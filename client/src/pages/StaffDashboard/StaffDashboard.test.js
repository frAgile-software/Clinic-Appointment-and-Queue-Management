import { render, screen } from '@testing-library/react';
import StaffDashboard from './StaffDashboard';

test('renders clinic name and patient queue', () => {
 //tests here, refer to app.tests.js for example
 <MemoryRouter>
    render(<StaffDashboard/>);
    </MemoryRouter>
    const logoElement = screen.getByText(/ClinIQ/i);
    expect(logoElement).toBeInTheDocument();    
    const queueHeading = screen.getByText(/Patient Queue/i);
    expect(queueHeading).toBeInTheDocument();
});

test('renders patient names in the queue', () => {
    <MemoryRouter>
    render(<StaffDashboard />);
    </MemoryRouter>
    const patient1 = screen.getByText(/Jane Smith/i); 
    const patient2 = screen.getByText(/John Doe/i);
    expect(patient1).toBeInTheDocument();
    expect(patient2).toBeInTheDocument();
});

test('renders action buttons', () => {
    <MemoryRouter>
    render(<StaffDashboard />);
</MemoryRouter>
    const updateButton = screen.getByRole('button', { name: /update/i });
    const addButton = screen.getByRole('button', { name: /add/i });
    expect(updateButton).toBeInTheDocument();
    expect(addButton).toBeInTheDocument();
});

test('renders welcome message', () => {
    <MemoryRouter>
    render(<StaffDashboard />);
    </MemoryRouter>
    const welcomeMessage = screen.getByText(/Welcome back, Staff Member!/i);
    expect(welcomeMessage).toBeInTheDocument();
});

test('renders notification icon', () => {
    <MemoryRouter>
    render(<StaffDashboard />);
    </MemoryRouter>
    const notificationIcon = screen.getByLabelText(/Notifications/i);
    expect(notificationIcon).toBeInTheDocument();
});