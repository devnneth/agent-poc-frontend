import { useTranslation } from 'react-i18next';
import React from 'react';

/**
 * 백엔드 오프라인 상태를 나타내는 빨간 점 인디케이터
 */
export function BackendStatusIndicator({ className = "" }) {
    const { t } = useTranslation();
    return (
        <div className={`flex items-center justify-center gap-2 text-destructive text-sm font-medium animate-pulse ${className}`}>
            <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/75 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </div>
            <span>{t('common.backend_offline')}</span>
        </div>
    );
}
