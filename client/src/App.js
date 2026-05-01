import { BrowserRouter, Routes, Route, Navigate} from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';

import Landing from           "./pages/Landing/Landing"
import Registration from      "./pages/Registration/Registration"
import AdminDashboard from    "./pages/AdminDashboard/AdminDashboard"
import StaffDashboard from    "./pages/StaffDashboard/StaffDashboard"
import PatientDashboard from  "./pages/PatientDashboard/PatientDashboard"
import StaffProfile from      "./pages/StaffProfile/StaffProfile"
import Booking from         "./pages/Booking/Booking"
function App() {
  const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth0();

    if (!isAuthenticated) return <Navigate to="/" replace />;
    return children;
  };

  return (
    <BrowserRouter>
      {/* Routes */}
      <Routes>
        <Route path="/" element= { <Landing /> } />
        <Route path="/register" element= { <Registration /> } />
        <Route path="/dashboard/admin" element= { 
          <ProtectedRoute>
            <AdminDashboard /> 
          </ProtectedRoute>
          } />
        <Route path="/dashboard/staff" element= { 
          <ProtectedRoute>
            <StaffDashboard /> 
          </ProtectedRoute>} />
          <Route path="/dashboard/staff/profile" element= {
          <ProtectedRoute>
            <StaffProfile />
          </ProtectedRoute>} />
        <Route path="/dashboard/patient" element= { 
          <ProtectedRoute>
            <PatientDashboard /> 
          </ProtectedRoute>} />
          <Route path="/book" element={<Booking />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
