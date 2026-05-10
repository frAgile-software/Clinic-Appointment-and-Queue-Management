import { render, screen, waitFor } from '@testing-library/react';
import StaffDashboard from './StaffDashboard';
import { MemoryRouter } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';
import { useApiAuth } from '../../hooks/apiAuth';

jest.mock('../../hooks/apiAuth');
jest.mock('@auth0/auth0-react', () => ({
    useAuth0: () => ({
        user: { sub: "auth0|12345" },
        logout: jest.fn(),
    }),
}));

const mockAppointments = [
    { _id: "67890", Patient: { _id: "1", name: "Jane Doe", email: "jane.doe@mail.com" }, BookingDateTime: "2026-05-06T10:00:00Z", ReasonDetails: "Flu shot", Speciality: { SpecialityName: "General" }, status: "In Consult" },
    { _id: "12345", Patient: { _id: "2", name: "John Doe", email: "john.doe@mail.com" }, BookingDateTime: "2026-05-06T10:00:00Z", ReasonDetails: "Check-up", Speciality: { SpecialityName: "ENT" }, status: "Upcoming" }
];

const mockQueue = [
    { _id: "53820", Patient: { _id: "3", name: "Janet Doe", email: "janet.doe@mail.com" }, createdAt: "2026-05-06T10:00:00Z", Speciality: { SpecialityName: "Maternity" }, status: "Waiting" },
    { _id: "74387", Patient: { _id: "4", name: "Jack Doe", email: "jack.doe@mail.com" }, createdAt: "2026-05-06T10:00:00Z", Speciality: { SpecialityName: "General" }, status: "Waiting" }
];

const mockApiFetch = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();

    useApiAuth.mockReturnValue({
        apiFetch: mockApiFetch,
    });

    mockApiFetch.mockImplementation((url, options) => {
        if (url.includes('/api/clinics')) {
            return Promise.resolve({
                ok: true,
                json: async () => ([{ id: "987654" }]),
            });
        }
        if (url.includes('/api/queues')) {
            return Promise.resolve({
                ok: true,
                json: async () => (mockQueue),
            });
        }
        if (url.includes('/api/appointments')) {
            return Promise.resolve({
                ok: true,
                json: async () => (mockAppointments),
            });
        }

        return Promise.resolve({ ok: true, json: async () => ({}) });
    });
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

    const welcomeMessage = screen.getByText(/Welcome Back, Staff Member/i);
    expect(welcomeMessage).toBeInTheDocument();
});

test('renders profile icon', async () => {
    await renderDashboard();

    const profileIcon = screen.getByLabelText(/Profile/i);
    expect(profileIcon).toBeInTheDocument();
});