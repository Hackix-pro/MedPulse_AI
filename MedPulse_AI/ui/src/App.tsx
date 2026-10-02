import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Public pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Patient pages
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { PatientReports } from './pages/patient/PatientReports';
import { ReportDetailPage } from './pages/patient/ReportDetailPage';
import { HealthTimeline } from './pages/patient/HealthTimeline';
import { HealthTrends } from './pages/patient/HealthTrends';
import { CompareReports } from './pages/patient/CompareReports';
import { AIAssistant } from './pages/patient/AIAssistant';
import { AlertsPage } from './pages/patient/AlertsPage';
import { MyDoctors } from './pages/patient/MyDoctors';
import { SharedReports } from './pages/patient/SharedReports';
import { PatientNotifications } from './pages/patient/PatientNotifications';
import { PatientProfile } from './pages/patient/PatientProfile';
import { PatientSettings } from './pages/patient/PatientSettings';

// Doctor pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { DoctorPatients } from './pages/doctor/DoctorPatients';
import { DoctorPatientProfile } from './pages/doctor/DoctorPatientProfile';
import { DoctorAlerts } from './pages/doctor/DoctorAlerts';
import { DoctorRequests } from './pages/doctor/DoctorRequests';
import { DoctorNotifications } from './pages/doctor/DoctorNotifications';
import { DoctorProfile } from './pages/doctor/DoctorProfile';
import { DoctorSettings } from './pages/doctor/DoctorSettings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Patient Portal Routes */}
            <Route
              path="/patient"
              element={
                <ProtectedRoute allowedRole="patient">
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/patient/dashboard" replace />} />
              <Route path="dashboard" element={<PatientDashboard />} />
              <Route path="reports" element={<PatientReports />} />
              <Route path="reports/:id" element={<ReportDetailPage />} />
              <Route path="timeline" element={<HealthTimeline />} />
              <Route path="trends" element={<HealthTrends />} />
              <Route path="compare" element={<CompareReports />} />
              <Route path="assistant" element={<AIAssistant />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="doctors" element={<MyDoctors />} />
              <Route path="shared" element={<SharedReports />} />
              <Route path="notifications" element={<PatientNotifications />} />
              <Route path="profile" element={<PatientProfile />} />
              <Route path="settings" element={<PatientSettings />} />
            </Route>

            {/* Doctor Portal Routes */}
            <Route
              path="/doctor"
              element={
                <ProtectedRoute allowedRole="doctor">
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/doctor/dashboard" replace />} />
              <Route path="dashboard" element={<DoctorDashboard />} />
              <Route path="patients" element={<DoctorPatients />} />
              <Route path="patients/:id" element={<DoctorPatientProfile />} />
              <Route path="patients/:id/reports" element={<DoctorPatientProfile />} />
              <Route path="patients/:id/timeline" element={<DoctorPatientProfile />} />
              <Route path="patients/:id/trends" element={<DoctorPatientProfile />} />
              <Route path="patients/:id/compare" element={<DoctorPatientProfile />} />
              <Route path="patients/:id/ai-summary" element={<DoctorPatientProfile />} />
              <Route path="alerts" element={<DoctorAlerts />} />
              <Route path="requests" element={<DoctorRequests />} />
              <Route path="notifications" element={<DoctorNotifications />} />
              <Route path="profile" element={<DoctorProfile />} />
              <Route path="settings" element={<DoctorSettings />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
