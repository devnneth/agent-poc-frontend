const normalizeIntent = (intent) =>
  typeof intent === 'string' ? intent.trim().toLowerCase() : ''

function getHitlSlotKey(metadata = {}) {
  const intent = normalizeIntent(metadata?.intent || metadata?.current_intent)

  if (intent === 'todo') return 'todo_slots'
  if (intent === 'memo') return 'memo_slots'

  return 'schedule_slots'
}

function getHitlSlots(metadata = {}) {
  const slotKey = getHitlSlotKey(metadata)
  const slots = metadata?.[slotKey]

  if (slots && typeof slots === 'object') {
    return slots
  }

  return metadata?.schedule_slots || metadata?.todo_slots || metadata?.memo_slots || {}
}

export { getHitlSlotKey, getHitlSlots }
