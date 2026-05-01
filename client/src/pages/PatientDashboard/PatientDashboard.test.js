import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PatientDashboard from "./PatientDashboard";

import { useAuth0 } from '@auth0/auth0-react';
import { useApiAuth } from '../../hooks/apiAuth';

// 1. Mock dependencies
jest.mock('@auth0/auth0-react');
jest.mock('../../hooks/apiAuth');

const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock scrollIntoView since JSDOM doesn't support it natively
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe("Patient Dashboard - Component and Feature Tests", () => {
  const mockLogout = jest.fn();
  const mockApiFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    if (window.HTMLElement.prototype.scrollIntoView.mockClear) {
        window.HTMLElement.prototype.scrollIntoView.mockClear();
    }

    useAuth0.mockReturnValue({
      user: { sub: "auth0|12345" },
      logout: mockLogout,
    });

    useApiAuth.mockReturnValue({
      apiFetch: mockApiFetch,
    });

    mockApiFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ name: "John Doe", surname: "Smith" }),
    });

    global.fetch = jest.fn((url) => {
      if (url.includes('/clinics/filters')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            provinces: ['Gauteng'], 
            towns: ['Sandton'], 
            suburbs: [], 
            types: ['General Practice'],
            services: ['Dentistry', 'Cardiology']
          })
        });
      }
      if (url.includes('/clinics')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [
              {
                _id: 'clinic_123',
                practiceName: 'Sandton Health Clinic',
                practiceTypeDescription: 'General Practice',
                physicalAddress: '1 Sandton Drive',
                physicalTown: 'Sandton',
                isOpen: true,
                practiceNumber: '102846748',
                telephone: '0858761234'
              }
            ],
            pagination: { page: 1, totalPages: 1, total: 1 }
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderDashboard = async () => {
    render(<PatientDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Welcome Back, John Doe!/i)).toBeInTheDocument();
    });
  };

  // --- CORE DASHBOARD TESTS ---

  test("Given the dashboard loads, Then the top navigation bar is displayed", async () => {
    await renderDashboard();
    expect(screen.getByRole("heading", { name: /Clinics and Qs/i })).toBeInTheDocument(); 
    expect(screen.getByRole("button", { name: /HOME/i })).toBeInTheDocument();
  });

  test("Given the user is logged in, Then they see a personalized welcome message", async () => {
    render(<PatientDashboard />);
    
    const welcomeHeading = screen.getByRole("heading", { name: /Welcome Back/i });
    expect(welcomeHeading).toHaveTextContent("Welcome Back, ...!");

    await waitFor(() => {
      expect(welcomeHeading).toHaveTextContent("Welcome Back, John Doe!");
    });
  });

  test("Given the component mounts, Then it fetches the user profile using the Auth0 ID", async () => {
    await renderDashboard();
    expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining("/api/users/auth0|12345"));
  });

  test("Given the user clicks logout, Then the Auth0 logout function is triggered", async () => {
    await renderDashboard();
    const logoutBtn = screen.getByRole("button", { name: /Logout/i });
    fireEvent.click(logoutBtn);
    
    expect(mockLogout).toHaveBeenCalledWith({
      logoutParams: { returnTo: window.location.origin }
    });
  });

  // --- SEARCH EXTENSION TESTS ---

  test("Given the dashboard initially loads, Then the compressed 'Find Nearest Clinic' card is shown", async () => {
    await renderDashboard();
    expect(screen.getByText(/Discover clinics in your area and their opening times/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Clinic name/i)).not.toBeInTheDocument();
  });

  test("Given the user clicks 'SEARCH CLINIC', Then the search bar and filters are revealed", async () => {
    await renderDashboard();
    const searchBtn = screen.getByRole("button", { name: /SEARCH CLINIC/i });
    
    fireEvent.click(searchBtn);
    
    expect(screen.getByPlaceholderText(/Clinic name/i)).toBeInTheDocument();
    expect(screen.getByText(/All provinces/i)).toBeInTheDocument();

    await waitFor(() => {
        expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  test("Given the user clicks 'BOOK AN APPOINTMENT', Then the search bar is revealed and it scrolls", async () => {
    await renderDashboard();
    const bookApptBtn = screen.getByRole("button", { name: /BOOK AN APPOINTMENT/i });
    
    fireEvent.click(bookApptBtn);
    
    expect(screen.getByPlaceholderText(/Clinic name/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });

    await waitFor(() => {
        expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  test("Given the search card is expanded, Then it fetches and displays clinics from the API", async () => {
    await renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

    await waitFor(() => {
      expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    }, { timeout: 1500 }); 
    
    expect(screen.getByText(/1 Sandton Drive, Sandton/i)).toBeInTheDocument();
    expect(screen.getByText(/Open now/i)).toBeInTheDocument();
  });

  // --- MODAL (POPUP) TESTS ---

  test("Given the user clicks on a clinic card, Then the clinic details modal opens", async () => {
    await renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

    let clinicCard;
    await waitFor(() => {
      clinicCard = screen.getByText(/Sandton Health Clinic/i);
    }, { timeout: 1500 });

    fireEvent.click(clinicCard);

    expect(screen.getByText(/Practice Number: 102846748/i)).toBeInTheDocument();
  });

  test("Given the modal is open, When the user clicks the 'X' button, Then the modal closes", async () => {
    await renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC CLINIC/i }));

    await waitFor(() => {
      expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    }, { timeout: 1500 });

    fireEvent.click(screen.getByText(/Sandton Health Clinic/i));
    
    expect(screen.getByText(/Practice Number: 102846748/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: "X" });
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/Practice Number: 102846748/i)).not.toBeInTheDocument();
  });

  test("Given the modal is open, When the user clicks 'Book Now', Then they are navigated to /book with clinic state", async () => {
    await renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

    await waitFor(() => {
      expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    }, { timeout: 1500 });

    fireEvent.click(screen.getByText(/Sandton Health Clinic/i));

    const bookNowBtn = screen.getByRole("button", { name: /Book Now/i });
    fireEvent.click(bookNowBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/book", {
      state: expect.objectContaining({
        clinicId:    'clinic_123',
        clinicName:  'Sandton Health Clinic',
        fromBookNow: true,
      }),
    });
  });

  test("Given a reason is selected and the modal is open, When 'Book Now' is clicked, Then the reason is passed in state", async () => {
    await renderDashboard();
    
    fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /Filter by reason for visit/i })).toBeInTheDocument();
      expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    }, { timeout: 1500 });

    fireEvent.change(screen.getByRole('combobox', { name: /Filter by reason for visit/i }), { target: { value: 'Dentistry' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("service=Dentistry"));
    }, { timeout: 1500 });

    fireEvent.click(screen.getByText(/Sandton Health Clinic/i));

    const bookNowBtn = screen.getByRole("button", { name: /Book Now/i });
    fireEvent.click(bookNowBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/book", {
      state: expect.objectContaining({
        clinicId:    'clinic_123',
        clinicName:  'Sandton Health Clinic',
        fromBookNow: true,
        specialty:   'Dentistry',
      }),
    });
  });
});