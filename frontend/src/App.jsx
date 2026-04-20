import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DoctorLayout from './pages/doctor/layout/DoctorLayout';
import DoctorDashboard from './pages/doctor/dashboard/index';
import DoctorCalendar from './pages/doctor/calendar/index';
import DoctorSettings from './pages/doctor/settings/index';
import DoctorCMS from './pages/doctor/cms/index';
import DoctorAppointments from './pages/doctor/appointments/index';
import DoctorServices from './pages/doctor/services/index';
import DoctorInsurance from './pages/doctor/insurance/index';
import LandingPage from './pages/patient/LandingPage/index';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/p/:doctorId" element={<LandingPage />} />

      <Route
        path="/doctor"
        element={
          <ProtectedRoute role="doctor">
            <DoctorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/doctor/dashboard" replace />} />
        <Route path="dashboard"    element={<DoctorDashboard />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="calendar"     element={<DoctorCalendar />} />
        <Route path="services"     element={<DoctorServices />} />
        <Route path="insurance"    element={<DoctorInsurance />} />
        <Route path="cms"          element={<DoctorCMS />} />
        <Route path="settings"     element={<DoctorSettings />} />
      </Route>
    </Routes>
  );
}