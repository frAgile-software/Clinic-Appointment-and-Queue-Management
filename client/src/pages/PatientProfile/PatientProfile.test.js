import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PatientProfile from './PatientProfile';
import { MemoryRouter } from 'react-router';

const mockApiFetch = jest.fn();

jest.mock('@auth0/auth0-react', () => ({
    useAuth0: () => ({
        user: { sub: 'auth0|test-patient-123' },
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

const renderComponent = () => {
    render(
        <MemoryRouter>
            <PatientProfile />
        </MemoryRouter>
    );
};

describe('Render tests', () => {
    test('renders profile header', () => {
        renderComponent();
        expect(screen.getByText(/my profile/i)).toBeInTheDocument();
    });

    test('renders logo', () => {
        renderComponent();
        expect(screen.getByText(/clinics and qs/i)).toBeInTheDocument();
    });

    test('renders logout and back buttons', () => {
        renderComponent();
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    test('shows loading state initially', () => {
        renderComponent();
        expect(screen.getByText(/loading profile details/i)).toBeInTheDocument();
    });

    test('renders profile data after fetch', async () => {
        renderComponent();
        expect(await screen.findByText('Jane')).toBeInTheDocument();
        expect(screen.getByText('Doe')).toBeInTheDocument();
        expect(screen.getByText('Ms')).toBeInTheDocument();
        expect(screen.getByText('jane.doe@example.com')).toBeInTheDocument();
    });

    test('renders update account details button', async () => {
        renderComponent();
        expect(await screen.findByRole('button', { name: /update account details/i })).toBeInTheDocument();
    });
});

describe('Modal tests', () => {
    test('opens edit modal when update button is clicked', async () => {
        renderComponent();
        fireEvent.click(await screen.findByRole('button', { name: /update account details/i }));
        expect(screen.getByText(/edit account details/i)).toBeInTheDocument();
    });

    test('modal inputs are pre-filled with current profile data', async () => {
        renderComponent();
        fireEvent.click(await screen.findByRole('button', { name: /update account details/i }));
        expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Ms')).toBeInTheDocument();
        expect(screen.getByDisplayValue('jane.doe@example.com')).toBeInTheDocument();
    });

    test('closes modal when cancel is clicked', async () => {
        renderComponent();
        fireEvent.click(await screen.findByRole('button', { name: /update account details/i }));
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(screen.queryByText(/edit account details/i)).not.toBeInTheDocument();
    });

    test('calls apiFetch with PATCH on save', async () => {
        renderComponent();
        fireEvent.click(await screen.findByRole('button', { name: /update account details/i }));
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/auth0|test-patient-123'),
                expect.objectContaining({ method: 'PATCH' })
            );
        });
    });
});