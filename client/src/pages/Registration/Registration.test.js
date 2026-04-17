import { render, screen } from '@testing-library/react';
import Registration from './Registration';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router';

// Mock Auth0 to simulate a logged-in user
jest.mock('@auth0/auth0-react', () => ({
    useAuth0: () => ({
        isAuthenticated: true,
        user: { sub: 'auth0|123', email: 'test@example.com' },
        isLoading: false,
        loginWithRedirect: jest.fn(),
    }),
}));

describe('<Registration />', () => {
    beforeEach(() => {
        render(
            <MemoryRouter>
                <Registration />
            </MemoryRouter>
        );
    });

    it('should render the registration form', () => {
        const form = screen.getByTestId('register-form');
        expect(form).toBeInTheDocument();
    });

    it('should show the registration heading', () => {
        expect(screen.getByRole('heading', { name: /complete your profile/i })).toBeInTheDocument();
    });

    it('should have three role selection radios', () => {
        const roleRadioButtons = screen.getAllByTestId('role-select');
        expect(roleRadioButtons).toHaveLength(3);
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