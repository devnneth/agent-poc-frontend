const DEFAULT_ERROR_MESSAGE = "Failed to get response. Please try again later.";

// 스트림 payload의 content를 UI에 표시 가능한 문자열로 정규화한다
function normalizeContent(content) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (!item || typeof item !== "object") {
          return "";
        }

        if (item.type === "output_text" && typeof item.text === "string") {
          return item.text;
        }

        if (typeof item.content === "string") {
          return item.content;
        }

        return "";
      })
      .join("");
  }

  return "";
}

// 백엔드 URL을 환경변수에서 읽어온다
function getBackendUrl() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || "";
  return baseUrl.replace(/\/+$/, "");
}

// 인증 헤더 값을 상황에 맞게 구성한다
function buildAuthorizationHeader(accessToken) {
  if (!accessToken) return "";
  if (accessToken.toLowerCase().startsWith("bearer ")) return accessToken;
  return `Bearer ${accessToken}`;
}

// SSE data 라인을 텍스트 청크로 변환한다
function parseDataPayload(payload) {
  let cleaned = payload?.trim();
  if (!cleaned) {
    return null;
  }

  if (cleaned.startsWith("data:")) {
    cleaned = cleaned.substring(5).trim();
  }

  if (!cleaned) {
    return null;
  }

  try {
    const parsed = JSON.parse(cleaned);

    // 백엔드(chat.py) 응답 포맷 대응
    if (parsed.token) {
      return { type: "data", content: parsed.token };
    }
    if (parsed.done) {
      return { type: "end", content: parsed.content || "" };
    }
    if (parsed.error) {
      return { type: "error", content: parsed.message || "Error" };
    }

    // 기존 표준 포맷 (하위 호환성 유지)
    if (parsed.type && (parsed.type === "start" || parsed.type === "data" || parsed.type === "end")) {
      return {
        type: parsed.type,
        category: parsed.category || "",
        status: parsed.status || "",
        content: normalizeContent(parsed.content),
        metadata: parsed.metadata || {}
      };
    }

    console.warn("Unknown payload format:", parsed);
    return { type: "unknown", raw: parsed };

  } catch (e) {
    // 파싱 실패 시에도 표준이 아니므로 무시 (혹은 에러 처리)
    console.error("JSON Parse Error:", e, "Payload:", payload);
    return { type: "error", content: "Invalid JSON payload" };
  }
}

// 스트리밍 응답을 라인 단위로 읽어 콜백에 전달한다
async function streamChatResponse({
  reader,
  decoder,
  onChunk,
  onRawChunk,
  onDone,
  signal,
}) {
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (signal?.aborted) return;

    if (value) {
      buffer += decoder.decode(value, { stream: true });

      let lineBreakIndex = buffer.indexOf("\n");
      while (lineBreakIndex !== -1) {
        const line = buffer.slice(0, lineBreakIndex);
        buffer = buffer.slice(lineBreakIndex + 1);

        onRawChunk?.(line);
        if (line.trim()) {
          const parsed = parseDataPayload(line);
          if (parsed) {
            onChunk?.(parsed);
          }
        }
        lineBreakIndex = buffer.indexOf("\n");
      }
    }

    if (done) break;
  }

  const rest = buffer.trim();
  if (rest) {
    onRawChunk?.(rest);
    const parsed = parseDataPayload(rest);
    if (parsed) onChunk?.(parsed);
  }

  onDone?.();
}

// 백엔드 SSE 응답을 청크 단위로 전달한다
function sendChatMessage({ messages, accessToken, providerToken, sessionId, userId, language, calendarId, checkpoint: _checkpoint, intent: _contextIntent, onChunk, onRawChunk, onDone, onError, defaultErrorMessage }) {
  const controller = new AbortController();
  const baseUrl = getBackendUrl();

  if (!baseUrl) {
    onError?.(new Error(defaultErrorMessage || "Backend URL not configured."));
    return () => controller.abort();
  }

  const headers = { "Content-Type": "application/json" };
  const authorization = buildAuthorizationHeader(accessToken);
  if (authorization) {
    headers.authorization = authorization;
  }

  const lastMessage = messages[messages.length - 1];
  const payload = {
    user_id: userId || null,
    session_id: sessionId || null,
    calendar_id: calendarId || "null",
    message: lastMessage?.content || "",
    language: language || "ko",
    google_calendar_token: providerToken || "",
    minutes_offset: -new Date().getTimezoneOffset(),
  };

  fetch(`${baseUrl}/api/v1/agent/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        const fallback = detail || defaultErrorMessage || DEFAULT_ERROR_MESSAGE;
        throw new Error(fallback);
      }

      if (!response.body) {
        throw new Error(defaultErrorMessage || "No response body.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      await streamChatResponse({
        reader,
        decoder,
        onChunk,
        onRawChunk,
        onDone,
        signal: controller.signal,
      });
    })
    .catch((error) => {
      if (controller.signal.aborted) return;
      onError?.(error || new Error(defaultErrorMessage || DEFAULT_ERROR_MESSAGE));
    });

  return () => controller.abort();
}

export { sendChatMessage };
