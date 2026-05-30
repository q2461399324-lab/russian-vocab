import { createContext, useContext, useState, type ReactNode } from 'react'

interface LayoutCtx {
  showTabBar: boolean
  setShowTabBar: (v: boolean) => void
}

const Ctx = createContext<LayoutCtx>({ showTabBar: true, setShowTabBar: () => {} })

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [showTabBar, setShowTabBar] = useState(true)
  return <Ctx.Provider value={{ showTabBar, setShowTabBar }}>{children}</Ctx.Provider>
}

export function useLayout() {
  return useContext(Ctx)
}
