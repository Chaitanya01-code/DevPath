import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AdminProtectedRoute from './components/layout/AdminProtectedRoute'
import GuestRoute from './components/layout/GuestRoute'
import Navbar from './components/layout/Navbar'
import ProtectedRoute from './components/layout/ProtectedRoute'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { AuthProvider } from './context/AuthContext'
import AdminDashboard from './pages/AdminDashboard'
import Dashboard, {
  LearningResourcesPage,
  MyProgressPage,
  ProfilePage,
  RoadmapDetail,
  RoadmapsPage,
  StudentLayout,
} from './pages/Dashboard'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'

export default function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <BrowserRouter>
          <div className="flex min-h-screen flex-col bg-page text-body">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route element={<GuestRoute />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                  <Route element={<StudentLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/roadmaps" element={<RoadmapsPage />} />
                    <Route path="/roadmaps/:roadmapId" element={<RoadmapDetail />} />
                    <Route path="/resources" element={<LearningResourcesPage />} />
                    <Route path="/progress" element={<MyProgressPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                  </Route>
                </Route>
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route element={<AdminProtectedRoute />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AdminAuthProvider>
    </AuthProvider>
  )
}
