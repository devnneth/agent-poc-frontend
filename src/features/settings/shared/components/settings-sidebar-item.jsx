import { cn } from '@/lib/utils';

/**
 * 설정 사이드바 내비게이션 아이템 컴포넌트
 */
export function SettingsSidebarItem({ icon: Icon, label, active, onClick, className }) {
    if (!Icon) return null;
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-2xl transition-all",
                active
                    ? "bg-stone-900 text-white shadow-lg shadow-stone-200 dark:bg-stone-100 dark:text-stone-900 dark:shadow-none"
                    : "text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100",
                className
            )}
        >
            <Icon className={cn("h-4 w-4", active ? "text-white dark:text-stone-900" : "text-stone-400")} />
            <span>{label}</span>
        </button>
    );
}
