import { render, screen } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import { BrowserRouter } from 'react-router-dom'

describe('AdminDashboard Component', () => {

  test('renders navbar elements', () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    // Check nav buttons
    expect(screen.getByText(/log out/i)).toBeInTheDocument();
    expect(screen.getByText(/profile/i)).toBeInTheDocument();

    // Check notification image
    expect(screen.getByAltText(/notification bell/i)).toBeInTheDocument();
  });
  
  test('renders top section content', () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    expect(
      screen.getByText(/welcome to the admin dashboard/i)
    ).toBeInTheDocument();

    expect(screen.getByAltText(/clinic logo/i)).toBeInTheDocument();
  });

});