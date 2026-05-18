import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import StaffDashboard from './StaffDashboard';
import { MemoryRouter } from 'react-router';
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

const mockClinicSpecialities = {
    sp1: "Cardiology",
    sp2: "Maternity",
};

const mockFoundPatient = {
    _id: "patient-99",
    auth0Id: "auth0|patient-99",
    title: "Mr",
    name: "Ryan",
    surname: "Fletcher",
    email: "fletcher.ryj@gmail.com",
    role: "Patient",
};

const activeStatus = ["Waiting", "In Consult"];

const mockGetAssignedClinics = jest.fn();
const mockGetQueue = jest.fn();
const mockGetAppointments = jest.fn();
const mockUpdateQueue = jest.fn();
const mockUpdateAppointment = jest.fn();
const mockGetSpecialitiesForClinic = jest.fn();
const mockGetUserByEmail = jest.fn();
const mockAddPatientToQueue = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    useApi.mockReturnValue({
        clinics: { getAssignedClinics: mockGetAssignedClinics },
        queues: { get: mockGetQueue, update: mockUpdateQueue, addPatient: mockAddPatientToQueue },
        appointments: { getForAuth0Id: mockGetAppointments, update: mockUpdateAppointment },
        specialities: { getForClinic: mockGetSpecialitiesForClinic },
        users: { getByEmail: mockGetUserByEmail },
    });

    mockGetAssignedClinics.mockResolvedValue([{ _id: "987654" }]);
    mockGetQueue.mockResolvedValue(mockQueue);
    mockGetAppointments.mockResolvedValue(mockAppointments);
    mockGetSpecialitiesForClinic.mockResolvedValue(mockClinicSpecialities);
    mockGetUserByEmail.mockResolvedValue(mockFoundPatient);
    mockAddPatientToQueue.mockResolvedValue({ message: "Successfully joined queue" });
});

afterEach(() => {
    jest.useRealTimers();
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
    expect(mockGetQueue).toHaveBeenCalledWith('987654', { auth0Id: 'auth0|12345', statuses: activeStatus });
    expect(mockGetAppointments).toHaveBeenCalledWith('auth0|12345', {statuses: activeStatus});
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

    fireEvent.click(screen.getByRole('button', { name: /add to queue/i }));

    expect(screen.getByText(/Patient Email:/i)).toBeInTheDocument();
    expect(screen.getByText(/Service:/i)).toBeInTheDocument();
});

