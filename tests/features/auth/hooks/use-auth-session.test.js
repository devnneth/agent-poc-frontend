
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthSession } from '../../../../src/features/auth/hooks/use-auth-session';
import { authService } from '../../../../src/services/auth-service';
import { supabase } from '../../../../src/api/supabase';

// Supabase 모킹
vi.mock('../../../../src/api/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(),
        },
    },
}));

vi.mock('../../../../src/services/auth-service', () => ({
    authService: {
        checkBackendHealth: vi.fn(),
    },
}));

describe('useAuthSession Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // 기본 모킹 설정
        authService.checkBackendHealth.mockResolvedValue(true);
        supabase.auth.getSession.mockResolvedValue({
            data: { session: null },
            error: null,
        });

        supabase.auth.onAuthStateChange.mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } },
        });

        vi.spyOn(console, 'warn').mockImplementation(() => { });
    });

    it('초기 상태에서는 로딩 상태여야 한다', async () => {
        // getSession이 해결되기 전 상태 확인을 위해 promise를 지연시킴
        let resolveSession;
        const sessionPromise = new Promise(resolve => { resolveSession = resolve; });

        supabase.auth.getSession.mockReturnValue(sessionPromise);

        const { result } = renderHook(() => useAuthSession());

        expect(result.current.loading).toBe(true);
        expect(result.current.session).toBeNull();

        // 테스트 종료를 위해 프로미스 해결
        await act(async () => {
            resolveSession({ data: { session: null }, error: null });
        });
    });

    it('세션이 존재하면 세션 정보를 반환해야 한다', async () => {
        const mockSession = { user: { id: 'test-user' }, access_token: 'token' };

        supabase.auth.getSession.mockResolvedValue({
            data: { session: mockSession },
            error: null,
        });

        const { result } = renderHook(() => useAuthSession());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.session).toEqual(mockSession);
    });

    it('세션 조회 중 에러가 발생하면 세션은 null이어야 한다', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        supabase.auth.getSession.mockResolvedValue({
            data: { session: null },
            error: { message: 'Session error' },
        });

        const { result } = renderHook(() => useAuthSession());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.session).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith('세션 조회 실패:', 'Session error');
    });

    it('onAuthStateChange 이벤트를 구독하고 상태 변경을 반영해야 한다', async () => {
        // 이벤트 리스너를 캡처하기 위한 변수
        let authListener;

        supabase.auth.onAuthStateChange.mockImplementation((callback) => {
            authListener = callback;
            return { data: { subscription: { unsubscribe: vi.fn() } } };
        });

        const { result } = renderHook(() => useAuthSession());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // 로그인이 발생했다고 가정
        const newSession = { user: { id: 'logged-in' } };

        await act(async () => {
            authListener('SIGNED_IN', newSession);
        });

        expect(result.current.session).toEqual(newSession);

        // 로그아웃이 발생했다고 가정
        await act(async () => {
            authListener('SIGNED_OUT', null);
        });

        expect(result.current.session).toBeNull();
    });
});
