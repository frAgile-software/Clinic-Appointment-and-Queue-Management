import { render, screen } from '@testing-library/react';
import App from './App';
import { useAuth0 } from '@auth0/auth0-react';
import { MemoryRouter } from 'react-router';
import { ProtectedRoute } from './App'

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    BrowserRouter: ({ children }) => children,
}));

jest.mock('@auth0/auth0-react');
jest.mock('./pages/Landing/Landing', () => () => <div>Landing</div>);
jest.mock('./pages/Registration/Registration', () => () => <div>Registration</div>);
jest.mock('./pages/AdminDashboard/AdminDashboard', () => () => <div>Admin Dashboard</div>);
jest.mock('./pages/StaffDashboard/StaffDashboard', () => () => <div>Staff Dashboard</div>);
jest.mock('./pages/StaffProfile/StaffProfile', () => () => <div>Staff Profile</div>);
jest.mock('./pages/PatientDashboard/PatientDashboard', () => () => <div>Patient Dashboard</div>);

const renderPath = (path, isAuthenticated = false) => {
  useAuth0.mockReturnValue({ isAuthenticated });
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
    renderPath('/register', true);
    expect(screen.getByText('Registration')).toBeInTheDocument();
  });

  test('Renders Admin Dashboard at /dashboard/admin when authenticated', () => {
    renderPath('/dashboard/admin', true);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  test('Redirects from /dashboard/admin when not authenticated', () => {
    renderPath('/dashboard/admin', false);
    expect(screen.getByText('Landing')).toBeInTheDocument();
  });

  test('Renders Staff Dashboard at /dashboard/staff when authenticated', () => {
    renderPath('/dashboard/staff', true);
    expect(screen.getByText('Staff Dashboard')).toBeInTheDocument();
  });

  test('Redirects from /dashboard/staff when not authenticated', () => {
    renderPath('/dashboard/staff', false);
    expect(screen.getByText('Landing')).toBeInTheDocument();
  });

  test('Renders Patient Dashboard at /dashboard/patient when authenticated', () => {
    renderPath('/dashboard/patient', true);
    expect(screen.getByText('Patient Dashboard')).toBeInTheDocument();
  });

  test('Redirects from /dashboard/patient when not authenticated', () => {
    renderPath('/dashboard/patient', false);
    expect(screen.getByText('Landing')).toBeInTheDocument();
  });

  test('Renders Staff Profile at /dashboard/staff/profile when authenticated', () => {
    renderPath('/dashboard/staff/profile', true);
    expect(screen.getByText('Staff Profile')).toBeInTheDocument();
  });

  test('Redirects from /dashboard/staff/profile when not authenticated', () => {
    renderPath('/dashboard/staff/profile', false);
    expect(screen.getByText('Landing')).toBeInTheDocument();
  });
});