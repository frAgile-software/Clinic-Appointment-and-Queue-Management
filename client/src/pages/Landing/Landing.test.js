import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router';
import Landing from './Landing';

// Mock: Auth0
// Simulates a visitor who is NOT logged in so the role-redirect
jest.mock('@auth0/auth0-react', () => ({
    useAuth0: jest.fn(),
}));

// Landing.js calls api.clinics.filterAll(), api.clinics.getFilters(), api.users.get(), so mocks:
const mockFilterAll  = jest.fn();
const mockGetFilters = jest.fn();
const mockUsersGet   = jest.fn();

jest.mock('../../api/useApi', () => ({
    useApi: () => ({
        clinics: {
            filterAll:  mockFilterAll,
            getFilters: mockGetFilters,
        },
        users: {
            get: mockUsersGet,
        },
    }),
}));

// Reused across tests. practiceTimes 00:00–23:59 means always open
const baseClinic = {
    _id:                     '1',
    practiceName:            'Parkmed Neuro Clinic',
    practiceTypeDescription: 'Neurology specialist',
    physicalAddress:         '1 Park Lane',
    physicalTown:            'JOHANNESBURG',
    practiceNumber:          '0012345',
    contactNumber:           '011 123 4567',
    practiceTimes:           { open: '00:00', close: '23:59' },
};

beforeEach(() => {
    jest.useFakeTimers();

    require('@auth0/auth0-react').useAuth0.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        loginWithRedirect: jest.fn(),
    });

    mockGetFilters.mockResolvedValue({
        provinces: ['GAUTENG', 'WESTERN CAPE'],
        towns:     ['JOHANNESBURG', 'CAPE TOWN'],
        suburbs:   ['PARKTOWN', 'SEA POINT'],
        types:     ['SPECIALIST', 'GENERAL PRACTICE'],
        services:  ['General Consultation', 'Cardiology'],
    });

    mockFilterAll.mockResolvedValue({
        data:       [],
        pagination: { page: 1, totalPages: 1, total: 0 },
    });

    mockUsersGet.mockRejectedValue({ status: 404 });
});

// Clear all mocks after each test so they don't bleed into each other
afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.clearAllMocks();
});

// Helper: renders Landing inside a router
// MemoryRouter is required because Landing uses useNavigate
const renderLanding = async () => {
    await act(async () => {
        render(
            <MemoryRouter>
                <Landing />
            </MemoryRouter>
        );
        jest.runAllTimers();
    });
};

// Renders Landing with one clinic card visible, then clicks it to open the modal
const renderWithClinicAndOpenModal = async (clinic = baseClinic) => {
    mockFilterAll.mockResolvedValue({
        data:       [clinic],
        pagination: { page: 1, totalPages: 1, total: 1 },
    });

    await renderLanding();
    await waitFor(() => expect(screen.getByText(clinic.practiceName)).toBeInTheDocument());

    await act(async () => {
        await userEvent.click(screen.getByText(clinic.practiceName));
    });
};

