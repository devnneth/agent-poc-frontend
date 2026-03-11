// 사이드바 메뉴 버튼 컴포넌트
function MenuItem({ label, icon: Icon, active, onClick, collapsed, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={collapsed ? label : undefined}
      className={`flex w-full items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} rounded-2xl py-3 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${active
        ? 'bg-stone-900 text-white shadow dark:bg-stone-100 dark:text-stone-900'
        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100'
        }`}
    >
      {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  )
}

export { MenuItem }
