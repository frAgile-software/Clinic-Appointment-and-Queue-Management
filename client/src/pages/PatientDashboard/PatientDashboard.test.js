import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
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
    jest.useFakeTimers();
    jest.clearAllMocks();
    
    // Explicitly clear the manual prototype mock to prevent test bleed in CI
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
            provinces: ['Gauteng'], 
            towns: ['Sandton'], 
            suburbs: [], 
            types: ['General Practice'],
            services: ['Dentistry', 'Cardiology'] // Mock services list
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
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // HELPER: Renders the dashboard and waits for the initial profile fetch to prevent act() warnings
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

  test("Given the user profile fetch fails, Then an error is logged", async () => {
    mockApiFetch.mockImplementation(async (url) => {
      if (url.includes('/api/users/')) {
        return { ok: false, json: async () => ({}) };
      }
      if (url.includes('/api/queues/patient/')) {
        return { ok: true, json: async () => ({ inQueue: false }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<PatientDashboard />);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch user profile.");
    });
    consoleSpy.mockRestore();
  });

  test("Given the user profile fetch throws, Then a network error is logged", async () => {
    mockApiFetch.mockImplementation(async (url) => {
      if (url.includes('/api/users/')) throw new Error("Network error");
      if (url.includes('/api/queues/patient/')) {
        return { ok: true, json: async () => ({ inQueue: false }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<PatientDashboard />);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Network error fetching user:", expect.any(Error));
    });
    consoleSpy.mockRestore();
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

    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
        expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    });
  });

  test("Given the clinics fetch fails, Then clinics list is empty and error is logged", async () => {
    global.fetch = jest.fn((url) => {
      if (url.includes('/clinics/filters')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ provinces: [], towns: [], suburbs: [], types: [], services: [] })
        });
      }
      if (url.includes('/clinics')) throw new Error("Network error");
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Could not search clinics:', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  test("Given the filter options fetch fails, Then an error is logged", async () => {
    global.fetch = jest.fn((url) => {
      if (url.includes('/clinics/filters')) throw new Error("Network error");
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [], pagination: {} })
      });
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Couldn't fetch filter options:", expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  test("Given the user clicks 'BOOK AN APPOINTMENT', Then the search bar is revealed and it scrolls", async () => {
    await renderDashboard();
    const bookApptBtn = screen.getByRole("button", { name: /BOOK AN APPOINTMENT/i });
    
    fireEvent.click(bookApptBtn);
    
    expect(screen.getByPlaceholderText(/Clinic name/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });

    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
        expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    });
  });

  test("Given the search card is expanded, Then it fetches and displays clinics from the API", async () => {
    await renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    }); 
    
    expect(screen.getByText(/1 Sandton Drive, Sandton/i)).toBeInTheDocument();
    expect(screen.getByText(/Open now/i)).toBeInTheDocument();
  });

  // --- MODAL (POPUP) TESTS ---

  test("Given the user clicks on a clinic card, Then the clinic details modal opens", async () => {
    await renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

    let clinicCard;

    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      clinicCard = screen.getByText(/Sandton Health Clinic/i);
    });

    fireEvent.click(clinicCard);

    expect(screen.getByText(/Practice Number: 102846748/i)).toBeInTheDocument();
  });

  test("Given the modal is open, When the user clicks the 'X' button, Then the modal closes", async () => {
    await renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Sandton Health Clinic/i));
    
    expect(screen.getByText(/Practice Number: 102846748/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: "X" });
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/Practice Number: 102846748/i)).not.toBeInTheDocument();
  });

  test("Given the modal is open, When the user clicks 'Book Now', Then they are navigated to the clinic page", async () => {
    await renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Sandton Health Clinic/i));

    const bookNowBtn = screen.getByRole("button", { name: /Book Now/i });
    fireEvent.click(bookNowBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/clinics/clinic_123");
  });

  test("Given a reason is selected and the modal is open, When 'Book Now' is clicked, Then the reason is passed in the URL", async () => {
    await renderDashboard();
    
    // 1. Open the search menu
    fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

    // 2. Wait for the initial clinic list to populate
    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /Filter by reason for visit/i })).toBeInTheDocument();
      expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    });

    // 3. Change the dropdown. This triggers the 400ms debounce timer to fetch new clinics.
    fireEvent.change(screen.getByRole('combobox', { name: /Filter by reason for visit/i }), { target: { value: 'Dentistry' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("service=Dentistry"));
    });

    // 5. Safely click the clinic and complete the navigation
    fireEvent.click(screen.getByText(/Sandton Health Clinic/i));

    const bookNowBtn = screen.getByRole("button", { name: /Book Now/i });
    fireEvent.click(bookNowBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/clinics/clinic_123?reason=Dentistry");
  });

  describe("Queue testing", () => {

    test("Given the queue fetch throws, Then a network error is logged", async () => {
      mockApiFetch.mockImplementation(async (url) => {
        if (url.includes('/api/users/')) {
          return { ok: true, json: async () => ({ name: "John Doe" }) };
        }
        if (url.includes('/api/queues/patient/')) throw new Error("Network error");
        return { ok: true, json: async () => ({}) };
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      render(<PatientDashboard />);
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Network error fetching queue:", expect.any(Error));
      });
      consoleSpy.mockRestore();
    });

    test("Given the user is not in a queue, Then the queue card shows 'Join a Virtual Queue'", async () => {
      mockApiFetch.mockImplementation((url) => {
        if (url.includes('/api/queues/patient/')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ inQueue: false }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ name: "John Doe" }),
        });
      });

      await renderDashboard();
      expect(screen.getByText(/Not currently in a queue/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /JOIN A VIRTUAL QUEUE/i })).toBeInTheDocument();
    });

    test("Given the user is in a queue, Then the queue card shows their position and clinic", async () => {
      mockApiFetch.mockImplementation((url) => {
        if (url.includes('/api/queues/patient/')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              inQueue: true,
              queue: {
                queue: {
                  Clinic: { practiceName: 'Sandton Health Clinic' },
                  Speciality: { SpecialityName: 'General Checkup' },
                },
                position: 2,
              },
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ name: "John Doe" }),
        });
      });

      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
        expect(screen.getByText(/General Checkup/i)).toBeInTheDocument();
        expect(screen.getByText(/2/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /LEAVE QUEUE/i })).toBeInTheDocument();
      });
    });

    test("Given the modal is open, When the user clicks 'Join Queue', Then the queue panel is shown", async () => {
      await renderDashboard();
      fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Sandton Health Clinic/i));
      fireEvent.click(screen.getByRole("button", { name: /Join Queue/i }));

      expect(screen.getByText(/Join Queue at/i)).toBeInTheDocument();
      expect(screen.getByText(/Select a service/i)).toBeInTheDocument();
    });

    test("Given the queue panel is open, When the user clicks 'Back', Then the clinic details are shown again", async () => {
      await renderDashboard();
      fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Sandton Health Clinic/i));
      fireEvent.click(screen.getByRole("button", { name: /Join Queue/i }));
      fireEvent.click(screen.getByRole("button", { name: /Back/i }));

      expect(screen.getByText(/Practice Number: 102846748/i)).toBeInTheDocument();
    });

    test("Given the queue panel is open, When no service is selected, Then the Confirm button is disabled", async () => {
      await renderDashboard();
      fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Sandton Health Clinic/i));
      fireEvent.click(screen.getByRole("button", { name: /Join Queue/i }));

      expect(screen.getByRole("button", { name: /Confirm/i })).toBeDisabled();
    });

    test("Given the queue panel is open with a pre-selected service, Then the dropdown is pre-filled", async () => {
      await renderDashboard();
      fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /Filter by reason for visit/i })).toBeInTheDocument();
        expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByRole('combobox', { name: /Filter by reason for visit/i }), { target: { value: 'Dentistry' } });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("service=Dentistry"));
      });

      fireEvent.click(screen.getByText(/Sandton Health Clinic/i));
      fireEvent.click(screen.getByRole("button", { name: /Join Queue/i }));

      const queueServiceDropdown = screen.getAllByRole("combobox")[0];
      expect(queueServiceDropdown.value).toBe('Dentistry');
    });

    test("Given the queue panel, When the user confirms joining, Then the queue card updates", async () => {
      let queueJoined = false;

      mockApiFetch.mockImplementation(async (url, options) => {
        if (url.includes('/api/users/')) {
          return { ok: true, json: async () => ({ name: "John Doe" }) };
        }
        if (url.includes('/api/queues/patient/')) {
          return {
            ok: true,
            json: async () => queueJoined
              ? {
                  inQueue: true,
                  queue: {
                    queue: {
                      Clinic: { practiceName: 'Sandton Health Clinic' },
                      Speciality: { SpecialityName: 'Dentistry' },
                    },
                    position: 1,
                  },
                }
              : { inQueue: false },
          };
        }
        if (url.includes('/api/queues/') && options?.method === 'POST') {
          queueJoined = true;
          return { ok: true, json: async () => ({ message: "Successfully joined queue" }) };
        }
        return { ok: true, json: async () => ({}) };
      });

      await renderDashboard();
      fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Sandton Health Clinic/i));
      fireEvent.click(screen.getByRole("button", { name: /Join Queue/i }));

      const queueServiceSelect = screen.getByDisplayValue('Select a service');
      fireEvent.change(queueServiceSelect, { target: { value: 'Dentistry' } });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Confirm/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole("button", { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /LEAVE QUEUE/i })).toBeInTheDocument();
      });
    });

    test("Given joining queue fails, Then the modal stays open", async () => {
      mockApiFetch.mockImplementation(async (url, options) => {
        if (url.includes('/api/users/')) return { ok: true, json: async () => ({ name: "John Doe" }) };
        if (url.includes('/api/queues/patient/')) return { ok: true, json: async () => ({ inQueue: false }) };
        if (url.includes('/api/queues/') && options?.method === 'POST') return { ok: false, json: async () => ({ message: "Error" }) };
        return { ok: true, json: async () => ({}) };
      });

      await renderDashboard();
      fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Sandton Health Clinic/i));
      fireEvent.click(screen.getByRole("button", { name: /Join Queue/i }));

      const queueServiceSelect = screen.getByDisplayValue('Select a service');
      fireEvent.change(queueServiceSelect, { target: { value: 'Dentistry' } });
      fireEvent.click(screen.getByRole("button", { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText(/Join Queue at/i)).toBeInTheDocument();
      });
    });

    test("Given joining queue throws, Then an error is logged", async () => {
      mockApiFetch.mockImplementation(async (url, options) => {
        if (url.includes('/api/users/')) return { ok: true, json: async () => ({ name: "John Doe" }) };
        if (url.includes('/api/queues/patient/')) return { ok: true, json: async () => ({ inQueue: false }) };
        if (url.includes('/api/queues/') && options?.method === 'POST') throw new Error("Network error");
        return { ok: true, json: async () => ({}) };
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await renderDashboard();
      fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Sandton Health Clinic/i));
      fireEvent.click(screen.getByRole("button", { name: /Join Queue/i }));

      const queueServiceSelect = screen.getByDisplayValue('Select a service');
      fireEvent.change(queueServiceSelect, { target: { value: 'Dentistry' } });
      fireEvent.click(screen.getByRole("button", { name: /Confirm/i }));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Failed to join queue:", expect.any(Error));
      });
      consoleSpy.mockRestore();
    });
  });
});