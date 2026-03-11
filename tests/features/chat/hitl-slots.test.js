import { describe, expect, it } from 'vitest'
import { getHitlSlotKey, getHitlSlots } from '../../../src/features/chat/lib/hitl-slots'

describe('hitl slots helpers', () => {
  it('todo intent면 todo_slots를 읽어야 한다', () => {
    const metadata = {
      intent: 'todo',
      schedule_slots: { summary: '회의' },
      todo_slots: { title: '우유 사기' },
    }

    expect(getHitlSlotKey(metadata)).toBe('todo_slots')
    expect(getHitlSlots(metadata)).toEqual({ title: '우유 사기' })
  })

  it('todo slot이 없으면 기존 schedule_slots로 안전하게 fallback 한다', () => {
    const metadata = {
      intent: 'todo',
      schedule_slots: { summary: '회의' },
    }

    expect(getHitlSlots(metadata)).toEqual({ summary: '회의' })
  })

  it('기본값은 schedule_slots를 읽어야 한다', () => {
    const metadata = {
      intent: 'schedule',
      schedule_slots: { summary: '미용실' },
      todo_slots: { title: '장보기' },
    }

    expect(getHitlSlotKey(metadata)).toBe('schedule_slots')
    expect(getHitlSlots(metadata)).toEqual({ summary: '미용실' })
  })

  it('memo intent면 memo_slots를 읽어야 한다', () => {
    const metadata = {
      intent: 'memo',
      schedule_slots: { summary: '회의' },
      memo_slots: { title: '회의 메모', content: '의사결정 정리' },
    }

    expect(getHitlSlotKey(metadata)).toBe('memo_slots')
    expect(getHitlSlots(metadata)).toEqual({ title: '회의 메모', content: '의사결정 정리' })
  })
})
