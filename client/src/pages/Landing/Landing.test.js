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

// Mock: apiAuth hook
// apiFetch is only called when a user is authenticated.
jest.mock('../../hooks/apiAuth', () => ({
    useApiAuth: () => ({ apiFetch: jest.fn() }),
}));

// Mock: global fetch
// The Landing page calls fetch on mount to load clinics.
// We return empty data here since card rendering is not tested by default
beforeEach(() => {
    jest.useFakeTimers();

    require('@auth0/auth0-react').useAuth0.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        loginWithRedirect: jest.fn(),
    });

    global.fetch = jest.fn((url) => {
        if (url.includes('/clinics/filters')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    provinces: ['GAUTENG', 'WESTERN CAPE'],
                    towns:     ['JOHANNESBURG', 'CAPE TOWN'],
                    suburbs:   ['PARKTOWN', 'SEA POINT'],
                    types:     ['SPECIALIST', 'GENERAL PRACTICE'],
                    services:  ['General Consultation', 'Cardiology'],
                }),
            });
        }
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [], pagination: {} }),
        });
    });
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

            const mockApiFetch = jest.fn((url) => {
                if (url.includes('/api/users/')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ role: 'Patient' }),
                    });
                }
            });

            jest.spyOn(require('../../hooks/apiAuth'), 'useApiAuth').mockReturnValue({
                apiFetch: mockApiFetch,
            });

            require('@auth0/auth0-react').useAuth0.mockReturnValue({
                isAuthenticated: true,
                isLoading: false,
                user: { sub: 'auth0|123' },
                loginWithRedirect: jest.fn(),
            });

            await renderLanding();

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard/patient');
            });
        });

        test('redirects Staff to /dashboard/staff', async () => {
            const mockNavigate = jest.fn();
            jest.spyOn(require('react-router'), 'useNavigate').mockReturnValue(mockNavigate);

            const mockApiFetch = jest.fn((url) => {
                if (url.includes('/api/users/')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ role: 'Staff' }),
                    });
                }
            });

            jest.spyOn(require('../../hooks/apiAuth'), 'useApiAuth').mockReturnValue({
                apiFetch: mockApiFetch,
            });

            require('@auth0/auth0-react').useAuth0.mockReturnValue({
                isAuthenticated: true,
                isLoading: false,
                user: { sub: 'auth0|123' },
                loginWithRedirect: jest.fn(),
            });

            await renderLanding();

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard/staff');
            });
        });

        test('redirects Admin to /dashboard/admin', async () => {
            const mockNavigate = jest.fn();
            jest.spyOn(require('react-router'), 'useNavigate').mockReturnValue(mockNavigate);

            const mockApiFetch = jest.fn((url) => {
                if (url.includes('/api/users/')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ role: 'Admin' }),
                    });
                }
            });

            jest.spyOn(require('../../hooks/apiAuth'), 'useApiAuth').mockReturnValue({
                apiFetch: mockApiFetch,
            });

            require('@auth0/auth0-react').useAuth0.mockReturnValue({
                isAuthenticated: true,
                isLoading: false,
                user: { sub: 'auth0|123' },
                loginWithRedirect: jest.fn(),
            });

            await renderLanding();

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin');
            });
        });

        test('redirects to /register when user not found (404)', async () => {
            const mockNavigate = jest.fn();
            jest.spyOn(require('react-router'), 'useNavigate').mockReturnValue(mockNavigate);
            jest.spyOn(require('../../hooks/apiAuth'), 'useApiAuth').mockReturnValue({
                apiFetch: jest.fn(() => Promise.resolve({ ok: false, status: 404 })),
            });
            require('@auth0/auth0-react').useAuth0.mockReturnValue({
                isAuthenticated: true, isLoading: false,
                user: { sub: 'auth0|123' }, loginWithRedirect: jest.fn(),
            });

            await renderLanding();
            await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/register'));
        });

        test('handles failed profile verification', async () => {
            jest.spyOn(require('../../hooks/apiAuth'), 'useApiAuth').mockReturnValue({
                apiFetch: jest.fn(() => Promise.resolve({ ok: false, status: 500 })),
            });
            require('@auth0/auth0-react').useAuth0.mockReturnValue({
                isAuthenticated: true, isLoading: false,
                user: { sub: 'auth0|123' }, loginWithRedirect: jest.fn(),
            });

            await renderLanding();
            expect(screen.getByText(/skip the queue/i)).toBeInTheDocument();
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
        test('selecting a service calls fetch with service param', async () => {
            await renderLanding();

            await act(async () => {
                await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'General Consultation');
            });

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('service=General+Consultation')
                );
            });
        });

        test('selecting a province calls fetch with province param', async () => {
            await renderLanding();

            await act(async () => {
                await userEvent.selectOptions(screen.getAllByRole('combobox')[1], 'GAUTENG');
            });

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('province=GAUTENG')
                );
            });
        });

        test('selecting a town calls fetch with town param', async () => {
            await renderLanding();

            await act(async () => {
                await userEvent.selectOptions(screen.getAllByRole('combobox')[2], 'JOHANNESBURG');
            });

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('town=JOHANNESBURG')
                );
            });
        });

        test('selecting a suburb calls fetch with suburb param', async () => {
            await renderLanding();

            await act(async () => {
                await userEvent.selectOptions(screen.getAllByRole('combobox')[3], 'PARKTOWN');
            });

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('suburb=PARKTOWN')
                );
            });
        });

        test('selecting a type calls fetch with type param', async () => {
            await renderLanding();

            await act(async () => {
                await userEvent.selectOptions(screen.getAllByRole('combobox')[4], 'SPECIALIST');
            });

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('type=SPECIALIST')
                );
            });
        });

        test('shows clinic cards when filter returns results', async () => {
            global.fetch = jest.fn((url) => {
                if (url.includes('/clinics/filters')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({
                            provinces: ['GAUTENG'],
                            towns:     ['JOHANNESBURG'],
                            suburbs:   ['PARKTOWN'],
                            types:     ['SPECIALIST'],
                            services:  ['General Consultation'],
                        }),
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        data: [{
                            _id:                    '1',
                            practiceName:           'Parkmed Neuro Clinic',
                            practiceTypeDescription:'Neurology specialist',
                            physicalAddress:        '1 Park Lane',
                            physicalTown:           'JOHANNESBURG',
                            practiceTimes:          { open: '08:00', close: '17:00' },
                        }],
                        pagination: { total: 1, page: 1, totalPages: 1 },
                    }),
                });
            });

            await renderLanding();

            await act(async () => {
                await userEvent.selectOptions(screen.getAllByRole('combobox')[1], 'GAUTENG');
            });

            await waitFor(() => {
                expect(screen.getByText('Parkmed Neuro Clinic')).toBeInTheDocument();
            });
        });

        test('shows no clinics found when filter returns empty', async () => {
            await renderLanding();

            await act(async () => {
                await userEvent.selectOptions(screen.getAllByRole('combobox')[1], 'GAUTENG');
            });

            await waitFor(() => {
                expect(screen.getByText(/no clinics found/i)).toBeInTheDocument();
            });
        });

        test('handles clinic fetch network error gracefully', async () => {
            global.fetch = jest.fn((url) => {
                if (url.includes('/clinics/filters')) return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ provinces:[], towns:[], suburbs:[], types:[], services:[] }),
                });
                return Promise.reject(new Error('Network error'));
            });

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
            global.fetch = jest.fn((url) => {
                if (url.includes('/clinics/filters')) return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ provinces:[], towns:[], suburbs:[], types:[], services:[] }),
                });
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        data: [{ _id: '1', practiceName: 'Clinic A', practiceTypeDescription: 'GP', physicalAddress: '1 St', physicalTown: 'Town', practiceTimes: {} }],
                        pagination: { page: 1, totalPages: 1, total: 1 }
                    }),
                });
            });

            await renderLanding();
            await waitFor(() => expect(screen.getByText(/showing/i)).toBeInTheDocument());
        });


        describe('Pagination tests', () => {
            beforeEach(() => {
                global.fetch = jest.fn((url) => {
                    if (url.includes('/clinics/filters')) return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ provinces:[], towns:[], suburbs:[], types:[], services:[] }),
                    });
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({
                            data: [{ _id: '1', practiceName: 'Clinic A', practiceTypeDescription: 'GP', physicalAddress: '1 St', physicalTown: 'Town', practiceTimes: {} }],
                            pagination: { page: 1, totalPages: 3, total: 30 }
                        }),
                    });
                });
            });

            test('renders pagination buttons when multiple pages exist', async () => {
                await renderLanding();

                await waitFor(() => expect(screen.getByText('Clinic A')).toBeInTheDocument());

                expect(screen.getByLabelText('Next page')).toBeInTheDocument();
                expect(screen.getByLabelText('Previous page')).toBeDisabled();
            });

            test('clicking next page fetches page 2', async () => {
                await renderLanding();

                await waitFor(() => expect(screen.getByText('Clinic A')).toBeInTheDocument());

                await act(async () => {
                    await userEvent.click(screen.getByLabelText('Next page'));
                    jest.runAllTimers();
                });

                expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('_page=2'));
            });

            test('clicking a page number fetches that page', async () => {
                await renderLanding();

                await waitFor(() => expect(screen.getByText('Clinic A')).toBeInTheDocument());

                await act(async () => {
                    await userEvent.click(screen.getByLabelText('Page 2'));
                    jest.runAllTimers();
                });

                expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('_page=2'));
            });
        });
    });

    // Clinic modal tests
    describe('Clinic detail modal', () => {

        const clinicWithTimes = {
            _id:                    '1',
            practiceName:           'Parkmed Neuro Clinic',
            practiceTypeDescription:'Neurology specialist',
            physicalAddress:        '1 Park Lane',
            physicalTown:           'JOHANNESBURG',
            practiceNumber:         '0012345',
            contactNumber:          '011 123 4567',
            practiceTimes:          { open: '00:00', close: '23:59' }, // always open for test
        };

        beforeEach(() => {
            global.fetch = jest.fn((url) => {
                if (url.includes('/clinics/filters')) return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ provinces:[], towns:[], suburbs:[], types:[], services:[] }),
                });
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        data: [clinicWithTimes],
                        pagination: { page: 1, totalPages: 1, total: 1 },
                    }),
                });
            });
        });

        test('clicking a clinic card opens the modal', async () => {
            await renderLanding();

            await waitFor(() => expect(screen.getByText('Parkmed Neuro Clinic')).toBeInTheDocument());

            await act(async () => {
                await userEvent.click(screen.getByText('Parkmed Neuro Clinic'));
            });

            expect(screen.getAllByText('Parkmed Neuro Clinic').length).toBeGreaterThan(1);
        });

        test('modal shows clinic address', async () => {
            await renderLanding();
            await waitFor(() => expect(screen.getByText('Parkmed Neuro Clinic')).toBeInTheDocument());

            await act(async () => {
                await userEvent.click(screen.getByText('Parkmed Neuro Clinic'));
            });

            const addressParagraph = document.querySelector('.clinic-modal-details p:nth-child(2)');
            expect(addressParagraph).toHaveTextContent('1 Park Lane');
        });

        test('modal shows contact number', async () => {
             await renderLanding();
             await waitFor(() => expect(screen.getByText('Parkmed Neuro Clinic')).toBeInTheDocument());

             await act(async () => {
             await userEvent.click(screen.getByText('Parkmed Neuro Clinic'));
        });

    expect(screen.getByText(/contact/i)).toBeInTheDocument();
});

        test('modal shows opening hours', async () => {
            await renderLanding();
            await waitFor(() => expect(screen.getByText('Parkmed Neuro Clinic')).toBeInTheDocument());

            await act(async () => {
                await userEvent.click(screen.getByText('Parkmed Neuro Clinic'));
            });

            expect(screen.getByText(/00:00/i)).toBeInTheDocument();
        });

        test('modal shows open badge when clinic is open', async () => {
            await renderLanding();
            await waitFor(() => expect(screen.getByText('Parkmed Neuro Clinic')).toBeInTheDocument());

            await act(async () => {
                await userEvent.click(screen.getByText('Parkmed Neuro Clinic'));
            });

            expect(document.querySelector('.modal-badge.status-open')).toBeInTheDocument();
        });

        test('modal shows Join Queue and Book Now buttons', async () => {
            await renderLanding();
            await waitFor(() => expect(screen.getByText('Parkmed Neuro Clinic')).toBeInTheDocument());

            await act(async () => {
                await userEvent.click(screen.getByText('Parkmed Neuro Clinic'));
            });

            expect(screen.getByRole('button', { name: /join queue/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /book now/i })).toBeInTheDocument();
        });

        test('clicking Join Queue triggers signup', async () => {
            const mockSignup = jest.fn();
            require('@auth0/auth0-react').useAuth0.mockReturnValue({
                isAuthenticated: false,
                isLoading: false,
                user: null,
                loginWithRedirect: mockSignup,
            });

            await renderLanding();
            await waitFor(() => expect(screen.getByText('Parkmed Neuro Clinic')).toBeInTheDocument());

            await act(async () => {
                await userEvent.click(screen.getByText('Parkmed Neuro Clinic'));
            });

            await act(async () => {
                await userEvent.click(screen.getByRole('button', { name: /join queue/i }));
            });

            expect(mockSignup).toHaveBeenCalled();
        });

        test('clicking Book Now triggers signup', async () => {
            const mockSignup = jest.fn();
            require('@auth0/auth0-react').useAuth0.mockReturnValue({
                isAuthenticated: false,
                isLoading: false,
                user: null,
                loginWithRedirect: mockSignup,
            });

            await renderLanding();
            await waitFor(() => expect(screen.getByText('Parkmed Neuro Clinic')).toBeInTheDocument());

            await act(async () => {
                await userEvent.click(screen.getByText('Parkmed Neuro Clinic'));
            });

            await act(async () => {
                await userEvent.click(screen.getByRole('button', { name: /book now/i }));
            });

            expect(mockSignup).toHaveBeenCalled();
        });

        test('clicking the close button dismisses the modal', async () => {
            await renderLanding();
            await waitFor(() => expect(screen.getByText('Parkmed Neuro Clinic')).toBeInTheDocument());

            await act(async () => {
            await userEvent.click(screen.getByText('Parkmed Neuro Clinic'));
        });

    await act(async () => {
        await userEvent.click(document.querySelector('.clinic-modal-close'));
    });

    await waitFor(() => {
        expect(document.querySelector('.clinic-modal-overlay')).not.toBeInTheDocument();
    });
});

        test('clicking the overlay dismisses the modal', async () => {
            await renderLanding();
            await waitFor(() => expect(screen.getByText('Parkmed Neuro Clinic')).toBeInTheDocument());

            await act(async () => {
                await userEvent.click(screen.getByText('Parkmed Neuro Clinic'));
            });

            // Click the overlay (the outer section with the blur)
            const overlay = document.querySelector('.clinic-modal-overlay');
            await act(async () => {
                await userEvent.click(overlay);
            });

            await waitFor(() => {
                expect(screen.getAllByText('Parkmed Neuro Clinic').length).toBe(1);
            });
        });

        test('modal shows closed badge when clinic is closed', async () => {
            global.fetch = jest.fn((url) => {
                if (url.includes('/clinics/filters')) return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ provinces:[], towns:[], suburbs:[], types:[], services:[] }),
                });
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        data: [{
                            ...clinicWithTimes,
                            practiceTimes: { open: '00:00', close: '00:01' }, // always closed
                        }],
                        pagination: { page: 1, totalPages: 1, total: 1 },
                    }),
                });
            });

            await renderLanding();
            await waitFor(() => expect(screen.getByText('Parkmed Neuro Clinic')).toBeInTheDocument());

            await act(async () => {
                await userEvent.click(screen.getByText('Parkmed Neuro Clinic'));
            });

            expect(document.querySelector('.modal-badge.status-closed')).toBeInTheDocument();
        });

        test('modal shows Hours not set when practiceTimes is missing', async () => {
            global.fetch = jest.fn((url) => {
                if (url.includes('/clinics/filters')) return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ provinces:[], towns:[], suburbs:[], types:[], services:[] }),
                });
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        data: [{
                            _id: '2',
                            practiceName: 'No Hours Clinic',
                            practiceTypeDescription: 'GP',
                            physicalAddress: '2 Main St',
                            physicalTown: 'CAPE TOWN',
                            practiceNumber: '999',
                            contactNumber: '021 999 9999',
                            practiceTimes: {},
                        }],
                        pagination: { page: 1, totalPages: 1, total: 1 },
                    }),
                });
            });

            await renderLanding();
            await waitFor(() => expect(screen.getByText('No Hours Clinic')).toBeInTheDocument());

            await act(async () => {
                await userEvent.click(screen.getByText('No Hours Clinic'));
            });

            expect(screen.getByText(/hours not set/i)).toBeInTheDocument();
        });
    });
});