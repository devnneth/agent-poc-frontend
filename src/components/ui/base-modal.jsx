import { createPortal } from 'react-dom'

// 공용 모달 레이아웃을 제공한다
function BaseModal({ open, onClose, ariaLabel = '모달', closeOnBackdrop = true, children }) {
  if (!open) return null

  const handleBackdropClick = () => {
    if (!closeOnBackdrop) return
    onClose?.()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={handleBackdropClick}
    >
      <div onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  )
}

export { BaseModal }
