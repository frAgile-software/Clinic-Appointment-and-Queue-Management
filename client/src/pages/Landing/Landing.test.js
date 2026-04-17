import { render, screen } from '@testing-library/react';
import Landing from './Landing';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router';

// Mock Auth0 to simulate a logged-out user
jest.mock('@auth0/auth0-react', () => ({
    useAuth0: () => ({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        loginWithRedirect: jest.fn(),
    }),
}));

describe('<Landing />', () => {
    const renderLanding = () => render(
        <MemoryRouter>
            <Landing />
        </MemoryRouter>
    );

    test('renders the site name', () => {
        renderLanding();
        expect(screen.getByText(/cliniq/i)).toBeInTheDocument();
    });

    test('renders a Login button', () => {
        renderLanding();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    test('renders the search button', () => {
        renderLanding();
        expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });
});