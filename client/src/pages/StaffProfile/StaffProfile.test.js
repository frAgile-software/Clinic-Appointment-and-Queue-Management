import { render, screen, fireEvent } from '@testing-library/react';
import StaffProfile from './StaffProfile';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router';

const mockApiFetch = jest.fn();
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

jest.mock('../../hooks/apiAuth', () => ({
    useApiAuth: () => ({
        apiFetch: mockApiFetch,
    }),
}));

afterEach(() => {
    jest.clearAllMocks();
});

const renderComponent = () => {
    render(
        <MemoryRouter>
            <StaffProfile />
        </MemoryRouter>
    );
};

describe('<StaffProfile />', () => {
    beforeEach(() => {
        mockApiFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    _id: 'staff-1',
                    name: 'Alex',
                    surname: 'Smith',
                    title: 'Dr',
                    email: 'alex.smith@example.com',
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    practiceName: 'HealthPlus',
                    physicalAddress: '123 Main St',
                    contactNumber: '0102030405',
                }),
            })
            
    });

    it('renders navigation, header, and action buttons', () => {
        renderComponent();

        expect(screen.getByText(/clinics and qs/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
        expect(screen.getByText(/my profile/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('shows loading state before profile data arrives', () => {
        renderComponent();

        expect(screen.getByText(/loading profile details/i)).toBeInTheDocument();
    });

    it('renders staff profile data and assigned clinic after fetch', async () => {
        renderComponent();

        expect(await screen.findByText('Alex')).toBeInTheDocument();
        expect(screen.getByText('alex.smith@example.com')).toBeInTheDocument();
        expect(screen.getByText(/HealthPlus/i)).toBeInTheDocument();
        
    });

    it('opens clinic details modal and shows assigned clinic information', async () => {
        renderComponent();

        fireEvent.click(await screen.findByRole('button', { name: /view details/i }));

        expect(screen.getByText(/Your Clinic Details/i)).toBeInTheDocument();
        expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
        expect(screen.getByText(/0102030405/i)).toBeInTheDocument();
    });

    it('opens the update personal details modal with pre-filled values', async () => {
        renderComponent();

        fireEvent.click(await screen.findByRole('button', { name: /update personal details/i }));

        expect(screen.getByDisplayValue('Alex')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Dr')).toBeInTheDocument();
        expect(screen.getByDisplayValue('alex.smith@example.com')).toBeInTheDocument();
    });
});

