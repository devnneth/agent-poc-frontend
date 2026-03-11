import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  loadMessages,
  loadSessions,
  saveMessages,
  saveSessions,
} from "../../../repositories/chat-repository";
import { sendChatMessage } from "../../../services/chat-stream";
import {
  deleteChatSession,
  deleteChatSessions,
} from "../../../services/agent-service";
import { useToast } from "../../../hooks/use-toast";
import { authService } from "../../../services/auth-service";
import { supabase } from "../../../api/supabase";

/**
 * 채팅 상태 및 로직을 관리하는 커스텀 훅
 */
export function useChat(
  authSession,
  { locked, onLockedAction, calendarContext = {} },
) {
  const { t, i18n } = useTranslation();
  const initialSessions = useMemo(() => loadSessions(), []);
  const [sessions, setSessions] = useState(() => initialSessions);
  const [messages, setMessages] = useState(() => loadMessages());
  const [activeSessionId, setActiveSessionId] = useState(() => {
    const historySessionId = window.history.state?.chatSessionId;
    if (!historySessionId) return null;
    const exists = initialSessions.some((item) => item.id === historySessionId);
    return exists ? historySessionId : null;
  });
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteAllRequest, setDeleteAllRequest] = useState(false);
  const [hitlRequest, setHitlRequest] = useState(null);

  const { toast } = useToast();

  const historyGuardRef = useRef(false);
  const streamStateRef = useRef(null);
  const messagesRef = useRef(messages);
  const sessionsRef = useRef(sessions);
  const activeSessionIdRef = useRef(activeSessionId);
  const sendingRef = useRef(sending);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    sendingRef.current = sending;
  }, [sending]);

  // 세션 정렬
  const sortSessions = useCallback(
    (items) =>
      [...items].sort((a, b) => {
        const left = new Date(a.updatedAt || a.createdAt).getTime();
        const right = new Date(b.updatedAt || b.createdAt).getTime();
        return right - left;
      }),
    [],
  );

  // 메시지 정렬
  const sortMessages = useCallback(
    (items) =>
      [...items].sort((a, b) => {
        const left = new Date(a.createdAt).getTime();
        const right = new Date(b.createdAt).getTime();
        return left - right;
      }),
    [],
  );

  // 세션 동기화
  const syncSessions = useCallback(
    (update) => {
      setSessions((prev) => {
        const next = typeof update === "function" ? update(prev) : update;
        const sorted = sortSessions(next);
        saveSessions(sorted);
        setActiveSessionId((prevActive) => {
          if (!prevActive) return prevActive;
          const exists = sorted.some((item) => item.id === prevActive);
          return exists ? prevActive : null;
        });
        return sorted;
      });
    },
    [sortSessions],
  );

  // 메시지 동기화
  const syncMessages = useCallback((update) => {
    setMessages((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      saveMessages(next);
      return next;
    });
  }, []);

  const createId = () => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const patchMessage = useCallback(
    (messageId, updates) => {
      syncMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? { ...message, ...updates } : message,
        ),
      );
    },
    [syncMessages],
  );

  const touchSession = useCallback(
    (sessionId) => {
      const now = new Date().toISOString();
      syncSessions((prev) =>
        prev.map((item) =>
          item.id === sessionId ? { ...item, updatedAt: now } : item,
        ),
      );
    },
    [syncSessions],
  );

  const activeSession = useMemo(
    () => sessions.find((item) => item.id === activeSessionId),
    [sessions, activeSessionId],
  );

  const activeMessages = useMemo(() => {
    if (!activeSessionId) return [];
    const filtered = messages.filter(
      (message) => message.sessionId === activeSessionId,
    );
    return sortMessages(filtered);
  }, [messages, activeSessionId, sortMessages]);

  const syncHistoryState = useCallback((nextSessionId, { replace } = {}) => {
    const currentState = window.history.state || null;
    const currentSessionId = currentState?.chatSessionId ?? null;
    if (currentSessionId === nextSessionId) return;
    const nextState = nextSessionId ? { chatSessionId: nextSessionId } : null;
    const update = replace ? "replaceState" : "pushState";
    window.history[update](nextState, "", window.location.href);
  }, []);

  const confirmLeaveWhileSending = useCallback(() => {
    if (!sendingRef.current) return true;
    return window.confirm(t("chat.leave_while_waiting"));
  }, [t]);

  const streamAssistantMessage = (sessionId, userMessage, contextIntent, background = false, currentProviderToken = "", currentAccessToken = "") => {
    const assistantId = createId();
    const startedAt = new Date(new Date(userMessage.createdAt).getTime() + 5).toISOString();
    let accumulated = "";

    const currentMessages = messagesRef.current;
    // 완료되었거나 중단되지 않은 메시지만 기록(history)에 포함 (단, isHidden은 전송 제외)
    let history = [
      ...currentMessages.filter(
        (m) =>
          m.sessionId === sessionId &&
          m.isCompleted !== false &&
          m.isCancelled !== true &&
          m.isHidden !== true,
      ),
      userMessage,
    ]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((m) => ({
        role: m.role,
        content: m.content,
        intent: m.intent || null,
      }));

    if (!background) {
      syncMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          sessionId,
          role: "assistant",
          content: "",
          createdAt: startedAt,
          isCompleted: false,
          ephemeralStatus: "",
          waitingForIntent: true,
          rawLog: null,
        },
      ]);

      setSending(true);
      setErrorMessage("");
    }

    return new Promise((resolve) => {
      const cancelStream = sendChatMessage({
        messages: history,
        accessToken: currentAccessToken || authSession?.access_token || "",
        providerToken: currentProviderToken,
        sessionId: sessionId,
        userId: authSession?.user?.id ?? null,
        language: i18n.language,
        intent: contextIntent,
        calendarId: calendarContext?.calendarId || "null",
        defaultErrorMessage: t("chat.error_fallback"),
        onRawChunk: (line) => {
          if (streamStateRef.current?.assistantId !== assistantId) return;
          streamStateRef.current.rawChunks.push(line);
        },
        onChunk: (chunk) => {
          if (streamStateRef.current?.assistantId !== assistantId) return;

          const { category, status, content, metadata } = chunk;

          // 1. Thinking / Tool 상태 업데이트 (단일 문자열 방식으로 복구)
          if (!background && (category === "thinking" || category === "tool")) {
            if (status === "start" || status === "ing") {
              let statusText = "";
              if (category === "tool") {
                statusText = "도구를 사용해 해결한다";
              } else {
                statusText =
                  content ||
                  (category === "thinking"
                    ? t("chat.thinking")
                    : t("chat.tool_using"));
                if (metadata?.tool) statusText = t("chat.tool_using_name", { tool: metadata.tool });
              }

              patchMessage(assistantId, { ephemeralStatus: statusText });
            } else if (status === "end") {
              patchMessage(assistantId, { ephemeralStatus: "" });
            }
          }

          // 2. 메시지 본문 누적 (Message 카테고리)
          if (!background && category === "message" && content) {
            accumulated += content;
            patchMessage(assistantId, { content: accumulated });
          }

          // 2-1. HITL 카테고리 처리 (승인 요청)
          if (!background && category === "hitl") {
            setHitlRequest(chunk);
            patchMessage(assistantId, { isHidden: true });
          }

          // 3. Intent 및 메타데이터 처리 (오직 metadata.intent만 신뢰)
          const foundIntent =
            metadata?.intent || metadata?.current_intent || null;

          if (foundIntent) {
            streamStateRef.current.parsedIntent = foundIntent;
            patchMessage(userMessage.id, { intent: foundIntent });
            if (!background) patchMessage(assistantId, { waitingForIntent: false }); // 의도 분석 완료
          }

          // 4. 에러 처리 (Error 카테고리)
          if (!background && category === "error") {
            const errorMsg =
              content || metadata?.detail || t("chat.error_fallback");
            setErrorMessage(errorMsg);

            // 말풍선에도 오류 표시 및 상태 완료 처리
            patchMessage(assistantId, {
              content: t("chat.error_occurred", { error: errorMsg }),
              isCompleted: false,
              ephemeralStatus: "",
            });
          }
        },
        onDone: () => {
          if (streamStateRef.current?.assistantId !== assistantId) return;
          if (!background) {
            setSending(false);
            patchMessage(assistantId, {
              isCompleted: true,
              ephemeralStatus: "",
              waitingForIntent: false,
              rawLog: {
                direction: "RECEIVE",
                timestamp: new Date().toISOString(),
                stream_chunks: streamStateRef.current.rawChunks,
              },
            });
          }
          touchSession(sessionId);
          streamStateRef.current = null;
          resolve(true);
        },
        onError: (error) => {
          if (streamStateRef.current?.assistantId !== assistantId) return;
          if (!background) {
            setSending(false);
            const fallback = t("chat.error_fallback");
            const errorMsg = error?.message || fallback;
            patchMessage(assistantId, {
              content: fallback,
              isCompleted: false,
              ephemeralStatus: "",
              waitingForIntent: false,
              rawLog: {
                direction: "ERROR",
                timestamp: new Date().toISOString(),
                error_message: errorMsg,
                stream_chunks: streamStateRef.current.rawChunks,
              },
            });
            setErrorMessage(errorMsg);
          }
          streamStateRef.current = null;
          resolve(false);
        },
      });

      streamStateRef.current = {
        assistantId,
        userMessageId: userMessage.id,
        cancelStream,
        resolve,
        getAccumulated: () => accumulated,
        parsedIntent: null,
        rawChunks: [],
      };
    });
  };

  const handleCancelStream = useCallback((silent = false) => {
    const activeStream = streamStateRef.current;
    if (!activeStream) return;
    activeStream.cancelStream?.();
    setSending(false);
    setErrorMessage("");

    const accumulated = activeStream.getAccumulated?.() ?? "";
    const trimmed = accumulated.trim();
    const nextContent = silent
      ? trimmed
      : (trimmed ? `${trimmed}\n\n${t("chat.response_stopped_hint")}` : t("chat.stop_response"));

    // 응답 중단 시 삭제하는 대신 취소 플래그를 달아 UI에는 보이게 함
    syncMessages((prev) =>
      prev.map((m) => {
        if (m.id === activeStream.assistantId) {
          return {
            ...m,
            content: nextContent,
            isCompleted: silent ? true : false,
            isCancelled: silent ? false : true,
          };
        }
        if (m.id === activeStream.userMessageId) {
          return { ...m, isCancelled: silent ? false : true };
        }
        return m;
      }),
    );

    streamStateRef.current = null;
    activeStream.resolve?.(false);
  }, [syncMessages, t]);

  const handleSendMessage = async (text, targetSessionId, options = {}) => {
    if (locked) {
      onLockedAction?.();
      return false;
    }

    if (options.force) {
      handleCancelStream(true);
    } else if (sending && !options.background) {
      return false;
    }

    const trimmed = text.trim();
    if (!trimmed) return false;

    // 새 메시지를 보내면 기존 HITL 요청 닫기
    setHitlRequest(null);

    const now = new Date().toISOString();
    let sessionId = targetSessionId;

    if (!sessionId) {
      sessionId = createId();
      const newSession = {
        id: sessionId,
        title: trimmed.length > 24 ? `${trimmed.slice(0, 24)}...` : trimmed,
        createdAt: now,
        updatedAt: now,
      };
      syncSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(sessionId);
    } else {
      touchSession(sessionId);
    }

    // 가장 최근에 저장된 intent를 찾아 세션 맥락으로 사용 (개별 메시지 객체에는 포함하지 않음)
    const sessionMessages = messagesRef.current.filter(
      (m) => m.sessionId === sessionId,
    );
    const lastIntent =
      [...sessionMessages].reverse().find((m) => m.intent)?.intent || null;

    let currentProviderToken = authSession?.provider_token || localStorage.getItem("gplanner_provider_token") || "";
    let currentAccessToken = authSession?.access_token || "";

    // 새 세션 시작, HITL 응답(hidden), 또는 토큰 없을 때 강제 갱신
    const isNewSession = !targetSessionId;
    const isHitlResponse = !!options.hidden;

    if ((isNewSession || isHitlResponse || !currentProviderToken) && authSession?.refresh_token) {
      try {
        console.log(isNewSession ? "새 세션 시작: 구글 토큰 강제 갱신 중..." : isHitlResponse ? "HITL 응답: 구글 토큰 강제 갱신 중..." : "구글 토큰 없음: 갱신 시도 중...");
        const refreshedData = await authService.refreshSession(authSession.refresh_token);
        if (refreshedData && refreshedData.provider_token) {
          currentProviderToken = refreshedData.provider_token;
          localStorage.setItem("gplanner_provider_token", currentProviderToken);

          if (refreshedData.access_token) {
            currentAccessToken = refreshedData.access_token;
          }

          // Supabase 세션 업데이트 (앱 전체 상태 반영)
          if (refreshedData.access_token && refreshedData.refresh_token) {
            await supabase.auth.setSession({
              access_token: refreshedData.access_token,
              refresh_token: refreshedData.refresh_token
            });
          }
        }
      } catch (err) {
        console.warn("채팅 시작 전 토큰 갱신 실패:", err);
      }
    }

    const userMessage = {
      id: createId(),
      sessionId,
      role: "user",
      content: trimmed,
      createdAt: now,
      intent: null,
      isHidden: options.hidden || false,
      rawLog: {
        direction: "SEND",
        timestamp: now,
        payload: {
          user_id: authSession?.user?.id ?? null,
          session_id: sessionId,
          calendar_id: calendarContext?.calendarId || "null",
          message: trimmed,
          language: i18n.language,
          google_calendar_token: currentProviderToken,
          minutes_offset: -new Date().getTimezoneOffset(),
        }
      }
    };

    const newMessages = [userMessage];
    if (options.injectMessage) {
      newMessages.push({
        id: createId(),
        sessionId,
        role: "user",
        content: options.injectMessage,
        createdAt: new Date(new Date(now).getTime() + 1).toISOString(),
        isCompleted: true,
        rawLog: null,
      });
    }

    syncMessages((prev) => [...prev, ...newMessages]);
    await streamAssistantMessage(sessionId, userMessage, lastIntent, options.background, currentProviderToken, currentAccessToken);

    return true;
  };

  const handleStartSession = (text, options) => handleSendMessage(text, null, options);
  const handleSendInSession = (text, options) =>
    handleSendMessage(text, activeSessionId, options);

  const handleSelectSession = useCallback(
    (sessionId) => {
      if (locked) {
        onLockedAction?.();
        return;
      }
      if (
        sessionId !== activeSessionIdRef.current &&
        !confirmLeaveWhileSending()
      ) {
        return;
      }
      setActiveSessionId(sessionId);
    },
    [locked, onLockedAction, confirmLeaveWhileSending],
  );

  const handleDeleteSession = useCallback(async () => {
    if (!deleteTarget || isDeleting) return;
    const sessionId = deleteTarget.id;
    const accessToken = authSession?.access_token;

    setIsDeleting(true);
    try {
      await deleteChatSession(sessionId, accessToken);

      // 로컬 상태 즉시 반영 (sync* 함수들은 내부적으로 repository와 useState를 연동하므로
      // removeSessionsLocally의 결과를 직접 반영하기보다 기존 sync 로직 활용)
      syncSessions((prev) => prev.filter((item) => item.id !== sessionId));
      syncMessages((prev) => prev.filter((item) => item.sessionId !== sessionId));

      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
      }
      setDeleteTarget(null);
    } catch (error) {
      toast({
        title: t("chat.delete_failed"),
        description: error.message || t("chat.delete_failed_desc"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [
    deleteTarget,
    isDeleting,
    authSession,
    activeSessionId,
    toast,
    t,
    syncSessions,
    syncMessages,
  ]);

  const handleDeleteSelectedSessions = useCallback(async (sessionIds) => {
    if (!sessionIds || sessionIds.length === 0 || isDeleting) return;
    const accessToken = authSession?.access_token;

    setIsDeleting(true);
    try {
      await deleteChatSessions(sessionIds, accessToken);

      syncSessions((prev) =>
        prev.filter((item) => !sessionIds.includes(item.id)),
      );
      syncMessages((prev) =>
        prev.filter((item) => !sessionIds.includes(item.sessionId)),
      );

      if (sessionIds.includes(activeSessionId)) {
        setActiveSessionId(null);
      }
      setDeleteAllRequest(false);
    } catch (error) {
      toast({
        title: t("chat.batch_delete_failed"),
        description: error.message || t("chat.batch_delete_failed_desc"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [
    isDeleting,
    authSession,
    activeSessionId,
    toast,
    t,
    syncSessions,
    syncMessages,
  ]);

  const handleDeleteAllRequest = useCallback(() => {
    if (locked) {
      onLockedAction?.();
      return;
    }
    setDeleteAllRequest(true);
  }, [locked, onLockedAction]);

  const handleCancelDeleteAll = useCallback(() => {
    setDeleteAllRequest(false);
  }, []);

  const handleConfirmDeleteAll = useCallback(() => {
    const allIds = sessions.map((s) => s.id);
    handleDeleteSelectedSessions(allIds);
  }, [sessions, handleDeleteSelectedSessions]);

  const handleBackToHome = useCallback(() => {
    if (activeSessionIdRef.current && !confirmLeaveWhileSending()) return;
    setActiveSessionId(null);
  }, [confirmLeaveWhileSending]);

  useEffect(() => {
    if (!sending) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sending]);

  useEffect(() => {
    const handlePopState = (event) => {
      if (!confirmLeaveWhileSending()) {
        syncHistoryState(activeSessionIdRef.current, { replace: false });
        return;
      }

      historyGuardRef.current = true;
      const historySessionId = event.state?.chatSessionId ?? null;
      const exists = historySessionId
        ? sessionsRef.current.some((item) => item.id === historySessionId)
        : false;
      setActiveSessionId(exists ? historySessionId : null);
      requestAnimationFrame(() => {
        historyGuardRef.current = false;
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [confirmLeaveWhileSending, syncHistoryState]);

  useEffect(() => {
    if (historyGuardRef.current) return;
    if (activeSessionId) {
      syncHistoryState(activeSessionId, { replace: false });
    } else {
      syncHistoryState(null, { replace: true });
    }
  }, [activeSessionId, syncHistoryState]);

  return {
    sessions,
    messages,
    activeSession,
    activeMessages,
    sending,
    isDeleting,
    errorMessage,
    deleteTarget,
    setDeleteTarget,
    deleteAllRequest,
    hitlRequest,
    setHitlRequest,
    handleDeleteAllRequest,
    handleCancelDeleteAll,
    handleConfirmDeleteAll,
    handleStartSession,
    handleSendInSession,
    handleSelectSession,
    handleDeleteSession,
    handleDeleteSelectedSessions,
    handleCancelStream,
    handleBackToHome,
    setActiveSessionId,
  };
}
