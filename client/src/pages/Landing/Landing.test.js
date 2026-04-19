import { render, screen } from '@testing-library/react';
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
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [], pagination: {} }),
        })
    );
});

// Clear all mocks after each test so they don't bleed into each other
afterEach(() => {
    jest.clearAllMocks();
});

//  Helper: renders Landing inside a router 
// MemoryRouter is required because Landing uses useNavigate

const renderLanding = () => render(
    <MemoryRouter>
        <Landing />
    </MemoryRouter>
);


describe('<Landing />', () => {

    //  Nav bar tests 

    // The  logo must always be visible in the top nav bar
    test('renders the site name', () => {
        renderLanding();
        expect(screen.getByText(/cliniq/i)).toBeInTheDocument();
    });

    // Login button opens the Auth0 login flow when clicked
    test('renders a Login button', () => {
        renderLanding();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    // Sign Up button opens the Auth0 registration flow when clicked
    test('renders a Sign Up button', () => {
        renderLanding();
        expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    // Hero / search tests

    // The main headline should always be visible on the landing page
    test('renders the headline', () => {
        renderLanding();
        expect(screen.getByText(/skip the queue/i)).toBeInTheDocument();
    });

    // The search input is where visitors type a clinic name to search
    test('renders the search input', () => {
        renderLanding();
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    // The Search button submits the form and triggers the clinic search
    test('renders the Search button', () => {
        renderLanding();
        expect(screen.getByRole('button', { name: /^search$/i })).toBeInTheDocument();
    });

});