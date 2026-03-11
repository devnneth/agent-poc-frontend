import { useEffect, useState } from 'react';
import { AlignLeft, Trash2, Loader2, Ban, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

// UI 컴포넌트 Import
import { ColorPicker } from '@/components/ui/color-picker';
import { IconPicker } from '@/components/ui/icon-picker';

/**
 * EventModal 컴포넌트 — google_calendar_events 기반 일정 생성/수정 모달
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 닫기 핸들러
 * @param {Function} props.onSubmit - 저장 핸들러
 * @param {Function} props.onDelete - 삭제 핸들러
 * @param {Object} props.initialData - 수정 시 초기 데이터
 * @param {Date} props.selectedDate - 선택된 날짜
 * @param {boolean} props.isSubmitting - 전송 중 상태
 */
export function EventModal({
    isOpen,
    onClose,
    onSubmit,
    onDelete,
    initialData,
    selectedDate,
    isSubmitting = false
}) {
    const { t } = useTranslation();
    // 폼 상태 (google_calendar_events 기반 필드)
    const [formData, setFormData] = useState({
        summary: '',       // 일정 제목
        description: '',   // 메모
        icon: 'Calendar',  // 선택된 아이콘 (기본값)
        color_id: 7,       // 선택된 색상 ID (기본값: Peacock)
        start_at: '',      // 시작 시각 (ISO 8601)
        end_at: '',        // 종료 시각 (ISO 8601)
    });

    useEffect(() => {
        if (!isOpen) return;

        if (initialData) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({
                summary: initialData.title || initialData.summary || '',
                description: initialData.description || '',
                icon: initialData.icon || 'Calendar',
                color_id: initialData.color || initialData.color_id || 7,
                start_at: initialData.start || initialData.start_at || '',
                end_at: initialData.end || initialData.end_at || '',
            });
        } else if (selectedDate) {
            // 생성 모드: 선택된 날짜 기준 기본 시작/종료 시각 설정 (09:00 ~ 10:00)
            const dateStr = format(new Date(selectedDate), 'yyyy-MM-dd');
            setFormData({
                summary: '',
                description: '',
                icon: 'Calendar',
                color_id: 7,
                start_at: `${dateStr}T09:00:00`,
                end_at: `${dateStr}T10:00:00`,
            });
        }
    }, [isOpen, initialData, selectedDate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            id: initialData?.id
        });
    };

    const isEditMode = !!initialData;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden" onInteractOutside={(e) => isSubmitting && e.preventDefault()}>
                    <DialogHeader className="px-6 pt-6 pb-2">
                        <div className="flex items-center justify-between">
                            <DialogTitle>{isEditMode ? t('calendar.event_edit') : t('calendar.event_add')}</DialogTitle>
                        </div>
                        <DialogDescription>
                            {t('calendar.event_manage', { date: formData.start_at ? formData.start_at.slice(0, 10) : '' })}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[85vh] px-6 pb-6 mt-2">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* 제목 */}
                            <div className="space-y-2">
                                <Label htmlFor="summary" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('calendar.event_title')}</Label>
                                <Input
                                    id="summary"
                                    autoFocus
                                    value={formData.summary}
                                    onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                                    placeholder={t('calendar.event_title_placeholder')}
                                    className="text-base py-5"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* 시작/종료 시각 */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('calendar.start_at')}</Label>
                                <Input
                                    type="time"
                                    value={formData.start_at ? formData.start_at.slice(11, 16) : ''}
                                    onChange={(e) => setFormData(prev => {
                                        const datePart = prev.start_at ? prev.start_at.slice(0, 10) : format(new Date(selectedDate || new Date()), 'yyyy-MM-dd');
                                        return { ...prev, start_at: `${datePart}T${e.target.value}:00` };
                                    })}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('calendar.end_at')}</Label>
                                <Input
                                    type="time"
                                    value={formData.end_at ? formData.end_at.slice(11, 16) : ''}
                                    onChange={(e) => setFormData(prev => {
                                        const datePart = prev.end_at ? prev.end_at.slice(0, 10) : format(new Date(selectedDate || new Date()), 'yyyy-MM-dd');
                                        return { ...prev, end_at: `${datePart}T${e.target.value}:00` };
                                    })}
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* 메모 (선택) */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" />
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('calendar.memo_optional')}</Label>
                                </div>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder={t('calendar.memo_placeholder')}
                                    className="min-h-[80px] resize-none bg-muted/20"
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* 아이콘 선택 */}
                            <IconPicker
                                selectedIcon={formData.icon}
                                onIconChange={(icon) => setFormData(prev => ({ ...prev, icon }))}
                            />

                            {/* 색상 선택 */}
                            <ColorPicker
                                selectedColor={formData.color_id}
                                onColorChange={(color_id) => setFormData(prev => ({ ...prev, color_id }))}
                            />

                            <DialogFooter className="pt-4 flex sm:justify-between items-center gap-2">
                                {/* 삭제 버튼: 좌측 배치 */}
                                {isEditMode && onDelete ? (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => {
                                            if (window.confirm(t('common.confirm_delete'))) onDelete(initialData.id);
                                        }}
                                        disabled={isSubmitting}
                                        className="h-9 w-9"
                                    >
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                ) : (
                                    <div />
                                )}

                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1 sm:flex-none">
                                        <Ban className="mr-2 h-4 w-4" />
                                        취소
                                    </Button>
                                    <Button type="submit" className="flex-1 sm:flex-none px-8" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        저장
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    );
}
