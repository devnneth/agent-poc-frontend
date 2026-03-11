
import { authService } from '../../services/auth-service';

/**
 * 구글 서비스 공통 유틸리티 및 API 래퍼
 */
export const googleApiService = {
    async _parseJsonSafely(response) {
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) return null;

        const text = await response.text();
        if (!text) return null;

        try {
            return JSON.parse(text);
        } catch {
            return null;
        }
    },

    /**
     * 구글 API 에러 처리
     */
    async _handleApiError(response) {
        const errorData = (await this._parseJsonSafely(response)) || {};
        console.error('Google API Error Detail:', errorData);

        if (response.status === 401 || response.status === 403) {
            // 403인 경우 권한 부족 메시지를 구체적으로 던짐
            if (response.status === 403) {
                throw new Error('INSUFFICIENT_PERMISSION');
            }
            throw new Error('AUTH_REQUIRED');
        }
        throw new Error(errorData.error?.message || `Google API 요청 실패 (${response.status})`);
    },

    /**
     * 구글 API 공통 Fetch 래퍼 (자동 토큰 갱신 포함)
     */
    async fetch(endpoint, options = {}, token, refreshToken, onTokenRefreshed) {
        if (!token) throw new Error('AUTH_REQUIRED');

        try {
            let response = await fetch(endpoint, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            // 토큰 만료 시 백엔드를 통한 갱신 시도
            if (response.status === 401 && refreshToken) {
                console.log('Google API: 토큰 만료됨. 백엔드에 갱신 요청 중...');
                const newSession = await authService.refreshSession(refreshToken);

                if (newSession && newSession.provider_token) {
                    console.log('Google API: 토큰 갱신 성공 (Provider Token 확보). 재시도 중...');
                    if (onTokenRefreshed) {
                        await onTokenRefreshed(newSession);
                    }

                    response = await fetch(endpoint, {
                        ...options,
                        headers: {
                            ...options.headers,
                            Authorization: `Bearer ${newSession.provider_token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                } else {
                    console.warn('Google API: 백엔드로부터 새로운 Provider Token을 받지 못했습니다.');
                }
            }

            if (!response.ok) return this._handleApiError(response);
            return await this._parseJsonSafely(response);
        } catch (e) {
            if (e.message === 'AUTH_REQUIRED') throw e;
            console.error('Google API Error:', e);
            throw e;
        }
    }
};
