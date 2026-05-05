import { render, screen } from '@testing-library/react';
import StaffDashboard from './StaffDashboard';
import { MemoryRouter } from 'react-router';

jest.mock('@auth0/auth0-react', () => ({
    useAuth0: () => ({
        logout: jest.fn(),
    }),
}));

test('renders clinic name and patient queue', () => {
    render(
        <MemoryRouter>
            <StaffDashboard/>
        </MemoryRouter>
    );
    
    const logoElement = screen.getByText(/Clinics and Qs/i);
    expect(logoElement).toBeInTheDocument();    
    const queueHeading = screen.getByText(/Patient Queue/i);
    expect(queueHeading).toBeInTheDocument();
});

test('renders patient names in the lists', () => {
    render(
        <MemoryRouter>
            <StaffDashboard />
        </MemoryRouter>
    );
    
    const patient1 = screen.getByText(/Jane Doe/i); 
    const patient2 = screen.getByText(/Janet Doe/i);
    
    expect(patient1).toBeInTheDocument();
    expect(patient2).toBeInTheDocument();
});

test('renders action buttons', () => {
    render(
        <MemoryRouter>
            <StaffDashboard />
        </MemoryRouter>
    );
   
    const addQueueButtons = screen.getAllByRole('button', { name: /add to queue/i });
    const viewScheduleButton = screen.getByRole('button', { name: /view schedule/i });
    
    expect(addQueueButtons[0]).toBeInTheDocument();
    expect(viewScheduleButton).toBeInTheDocument();
});

test('renders welcome message', () => {
    render(
        <MemoryRouter>
            <StaffDashboard />
        </MemoryRouter>
    );
  
    const welcomeMessage = screen.getByText(/Welcome Back, Staff Member/i);
    expect(welcomeMessage).toBeInTheDocument();
});

test('renders profile icon', () => {
    render(
        <MemoryRouter>
            <StaffDashboard />
        </MemoryRouter>
    );
    
    const profileIcon = screen.getByLabelText(/Profile/i);
    expect(profileIcon).toBeInTheDocument();
});