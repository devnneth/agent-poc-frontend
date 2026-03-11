import { useState } from 'react';
import { Lock, Calendar, Settings } from 'lucide-react';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { useTranslation } from 'react-i18next';

// Shared imports
import { SettingsSidebarItem } from '../shared/components/settings-sidebar-item';
import { SETTINGS_TABS, SETTINGS_LABELS } from '../shared/lib/constants';

// Sub-feature Screen imports
import { CalendarProviderScreen } from '../calendar/screens/calendar-provider-screen';
import { PasswordScreen } from '../password/screens/password-screen';
import { GeneralSettingsScreen } from './general-settings-screen';

/**
 * 시스템 통합 설정을 총괄하는 메인 스크린 컴포넌트
 */
export function CalendarSettingsScreen() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(SETTINGS_TABS.GENERAL);

    const renderContent = () => {
        switch (activeTab) {
            case SETTINGS_TABS.GENERAL:
                return <GeneralSettingsScreen />;
            case SETTINGS_TABS.PASSWORD:
                return <PasswordScreen />;
            case SETTINGS_TABS.CALENDAR:
                return <CalendarProviderScreen />;
            default:
                return <GeneralSettingsScreen />;
        }
    };

    return (
        <SettingsLayout
            sidebar={
                <div className="space-y-1">
                    <SettingsSidebarItem
                        icon={Settings}
                        label={t(SETTINGS_LABELS[SETTINGS_TABS.GENERAL])}
                        active={activeTab === SETTINGS_TABS.GENERAL}
                        onClick={() => setActiveTab(SETTINGS_TABS.GENERAL)}
                    />
                    <SettingsSidebarItem
                        icon={Lock}
                        label={t(SETTINGS_LABELS[SETTINGS_TABS.PASSWORD])}
                        active={activeTab === SETTINGS_TABS.PASSWORD}
                        onClick={() => setActiveTab(SETTINGS_TABS.PASSWORD)}
                    />
                    <SettingsSidebarItem
                        icon={Calendar}
                        label={t(SETTINGS_LABELS[SETTINGS_TABS.CALENDAR])}
                        active={activeTab === SETTINGS_TABS.CALENDAR}
                        onClick={() => setActiveTab(SETTINGS_TABS.CALENDAR)}
                    />
                </div>
            }
        >
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div className="pt-2">
                    {renderContent()}
                </div>
            </div>
        </SettingsLayout>
    );
}
