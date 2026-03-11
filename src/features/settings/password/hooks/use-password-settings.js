import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { authService } from '@/services/auth-service';
import { validatePassword } from '@/lib/validators';
import { useToast } from '@/hooks/use-toast';

/**
 * 비밀번호 변경 관련 비즈니스 로직을 관리하는 훅
 */
export function usePasswordSettings() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUpdatePassword = useCallback(async () => {
        const validation = validatePassword(password);
        if (!validation.valid) {
            toast({
                title: t('settings.password_title'),
                description: validation.message,
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await authService.updatePassword(validation.value);
            if (error) throw error;
            toast({
                title: t('settings.update_complete'),
                description: t('settings.password_update_success'),
            });
            setPassword('');
        } catch (error) {
            toast({
                title: t('settings.update_fail'),
                description: error.message || t('settings.password_update_fail'),
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [password, toast, t]);

    return {
        password,
        setPassword,
        isSubmitting,
        handleUpdatePassword
    };
}
