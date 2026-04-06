
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../../src/services/auth-service';
import { supabase } from '../../src/api/supabase';

// Supabase 모킹
vi.mock('../../src/api/supabase', () => ({
    supabase: {
        auth: {
            updateUser: vi.fn()
        }
    }
}));

// Vite 환경 변수 모킹
vi.mock('import.meta.env', () => ({
    VITE_BACKEND_URL: 'http://localhost:8000', // 테스트용 더미 URL
    VITE_ENABLE_BACKEND_HEALTH_CHECK: 'true'
}));

describe('Auth Service', () => {
    const BACKEND_URL = 'http://localhost:8000'; // auth-service.js 내부 로직과 일치시킴 (실제 모듈은 import.meta.env를 사용)

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        vi.spyOn(console, 'error').mockImplementation(() => { }); // 콘솔 에러 숨김
        vi.spyOn(console, 'warn').mockImplementation(() => { }); // 콘솔 경고 숨김
        supabase.auth.updateUser.mockClear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    describe('refreshSession', () => {
        it('유효한 리프레시 토큰으로 세션 갱신 성공 시 데이터를 반환해야 한다', async () => {
            const mockResponseData = {
                result: {
                    access_token: 'new-access-token',
                    refresh_token: 'new-refresh-token',
                    user: { id: 'user-1' }
                },
                error: false,
                status: 200
            };

            fetch.mockResolvedValue({
                ok: true,
                json: async () => mockResponseData
            });

            const result = await authService.refreshSession('valid-refresh-token');

            expect(fetch).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockResponseData.result);
        });

        it('리프레시 토큰이 없으면 null을 반환해야 한다', async () => {
            const result = await authService.refreshSession(null);
            expect(result).toBeNull();
            expect(fetch).not.toHaveBeenCalled();
        });

        it('빈 문자열 리프레시 토큰이면 null을 반환해야 한다', async () => {
            const result = await authService.refreshSession('');
            expect(result).toBeNull();
            expect(fetch).not.toHaveBeenCalled();
        });

        it('백엔드 응답이 실패(ok=false)인 경우 null을 반환해야 한다', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 401,
                statusText: 'Unauthorized'
            });

            const result = await authService.refreshSession('expired-refresh-token');

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalledWith('인증 서비스: 토큰 갱신 실패');
        });

        it('백엔드 서버 오류(5xx) 발생 시 NETWORK_ERROR 에러를 던져야 한다', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            await expect(authService.refreshSession('valid-refresh-token'))
                .rejects
                .toThrow('NETWORK_ERROR');

            // 500 에러 시 throw로 인해 catch 블록으로 넘어가므로, warn이 두 번 호출될 수 있음.
            // 첫 번째 warn이 '서버 오류'인지 확인
            expect(console.warn).toHaveBeenCalledWith('인증 서비스: 서버 오류 (500)');
        });

        it('네트워크 오류 발생 시 NETWORK_ERROR 에러를 던져야 한다', async () => {
            const networkError = new Error('Network Error');
            fetch.mockRejectedValue(networkError);

            await expect(authService.refreshSession('valid-refresh-token'))
                .rejects
                .toThrow('NETWORK_ERROR');

            expect(console.warn).toHaveBeenCalledWith('인증 서비스: 갱신 요청 중 네트워크 오류 (정상 처리됨):', networkError.message);
        });
    });

    describe('updatePassword', () => {
        it('비밀번호가 제공되면 supabase.auth.updateUser를 호출해야 한다', async () => {
            const mockResponse = { data: { user: { id: '123' } }, error: null };
            supabase.auth.updateUser.mockResolvedValue(mockResponse);

            const result = await authService.updatePassword('new-password-123');

            expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'new-password-123' });
            expect(result).toEqual(mockResponse);
        });

        it('비밀번호가 제공되지 않으면 에러를 반환해야 한다', async () => {
            const result = await authService.updatePassword('');
            expect(result.error).toBeDefined();
            expect(result.error.message).toBe('비밀번호가 제공되지 않았습니다.');
            expect(supabase.auth.updateUser).not.toHaveBeenCalled();
        });

        it('supabase 업데이트 실패 시 에러를 반환해야 한다', async () => {
            const mockError = { data: null, error: { message: 'Update failed' } };
            supabase.auth.updateUser.mockResolvedValue(mockError);

            const result = await authService.updatePassword('new-password-123');
            expect(result.error).toEqual(mockError.error);
        });
    });

    describe('checkBackendHealth', () => {
        it('서버가 정상 응답(ok=true)하면 true를 반환해야 한다', async () => {
            fetch.mockResolvedValue({ ok: true });
            const result = await authService.checkBackendHealth();
            expect(result).toBe(true);
        });

        it('서버가 에러 응답(ok=false)하면 false를 반환해야 한다', async () => {
            fetch.mockResolvedValue({ ok: false });
            const result = await authService.checkBackendHealth();
            expect(result).toBe(false);
        });

        it('네트워크 에러 발생 시 false를 반환해야 한다', async () => {
            fetch.mockRejectedValue(new Error('Network Error'));
            const result = await authService.checkBackendHealth();
            expect(result).toBe(false);
        });
    });
});
