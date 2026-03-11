import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * 비밀번호 변경 입력 폼 컴포넌트
 */
export function PasswordUpdateForm({ password, setPassword, isSubmitting, onUpdate }) {
    const { t } = useTranslation();

    return (
        <div className="max-w-md space-y-4">
            <div className="space-y-2">
                <Label htmlFor="new-password">{t('settings.new_password')}</Label>
                <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onUpdate()}
                    disabled={isSubmitting}
                />
            </div>
            <Button
                onClick={onUpdate}
                disabled={isSubmitting || !password}
                className="w-full"
            >
                {isSubmitting ? t('settings.updating_password') : t('settings.change_password_btn')}
            </Button>
        </div>
    );
}
