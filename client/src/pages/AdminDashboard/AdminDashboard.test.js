import { render, screen } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';


describe('AdminDashboard Component', () => {

  test('renders navbar elements', () => {
    render(
      <AdminDashboard />
    );

    // Check nav buttons
    expect(screen.getByText(/log out/i)).toBeInTheDocument();
    expect(screen.getByText(/profile/i)).toBeInTheDocument();

    // Check notification image
    expect(screen.getByAltText(/notification bell/i)).toBeInTheDocument();
  });
  
  test('renders top section content', () => {
    render(
        <AdminDashboard />
      
    );

    expect(
      screen.getByText(/welcome to the admin dashboard/i)
    ).toBeInTheDocument();

    expect(screen.getByAltText(/clinic logo/i)).toBeInTheDocument();
  });

});