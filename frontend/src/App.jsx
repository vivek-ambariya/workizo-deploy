import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { GoogleOAuthProvider } from '@react-oauth/google';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import CaptainLayout from './layouts/CaptainLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import SplineLanding from './SplineLanding';
import LandingPage from './LandingPage';

import CustomerLogin from './customer/CustomerLogin';
import CustomerRegister from './customer/CustomerRegister';
import WorkerLogin from './captain/WorkerLogin';
import WorkerRegister from './captain/WorkerRegister';
import AdminLogin from './admin/AdminLogin';
import ForgotPassword from './components/ForgotPassword';
import CustomerProfile from './customer/CustomerProfile';
import WorkerProfile from './captain/WorkerProfile';
import CustomerDashboard from './customer/CustomerDashboard';
import WorkerDashboard from './captain/WorkerDashboard';
import AdminDashboard from './admin/AdminDashboard';
import BookingFlow from './customer/BookingFlow';
import BookingTracker from './customer/BookingTracker';
import WorkerJobDetails from './captain/WorkerJobDetails';
import WorkerJobHistory from './captain/WorkerJobHistory';
import WorkerWallet from './captain/WorkerWallet';
import WorkerSettings from './captain/WorkerSettings';
import WorkerOnboarding from './captain/WorkerOnboarding';
import WorkerWaiting from './captain/WorkerWaiting';
import CaptainRouteWrapper from './components/CaptainRouteWrapper';
import { Outlet } from 'react-router-dom';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1036814981144-mockgoogleclientid.apps.googleusercontent.com";

function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Spline Landing Page (No Layout, completely full screen) */}
              <Route path="/" element={<SplineLanding />} />

              {/* Public and Customer Routes under CustomerLayout */}
              <Route element={<CustomerLayout />}>
                <Route path="/home" element={<LandingPage />} />

                <Route path="/customer/login" element={<CustomerLogin />} />
                <Route path="/customer/register" element={<CustomerRegister />} />
                <Route path="/captain/login" element={<WorkerLogin />} />
                <Route path="/captain/register" element={<WorkerRegister />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Customer Protected Routes */}
                <Route
                  path="/customer/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <CustomerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/book"
                  element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <BookingFlow />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/profile"
                  element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <CustomerProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/booking/:bookingId"
                  element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <BookingTracker />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Captain Onboarding/Waiting (Non-approved) Routes */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['worker']}>
                    <CaptainRouteWrapper requireApproved={false}>
                      <Outlet />
                    </CaptainRouteWrapper>
                  </ProtectedRoute>
                }
              >
                <Route path="/captain/onboarding" element={<WorkerOnboarding />} />
                <Route path="/captain/waiting" element={<WorkerWaiting />} />
              </Route>

              {/* Captain Protected Routes under CaptainLayout */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['worker']}>
                    <CaptainRouteWrapper requireApproved={true}>
                      <CaptainLayout />
                    </CaptainRouteWrapper>
                  </ProtectedRoute>
                }
              >
                <Route path="/captain/dashboard" element={<WorkerDashboard />} />
                <Route path="/captain/job/:id" element={<WorkerJobDetails />} />
                <Route path="/captain/profile" element={<WorkerProfile />} />
                <Route path="/captain/history" element={<WorkerJobHistory />} />
                <Route path="/captain/wallet" element={<WorkerWallet />} />
                <Route path="/captain/settings" element={<WorkerSettings />} />
              </Route>

              {/* Admin Protected Routes under AdminLayout */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </Route>
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#ffffff',
                  color: '#0F0F14',
                  border: '1px solid #E5E7EB'
                }
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
