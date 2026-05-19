import { BrowserRouter, Routes, Route, Navigate} from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';

import Landing from           "./pages/Landing/Landing"
import Registration from      "./pages/Registration/Registration"
import AdminDashboard from    "./pages/AdminDashboard/AdminDashboard"
import StaffDashboard from    "./pages/StaffDashboard/StaffDashboard"
import PatientDashboard from  "./pages/PatientDashboard/PatientDashboard"
import StaffProfile from      "./pages/StaffProfile/StaffProfile"
import Booking from           "./pages/Booking/Booking"
import PatientProfile from    './pages/PatientProfile/PatientProfile'
import AdminProfile from './pages/AdminProfile/AdminProfile';
import { UserRoleProvider, useUserRole } from './context/UserRoleContext';
import EditSchedule from    "./pages/Schedule/ScheduleDashboard"

function App() {
  const ProtectedRoute = ({ allowedRoles, children }) => {
    const { isAuthenticated, isLoading } = useAuth0();
    const {role, roleLoading} = useUserRole();

    if (isLoading || roleLoading) return <div>Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/" replace />;
    if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />;

    return children;
  };

  return (
    <UserRoleProvider>
    <BrowserRouter>
      {/* Routes */}
      <Routes>
        <Route path="/" element= { <Landing /> } />
        <Route path="/register" element= { <Registration /> } />
        <Route path="/dashboard/admin" element= { 
          <ProtectedRoute allowedRoles={["Admin"]}>
            <AdminDashboard /> 
          </ProtectedRoute>
          } />
        <Route path="/dashboard/admin/profile" element= { 
          <ProtectedRoute allowedRoles={["Admin"]}>
            <AdminProfile /> 
          </ProtectedRoute>
          } />
        <Route path="/dashboard/staff" element= { 
          <ProtectedRoute allowedRoles={["Staff"]}>
            <StaffDashboard /> 
          </ProtectedRoute>} />
        <Route path="/dashboard/staff/profile" element= {
          <ProtectedRoute allowedRoles={["Staff"]}>
            <StaffProfile />
          </ProtectedRoute>} />
        <Route path="/dashboard/patient" element= { 
          <ProtectedRoute allowedRoles={["Patient"]}>
            <PatientDashboard /> 
          </ProtectedRoute>} />
        <Route path="/dashboard/patient/profile" element= {
          <ProtectedRoute allowedRoles={["Patient"]}>
            <PatientProfile />
          </ProtectedRoute>} />
        <Route path="/book" element= {
          <ProtectedRoute allowedRoles={["Patient"]}>
            <Booking />
          </ProtectedRoute>} />
        <Route path="/dashboard/staff/schedule" element={
                    <ProtectedRoute>
                        <EditSchedule />
                      </ProtectedRoute>} />
            </Routes>
    </BrowserRouter>
    </UserRoleProvider>
  );
}

export default App;
