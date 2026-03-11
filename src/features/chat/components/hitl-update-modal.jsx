import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BaseModal } from '@/components/ui/base-modal'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getHitlSlots } from '../lib/hitl-slots'

// snake_case → 읽기 좋은 레이블로 변환
const formatKey = (key) => key.replace(/_/g, ' ')

// 필드 타입에 따른 input type 결정
const inferInputType = (key, value) => {
  if (key === 'id' || key === 'todo_id' || key === 'memo_id') return 'hidden'
  if (key === 'status') return 'checkbox'
  if (key === 'priority') return 'select'
  if (typeof value === 'number') return 'number'
  if (key.includes('date') || key.includes('time') || key.includes('at')) return 'datetime-local'
  return 'text'
}

const PRIORITY_OPTIONS = ['urgent', 'hight', 'normal']

const toBooleanValue = (value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === 'done'
  }
  return Boolean(value)
}

// ISO 날짜 문자열을 datetime-local input에 맞는 형식으로 변환
const toDatetimeLocalValue = (val) => {
  if (!val) return ''
  try {
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return val
    // datetime-local 은 'YYYY-MM-DDTHH:mm' 포맷 필요
    return d.toISOString().slice(0, 16)
  } catch {
    return val
  }
}

const isIsoDateString = (val) =>
  typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)

const initFormValues = (fields) => {
  const result = {}
  for (const field of fields) {
    const type = inferInputType(field.key, field.value)
    if (type === 'checkbox') {
      result[field.key] = toBooleanValue(field.value)
      continue
    }
    result[field.key] =
      type === 'datetime-local' && isIsoDateString(String(field.value))
        ? toDatetimeLocalValue(String(field.value))
        : String(field.value ?? '')
  }
  return result
}

// metadata.schedule_slots / metadata.todo_slots 같은 plain object → fields 배열로 변환
const slotsToFields = (slots) => {
  if (!slots || typeof slots !== 'object') return []
  return Object.entries(slots).map(([key, value]) => ({
    key,
    value,
    required: true,
  }))
}

// HITL update 요청 — 사용자에게 값을 직접 수정하게 하는 모달
// request 구조 예시 (fields 방식):
//   { content: '...', metadata: { fields: [{ key: 'title', value: '회의', required: true }, ...] } }
// request 구조 예시 (slots 방식):
//   { content: '...', metadata: { action: 'update', intent: 'schedule', schedule_slots: { summary: '미용실', start_at: '...', ... } } }
function HitlUpdateModal({ request, open, onConfirm, onCancel }) {
  const { t } = useTranslation()
  const fields = (request?.metadata?.fields
    ?? slotsToFields(getHitlSlots(request?.metadata)))
    .filter((field) => field.key !== 'project')
  const [values, setValues] = useState(() => initFormValues(fields))

  if (!open || !request) return null

  const content = request.content || t('chat.hitl_update_question')

  const handleChange = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }))
  }

  const handleConfirm = () => {
    // datetime-local → ISO 문자열로 재변환
    const result = {}
    for (const field of fields) {
      const type = inferInputType(field.key, field.value)
      result[field.key] =
        type === 'datetime-local' && values[field.key]
          ? new Date(values[field.key]).toISOString()
          : values[field.key]
    }
    onConfirm?.(result)
  }

  return (
    <BaseModal
      open={open}
      onClose={undefined}
      ariaLabel={t('chat.hitl_update_modal_title')}
      closeOnBackdrop={false}
    >
      <div className="flex w-full max-w-lg flex-col rounded-3xl bg-white p-8 shadow-xl dark:bg-stone-900">
        {/* 상단 레이블 */}
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-500 dark:text-amber-400">
          {t('chat.hitl_update_label')}
        </p>

        {/* 제목 */}
        <h2 className="mt-3 text-xl font-semibold text-stone-900 dark:text-stone-100">
          {content}
        </h2>

        {/* 필드 폼 */}
        {fields.length > 0 && (
          <div className="mt-6 flex flex-col gap-4">
            {fields.filter((f) => f.key !== 'schedule_id').map((field) => {
              const inputType = inferInputType(field.key, field.value)

              if (inputType === 'hidden') {
                return null
              }

              return (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`hitl-field-${field.key}`}
                    className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400"
                  >
                    {formatKey(field.key)}
                    {field.required && (
                      <span className="text-rose-400" aria-label="필수">*</span>
                    )}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      id={`hitl-field-${field.key}`}
                      rows={3}
                      value={values[field.key] ?? ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder ?? ''}
                      className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-100 dark:focus:border-amber-500 dark:focus:ring-amber-900/30"
                    />
                  ) : inputType === 'checkbox' ? (
                    <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800/60">
                      <Checkbox
                        id={`hitl-field-${field.key}`}
                        checked={Boolean(values[field.key])}
                        onCheckedChange={(checked) => handleChange(field.key, checked === true)}
                      />
                    </div>
                  ) : inputType === 'select' ? (
                    <Select
                      value={values[field.key] ?? ''}
                      onValueChange={(value) => handleChange(field.key, value)}
                    >
                      <SelectTrigger
                        id={`hitl-field-${field.key}`}
                        className="w-full rounded-xl border-stone-200 bg-stone-50 text-sm text-stone-800 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-100 dark:focus:ring-amber-900/30"
                      >
                        <SelectValue placeholder={field.placeholder ?? ''} />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <input
                      id={`hitl-field-${field.key}`}
                      type={inputType}
                      value={values[field.key] ?? ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder ?? ''}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-100 dark:focus:border-amber-500 dark:focus:ring-amber-900/30"
                    />
                  )}

                  {field.description && (
                    <p className="text-[11px] text-stone-400 dark:text-stone-500">
                      {field.description}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 필드가 없을 때 빈 상태 */}
        {fields.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-6 text-center dark:border-stone-700 dark:bg-stone-800/40">
            <p className="text-sm text-stone-400 dark:text-stone-500">
              {t('chat.hitl_update_no_fields')}
            </p>
          </div>
        )}

        {/* 버튼 */}
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            {t('chat.hitl_cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-400 dark:hover:bg-amber-300"
          >
            {t('chat.hitl_confirm')}
          </button>
        </div>
      </div>
    </BaseModal>
  )
}

export { HitlUpdateModal }
