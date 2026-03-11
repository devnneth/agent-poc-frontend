import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { COLOR_PALETTE } from '@/lib/design-tokens';

/**
 * 범용 ColorPicker 컴포넌트
 */
export function ColorPicker({ selectedColor, onColorChange, className }) {
    return (
        <div className={cn("space-y-2", className)}>
            <ScrollArea className="w-full whitespace-nowrap rounded-md border py-3 px-3 bg-muted/20">
                <div className="flex w-max space-x-3">
                    {COLOR_PALETTE.map((color) => {
                        const isSelected = String(selectedColor) === String(color.id);
                        return (
                            <button
                                key={color.id}
                                type="button"
                                onClick={() => onColorChange(color.id)}
                                className={cn(
                                    "relative py-1 h-7 w-7 rounded-full transition-all active:scale-95",
                                    "focus:outline-none",
                                    isSelected ? "" : "opacity-80 hover:opacity-100 dark:border dark:border-white/10"
                                )}
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                            >
                                {isSelected && (
                                    <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow-sm" />
                                )}
                            </button>
                        );
                    })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
