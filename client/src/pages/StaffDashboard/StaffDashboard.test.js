import { render, screen, waitFor } from '@testing-library/react';
import StaffDashboard from './StaffDashboard';
import { MemoryRouter } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from '../../api/useApi';

jest.mock('../../api/useApi');
jest.mock('@auth0/auth0-react', () => ({
    useAuth0: () => ({
        user: { sub: "auth0|12345", name: "Hugh Morris" },
        logout: jest.fn(),
    }),
}));

const mockAppointments = [
    { _id: "67890", Patient: { _id: "1", name: "Jane Doe", email: "jane.doe@mail.com" }, BookingDateTime: "2026-05-06T10:00:00Z", ReasonDetails: "Flu shot", Speciality: { SpecialityName: "General" }, Status: "In Consult", Remarks: "" },
    { _id: "12345", Patient: { _id: "2", name: "John Doe", email: "john.doe@mail.com" }, BookingDateTime: "2026-05-06T10:00:00Z", ReasonDetails: "Check-up", Speciality: { SpecialityName: "ENT" }, Status: "Upcoming", Remarks: "" }
];

const mockQueue = [
    { _id: "53820", Patient: { _id: "3", name: "Janet Doe", email: "janet.doe@mail.com" }, createdAt: "2026-05-06T10:00:00Z", Speciality: { SpecialityName: "Maternity" }, Status: "Waiting", Remarks: ""  },
    { _id: "74387", Patient: { _id: "4", name: "Jack Doe", email: "jack.doe@mail.com" }, createdAt: "2026-05-06T10:00:00Z", Speciality: { SpecialityName: "General" }, Status: "Waiting", Remarks: "" }
];

const mockGetAssignedClinics = jest.fn();
const mockGetQueue = jest.fn();
const mockGetAppointments = jest.fn();
const mockUpdateQueue = jest.fn();
const mockUpdateAppointment = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();

    useApi.mockReturnValue({
        clinics: { getAssignedClinics: mockGetAssignedClinics },
        queues: { get: mockGetQueue, update: mockUpdateQueue },
        appointments: { getForAuth0Id: mockGetAppointments, update: mockUpdateAppointment },
    });

    mockGetAssignedClinics.mockResolvedValue([{ _id: "987654" }]);
    mockGetQueue.mockResolvedValue(mockQueue);
    mockGetAppointments.mockResolvedValue(mockAppointments);
});

afterEach(() => {
    jest.restoreAllMocks();
});

const renderDashboard = async () => {
    render(
        <MemoryRouter>
            <StaffDashboard />
        </MemoryRouter>
    );
    await waitFor(() => {
        expect(screen.getByText(/Clinics and Qs/i)).toBeInTheDocument();
    });
};

test('renders clinic name and patient queue', async () => {
    await renderDashboard();

    const logoElement = screen.getByText(/Clinics and Qs/i);
    expect(logoElement).toBeInTheDocument();
    const queueHeading = screen.getByText(/Patient Queue/i);
    expect(queueHeading).toBeInTheDocument();
});

test('renders appointment list elements', async () => {
    await renderDashboard();

    await waitFor(() => {
    const patient1 = screen.getByText(/Jane Doe/i);
    const patient2 = screen.getByText(/John Doe/i);

    expect(patient1).toBeInTheDocument();
    expect(patient2).toBeInTheDocument();
    });
});

test('renders patient queue elements', async () => {
    await renderDashboard();

    await waitFor(() => {
    const patient1 = screen.getByText(/Janet Doe/i);
    const patient2 = screen.getByText(/Jack Doe/i);

    expect(patient1).toBeInTheDocument();
    expect(patient2).toBeInTheDocument();
    });
});

test('renders action buttons', async () => {
    await renderDashboard();

    const addQueueButtons = screen.getAllByRole('button', { name: /add to queue/i });
    const viewScheduleButton = screen.getByRole('button', { name: /view schedule/i });

    expect(addQueueButtons[0]).toBeInTheDocument();
    expect(viewScheduleButton).toBeInTheDocument();
});

test('renders welcome message', async () => {
    await renderDashboard();

    const welcomeMessage = screen.getByText(/Welcome Back, Hugh Morris/i);
    expect(welcomeMessage).toBeInTheDocument();
});

test('renders profile icon', async () => {
    await renderDashboard();

    const profileIcon = screen.getByLabelText(/Profile/i);
    expect(profileIcon).toBeInTheDocument();
});

test('uses API calls to load clinics, queue, and appointments', async () => {
    await renderDashboard();

    expect(mockGetAssignedClinics).toHaveBeenCalledWith('auth0|12345');
    expect(mockGetQueue).toHaveBeenCalledWith('987654', { auth0Id: 'auth0|12345' });
    expect(mockGetAppointments).toHaveBeenCalledWith('auth0|12345');
});

test('opens a patient modal when a queue item is clicked', async () => {
    await renderDashboard();

    const queuePatient = await screen.findByText(/Janet Doe/i);
    queuePatient.click();

    expect(await screen.findByText(/Contact Email:/i)).toBeInTheDocument();
    expect(screen.getByText(/Reason:\s*Maternity/i)).toBeInTheDocument();
});

test('shows add queue form fields', async () => {
    await renderDashboard();

    expect(screen.getByText(/Patient Name:/i)).toBeInTheDocument();
    expect(screen.getByText(/Arrival time:/i)).toBeInTheDocument();
    expect(screen.getByText(/Reason:/i)).toBeInTheDocument();
});