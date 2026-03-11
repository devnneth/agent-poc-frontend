import { PageHeader } from '@/components/ui/page-header';
import { useSecuritySettings } from '../hooks/use-security-settings';
import { PasswordUpdateForm } from '../components/password-update-form';

/**
 * 보안 설정 화면 (Screen 레이어)
 */
export function SecurityScreen() {
    const {
        password,
        setPassword,
        isSubmitting,
        handleUpdatePassword
    } = useSecuritySettings();

    return (
        <div className="space-y-6">
            <PageHeader
                category="Account"
                title="비밀번호 변경"
                description="새 비밀번호를 입력하고 변경 버튼을 눌러주세요."
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
