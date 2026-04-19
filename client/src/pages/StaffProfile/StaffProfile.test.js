import { render, screen } from '@testing-library/react';
import StaffProfile from './StaffProfile';

test('renders profile header', () => {  
    render(<StaffProfile />);      
    const headerElement = screen.getByText(/MY PROFILE/i);
    expect(headerElement).toBeInTheDocument();
});

test('renders assigned clinics', () => {
    render(<StaffProfile />);
    const clinic1 = screen.getByText(/Hayden Medical Clinic/i);
    const clinic2 = screen.getByText(/Forgotten Dreams Dental Clinic/i);
    expect(clinic1).toBeInTheDocument();
    expect(clinic2).toBeInTheDocument();
});

