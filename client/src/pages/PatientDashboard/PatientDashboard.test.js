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

// Mock scrollIntoView since JSDOM doesn't support it
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe("Patient Dashboard - Component and Feature Tests", () => {
  const mockLogout = jest.fn();
  const mockApiFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useAuth0.mockReturnValue({
      user: { sub: "auth0|12345" },
      logout: mockLogout,
    });

    useApiAuth.mockReturnValue({
      apiFetch: mockApiFetch,
    });

    // Mock the authenticated user profile fetch
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ name: "John Doe", surname: "Smith" }),
    });

    // Mock the global fetch used for clinics and filters
    global.fetch = jest.fn((url) => {
      if (url.includes('/clinics/filters')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            provinces: ['Gauteng'], towns: ['Sandton'], suburbs: [], types: ['General Practice']
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

  // --- CORE DASHBOARD TESTS ---

  test("Given the dashboard loads, Then the top navigation bar is displayed", () => {
    render(<PatientDashboard />);
    expect(screen.getByRole("heading", { name: /Clinics and Qs/i })).toBeInTheDocument(); 
    expect(screen.getByRole("button", { name: /HOME/i })).toBeInTheDocument();
  });

  test("Given the user is logged in, Then they see a personalized welcome message", async () => {
    render(<PatientDashboard />);
    expect(screen.getByText(/Welcome Back, ...!/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Welcome Back, John Doe!/i)).toBeInTheDocument();
    });
  });

  test("Given the component mounts, Then it fetches the user profile using the Auth0 ID", async () => {
    render(<PatientDashboard />);
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining("/api/users/auth0|12345"));
    });
  });

  test("Given the user clicks logout, Then the Auth0 logout function is triggered", () => {
    render(<PatientDashboard />);
    const logoutBtn = screen.getByRole("button", { name: /Logout/i });
    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledWith({
      logoutParams: { returnTo: "http://localhost" }
    });
  });

  // --- SEARCH EXTENSION TESTS ---

  test("Given the dashboard initially loads, Then the compressed 'Find Nearest Clinic' card is shown", () => {
    render(<PatientDashboard />);
    expect(screen.getByText(/Discover clinics in your area and their opening times/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Search by clinic name…/i)).not.toBeInTheDocument();
  });

  test("Given the user clicks 'SEARCH CLINIC', Then the search bar and filters are revealed", () => {
    render(<PatientDashboard />);
    const searchBtn = screen.getByRole("button", { name: /SEARCH CLINIC/i });
    
    fireEvent.click(searchBtn);
    
    expect(screen.getByPlaceholderText(/Search by clinic name…/i)).toBeInTheDocument();
    expect(screen.getByText(/All provinces/i)).toBeInTheDocument();
  });

  test("Given the search card is expanded, Then it fetches and displays clinics from the API", async () => {
    render(<PatientDashboard />);
    fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

    // Wait for the debounced fetch to resolve and render the clinic card
    await waitFor(() => {
      expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    }, { timeout: 1500 }); // Accounts for the 400ms debounce
    
    expect(screen.getByText(/1 Sandton Drive, Sandton/i)).toBeInTheDocument();
    expect(screen.getByText(/Open now/i)).toBeInTheDocument();
  });

  // --- MODAL (POPUP) TESTS ---

  test("Given the user clicks on a clinic card, Then the clinic details modal opens", async () => {
    render(<PatientDashboard />);
    fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

    // Wait for the clinic to render
    let clinicCard;
    await waitFor(() => {
      clinicCard = screen.getByText(/Sandton Health Clinic/i);
    }, { timeout: 1500 });

    // Click the card
    fireEvent.click(clinicCard);

    // Verify modal content
    expect(screen.getByText(/Practice Number: 102846748/i)).toBeInTheDocument();
  });

  test("Given the modal is open, When the user clicks the 'X' button, Then the modal closes", async () => {
    render(<PatientDashboard />);
    fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

    await waitFor(() => {
      expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    }, { timeout: 1500 });

    fireEvent.click(screen.getByText(/Sandton Health Clinic/i));
    
    // Check modal is open
    expect(screen.getByText(/Practice Number: 102846748/i)).toBeInTheDocument();

    // Click X
    const closeBtn = screen.getByRole("button", { name: "X" });
    fireEvent.click(closeBtn);

    // Verify modal is gone
    expect(screen.queryByText(/Practice Number: 102846748/i)).not.toBeInTheDocument();
  });

  test("Given the modal is open, When the user clicks 'Book Now', Then they are navigated to the clinic page", async () => {
    render(<PatientDashboard />);
    fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

    await waitFor(() => {
      expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    }, { timeout: 1500 });

    fireEvent.click(screen.getByText(/Sandton Health Clinic/i));

    // Click Book Now
    const bookNowBtn = screen.getByRole("button", { name: /Book Now/i });
    fireEvent.click(bookNowBtn);

    // Verify react-router navigation was triggered with the correct ID
    expect(mockNavigate).toHaveBeenCalledWith("/clinics/clinic_123");
  });

});