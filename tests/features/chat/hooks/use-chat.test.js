
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChat } from '../../../../src/features/chat/hooks/use-chat';
import * as chatRepo from '../../../../src/repositories/chat-repository';
import * as chatStream from '../../../../src/services/chat-stream';

// 모듈 모킹
vi.mock('../../../../src/repositories/chat-repository', () => ({
    loadSessions: vi.fn(),
    loadMessages: vi.fn(),
    saveSessions: vi.fn(),
    saveMessages: vi.fn(),
    // append/get 함수들은 훅 내부에서 직접 사용되지 않고 load/save를 메인으로 사용함
}));

vi.mock('../../../../src/services/chat-stream', () => ({
    sendChatMessage: vi.fn(),
}));

vi.mock('../../../../src/services/auth-service', () => ({
    authService: {
        refreshSession: vi.fn(),
    }
}));

vi.mock('../../../../src/api/supabase', () => ({
    supabase: {
        auth: {
            setSession: vi.fn(),
        }
    }
}));

vi.mock('../../../../src/services/agent-service', () => ({
    deleteChatSession: vi.fn(),
    deleteChatSessions: vi.fn(),
}));

import * as authSvc from '../../../../src/services/auth-service';
import * as agentSvc from '../../../../src/services/agent-service';

describe('useChat Hook', () => {
    const mockAuthSession = { access_token: 'valid-token' };
    const mockOptions = { locked: false, onLockedAction: vi.fn() };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        // Repository 기본 반환값 설정
        chatRepo.loadSessions.mockReturnValue([]);
        chatRepo.loadMessages.mockReturnValue([]);
        authSvc.authService.refreshSession.mockResolvedValue({
            provider_token: 'new-google-token',
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token'
        });
        agentSvc.deleteChatSession.mockResolvedValue({ error: null });
        vi.spyOn(window, 'confirm').mockReturnValue(true);
    });

    it('초기 상태를 레포지토리에서 불러와야 한다', () => {
        const initialSessions = [{ id: 's1', title: 'Session 1' }];
        const initialMessages = [{ id: 'm1', sessionId: 's1', content: 'hello' }];

        chatRepo.loadSessions.mockReturnValue(initialSessions);
        chatRepo.loadMessages.mockReturnValue(initialMessages);

        const { result } = renderHook(() => useChat(mockAuthSession, mockOptions));

        expect(result.current.sessions).toEqual(initialSessions);
        expect(result.current.messages).toEqual(initialMessages);
        expect(result.current.activeSession).toBeUndefined(); // 히스토리 state가 없으므로
    });

    // 다시 작성: 비동기 흐름 제어를 위해 테스트 구조 변경
    it('메시지 전송 프로세스 검증 (스트림 완료)', async () => {
        const { result } = renderHook(() => useChat(mockAuthSession, mockOptions));

        let triggerStream;
        const streamPromise = new Promise(resolve => { triggerStream = resolve; });

        chatStream.sendChatMessage.mockImplementation(({ onChunk, onDone }) => {
            // 호출되면 콜백을 외부로 노출
            triggerStream({ onChunk, onDone });
            return vi.fn();
        });

        // 1. 메시지 전송 시작
        let sendPromise;
        await act(async () => {
            sendPromise = result.current.handleStartSession('Hello');
        });

        // 2. sendChatMessage가 호출되었는지 확인
        expect(chatStream.sendChatMessage).toHaveBeenCalled();

        // 3. 스트림 콜백 획득
        const callbacks = await streamPromise;

        // 4. 로딩 상태 확인
        expect(result.current.sending).toBe(true);

        // 5. 청크 수신 시뮬레이션
        await act(async () => {
            callbacks.onChunk({ category: 'message', content: 'Hel' });
            callbacks.onChunk({ category: 'message', content: 'lo' });
        });

        // 메시지가 업데이트 되었는지 확인 (중간 상태)
        // Hook의 state는 비동기 업데이트되므로 waitFor 필요 가능성 있음
        // 하지만 여기서는 pending 상태의 메시지가 추가되었는지 확인
        const assistantMsg = result.current.messages.find(m => m.role === 'assistant');
        expect(assistantMsg).toBeDefined();
        expect(assistantMsg.content).toBe('Hello');

        // 6. 스트림 완료 시뮬레이션
        await act(async () => {
            callbacks.onDone();
        });

        // 7. 전송 완료 확인
        await sendPromise; // 이제 handleStartSession이 완료되어야 함

        expect(result.current.sending).toBe(false);
        const completedMsg = result.current.messages.find(m => m.role === 'assistant');
        expect(completedMsg.isCompleted).toBe(true);
    });

    it('잠금(locked) 상태에서는 메시지를 보낼 수 없어야 한다', async () => {
        const onLockedAction = vi.fn();
        const { result } = renderHook(() => useChat(mockAuthSession, { locked: true, onLockedAction }));

        await act(async () => {
            const success = await result.current.handleStartSession('Hello');
            expect(success).toBe(false);
        });

        expect(chatStream.sendChatMessage).not.toHaveBeenCalled();
        expect(onLockedAction).toHaveBeenCalled();
    });

    it('세션을 삭제하면 상태와 저장소에서 제거되어야 한다', async () => {
        const session = { id: 's1', title: 'Delete Me' };
        chatRepo.loadSessions.mockReturnValue([session]);

        const { result } = renderHook(() => useChat(mockAuthSession, mockOptions));

        // 삭제 대상 설정
        act(() => {
            result.current.setDeleteTarget(session);
        });

        // 삭제 실행
        await act(async () => {
            await result.current.handleDeleteSession();
        });

        // 타이머 진행 (디바운스 대기)
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(result.current.sessions).toHaveLength(0);
        expect(result.current.deleteTarget).toBeNull();
        expect(chatRepo.saveSessions).toHaveBeenCalledWith([]);
    });

    it('세션 선택 시 활성 세션이 변경되어야 한다', () => {
        const sessions = [{ id: 's1' }, { id: 's2' }];
        chatRepo.loadSessions.mockReturnValue(sessions);

        const { result } = renderHook(() => useChat(mockAuthSession, mockOptions));

        act(() => {
            result.current.handleSelectSession('s2');
        });

        expect(result.current.activeSession).toBeDefined();
        expect(result.current.activeSession.id).toBe('s2');
    });

    it('응답 대기 중에는 세션 전환 전에 확인이 필요하다', async () => {
        const sessions = [
            { id: 's1', title: 'Session 1', createdAt: '2026-03-11T00:00:00.000Z', updatedAt: '2026-03-11T00:00:00.000Z' },
            { id: 's2', title: 'Session 2', createdAt: '2026-03-11T00:00:01.000Z', updatedAt: '2026-03-11T00:00:01.000Z' },
        ];
        chatRepo.loadSessions.mockReturnValue(sessions);

        let callbacks;
        chatStream.sendChatMessage.mockImplementation((params) => {
            callbacks = params;
            return vi.fn();
        });

        const { result } = renderHook(() => useChat(mockAuthSession, mockOptions));

        act(() => {
            result.current.handleSelectSession('s1');
        });

        let sendPromise;
        await act(async () => {
            sendPromise = result.current.handleSendInSession('Hello');
        });

        window.confirm.mockReturnValue(false);

        act(() => {
            result.current.handleSelectSession('s2');
        });

        expect(window.confirm).toHaveBeenCalled();
        expect(result.current.activeSession.id).toBe('s1');

        await act(async () => {
            callbacks.onDone();
            await sendPromise;
        });
    });

    it('응답 대기 중에는 목록 복귀 전에 확인이 필요하다', async () => {
        const sessions = [
            { id: 's1', title: 'Session 1', createdAt: '2026-03-11T00:00:00.000Z', updatedAt: '2026-03-11T00:00:00.000Z' },
        ];
        chatRepo.loadSessions.mockReturnValue(sessions);

        let callbacks;
        chatStream.sendChatMessage.mockImplementation((params) => {
            callbacks = params;
            return vi.fn();
        });

        const { result } = renderHook(() => useChat(mockAuthSession, mockOptions));

        act(() => {
            result.current.handleSelectSession('s1');
        });

        let sendPromise;
        await act(async () => {
            sendPromise = result.current.handleSendInSession('Hello');
        });

        window.confirm.mockReturnValue(false);

        act(() => {
            result.current.handleBackToHome();
        });

        expect(window.confirm).toHaveBeenCalled();
        expect(result.current.activeSession.id).toBe('s1');

        await act(async () => {
            callbacks.onDone();
            await sendPromise;
        });
    });
});
