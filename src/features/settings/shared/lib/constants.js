/**
 * 설정 화면에서 사용하는 상수 및 라벨 정의
 */

export const SETTINGS_TABS = {
    GENERAL: 'general',
    PASSWORD: 'password',
    CALENDAR: 'calendar',
    CATEGORY_BOX: 'category-box'
};

export const SETTINGS_LABELS = {
    [SETTINGS_TABS.GENERAL]: 'settings.general',
    [SETTINGS_TABS.PASSWORD]: 'settings.password',
    [SETTINGS_TABS.CALENDAR]: 'settings.calendar',
    [SETTINGS_TABS.CATEGORY_BOX]: 'settings.category_box'
};

export const DELETE_MESSAGES = {
    TAB: "이 대분류를 삭제하면 하위 분류와 해당 분류에 속한 모든 일정 데이터가 삭제됩니다. 정말 삭제하시겠습니까?",
    CATEGORY: "이 하위 분류를 삭제하면 해당 분류에 속한 모든 일정 데이터가 삭제됩니다. 정말 삭제하시겠습니까?"
};
