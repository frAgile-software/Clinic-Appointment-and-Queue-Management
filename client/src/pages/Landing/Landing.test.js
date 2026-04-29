import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router';
import Landing from './Landing';

jest.mock('@auth0/auth0-react', () => ({
    useAuth0: jest.fn(),
}));

jest.mock('../../hooks/apiAuth', () => ({
    useApiAuth: () => ({ apiFetch: jest.fn() }),
}));

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

afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.clearAllMocks();
});

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

    test('renders the site name', async () => {
        await renderLanding();
        expect(screen.getByText(/clinics and qs/i)).toBeInTheDocument();
    });

    test('renders a Login button', async () => {
        await renderLanding();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    test('renders a Sign Up button', async () => {
        await renderLanding();
        expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    test('renders the headline', async () => {
        await renderLanding();
        expect(screen.getByText(/skip the queue/i)).toBeInTheDocument();
    });

    test('renders the search input', async () => {
        await renderLanding();
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    test('renders the Search button', async () => {
        await renderLanding();
        expect(screen.getByRole('button', { name: /^search$/i })).toBeInTheDocument();
    });
    
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

    describe('Clinic sesarching and filtering', () => {
        
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

        test('handles clinic fetch network error gracefully', async () => {
            global.fetch = jest.fn((url) => {
                if (url.includes('/clinics/filters')) return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ provinces:[], towns:[], suburbs:[], types:[] }),
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
                    json: () => Promise.resolve({ provinces:[], towns:[], suburbs:[], types:[] }),
                });
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        data: [{ _id: '1', practiceName: 'Clinic A', practiceTypeDescription: 'GP', physicalAddress: '1 St', physicalTown: 'Town', isOpen: false }],
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
                        json: () => Promise.resolve({ provinces:[], towns:[], suburbs:[], types:[] }),
                    });
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({
                            data: [{ _id: '1', practiceName: 'Clinic A', practiceTypeDescription: 'GP', physicalAddress: '1 St', physicalTown: 'Town', isOpen: true }],
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
});