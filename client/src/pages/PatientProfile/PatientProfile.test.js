import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PatientProfile from './PatientProfile';
import { MemoryRouter } from 'react-router';
import { act } from 'react';

const mockApiFetch = jest.fn();

jest.mock('@auth0/auth0-react', () => ({
    useAuth0: () => ({
        user: { 
            sub: 'auth0|test-patient-123',
            picture: 'https://example.com/avatar.jpg'
        },
        logout: jest.fn(),
    }),
}));

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: () => jest.fn(),
}));

jest.mock('../../hooks/apiAuth', () => ({
    useApiAuth: () => ({
        apiFetch: mockApiFetch,
    }),
}));

beforeEach(() => {
    mockApiFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
            name: 'Jane',
            surname: 'Doe',
            title: 'Ms',
            email: 'jane.doe@example.com',
        }),
    });
});

afterEach(() => {
    mockApiFetch.mockReset();
});

const renderComponent = async () => {
    await act(async () => {
        render(
            <MemoryRouter>
                <PatientProfile />
            </MemoryRouter>
        );
    });
};

describe('Render tests', () => {
    test('renders profile header', async () => {
        await renderComponent();
        expect(screen.getByText(/my profile/i)).toBeInTheDocument();
    });

    test('fetches and displays profile data', async () => {
        await renderComponent();
        expect(await screen.findByText('Jane')).toBeInTheDocument();
        expect(screen.getByText('Doe')).toBeInTheDocument();
        expect(screen.getByText('jane.doe@example.com')).toBeInTheDocument();
    });

    test('shows alert and modal stays open when no changes made', async () => {
        window.alert = jest.fn();
        await renderComponent();
        
        await act(async () => {
            fireEvent.click(await screen.findByRole('button', { name: /update account details/i }));
        });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
        });

        expect(window.alert).toHaveBeenCalledWith('No changes made.');
        expect(await screen.findByText(/edit account details/i)).toBeInTheDocument();
    });
});

describe('Update logic', () => {
    test('successful update and save', async () => {
        await renderComponent();
        
        await act(async () => {
            fireEvent.click(await screen.findByRole('button', { name: /update account details/i }));
        });

        await act(async () => {
            fireEvent.change(screen.getByDisplayValue('Jane'), { target: { value: 'Janet' } });
        });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
        });

        await waitFor(() => {
            expect(screen.queryByText(/edit account details/i)).not.toBeInTheDocument();
        });
        expect(screen.getByText('Janet')).toBeInTheDocument();
        expect(screen.getByText('Doe')).toBeInTheDocument();
    });
});

describe('Email field disable logic', () => {
    test('email is enabled for auth0 users (auth0| prefix)', async () => {
        await renderComponent();
        
        await act(async () => {
            fireEvent.click(await screen.findByRole('button', { name: /update account details/i }));
        });
        
        expect(screen.getByDisplayValue('jane.doe@example.com')).not.toBeDisabled();
    });

    test('email is disabled for non-auth0 users', async () => {
        const auth0 = require('@auth0/auth0-react');
        jest.spyOn(auth0, 'useAuth0').mockReturnValue({
            user: { sub: 'google-oauth2|test-patient-456' },
            logout: jest.fn(),
        });

        await renderComponent();
        
        await act(async () => {
            fireEvent.click(await screen.findByRole('button', { name: /update account details/i }));
        });
        
        expect(screen.getByDisplayValue('jane.doe@example.com')).toBeDisabled();
    });
});