import { render, screen } from '@testing-library/react';
import StaffProfile from './StaffProfile';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router';

//mock auth
jest.mock('@auth0/auth0-react', () => ({
    useAuth0: () => ({
        isAuthenticated: true,
        user: { sub: 'auth0|123', email: 'test@example.com' },
        isLoading: false,
        loginWithRedirect: jest.fn(),
    }),
}));

describe('<StaffProfile />', () => {
    beforeEach(() => {
        render(
            <MemoryRouter>
                <StaffProfile />
            </MemoryRouter>
        );
    });
    it('should render profile nav', ()=>{
      const form = screen.getByText(/MY PROFILE/i);
      expect(form).toBeInTheDocument;
    });
    it()
});

