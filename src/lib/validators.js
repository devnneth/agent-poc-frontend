// 비밀번호 규칙을 검증하고 메시지를 반환
const validatePassword = (password) => {
  const trimmed = password.trim()

  if (!trimmed) {
    return { valid: false, message: '비밀번호를 입력해주세요.' }
  }

  if (trimmed.length < 8) {
    return { valid: false, message: '비밀번호는 최소 8자 이상이어야 합니다.' }
  }

  return { valid: true, value: trimmed }
}

export { validatePassword }
