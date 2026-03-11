import { useState, useCallback } from 'react';
import { authService } from '@/services/auth-service';
import { useToast } from '@/hooks/use-toast';

/**
 * 보안(비밀번호 변경 등) 관련 비즈니스 로직을 관리하는 훅
 */
export function useSecuritySettings() {
    const { toast } = useToast();
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUpdatePassword = useCallback(async () => {
        if (!password) {
            toast({
                title: '비밀번호 입력',
                description: '새 비밀번호를 입력해주세요.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await authService.updatePassword(password);
            if (error) throw error;
            toast({
                title: '변경 완료',
                description: '비밀번호가 성공적으로 변경되었습니다.',
            });
            setPassword('');
        } catch (error) {
            toast({
                title: '변경 실패',
                description: error.message || '비밀번호 변경 중 오류가 발생했습니다.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [password, toast]);

    return {
        password,
        setPassword,
        isSubmitting,
        handleUpdatePassword
    };
}