describe('Add patient to queue', () => {
    const openForm = () => fireEvent.click(screen.getByRole('button', { name: /add to queue/i }));

    test('fetches and renders clinic specialities in the dropdown', async () => {
        await renderDashboard();
        openForm();

        await waitFor(() => {
            expect(mockGetSpecialitiesForClinic).toHaveBeenCalledWith('987654');
        });

        expect(await screen.findByRole('option', { name: 'Cardiology' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Maternity' })).toBeInTheDocument();
    });

    test('searches for a patient by email after debounce and shows their details', async () => {
        await renderDashboard();
        openForm();

        const emailInput = screen.getByLabelText(/Patient Email:/i);
        fireEvent.change(emailInput, { target: { value: 'fletcher.ryj@gmail.com' } });

        jest.advanceTimersByTime(500);

        await waitFor(() => {
            expect(mockGetUserByEmail).toHaveBeenCalledWith('fletcher.ryj@gmail.com', { role: 'Patient' });
        });

        expect(await screen.findByText(/Patient found: Mr Ryan Fletcher/i)).toBeInTheDocument();
    });

    test('shows X indicator when patient is not found', async () => {
        mockGetUserByEmail.mockRejectedValueOnce({ status: 404 });
        await renderDashboard();
        openForm();

        const emailInput = screen.getByLabelText(/Patient Email:/i);
        fireEvent.change(emailInput, { target: { value: 'nobody@example.com' } });

        jest.advanceTimersByTime(500);

        await waitFor(() => {
            expect(screen.getByLabelText(/Patient not found/i)).toBeInTheDocument();
        });
    });

    test('disables submit until both patient and speciality are selected', async () => {
        await renderDashboard();
        openForm();

        const submitBtn = screen.getByRole('button', { name: /^add to queue$/i });
        expect(submitBtn).toBeDisabled();

        // search for patient
        const emailInput = screen.getByLabelText(/Patient Email:/i);
        fireEvent.change(emailInput, { target: { value: 'fletcher.ryj@gmail.com' } });
        jest.advanceTimersByTime(500);
        await screen.findByText(/Patient found:/i);

        // still disabled without a speciality
        expect(submitBtn).toBeDisabled();

        // pick a speciality
        const select = screen.getByLabelText(/Service:/i);
        fireEvent.change(select, { target: { value: 'Cardiology' } });

        expect(submitBtn).toBeEnabled();
    });

    test('calls addPatient with the correct arguments on submit', async () => {
        await renderDashboard();
        openForm();

        const emailInput = screen.getByLabelText(/Patient Email:/i);
        fireEvent.change(emailInput, { target: { value: 'fletcher.ryj@gmail.com' } });
        jest.advanceTimersByTime(500);
        await screen.findByText(/Patient found:/i);

        const select = screen.getByLabelText(/Service:/i);
        fireEvent.change(select, { target: { value: 'Cardiology' } });

        const submitBtn = screen.getByRole('button', { name: /^add to queue$/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockAddPatientToQueue).toHaveBeenCalledWith(
                '987654',
                { patientId: 'patient-99' },
                'Cardiology'
            );
        });
    });

    test('shows alert when patient is already in a queue (409)', async () => {
        mockAddPatientToQueue.mockRejectedValueOnce({ status: 409, message: 'User is already in a queue.' });
        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

        await renderDashboard();
        openForm();

        const emailInput = screen.getByLabelText(/Patient Email:/i);
        fireEvent.change(emailInput, { target: { value: 'fletcher.ryj@gmail.com' } });
        jest.advanceTimersByTime(500);
        await screen.findByText(/Patient found:/i);

        const select = screen.getByLabelText(/Service:/i);
        fireEvent.change(select, { target: { value: 'Cardiology' } });

        fireEvent.click(screen.getByRole('button', { name: /^add to queue$/i }));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/already in a queue/i));
        });

        alertSpy.mockRestore();
    });

    test('resets the form after successful submission', async () => {
        await renderDashboard();
        openForm();

        const emailInput = screen.getByLabelText(/Patient Email:/i);
        fireEvent.change(emailInput, { target: { value: 'fletcher.ryj@gmail.com' } });
        jest.advanceTimersByTime(500);
        await screen.findByText(/Patient found:/i);

        const select = screen.getByLabelText(/Service:/i);
        fireEvent.change(select, { target: { value: 'Cardiology' } });

        fireEvent.click(screen.getByRole('button', { name: /^add to queue$/i }));

        await waitFor(() => {
            expect(emailInput.value).toBe('');
        });
        expect(select.value).toBe('');
    });

    test('shows no-clinic message when staff has no assigned clinics', async () => {
        mockGetAssignedClinics.mockResolvedValue([]);
        render(<MemoryRouter><StaffDashboard /></MemoryRouter>);

        expect(await screen.findByText(/not assigned to any clinics/i)).toBeInTheDocument();
    });

    test('calls auth0 logout on logout click', async () => {
        const mockLogout = jest.fn();
        jest.spyOn(require('@auth0/auth0-react'), 'useAuth0').mockReturnValue({
            user: { sub: 'auth0|12345', name: 'Hugh Morris' },
            logout: mockLogout,
        });
        await renderDashboard();

        fireEvent.click(screen.getByRole('button', { name: /logout/i }));
        expect(mockLogout).toHaveBeenCalled();
    });

    test('toggles between active and history views', async () => {
        const inactiveStatus = ["Completed", "Cancelled", "No-show"];
        await renderDashboard();

        fireEvent.click(screen.getByRole('button', { name: /toggle history/i }));

        await waitFor(() => {
            expect(mockGetAppointments).toHaveBeenCalledWith('auth0|12345', { statuses: inactiveStatus });
            expect(mockGetQueue).toHaveBeenCalledWith('987654', { auth0Id: 'auth0|12345', statuses: inactiveStatus });
        });

        expect(screen.getByText(/Patient Appointment History/i)).toBeInTheDocument();
        expect(screen.getByText(/Patient Queue History/i)).toBeInTheDocument();
    });

    test('closing the add-to-queue form resets its state', async () => {
        await renderDashboard();

        fireEvent.click(screen.getByRole('button', { name: /add to queue/i }));
        const emailInput = screen.getByLabelText(/Patient Email:/i);
        fireEvent.change(emailInput, { target: { value: 'someone@test.com' } });

        // close the form
        fireEvent.click(screen.getByRole('button', { name: /close/i }));

        // reopen — should be reset
        fireEvent.click(screen.getByRole('button', { name: /add to queue/i }));
        expect(screen.getByLabelText(/Patient Email:/i).value).toBe('');
    });

    describe('Consultation modal actions', () => {
        const openQueueModal = async () => {
            await renderDashboard();
            const patient = await screen.findByText(/Janet Doe/i);
            fireEvent.click(patient);
            await screen.findByText(/Contact Email:/i);
        };

        test('Check In calls queue update with In Consult status and timeSeen', async () => {
            await openQueueModal();

            fireEvent.click(screen.getByRole('button', { name: /check in/i }));

            await waitFor(() => {
                expect(mockUpdateQueue).toHaveBeenCalledWith('53820', expect.objectContaining({
                    status: 'In Consult',
                    timeSeen: expect.any(Date),
                }));
            });
        });

        test('Conclude calls queue update with Completed status', async () => {
            await openQueueModal();

            fireEvent.click(screen.getByRole('button', { name: /conclude session/i }));

            await waitFor(() => {
                expect(mockUpdateQueue).toHaveBeenCalledWith('53820', expect.objectContaining({
                    status: 'Completed',
                }));
            });
        });

        test('Cancel calls queue update with Cancelled status', async () => {
            await openQueueModal();

            fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

            await waitFor(() => {
                expect(mockUpdateQueue).toHaveBeenCalledWith('53820', expect.objectContaining({
                    status: 'Cancelled',
                }));
            });
        });

        test('No show calls queue update with No-show status', async () => {
            await openQueueModal();

            fireEvent.click(screen.getByRole('button', { name: /no show/i }));

            await waitFor(() => {
                expect(mockUpdateQueue).toHaveBeenCalledWith('53820', expect.objectContaining({
                    status: 'No-show',
                }));
            });
        });

        test('appointment modal shows Reschedule button and opens reschedule modal', async () => {
            await renderDashboard();

            const apptPatient = await screen.findByText(/Jane Doe/i);
            fireEvent.click(apptPatient);
            await screen.findByText(/Contact Email:/i);

            fireEvent.click(screen.getByRole('button', { name: /reschedule/i }));

            expect(screen.getByText(/Reschedule Appointment/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/New Date\/Time/i)).toBeInTheDocument();
        });

        test('reschedule validates empty datetime', async () => {
            const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
            await renderDashboard();

            fireEvent.click(await screen.findByText(/Jane Doe/i));
            await screen.findByText(/Contact Email:/i);
            fireEvent.click(screen.getByRole('button', { name: /reschedule/i }));

            fireEvent.click(screen.getByRole('button', { name: /confirm reschedule/i }));

            expect(alertSpy).toHaveBeenCalledWith('Please select a new date and time.');
            alertSpy.mockRestore();
        });

        test('reschedule validates past datetime', async () => {
            const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
            jest.useRealTimers(); // need real Date for comparison
            await renderDashboard();

            fireEvent.click(await screen.findByText(/Jane Doe/i));
            await screen.findByText(/Contact Email:/i);
            fireEvent.click(screen.getByRole('button', { name: /reschedule/i }));

            fireEvent.change(screen.getByLabelText(/New Date\/Time/i), {
                target: { value: '2020-01-01T10:00' },
            });
            fireEvent.click(screen.getByRole('button', { name: /confirm reschedule/i }));

            expect(alertSpy).toHaveBeenCalledWith('Please select a future date and time.');
            alertSpy.mockRestore();
            jest.useFakeTimers();
        });

        test('successful reschedule calls appointment update and closes modal', async () => {
            jest.useRealTimers();
            await renderDashboard();

            fireEvent.click(await screen.findByText(/Jane Doe/i));
            await screen.findByText(/Contact Email:/i);
            fireEvent.click(screen.getByRole('button', { name: /reschedule/i }));

            const futureDate = '2028-12-25T14:00';
            fireEvent.change(screen.getByLabelText(/New Date\/Time/i), {
                target: { value: futureDate },
            });
            fireEvent.click(screen.getByRole('button', { name: /confirm reschedule/i }));

            await waitFor(() => {
                expect(mockUpdateAppointment).toHaveBeenCalledWith('67890', { bookingDateTime: futureDate });
            });
            await waitFor(() => {
                expect(screen.queryByText(/Reschedule Appointment/i)).not.toBeInTheDocument();
            });
            jest.useFakeTimers();
        });

        test('remarks textarea updates modal state', async () => {
            await openQueueModal();

            const textarea = screen.getByRole('textbox');
            fireEvent.change(textarea, { target: { value: 'Urgent case' } });

            expect(textarea.value).toBe('Urgent case');
        });
    });
});