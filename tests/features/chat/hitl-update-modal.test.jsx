import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HitlUpdateModal } from '../../../src/features/chat/components/hitl-update-modal'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}))

describe('HitlUpdateModal', () => {
  it('todo status가 DONE이면 체크박스를 체크 상태로 렌더링해야 한다', () => {
    render(
      <HitlUpdateModal
        open
        request={{
          content: '할일 수정 작업을 승인해주세요',
          metadata: {
            intent: 'todo',
            action: 'update',
            todo_slots: {
              title: '어머니께 전화하기',
              description: '',
              status: 'DONE',
              priority: 'normal',
              project: '',
              todo_id: 7,
            },
          },
        }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByRole('checkbox')).toBeChecked()
  })
})
