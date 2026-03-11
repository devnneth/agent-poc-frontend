import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// 채팅 입력창에서 메시지를 전송하는 공용 컴포넌트
function ChatInput({
  onSend,
  sending = false,
  onCancel,
  locked = false,
  onLockedAction,
  placeholder = 'chat.placeholder',
  autoFocus = false,
  presets = [],
}) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('')

  // 잠금 상태에서 입력을 막고 로그인 안내를 호출한다
  const handleLocked = (event) => {
    if (!locked) return
    event.preventDefault()
    onLockedAction?.()
  }

  // 입력값 변경을 처리한다
  const handleChange = (event) => {
    if (locked) return
    setValue(event.target.value)
  }

  // 프리셋 선택 시 즉시 메시지를 전송한다
  const handlePresetChange = (event) => {
    if (locked) return
    const presetId = event.target.value
    
    // 선택 즉시 초기화하여 같은 항목을 다시 누를 수 있게 함
    setSelectedPreset('')

    const preset = presets.find((item) => item.id === presetId)
    if (!preset || sending) return

    setValue('')
    onSend?.(preset.prompt)
  }

  // 메시지 전송 요청을 전달한다
  const handleSubmit = (event) => {
    event.preventDefault()
    if (locked) {
      onLockedAction?.()
      return
    }

    if (sending) return

    const trimmed = value.trim()
    if (!trimmed) return

    setValue('')
    onSend?.(trimmed)
  }

  // 응답 스트리밍 중단을 요청한다
  const handleCancel = (event) => {
    event.preventDefault()
    if (locked) {
      onLockedAction?.()
      return
    }
    onCancel?.()
  }

  return (
    <form className="mt-6" onSubmit={handleSubmit}>
      {presets.length > 0 ? (
        <div className="mb-3">
          <div className="relative">
            <select
              id="chat-preset-select"
              value={selectedPreset}
              onChange={handlePresetChange}
              onFocus={handleLocked}
              onClick={handleLocked}
              disabled={locked}
              className="w-full appearance-none rounded-2xl border border-stone-200 bg-white px-4 py-3 pr-12 text-sm text-stone-700 outline-none shadow-sm transition focus:border-stone-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            >
              <option value="">{t('chat.preset_placeholder')}</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.prompt}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            />
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm dark:border-stone-700 dark:bg-stone-900">
        <input
          type="text"
          value={value}
          placeholder={locked ? t('chat.locked_placeholder') : t(placeholder)}
          autoFocus={autoFocus && !locked}
          onFocus={handleLocked}
          onClick={handleLocked}
          onChange={handleChange}
          readOnly={locked}
          className="flex-1 bg-transparent text-sm text-stone-700 outline-none placeholder:text-stone-400 dark:text-stone-100 dark:placeholder:text-stone-500"
        />
        <button
          type={sending ? 'button' : 'submit'}
          onClick={sending ? handleCancel : handleLocked}
          aria-label={sending ? t('chat.stop_aria') : t('chat.send')}
          className="flex items-center justify-center rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white dark:bg-stone-100 dark:text-stone-900"
        >
          {sending ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect x="3" y="2.5" width="3.5" height="11" rx="1" fill="currentColor" />
              <rect x="9.5" y="2.5" width="3.5" height="11" rx="1" fill="currentColor" />
            </svg>
          ) : (
            t('chat.send')
          )}
        </button>
      </div>
    </form>
  )
}

export { ChatInput }
