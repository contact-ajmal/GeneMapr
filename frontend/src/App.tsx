import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import UploadPage from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Layout>
  )
}

export default App
