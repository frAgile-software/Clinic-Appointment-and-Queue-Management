import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from './AdminDashboard';
import { BrowserRouter } from 'react-router'

// Mock Auth0
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    user: { sub: 'auth0|testuser' },
    logout: jest.fn(),
    isAuthenticated: true,
    isLoading: false,
    getAccessTokenSilently: jest.fn().mockResolvedValue('mock-token'),
  }),
}));

// Mock useApi
jest.mock('../../api/useApi', () => ({
  useApi: () => ({
    users: { get: jest.fn().mockResolvedValue({ name: 'Test Admin' }) },
    clinics: {
      getAssignedClinics: jest.fn().mockResolvedValue([
        {
          _id: 'clinic-1',
          practiceName: 'Test Clinic',
          practiceTypeDescription: 'General Practice',
          physicalAddress: '123 Main St',
          physicalSuburb: 'Sandton',
          physicalTown: 'Johannesburg',
          practiceNumber: 'PN123',
          contactNumber: '011 000 0000',
          practiceTimes: { open: '08:00', close: '17:00' },
          services: ['GP', 'Maternity'],
        },
      ]),
      listStaff: jest.fn().mockResolvedValue({ users: [] }),
      updateClinic: jest.fn().mockResolvedValue({}),
    },
    queues: { getAverageWaitTime: jest.fn().mockResolvedValue({ data: [] }) },
  }),
}));

describe('AdminDashboard Component', () => {

  test('renders navbar elements', () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    // Check nav buttons
    //expect(screen.getByText(/log out/i)).toBeInTheDocument();
    //expect(screen.getByText(/profile/i)).toBeInTheDocument();

    // Check notification image
    //expect(screen.getByAltText(/notification bell/i)).toBeInTheDocument();
  });
  
  test('renders top section content', () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    /*expect(
      screen.getByText(/welcome to the admin dashboard/i)
    ).toBeInTheDocument();*/

    //expect(screen.getByAltText(/clinic logo/i)).toBeInTheDocument();
  });

  test('renders brand title', () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/clinics and qs/i)).toBeInTheDocument();
  });

  test('renders logout button', () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/logout/i)).toBeInTheDocument();
  });

  test('renders welcome message', async () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    expect(await screen.findByText(/welcome back/i)).toBeInTheDocument();
  });

  test('renders clinic action buttons', async () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    expect(await screen.findByText(/manage clinic/i)).toBeInTheDocument();
    expect(await screen.findByText(/manage staff/i)).toBeInTheDocument();
    expect(await screen.findByText(/add staff/i)).toBeInTheDocument();
    expect(await screen.findByText(/view stats/i)).toBeInTheDocument();
  });

  test('renders assigned clinic card', async () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    expect(await screen.findByText(/test clinic/i)).toBeInTheDocument();
  });

  test('shows manage clinic details on button click', async () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    const manageBtn = await screen.findByText(/manage clinic/i);
    await userEvent.click(manageBtn);

    expect(await screen.findByText(/practice number/i)).toBeInTheDocument();
    expect(await screen.findByText(/edit clinic times/i)).toBeInTheDocument();
  });

  test('shows time inputs when Edit Clinic Times is clicked', async () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    const manageBtn = await screen.findByText(/manage clinic/i);
    await userEvent.click(manageBtn);

    const editBtn = await screen.findByText(/edit clinic times/i);
    await userEvent.click(editBtn);

    expect(screen.getByLabelText(/open/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/close/i)).toBeInTheDocument();
  });

});