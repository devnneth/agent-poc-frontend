import template from '../resources/embedding/calendar-template.txt?raw';

const PLACEHOLDER_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;

function toText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

export function buildScheduleEmbeddingText(input) {
  if (!input) return '';

  // start_at ISO 문자열에서 날짜(YYYY-MM-DD)와 시간(HH:MM)을 추출합니다.
  const dateStr = input.start_at ? input.start_at.slice(0, 10) : '';
  const timeStr = input.start_at ? input.start_at.slice(11, 16) : '';

  const values = {
    title: toText(input.summary),
    description: toText(input.description),
    alarm_time: toText(input.alarm_time ?? timeStr),
    date: toText(dateStr),
    time: toText(timeStr),
    calendar_name: toText(input.calendar_name),
    category_name: toText(input.category_name),
    sub_category_name: toText(input.sub_category_name)
  };

  const filled = template.replace(PLACEHOLDER_PATTERN, (_, key) => {
    const value = values[key];
    return value ?? '';
  });

  return filled.replace(/[ \t\r\n]+$/, '');
}
