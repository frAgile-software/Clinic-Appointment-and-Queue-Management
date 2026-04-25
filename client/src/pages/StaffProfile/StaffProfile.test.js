import { render, screen } from '@testing-library/react';
import StaffProfile from './StaffProfile';
import { MemoryRouter } from 'react-router';

test('renders profile header', () => { 
    render(
  <MemoryRouter>
    <StaffProfile />
  </MemoryRouter>
);
    const headerElement = screen.getByText(/MY PROFILE/i);
    expect(headerElement).toBeInTheDocument();
});

