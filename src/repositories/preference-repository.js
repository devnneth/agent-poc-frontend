const THEME_STORAGE_KEY = 'gplanner.theme'
const CALENDAR_ID_KEY = 'gplanner_selected_calendar_id'
const CALENDAR_NAME_KEY = 'gplanner_selected_calendar_name'
const TAB_ID_KEY = 'gplanner_selected_tab_id'
const CATEGORY_ID_KEY = 'gplanner_selected_category_id'

// 저장된 테마 값을 안전하게 불러온다
function loadTheme() {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (raw === 'light' || raw === 'dark') return raw
    return null
  } catch (error) {
    console.error('테마 저장소 읽기 실패:', error)
    return null
  }
}

// 테마 값을 로컬 저장소에 저장한다
function saveTheme(theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (error) {
    console.error('테마 저장소 저장 실패:', error)
  }
}

/**
 * 캘린더 작업 환경 설정을 불러온다
 */
function loadCalendarPreferences() {
  try {
    return {
      calendarId: window.localStorage.getItem(CALENDAR_ID_KEY),
      calendarName: window.localStorage.getItem(CALENDAR_NAME_KEY),
      tabId: window.localStorage.getItem(TAB_ID_KEY),
      categoryId: window.localStorage.getItem(CATEGORY_ID_KEY),
    }
  } catch (error) {
    console.error('캘린더 설정 읽기 실패:', error)
    return {}
  }
}

/**
 * 캘린더 작업 환경 설정을 저장한다
 * 값이 null/undefined인 경우 해당 키를 삭제한다
 */
function saveCalendarPreferences({ calendarId, calendarName, tabId, categoryId }) {
  try {
    if (calendarId !== undefined) {
      if (calendarId) window.localStorage.setItem(CALENDAR_ID_KEY, calendarId)
      else window.localStorage.removeItem(CALENDAR_ID_KEY)
    }
    if (calendarName !== undefined) {
      if (calendarName) window.localStorage.setItem(CALENDAR_NAME_KEY, calendarName)
      else window.localStorage.removeItem(CALENDAR_NAME_KEY)
    }
    if (tabId !== undefined) {
      if (tabId) window.localStorage.setItem(TAB_ID_KEY, tabId)
      else window.localStorage.removeItem(TAB_ID_KEY)
    }
    if (categoryId !== undefined) {
      if (categoryId) window.localStorage.setItem(CATEGORY_ID_KEY, categoryId)
      else window.localStorage.removeItem(CATEGORY_ID_KEY)
    }
  } catch (error) {
    console.error('캘린더 설정 저장 실패:', error)
  }
}

/**
 * 필수 설정(캘린더, 탭, 카테고리)이 모두 설정되어 있는지 확인한다
 */
function checkRequiredSettings() {
  const { calendarId } = loadCalendarPreferences()
  return Boolean(calendarId)
}

export {
  loadTheme,
  saveTheme,
  loadCalendarPreferences,
  saveCalendarPreferences,
  checkRequiredSettings,
}
