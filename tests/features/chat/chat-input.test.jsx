import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatInput } from '../../../src/features/chat/components/chat-input'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}))

describe('ChatInput', () => {
  it('프리셋을 선택하면 입력창에 문구를 채워야 한다', () => {
    const onSend = vi.fn()

    render(
      <ChatInput
        onSend={onSend}
        presets={[
          { id: 'preset-1', prompt: '오늘 일정 정리해줘.' },
        ]}
      />,
    )

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'preset-1' },
    })

    expect(onSend).toHaveBeenCalledWith('오늘 일정 정리해줘.')
  })

  it('입력한 메시지를 전송해야 한다', () => {
    const onSend = vi.fn()

    render(<ChatInput onSend={onSend} />)

    fireEvent.change(screen.getByPlaceholderText('chat.placeholder'), {
      target: { value: '테스트 메시지' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'chat.send' }))

    expect(onSend).toHaveBeenCalledWith('테스트 메시지')
  })
})
