import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { NotificationProvider } from './context/NotificationContext';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import MapView from './pages/MapView';
import ReportIssue from './pages/ReportIssue';
import IssueDetail from './pages/IssueDetail';
import MyReports from './pages/MyReports';
import NotificationsPage from './pages/NotificationsPage';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/map"
              element={
                <ProtectedRoute roles={['citizen']}>
                  <MapView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute roles={['citizen']}>
                  <ReportIssue />
                </ProtectedRoute>
              }
            />
            <Route path="/issues/:id" element={<IssueDetail />} />
            <Route
              path="/my-reports"
              element={
                <ProtectedRoute roles={['citizen']}>
                  <MyReports />
                </ProtectedRoute>
              }
            />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={['staff', 'admin']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Landing />} />
          </Routes>
        </main>
      </NotificationProvider>
    </BrowserRouter>
  );
}