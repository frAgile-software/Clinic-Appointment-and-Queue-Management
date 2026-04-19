import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router';
import Landing from './Landing';

// Mock: Auth0
// Simulates a visitor who is NOT logged in so the role-redirect
jest.mock('@auth0/auth0-react', () => ({
    useAuth0: () => ({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        loginWithRedirect: jest.fn(),
    }),
}));

//  Mock: apiAuth hook 
// apiFetch is only called when a user is authenticated.

jest.mock('../../hooks/apiAuth', () => ({
    useApiAuth: () => ({ apiFetch: jest.fn() }),
}));

// Mock: global fetch
// The Landing page calls fetch on mount to load clinics.
// We return empty data here since card rendering is not
beforeEach(() => {
    global.fetch = jest.fn((url) => {
        if (url.includes('/clinics/filters')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    provinces: ['GAUTENG', 'WESTERN CAPE'],
                    towns:     ['JOHANNESBURG', 'CAPE TOWN'],
                    suburbs:   ['PARKTOWN','SEA POINT'],
                    types:     ['SPECIALIST', 'GENERAL PRACTICE'],
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
    jest.clearAllMocks();
});

//  Helper: renders Landing inside a router 
// MemoryRouter is required because Landing uses useNavigate

const renderLanding = async () => {
    await act(async () => {
        render(
            <MemoryRouter>
                <Landing />
            </MemoryRouter>
        )}
)};


describe('<Landing />', () => {

    //  Nav bar tests 

    // The  logo must always be visible in the top nav bar
    test('renders the site name', async () => {
        await renderLanding();
        expect(screen.getByText(/cliniq/i)).toBeInTheDocument();
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

    // Filter dropdown tests
    describe('Dropdown filter tests', () => {
        
        test('renders all four filter dropdowns', async () => {
            await renderLanding();
            expect(screen.getAllByRole('combobox')).toHaveLength(4);
        });

        test('each dropdown has a default All option', async () => {
            await renderLanding();
            expect(screen.getByText('All provinces')).toBeInTheDocument();
            expect(screen.getByText('All towns')).toBeInTheDocument();
            expect(screen.getByText('All suburbs')).toBeInTheDocument();
            expect(screen.getByText('All types')).toBeInTheDocument();
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

        test('selecting a province calls fetch with province param', async () => {
            await renderLanding();

            await act(async () => {
                await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'GAUTENG');
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
                await userEvent.selectOptions(screen.getAllByRole('combobox')[1], 'JOHANNESBURG');
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
                await userEvent.selectOptions(screen.getAllByRole('combobox')[2], 'PARKTOWN');
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
                await userEvent.selectOptions(screen.getAllByRole('combobox')[3], 'SPECIALIST');
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
                            isOpen:                 true,
                        }],
                        pagination: { total: 1 },
                    }),
                });
            });

            await renderLanding();

            await act(async () => {
                await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'GAUTENG');
            });

            await waitFor(() => {
                expect(screen.getByText('Parkmed Neuro Clinic')).toBeInTheDocument();
            });
        });

        test('shows no clinics found when filter returns empty', async () => {
            await renderLanding();

            await act(async () => {
                await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'GAUTENG');
            });

            await waitFor(() => {
                expect(screen.getByText(/no clinics found/i)).toBeInTheDocument();
            });
        });
    });
});