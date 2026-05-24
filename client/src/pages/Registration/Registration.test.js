import { render, screen } from '@testing-library/react';
import Registration from './Registration';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router';

jest.mock('@auth0/auth0-react', () => ({
    useAuth0: () => ({
        isAuthenticated: true,
        user: { sub: 'auth0|123', email: 'test@example.com' },
        isLoading: false,
        loginWithRedirect: jest.fn(),
    }),
}));

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: () => jest.fn(),
}));

const mockGet = jest.fn();
const mockRegister = jest.fn();

const mockApi = {
    users: {
        get: mockGet,
        register: mockRegister,
    },
};

jest.mock('../../api/useApi', () => ({
    useApi: () => mockApi,
}));

jest.mock('../../context/UserRoleContext', () => ({
    useUserRole: () => ({
        refreshRole: jest.fn(),
    }),
}));

describe('<Registration />', () => {
    beforeEach(() => {
        mockGet.mockRejectedValue({ status: 404 });

        render(
            <MemoryRouter>
                <Registration />
            </MemoryRouter>
        );
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should render the registration form', () => {
        expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    it('should show the registration heading', () => {
        expect(screen.getByRole('heading', { name: /complete your profile/i })).toBeInTheDocument();
    });

    it('should have three role selection radios', () => {
        expect(screen.getAllByTestId('role-select')).toHaveLength(3);
    });

    it('should default to the Patient role selected', () => {
        expect(screen.getByLabelText(/patient/i)).toBeChecked();
    });

    it('should render a submit button labeled Complete Registration', () => {
        const registerButton = screen.getByTestId('register-button');
        expect(registerButton).toBeInTheDocument();
        expect(registerButton).toHaveTextContent(/complete registration/i);
    });
});