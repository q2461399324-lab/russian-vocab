import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { path: '/learn', label: '学习', icon: '📚' },
  { path: '/review', label: '复习', icon: '🔄' },
  { path: '/profile', label: '我的', icon: '👤' },
]

export default function TabBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-[430px] border-t border-slate-200 bg-white/90 backdrop-blur-lg safe-area-bottom">
      <div className="flex h-16 items-center justify-around px-4">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center justify-center gap-0.5 px-5 py-2 transition-colors active:scale-95 ${
              isActive(tab.path)
                ? 'text-blue-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
