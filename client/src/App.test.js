import { render, screen } from '@testing-library/react';
import App from './App';
import { useAuth0 } from '@auth0/auth0-react';
import { MemoryRouter } from 'react-router';
import { useUserRole } from './context/UserRoleContext';

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    BrowserRouter: ({ children }) => children,
}));

jest.mock('./context/UserRoleContext', () => ({
    UserRoleProvider: ({ children }) => children,
    useUserRole: jest.fn(),
}));

jest.mock('@auth0/auth0-react');
jest.mock('./pages/Landing/Landing', () => () => <section>Landing</section>);
jest.mock('./pages/Registration/Registration', () => () => <section>Registration</section>);
jest.mock('./pages/AdminDashboard/AdminDashboard', () => () => <section>Admin Dashboard</section>);
jest.mock('./pages/AdminProfile/AdminProfile', () => () => <section>Admin Profile</section>);
jest.mock('./pages/StaffDashboard/StaffDashboard', () => () => <section>Staff Dashboard</section>);
jest.mock('./pages/StaffProfile/StaffProfile', () => () => <section>Staff Profile</section>);
jest.mock('./pages/PatientDashboard/PatientDashboard', () => () => <section>Patient Dashboard</section>);
jest.mock('./pages/PatientProfile/PatientProfile', () => () => <section>Patient Profile</section>);
jest.mock('./pages/Booking/Booking', () => () => <section>Booking</section>);

const renderPath = (path, { isAuthenticated = false, role = null } = {}) => {
  useAuth0.mockReturnValue({ isAuthenticated, isLoading: false });
  useUserRole.mockReturnValue({ role, roleLoading: false });

  render(
    <MemoryRouter initialEntries={[path]}>
      <App/>
    </MemoryRouter>
  );
};

describe('App Routing', () => {

  test('Renders landing at /', () => {
    renderPath('/');
    expect(screen.getByText('Landing')).toBeInTheDocument();
  });

  test('Renders Registration at /register', () => {
    renderPath('/register', { isAuthenticated: true });
    expect(screen.getByText('Registration')).toBeInTheDocument();
  });

  // ------- Admin routes --------
  test('Renders Admin Dashboard at /dashboard/admin when authenticated', () => {
    renderPath('/dashboard/admin', { isAuthenticated: true, role: 'Admin' });
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  test('Redirects from /dashboard/admin when not authenticated', () => {
    renderPath('/dashboard/admin');
    expect(screen.getByText('Landing')).toBeInTheDocument();
  });

  test('Redirects from /dashboard/admin when wrong role', () => {
    renderPath('/dashboard/admin', { isAuthenticated: true, role: 'Patient' });
    expect(screen.getByText('Landing')).toBeInTheDocument();
  });

  // ------- Staff routes --------
  test('Renders Staff Dashboard at /dashboard/staff when authenticated', () => {
    renderPath('/dashboard/staff', { isAuthenticated: true, role: 'Staff' });
    expect(screen.getByText('Staff Dashboard')).toBeInTheDocument();
  });

  test('Redirects from /dashboard/staff when not authenticated', () => {
    renderPath('/dashboard/staff');
    expect(screen.getByText('Landing')).toBeInTheDocument();
  });

  test('Redirects from /dashboard/staff when wrong role', () => {
    renderPath('/dashboard/staff', { isAuthenticated: true, role: 'Patient' });
    expect(screen.getByText('Landing')).toBeInTheDocument();
  });

  // ------- Patient routes --------
  test('Renders Patient Dashboard at /dashboard/patient when authenticated', () => {
    renderPath('/dashboard/patient', { isAuthenticated: true, role: 'Patient' });
    expect(screen.getByText('Patient Dashboard')).toBeInTheDocument();
  });

  test('Redirects from /dashboard/patient when not authenticated', () => {
    renderPath('/dashboard/patient');
    expect(screen.getByText('Landing')).toBeInTheDocument();
  });

  test('Redirects from /dashboard/patient when wrong role', () => {
    renderPath('/dashboard/patient', { isAuthenticated: true, role: 'Staff' });
    expect(screen.getByText('Landing')).toBeInTheDocument();
  });

  // ------- Profile routes --------
    test('Renders Admin Profile when authenticated with Admin role', () => {
        renderPath('/dashboard/admin/profile', { isAuthenticated: true, role: 'Admin' });
        expect(screen.getByText('Admin Profile')).toBeInTheDocument();
    });

    test('Renders Staff Profile when authenticated with Staff role', () => {
        renderPath('/dashboard/staff/profile', { isAuthenticated: true, role: 'Staff' });
        expect(screen.getByText('Staff Profile')).toBeInTheDocument();
    });

    test('Renders Patient Profile when authenticated with Patient role', () => {
        renderPath('/dashboard/patient/profile', { isAuthenticated: true, role: 'Patient' });
        expect(screen.getByText('Patient Profile')).toBeInTheDocument();
    });
});