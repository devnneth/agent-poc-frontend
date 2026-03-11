import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 일반 설정을 담당하는 스크린 컴포넌트 (언어 설정 등)
 */
export function GeneralSettingsScreen() {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (value) => {
    i18n.changeLanguage(value);
  };

  return (
    <Card className="border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-stone-900 dark:text-stone-50">
          {t('settings.general')}
        </CardTitle>
        <CardDescription className="text-stone-500 dark:text-stone-400">
          {t('settings.language_desc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="language" className="text-sm font-medium text-stone-700 dark:text-stone-300">
            {t('settings.language')}
          </Label>
          <Select value={i18n.language} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language" className="w-[180px] bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800">
              <SelectValue placeholder={t('settings.language')} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800">
              <SelectItem value="en">{t('settings.lang_en')}</SelectItem>
              <SelectItem value="ko">{t('settings.lang_ko')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