describe('<Landing />', () => {

    //  Nav bar tests 

    // The logo must always be visible in the top nav bar
    test('renders the site name', async () => {
        await renderLanding();
        expect(screen.getByText(/clinics and qs/i)).toBeInTheDocument();
    });

    // Login button opens the Auth0 login flow when clicked
    test('renders a Login button', async () => {
        await renderLanding();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    // Sign Up button opens the Auth0 registration flow when clicked
    test('renders a Sign Up button', async () => {
        await renderLanding();
        expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    // Hero / search tests 

    // The main headline should always be visible on the landing page
    test('renders the headline', async () => {
        await renderLanding();
        expect(screen.getByText(/skip the queue/i)).toBeInTheDocument();
    });

    // The search input is where visitors type a clinic name to search
    test('renders the search input', async () => {
        await renderLanding();
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    // The Search button submits the form and triggers the clinic search
    test('renders the Search button', async () => {
        await renderLanding();
        expect(screen.getByRole('button', { name: /^search$/i })).toBeInTheDocument();
    });

    // Redirect tests 
    describe('Redirects', () => {
        test('redirects Patient to /dashboard/patient', async () => {
            const mockNavigate = jest.fn();
            jest.spyOn(require('react-router'), 'useNavigate').mockReturnValue(mockNavigate);
            mockUsersGet.mockResolvedValue({ role: 'Patient' });
            require('@auth0/auth0-react').useAuth0.mockReturnValue({
                isAuthenticated: true,
                isLoading: false,
                user: { sub: 'auth0|123' },
                loginWithRedirect: jest.fn(),
            });

            await renderLanding();
            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard/patient')
            });
        });

        test('redirects Staff to /dashboard/staff', async () => {
            const mockNavigate = jest.fn();
            jest.spyOn(require('react-router'), 'useNavigate').mockReturnValue(mockNavigate);
            mockUsersGet.mockResolvedValue({ role: 'Staff' });
            require('@auth0/auth0-react').useAuth0.mockReturnValue({
                isAuthenticated: true,
                isLoading: false,
                user: { sub: 'auth0|123' },
                loginWithRedirect: jest.fn(),
            });

            await renderLanding();
            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard/staff')
            });
        });

        test('redirects Admin to /dashboard/admin', async () => {
            const mockNavigate = jest.fn();
            jest.spyOn(require('react-router'), 'useNavigate').mockReturnValue(mockNavigate);
            mockUsersGet.mockResolvedValue({ role: 'Admin' });
            require('@auth0/auth0-react').useAuth0.mockReturnValue({
                isAuthenticated: true,
                isLoading: false,
                user: { sub: 'auth0|123' },
                loginWithRedirect: jest.fn(),
            });

            await renderLanding();
            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin')
            });
        });

        test('redirects to /register when user not found (404)', async () => {
            const mockNavigate = jest.fn();
            jest.spyOn(require('react-router'), 'useNavigate').mockReturnValue(mockNavigate);
            mockUsersGet.mockRejectedValue({ status: 404 });
            require('@auth0/auth0-react').useAuth0.mockReturnValue({
                isAuthenticated: true, isLoading: false,
                user: { sub: 'auth0|123' }, loginWithRedirect: jest.fn(),
            });

            await renderLanding();
            await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/register'));
        });

        test('handles failed profile verification and shows landing page', async () => {
            mockUsersGet.mockRejectedValue({ status: 500 });
            require('@auth0/auth0-react').useAuth0.mockReturnValue({
                isAuthenticated: true, isLoading: false,
                user: { sub: 'auth0|123' }, loginWithRedirect: jest.fn(),
            });

            await renderLanding();
            await waitFor(() => {
                expect(screen.getByText(/skip the queue/i)).toBeInTheDocument();
            });
        });
    });

    //  Filter dropdown tests
    describe('Clinic searching and filtering', () => { //spelling fixed

       
        test('renders all five filter dropdowns', async () => {
            await renderLanding();
            expect(screen.getAllByRole('combobox')).toHaveLength(5);
        });

        test('each dropdown has a default All option', async () => {
            await renderLanding();
            expect(screen.getByText('Reason for visit (All)')).toBeInTheDocument();
            expect(screen.getByText('All provinces')).toBeInTheDocument();
            expect(screen.getByText('All towns')).toBeInTheDocument();
            expect(screen.getByText('All suburbs')).toBeInTheDocument();
            expect(screen.getByText('All types')).toBeInTheDocument();
        });

        test('services dropdown is populated from API', async () => {
            await renderLanding();
            expect(screen.getByText('General Consultation')).toBeInTheDocument();
            expect(screen.getByText('Cardiology')).toBeInTheDocument();
        });

        test('province dropdown is populated from API', async () => {
            await renderLanding();
            expect(screen.getByText('GAUTENG')).toBeInTheDocument();
            expect(screen.getByText('WESTERN CAPE')).toBeInTheDocument();
        });

        test('town dropdown is populated from API', async () => {
            await renderLanding();
            expect(screen.getByText('JOHANNESBURG')).toBeInTheDocument();
            expect(screen.getByText('CAPE TOWN')).toBeInTheDocument();
        });

        test('suburb dropdown is populated from API', async () => {
            await renderLanding();
            expect(screen.getByText('PARKTOWN')).toBeInTheDocument();
            expect(screen.getByText('SEA POINT')).toBeInTheDocument();
        });

        test('type dropdown is populated from API', async () => {
            await renderLanding();
            expect(screen.getByText('SPECIALIST')).toBeInTheDocument();
            expect(screen.getByText('GENERAL PRACTICE')).toBeInTheDocument();
        });

        // index 0 = reason for visit, 1 = province, 2 = town, 3 = suburb, 4 = type
        test('selecting a service calls filterAll with service param', async () => {
            await renderLanding();

            await act(async () => {
                await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'General Consultation');
                jest.runAllTimers();
            });

            await waitFor(() => {
                expect(mockFilterAll).toHaveBeenCalledWith(
                    expect.objectContaining({ service: 'General Consultation' })
                );
            });
        });

        test('selecting a province calls filterAll with province param', async () => {
            await renderLanding();

            await act(async () => {
                await userEvent.selectOptions(screen.getAllByRole('combobox')[1], 'GAUTENG');
                jest.runAllTimers();
            });

            await waitFor(() => {
                expect(mockFilterAll).toHaveBeenCalledWith(
                    expect.objectContaining({ province: 'GAUTENG' })
                );
            });
        });

        test('selecting a town calls filterAll with town param', async () => {
            await renderLanding();

            await act(async () => {
                await userEvent.selectOptions(screen.getAllByRole('combobox')[2], 'JOHANNESBURG');
                jest.runAllTimers();
            });

            await waitFor(() => {
                expect(mockFilterAll).toHaveBeenCalledWith(
                    expect.objectContaining({ town: 'JOHANNESBURG' })
                );
            });
        });

        test('selecting a suburb calls filterAll with suburb param', async () => {
            await renderLanding();

            await act(async () => {
                await userEvent.selectOptions(screen.getAllByRole('combobox')[3], 'PARKTOWN');
                jest.runAllTimers();
            });

            await waitFor(() => {
                expect(mockFilterAll).toHaveBeenCalledWith(
                    expect.objectContaining({ suburb: 'PARKTOWN' })
                );
            });
        });

        test('selecting a type calls filterAll with type param', async () => {
            await renderLanding();

            await act(async () => {
                await userEvent.selectOptions(screen.getAllByRole('combobox')[4], 'SPECIALIST');
                jest.runAllTimers();
            });

            await waitFor(() => {
                expect(mockFilterAll).toHaveBeenCalledWith(
                    expect.objectContaining({ type: 'SPECIALIST' })
                );
            });
        });

        test('shows clinic cards when filter returns results', async () => {
            mockFilterAll.mockResolvedValue({
                data:       [baseClinic],
                pagination: { page: 1, totalPages: 1, total: 1 },
            });

            await renderLanding();

            await act(async () => {
                await userEvent.selectOptions(screen.getAllByRole('combobox')[1], 'GAUTENG');
                jest.runAllTimers();
            });

            await waitFor(() => {
                expect(screen.getByText('Parkmed Neuro Clinic')).toBeInTheDocument();
            });
        });

        test('shows no clinics found when filter returns empty', async () => {
            // mockFilterAll already returns [] by default
            await renderLanding();

            await act(async () => {
                await userEvent.selectOptions(screen.getAllByRole('combobox')[1], 'GAUTENG');
                jest.runAllTimers();
            });

            await waitFor(() => {
                expect(screen.getByText(/no clinics found/i)).toBeInTheDocument();
            });
        });

        test('handles clinic fetch network error gracefully', async () => {
            mockFilterAll.mockRejectedValue(new Error('Network error'));

            await renderLanding();
            expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
        });

        test('typing in search input updates value and resets page', async () => {
            await renderLanding();
            const input = screen.getByRole('searchbox');

            await act(async () => {
                await userEvent.type(input, 'Park');
            });

            expect(input.value).toBe('Park');
        });

        test('shows clinic count when results are returned', async () => {
            mockFilterAll.mockResolvedValue({
                data:       [{ ...baseClinic, _id: '2', practiceName: 'Clinic A' }],
                pagination: { page: 1, totalPages: 1, total: 1 },
            });

            await renderLanding();
            await waitFor(() => expect(screen.getByText(/showing/i)).toBeInTheDocument());
        });


        describe('Pagination tests', () => {
            beforeEach(() => {
                mockFilterAll.mockResolvedValue({
                    data:       [{ ...baseClinic, _id: '2', practiceName: 'Clinic A' }],
                    pagination: { page: 1, totalPages: 3, total: 30 },
                });
            });

            test('renders pagination buttons when multiple pages exist', async () => {
                await renderLanding();

                await waitFor(() => expect(screen.getByText('Clinic A')).toBeInTheDocument());

                expect(screen.getByLabelText('Next page')).toBeInTheDocument();
                expect(screen.getByLabelText('Previous page')).toBeDisabled();
            });

            test('clicking next page calls filterAll with _page 2', async () => {
                await renderLanding();

                await waitFor(() => expect(screen.getByText('Clinic A')).toBeInTheDocument());

                await act(async () => {
                    await userEvent.click(screen.getByLabelText('Next page'));
                    jest.runAllTimers();
                });

                await waitFor(() => {
                    expect(mockFilterAll).toHaveBeenCalledWith(
                        expect.objectContaining({ _page: 2 })
                    );
                });
            });

            test('clicking a page number calls filterAll with that page', async () => {
                await renderLanding();

                await waitFor(() => expect(screen.getByText('Clinic A')).toBeInTheDocument());

                await act(async () => {
                    await userEvent.click(screen.getByLabelText('Page 2'));
                    jest.runAllTimers();
                });

                await waitFor(() => {
                    expect(mockFilterAll).toHaveBeenCalledWith(
                        expect.objectContaining({ _page: 2 })
                    );
                });
            });
        });
    });

    // Clinic modal tests
    describe('Clinic detail modal', () => {

        test('clicking a clinic card opens the modal', async () => {
            await renderWithClinicAndOpenModal();
            expect(screen.getAllByText('Parkmed Neuro Clinic').length).toBeGreaterThan(1);
        });

        test('modal shows clinic address', async () => {
            await renderWithClinicAndOpenModal();
            const modalDetails = document.querySelector('.clinic-modal-details');
            expect(modalDetails).toHaveTextContent('1 Park Lane');
        });

        test('modal shows contact number', async () => {
            await renderWithClinicAndOpenModal();
            expect(screen.getByText(/contact/i)).toBeInTheDocument();
        });

        test('modal shows opening hours', async () => {
            await renderWithClinicAndOpenModal();
            expect(screen.getByText(/00:00/i)).toBeInTheDocument();
        });

        test('modal shows open badge when clinic is open', async () => {
            await renderWithClinicAndOpenModal();
            expect(document.querySelector('.modal-badge.status-open')).toBeInTheDocument();
        });

        test('modal shows closed badge when clinic is closed', async () => {
            const closedClinic = { ...baseClinic, practiceTimes: { open: '00:00', close: '00:01' } };
            await renderWithClinicAndOpenModal(closedClinic);
            expect(document.querySelector('.modal-badge.status-closed')).toBeInTheDocument();
        });

        test('modal shows Hours not set when practiceTimes is missing', async () => {
            const noHoursClinic = {
                ...baseClinic,
                _id:          '2',
                practiceName: 'No Hours Clinic',
                practiceTimes: {},
            };
            await renderWithClinicAndOpenModal(noHoursClinic);
            expect(screen.getByText(/hours not set/i)).toBeInTheDocument();
        });

        test('modal shows Join Queue and Book Now buttons', async () => {
            await renderWithClinicAndOpenModal();
            expect(screen.getByRole('button', { name: /join queue/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /book now/i })).toBeInTheDocument();
        });

        test('clicking Join Queue triggers signup', async () => {
            const mockLogin = jest.fn();
            require('@auth0/auth0-react').useAuth0.mockReturnValue({
                isAuthenticated: false, isLoading: false,
                user: null, loginWithRedirect: mockLogin,
            });

            await renderWithClinicAndOpenModal();

            await act(async () => {
                await userEvent.click(screen.getByRole('button', { name: /join queue/i }));
            });

            expect(mockLogin).toHaveBeenCalled();
        });

        test('clicking Book Now triggers signup', async () => {
            const mockLogin = jest.fn();
            require('@auth0/auth0-react').useAuth0.mockReturnValue({
                isAuthenticated: false, isLoading: false,
                user: null, loginWithRedirect: mockLogin,
            });

            await renderWithClinicAndOpenModal();

            await act(async () => {
                await userEvent.click(screen.getByRole('button', { name: /book now/i }));
            });

            expect(mockLogin).toHaveBeenCalled();
        });

        test('clicking the close button dismisses the modal', async () => {
            await renderWithClinicAndOpenModal();

            await act(async () => {
                await userEvent.click(document.querySelector('.clinic-modal-close'));
            });

            await waitFor(() => {
                expect(document.querySelector('.clinic-modal-overlay')).not.toBeInTheDocument();
            });
        });

        test('clicking the overlay dismisses the modal', async () => {
            await renderWithClinicAndOpenModal();

            await act(async () => {
                await userEvent.click(document.querySelector('.clinic-modal-overlay'));
            });

            await waitFor(() => {
                expect(screen.getAllByText('Parkmed Neuro Clinic').length).toBe(1);
            });
        });
    });
});