import { useLayout } from './LayoutContext'
import TabBar from './TabBar'

export default function TabBarWrapper() {
  const { showTabBar } = useLayout()
  if (!showTabBar) return null
  return <TabBar />
}
