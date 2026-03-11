import { useTranslation } from 'react-i18next';
import { cn } from "@/lib/utils";

/**
 * 설정 화면을 위한 공통 레이아웃 컴포넌트
 * 좌측 사이드바와 우측 컨텐츠 영역으로 구분됩니다.
 */
export function SettingsLayout({ sidebar, children, className }) {
    const { t } = useTranslation();
    return (
        <div className={cn("flex h-full w-full bg-background", className)}>
            <aside className="w-64 border-r bg-muted/10 flex flex-col shrink-0">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold tracking-tight">{t('settings.title')}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{t('settings.desc')}</p>
                </div>
                <nav className="flex-1 p-2 space-y-1">
                    {sidebar}
                </nav>
            </aside>
            <main className="flex-1 overflow-y-auto bg-background p-8 lg:p-12">
                <div className="max-w-4xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

