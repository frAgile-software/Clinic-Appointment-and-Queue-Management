import { BrowserRouter, Routes, Route, Link, Navigate} from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';

import Landing from           "./pages/Landing/Landing"
import Registration from      "./pages/Registration/Registration"
import AdminDashboard from    "./pages/AdminDashboard/AdminDashboard"
import StaffDashboard from    "./pages/StaffDashboard/StaffDashboard"
import StaffProfile from      "./pages/StaffProfile/StaffProfile"
import PatientDashboard from  "./pages/PatientDashboard/PatientDashboard"

function App() {
  const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth0();

    if (!isAuthenticated) return <Navigate to="/" replace />;
    return children;
  };

  return (
    <BrowserRouter>
      {/* Navigation */}
      <nav>
        <Link to="/">Landing</Link>
        <Link to="/register">Registration</Link>
        <Link to="/dashboard/admin">AdminDashboard</Link>
        <Link to="/dashboard/staff">StaffDashboard</Link>
        <Link to="/dashboard/patient">PatientDashboard</Link>
      </nav>

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
