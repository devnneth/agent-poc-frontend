import { supabase } from '@/api/supabase';

// 환경 변수를 함수 내부에서 참조하도록 하여 테스트 시 동적 모킹을 지원합니다.

/**
 * 전역 인증 및 토큰 관리 서비스
 */
export const authService = {
    /**
     * 백엔드 API를 통해 세션 및 토큰을 갱신합니다.
     * @param {string} refreshToken - Supabase 리프레시 토큰
     * @returns {Promise<object|null>} - 갱신된 세션 데이터
     */
    async refreshSession(refreshToken) {
        if (!refreshToken) return null;

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            console.log(`인증 서비스: 백엔드 갱신 요청 (${backendUrl}/api/v1/auth/refresh)`);

            // localStorage에서 보관 중인 Google 리프레시 토큰 가져오기
            const googleRefreshToken = localStorage.getItem('gplanner_google_refresh_token');

            const response = await fetch(`${backendUrl}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    refresh_token: refreshToken,
                    google_refresh_token: googleRefreshToken
                })
            });

            if (!response.ok) {
                if (response.status >= 500) {
                    console.warn(`인증 서비스: 서버 오류 (${response.status})`);
                    throw new Error('NETWORK_ERROR');
                }
                console.error('인증 서비스: 토큰 갱신 실패');
                return null;
            }

            const result = await response.json();
            console.log('인증 서비스: 백엔드 갱신 응답 수신 성공', result);
            // 백엔드 응답 구조: { result: { access_token, refresh_token, ... }, error: false, ... }
            return result.result;
        } catch (err) {
            console.warn('인증 서비스: 갱신 요청 중 네트워크 오류 (정상 처리됨):', err.message);
            // 네트워크 오류를 상위로 전파하여 오프라인 상태 감지
            throw new Error('NETWORK_ERROR');
        }
    },

    /**
     * 사용자의 비밀번호를 업데이트합니다.
     * @param {string} password - 새 비밀번호
     * @returns {Promise<{data: object|null, error: object|null}>}
     */
    async updatePassword(password) {
        if (!password) {
            return { data: null, error: new Error('비밀번호가 제공되지 않았습니다.') };
        }
        return await supabase.auth.updateUser({ password });
    },

    /**
     * 백엔드 서버 헬스 체크
     * @returns {Promise<boolean>} - 서버 도달 가능 여부
     */
    async checkBackendHealth() {
        const healthCheckEnabled = import.meta.env.VITE_ENABLE_BACKEND_HEALTH_CHECK === 'true';
        if (!healthCheckEnabled) {
            return true;
        }

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            // 간단히 루트 경로 또는 API 베이스 경로 호출 (HEAD 메서드 권장하나, GET도 무방)
            // 여기서는 404가 뜨더라도 서버가 살아있다는 뜻이므로 응답이 오면 true
            const response = await fetch(`${backendUrl}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.ok; // 200-299
        } catch (_err) {
            // 네트워크 에러 등으로 연결 불가 시 false
            return false;
        }
    }
};
