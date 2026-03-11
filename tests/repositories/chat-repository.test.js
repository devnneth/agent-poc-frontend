
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as chatRepo from '../../src/repositories/chat-repository';

const localStorageMock = (function () {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value.toString();
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        })
    };
})();

describe('Chat Repository', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true
        });
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    describe('Session Management', () => {
        it('초기에는 빈 세션 목록을 반환해야 한다', () => {
            const sessions = chatRepo.loadSessions();
            expect(sessions).toEqual([]);
        });

        it('세션을 저장하고 불러올 수 있어야 한다', () => {
            const sessions = [{ id: '1', title: 'Test Session' }];
            chatRepo.saveSessions(sessions);

            const loaded = chatRepo.loadSessions();
            expect(loaded).toEqual(sessions);
            expect(window.localStorage.setItem).toHaveBeenCalledWith('gplanner.chat.sessions', JSON.stringify(sessions));
        });

        it('새로운 세션을 추가할 수 있어야 한다', () => {
            const initialSession = { id: '1', title: 'First' };
            chatRepo.saveSessions([initialSession]);

            const newSession = { id: '2', title: 'Second' };
            const updatedSessions = chatRepo.appendSession(newSession);

            expect(updatedSessions).toHaveLength(2);
            expect(updatedSessions[0]).toEqual(newSession); // 최신 세션이 앞에 옴 (코드 로직상)
            expect(updatedSessions[1]).toEqual(initialSession);
        });
    });

    describe('Message Management', () => {
        it('메시지를 추가할 수 있어야 한다', () => {
            const message = { id: 'm1', content: 'hello', sessionId: 's1' };
            const updatedMessages = chatRepo.appendMessage(message);

            expect(updatedMessages).toHaveLength(1);
            expect(updatedMessages[0]).toEqual(message);
            expect(window.localStorage.setItem).toHaveBeenCalledWith('gplanner.chat.messages', expect.any(String));
        });

        it('특정 세션 ID로 메시지를 필터링할 수 있어야 한다', () => {
            const messages = [
                { id: 'm1', content: 'hi', sessionId: 's1' },
                { id: 'm2', content: 'bye', sessionId: 's2' },
                { id: 'm3', content: 'again', sessionId: 's1' }
            ];
            // 직접 localStorage에 주입 (saveMessages를 통하지 않고 테스트)
            window.localStorage.setItem('gplanner.chat.messages', JSON.stringify(messages));

            const s1Messages = chatRepo.getMessagesBySession('s1');
            expect(s1Messages).toHaveLength(2);
            expect(s1Messages.map(m => m.id)).toEqual(['m1', 'm3']);
        });
    });

    describe('Error Handling', () => {
        it('저장된 데이터가 유효하지 않은 JSON일 경우 빈 배열을 반환해야 한다', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            window.localStorage.setItem('gplanner.chat.sessions', '{invalid-json}');
            const sessions = chatRepo.loadSessions();
            expect(sessions).toEqual([]);
            expect(consoleSpy).toHaveBeenCalled(); // 에러가 로깅되었는지 확인
        });

        it('저장된 데이터가 배열이 아닌 경우 빈 배열을 반환해야 한다 (fallback)', () => {
            window.localStorage.setItem('gplanner.chat.sessions', JSON.stringify({ not: 'an array' }));
            const sessions = chatRepo.loadSessions();
            expect(sessions).toEqual([]);
        });

        it('localStorage 접근 실패 시 에러를 로깅하고 fallback을 반환해야 한다', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            window.localStorage.getItem.mockImplementationOnce(() => {
                throw new Error('Access Denied');
            });

            const messages = chatRepo.loadMessages();
            expect(messages).toEqual([]);
            expect(consoleSpy).toHaveBeenCalled();
        });
    });
});
