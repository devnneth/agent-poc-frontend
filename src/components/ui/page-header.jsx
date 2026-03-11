import { cn } from "@/lib/utils";

/**
 * 페이지 상단 헤더 컴포넌트 (서비스 전반에서 사용)
 */
export function PageHeader({ category, title, description, className, children }) {
    return (
        <div className={cn("mb-8 flex flex-wrap items-start justify-between gap-4", className)}>
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500">
                    {category}
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                    {title}
                </h2>
                {description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-2 pt-2">
                    {children}
                </div>
            )}
        </div>
    );
}
