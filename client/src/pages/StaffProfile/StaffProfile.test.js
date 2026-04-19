import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom'; 
import StaffProfile from './StaffProfile';

test('renders profile header', () => {  
    // Wrap the component in MemoryRouter
    render(
        <MemoryRouter>
            <StaffProfile />
        </MemoryRouter>
    );      
    const headerElement = screen.getByText(/MY PROFILE/i);
    expect(headerElement).toBeInTheDocument();
});

test('renders assigned clinics', () => {
    render(
        <MemoryRouter>
            <StaffProfile />
        </MemoryRouter>
    );
    const clinic1 = screen.getByText(/Hayden Medical Clinic/i);
    const clinic2 = screen.getByText(/Forgotten Dreams Dental Clinic/i);
    expect(clinic1).toBeInTheDocument();
    expect(clinic2).toBeInTheDocument();
});