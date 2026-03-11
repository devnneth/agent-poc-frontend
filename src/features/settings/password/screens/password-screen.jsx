import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/ui/page-header';
import { usePasswordSettings } from '../hooks/use-password-settings';
import { PasswordUpdateForm } from '../components/password-update-form';

/**
 * 비밀번호 설정 화면 (Screen 레이어)
 */
export function PasswordScreen() {
    const { t } = useTranslation();
    const {
        password,
        setPassword,
        isSubmitting,
        handleUpdatePassword
    } = usePasswordSettings();

    return (
        <div className="space-y-6">
            <PageHeader
                category="Account"
                title={t('settings.password_title')}
                description={t('settings.password_desc')}
            />

            <PasswordUpdateForm
                password={password}
                setPassword={setPassword}
                isSubmitting={isSubmitting}
                onUpdate={handleUpdatePassword}
            />
        </div>
    );
}
