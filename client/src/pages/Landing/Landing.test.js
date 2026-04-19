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


// Not called when user is unauthenticated, but mocked for safety.
jest.mock('../../hooks/apiAuth', () => ({
  useApiAuth: () => ({ apiFetch: jest.fn() }),
}));
 
// Mock global fetch (clinic list) 
// Returns two sample clinic objects so we can assert card rendering
// without making real HTTP calls.
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok:   true,
      json: () =>
        Promise.resolve([
          {
            _id:                     '69e395a75404dbfc4a43b47d',
            practiceName:            'BRITS SUBAKUUT HOSPITAAL',
            practiceTypeDescription: 'SUB ACUTE FACILITIES',
            physicalAddress:         '62A KERK STREET 0250',
            physicalTown:            'BRITS',
            isOpen:                  false,
          },
          {
            _id:                     'aabbcc112233445566778899',
            practiceName:            'SANDTON HEALTH CLINIC',
            practiceTypeDescription: 'GENERAL PRACTICE',
            physicalAddress:         '1 SANDTON DRIVE',
            physicalTown:            'SANDTON',
            isOpen:                  true,
          },
        ]),
    })
  );
});
 
afterEach(() => {
  jest.clearAllMocks();
});
 
// Helper

const renderLanding = () =>
  render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>
  );
 
 

describe('<Landing />', () => {
 
  
  describe('Navigation', () => {
 
    test('renders the CliniQ brand name', () => {
      renderLanding();
      
      expect(screen.getByText(/cliniq/i)).toBeInTheDocument();
    });
 
    test('renders a Login button', () => {
      renderLanding();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });
 
    test('renders a Sign Up button', () => {
      renderLanding();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });
  });
 

  describe('Hero / search', () => {
 
    test('renders the headline', () => {
      renderLanding();
      expect(screen.getByText(/skip the queue/i)).toBeInTheDocument();
    });
 
    test('renders the search input', () => {
      renderLanding();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });
 
    test('renders the Search submit button', () => {
      renderLanding();
      expect(screen.getByRole('button', { name: /^search$/i })).toBeInTheDocument();
    });
 
    test('updates search input as the user types', async () => {
      renderLanding();
      const input = screen.getByRole('searchbox');
      
      await userEvent.type(input, 'Brits');
      expect(input).toHaveValue('Brits');
    });
  });
 

  describe('Clinic cards', () => {
 
    test('renders clinic cards after fetch resolves', async () => {
      renderLanding();
      
      await waitFor(() => {
        expect(screen.getByText(/brits subakuut hospitaal/i)).toBeInTheDocument();
        expect(screen.getByText(/sandton health clinic/i)).toBeInTheDocument();
      });
    });
 
    test('shows "Open now" badge for open clinics', async () => {
      renderLanding();
      await waitFor(() => {
        expect(screen.getByText(/open now/i)).toBeInTheDocument();
      });
    });
 
    test('shows "Closed" badge for closed clinics', async () => {
      renderLanding();
      await waitFor(() => {
    
        expect(screen.getAllByText(/closed/i).length).toBeGreaterThan(0);
      });
    });
 
  });
 
});
 