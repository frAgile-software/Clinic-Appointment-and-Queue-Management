import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Landing from "./pages/Landing/Landing"
import Registration from "./pages/Registration/Registration"
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard"
import StaffDashboard from "./pages/StaffDashboard/StaffDashboard"
import PatientDashboard from "./pages/PatientDashboard/PatientDashboard"

function App() {
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
        <Route path="/dashboard/admin" element= { <AdminDashboard /> } />
        <Route path="/dashboard/staff" element= { <StaffDashboard /> } />
        <Route path="/dashboard/patient" element= { <PatientDashboard /> } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
