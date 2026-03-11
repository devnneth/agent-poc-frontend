import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ICON_PALETTE } from '@/lib/design-tokens';

/**
 * 범용 IconPicker 컴포넌트
 */
export function IconPicker({ selectedIcon, onIconChange, className }) {
    return (
        <div className={cn("space-y-2", className)}>
            <ScrollArea className="w-full whitespace-nowrap rounded-md border p-3 bg-muted/20">
                <div className="flex w-max space-x-3">
                    {ICON_PALETTE.map((iconName) => {
                        const Icon = LucideIcons[iconName] || LucideIcons.HelpCircle;
                        const isSelected = selectedIcon === iconName;

                        return (
                            <button
                                key={iconName}
                                type="button"
                                onClick={() => onIconChange(iconName)}
                                className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-md border transition-all",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                                    isSelected
                                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                                        : "border-input bg-background text-muted-foreground"
                                )}
                                title={iconName}
                            >
                                <Icon className={cn("h-4 w-4", isSelected && "scale-110")} />
                            </button>
                        );
                    })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
