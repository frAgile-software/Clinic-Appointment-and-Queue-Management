import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StaffProfile from './StaffProfile';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router';

const mockUpdate = jest.fn();
const mockGetUser = jest.fn();
const mockGetSpecialities = jest.fn();
const mockGetAssignedClinics = jest.fn();
const mockGetAdmins = jest.fn();
const mockNavigate = jest.fn();
const mockLogout = jest.fn();

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    user: { sub: 'auth0|123', email: 'test@example.com' },
    logout: mockLogout,
  }),
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../api/useApi', () => ({
  useApi: () => ({
    users: {
      get: mockGetUser,
      update: mockUpdate,
    },
    specialities: {
      getForStaff: mockGetSpecialities,
    },
    clinics: {
      getAssignedClinics: mockGetAssignedClinics,
      getAdmins: mockGetAdmins,
    },
    notifications: mockNotifications
  }),
}));

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

jest.mock('../../components/NotificationCenter', () => {
  return function MockNotificationCenter() {
    return <section data-testid="notification-center" />;
  };
});

const mockNotifications = {
  createNotif: jest.fn().mockResolvedValue({ success: true }),
  getNotifs: jest.fn().mockResolvedValue([]),
  markSeen: jest.fn().mockResolvedValue({}),
  deleteSeen: jest.fn().mockResolvedValue({})
};

const profileData = {
  _id: 'staff-1',
  name: 'Alex',
  surname: 'Smith',
  title: 'Dr',
  email: 'alex.smith@example.com',
};

const clinicData = {
  _id: 'clinic-1',
  practiceName: 'HealthPlus',
  physicalAddress: '123 Main St',
  contactNumber: '0102030405',
};

const setupDefaultMocks = ({ withClinic = true, withAdmin = true } = {}) => {
  mockGetUser.mockResolvedValue(profileData);
  mockGetSpecialities.mockResolvedValue({ Specialities: ['Cardiology', 'Neurology'] });
  mockGetAssignedClinics.mockResolvedValue(withClinic ? [clinicData] : []);
  mockGetAdmins.mockResolvedValue({
    users: withAdmin ? [{ email: 'admin@example.com' }] : [],
  });
};

const renderComponent = () => {
  render(
    <MemoryRouter>
      <StaffProfile />
    </MemoryRouter>
  );
};

describe('<StaffProfile />', () => {
  // --- Rendering ---

  it('renders navigation, header, and action buttons', () => {
    setupDefaultMocks();
    renderComponent();

    expect(screen.getByText(/clinics and qs/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.getByText(/my profile/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('shows loading state before profile data arrives', () => {
    mockGetUser.mockReturnValue(new Promise(() => {})); // never resolves
    mockGetAssignedClinics.mockReturnValue(new Promise(() => {}));
    mockGetSpecialities.mockResolvedValue({ Specialities: [] });
    renderComponent();

    expect(screen.getByText(/loading profile details/i)).toBeInTheDocument();
  });

  it('renders staff profile data and assigned clinic after fetch', async () => {
    setupDefaultMocks();
    renderComponent();

    expect(await screen.findByText(/Alex/)).toBeInTheDocument();
    expect(screen.getByText('alex.smith@example.com')).toBeInTheDocument();
    expect(screen.getByText(/HealthPlus/i)).toBeInTheDocument();
  });

  it('renders specialities', async () => {
    setupDefaultMocks();
    renderComponent();

    expect(await screen.findByText('Cardiology')).toBeInTheDocument();
    expect(screen.getByText('Neurology')).toBeInTheDocument();
  });

  it('shows fallback when no specialities exist', async () => {
    setupDefaultMocks();
    mockGetSpecialities.mockResolvedValue({ Specialities: [] });
    renderComponent();

    expect(await screen.findByText(/no specialities found/i)).toBeInTheDocument();
  });

  it('shows "No assigned clinic" when none returned', async () => {
    setupDefaultMocks({ withClinic: false });
    renderComponent();

    expect(await screen.findByText(/no assigned clinic/i)).toBeInTheDocument();
  });

  // --- Navigation ---

  it('navigates back to dashboard on Back click', async () => {
    setupDefaultMocks();
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/staff');
  });

  it('calls auth0 logout on Logout click', () => {
    setupDefaultMocks();
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(mockLogout).toHaveBeenCalledWith({
      logoutParams: { returnTo: window.location.origin },
    });
  });

  // --- Clinic Details Modal ---

  it('opens clinic details modal and shows clinic information', async () => {
    setupDefaultMocks();
    renderComponent();

    fireEvent.click(await screen.findByRole('button', { name: /view details/i }));

    expect(screen.getByText(/your clinic details/i)).toBeInTheDocument();
    expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
    expect(screen.getByText(/0102030405/i)).toBeInTheDocument();
  });

  it('shows no-clinic message in clinic details modal when unassigned', async () => {
    setupDefaultMocks({ withClinic: false });
    renderComponent();

    fireEvent.click(await screen.findByRole('button', { name: /view details/i }));

    expect(screen.getByText(/no clinic assigned/i)).toBeInTheDocument();
  });

  it('closes clinic details modal on Close click', async () => {
    setupDefaultMocks();
    renderComponent();

    fireEvent.click(await screen.findByRole('button', { name: /view details/i }));
    expect(screen.getByText(/your clinic details/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByText(/your clinic details/i)).not.toBeInTheDocument();
  });

  // --- Update Details Modal ---

  it('opens update modal with pre-filled values', async () => {
    setupDefaultMocks();
    renderComponent();

    fireEvent.click(await screen.findByRole('button', { name: /update personal details/i }));

    expect(screen.getByDisplayValue('Alex')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dr')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alex.smith@example.com')).toBeInTheDocument();
  });

  it('closes update modal on Cancel click', async () => {
    setupDefaultMocks();
    renderComponent();

    fireEvent.click(await screen.findByRole('button', { name: /update personal details/i }));
    expect(screen.getByText(/edit personal details/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText(/edit personal details/i)).not.toBeInTheDocument();
  });

  it('alerts and closes modal when no changes are detected', async () => {
    setupDefaultMocks();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    renderComponent();

    fireEvent.click(await screen.findByRole('button', { name: /update personal details/i }));
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(alertSpy).toHaveBeenCalledWith('No changes detected.');
    expect(screen.queryByText(/edit personal details/i)).not.toBeInTheDocument();
  });

  it('submits only changed fields and updates profile state', async () => {
    setupDefaultMocks();
    mockUpdate.mockResolvedValue({});
    
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    renderComponent();

    fireEvent.click(await screen.findByRole('button', { name: /update personal details/i }));

    fireEvent.change(screen.getByDisplayValue('Alex'), { target: { value: 'Alexander' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('auth0|123', { name: 'Alexander' });
    });
    expect(alertSpy).toHaveBeenCalledWith('Details updated successfully!');
    expect(await screen.findByText(/Alexander/)).toBeInTheDocument();
  });

  it('shows error in console when update API fails', async () => {
    setupDefaultMocks();
    mockUpdate.mockRejectedValue(new Error('Server error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    renderComponent();

    fireEvent.click(await screen.findByRole('button', { name: /update personal details/i }));
    fireEvent.change(screen.getByDisplayValue('Alex'), { target: { value: 'Alexander' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Update failed:', expect.any(Error));
    });
  });

  it('alerts when requesting dismissal with no admin assigned', async () => {
    setupDefaultMocks({ withAdmin: false });
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    renderComponent();

    fireEvent.click(await screen.findByRole('button', { name: /request dismissal/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('No clinic administrator')
      );
    });
  });
});