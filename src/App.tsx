import { Routes, Route, Navigate } from 'react-router-dom'
import { LayoutProvider } from './components/LayoutContext'
import ErrorBoundary from './components/ErrorBoundary'
import DataProvider from './components/DataProvider'
import TabBarWrapper from './components/TabBarWrapper'
import LearnPage from './pages/LearnPage'
import ReviewPage from './pages/ReviewPage'
import ProfilePage from './pages/ProfilePage'

function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <LayoutProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/learn" replace />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
          <TabBarWrapper />
        </LayoutProvider>
      </DataProvider>
    </ErrorBoundary>
  )
}

export default App
