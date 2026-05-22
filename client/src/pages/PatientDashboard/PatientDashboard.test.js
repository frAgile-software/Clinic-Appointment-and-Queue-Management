import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import PatientDashboard from "./PatientDashboard";

import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from '../../api/useApi';

jest.mock('@auth0/auth0-react');
jest.mock('../../api/useApi');
const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe("Patient Dashboard - Component and Feature Tests", () => {
  const mockLogout = jest.fn();
  let mockApi;

  const safeFutureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  beforeEach(() => {
    jest.spyOn(global, 'setInterval').mockImplementation(() => 999);
    jest.spyOn(global, 'clearInterval').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    
    if (window.HTMLElement.prototype.scrollIntoView.mockClear) {
        window.HTMLElement.prototype.scrollIntoView.mockClear();
    }

    useAuth0.mockReturnValue({
      user: { sub: "auth0|12345" },
      logout: mockLogout,
    });

    mockApi = {
      users: {
        get: jest.fn().mockResolvedValue({ name: "John Doe", surname: "Smith" }),
      },
      appointments: {
        getForAuth0Id: jest.fn().mockResolvedValue([
          {
            _id: 'app_1',
            Status: 'Waiting',
            Clinic: { _id: 'clinic_123', practiceName: 'Test Clinic', physicalAddress: '1 Test Rd', physicalTown: 'Testville' },
            Staff: { name: 'Dr.', surname: 'Smith' },
            Speciality: { name: 'Dentistry' },
            BookingDateTime: safeFutureDate,
          },
        ]),
        cancel: jest.fn().mockResolvedValue({ message: "Cancelled" }),
      },
      queues: {
        getForPatient: jest.fn().mockResolvedValue({ inQueue: false }),
        addPatient: jest.fn().mockResolvedValue({ message: "Successfully joined queue" }),
        remove: jest.fn().mockResolvedValue({ message: "Removed" }),
      },
      consults: {
        getForAuth0Id: jest.fn().mockResolvedValue([]),
      },
      clinics: {
        getFilters: jest.fn().mockResolvedValue({
          provinces: ['Gauteng'],
          towns: ['Sandton'],
          suburbs: [],
          types: ['General Practice'],
          services: ['Dentistry', 'Cardiology'],
        }),
        filterAll: jest.fn().mockResolvedValue({
          data: [
            {
              _id: 'clinic_123',
              practiceName: 'Sandton Health Clinic',
              practiceTypeDescription: 'General Practice',
              physicalAddress: '1 Sandton Drive',
              physicalTown: 'Sandton',
              isOpen: true,
              practiceNumber: '102846748',
              telephone: '0858761234',
              practiceTimes: { open: '00:00', close: '23:59' },
            },
          ],
          pagination: { page: 1, totalPages: 1, total: 1 },
        }),
      },
    };

    useApi.mockReturnValue(mockApi);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const renderDashboard = async () => {
    render(<PatientDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Welcome Back, John Doe!/i)).toBeInTheDocument();
    });
  };

 test("Given the dashboard loads, Then the top navigation bar is displayed", async () => {
  await renderDashboard();
  
  expect(screen.getByRole("banner")).toBeInTheDocument();
  
  expect(screen.getByText(/Clinics and Qs/i)).toBeInTheDocument(); 
  
  expect(screen.getByRole("navigation", { name: /Header actions/i })).toBeInTheDocument();
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
    mockApi.users.get.mockRejectedValue(new Error("Profile error"));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<PatientDashboard />);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch user profile:", expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  test("Given the component mounts, Then it fetches the user profile using the Auth0 ID", async () => {
    await renderDashboard();
    expect(mockApi.users.get).toHaveBeenCalledWith("auth0|12345");
  });

  test("Given the user clicks logout, Then the Auth0 logout function is triggered", async () => {
    await renderDashboard();
    const logoutBtn = screen.getByRole("button", { name: /Logout/i });
    fireEvent.click(logoutBtn);
    
    expect(mockLogout).toHaveBeenCalledWith({
      logoutParams: { returnTo: window.location.origin }
    });
  });

  test("Given appointments load, Then the dashboard shows the correct appointment count", async () => {
    await renderDashboard();
    expect(screen.getByText(/You have 1 appointment\(s\) upcoming/i)).toBeInTheDocument();
  });

  test("Given the user clicks 'VIEW DETAILS', Then the appointments modal opens showing the data", async () => {
    await renderDashboard();
    const viewDetailsBtn = screen.getByRole("button", { name: /VIEW DETAILS/i });
    
    fireEvent.click(viewDetailsBtn);
    
    expect(screen.getByRole("heading", { name: /Your Appointments/i })).toBeInTheDocument();
    expect(screen.getByText(/Test Clinic/i)).toBeInTheDocument();
    expect(screen.getByText(/Smith/i)).toBeInTheDocument();
  });

  test("Given the appointments modal is open, When user clicks 'Cancel Appointment', Then it shows a confirmation popup and deletes on confirm", async () => {
    await renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: /VIEW DETAILS/i }));
    
    const cancelBtn = screen.getByRole("button", { name: /Cancel Appointment/i });
    fireEvent.click(cancelBtn);

    expect(screen.getByText(/Are you sure you want to cancel this appointment?/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /Yes, Cancel/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockApi.appointments.cancel).toHaveBeenCalledWith("app_1");
    });
  });

  test("Given an appointment is within 24 hours, When user views appointments, Then Cancel and Reschedule buttons are disabled", async () => {
    mockApi.appointments.getForAuth0Id.mockResolvedValue([
      {
        _id: 'app_close',
        Status: 'Waiting',
        Clinic: { practiceName: 'Urgent Clinic' },
        BookingDateTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), 
      },
    ]);

    await renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: /VIEW DETAILS/i }));
    
    const cancelBtn = screen.getByRole("button", { name: /Cancel Appointment/i });
    const rescheduleBtn = screen.getByRole("button", { name: /Reschedule/i });
    
    expect(cancelBtn).toBeDisabled();
    expect(rescheduleBtn).toBeDisabled();
    expect(screen.getByText(/\* Too close to appointment time to modify\./i)).toBeInTheDocument();
  });

  test("Given the appointments modal is open, When user clicks 'Reschedule', Then it navigates to /book with reschedule state", async () => {
    await renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: /VIEW DETAILS/i }));
    
    const rescheduleBtn = screen.getByRole("button", { name: /Reschedule/i });
    fireEvent.click(rescheduleBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/book", expect.objectContaining({
      state: expect.objectContaining({
        clinicId: 'clinic_123',
        rescheduleAppointmentId: 'app_1',
        fromBookNow: true
      })
    }));
  });

  test("Given queue status loads, Then the dashboard updates the queue card", async () => {
    await renderDashboard();
    expect(screen.getByText(/Not currently in a queue/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /JOIN A VIRTUAL QUEUE/i })).toBeInTheDocument();
  });

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
    mockApi.clinics.filterAll.mockRejectedValue(new Error("Network error"));

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
    mockApi.clinics.getFilters.mockRejectedValue(new Error("Network error"));

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
    expect(mockApi.clinics.filterAll).toHaveBeenCalled();
  });

  test("Given no reason is selected, When the user clicks a clinic card, Then an error message is shown and modal does not open", async () => {
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

    expect(screen.getByText(/Please select a reason for your visit before selecting a clinic./i)).toBeInTheDocument();
    expect(screen.queryByText(/Practice Number: 102846748/i)).not.toBeInTheDocument();
  });

  test("Given a reason is selected, When the user clicks on a clinic card, Then the clinic details modal opens", async () => {
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

    let clinicCard;
    await waitFor(() => {
      clinicCard = screen.getByText(/Sandton Health Clinic/i);
    }, { timeout: 1500 });

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
      expect(screen.getByRole('combobox', { name: /Filter by reason for visit/i })).toBeInTheDocument();
      expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox', { name: /Filter by reason for visit/i }), { target: { value: 'Dentistry' } });

    act(() => { jest.runAllTimers(); });

    await waitFor(() => {
      expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Sandton Health Clinic/i));
    
    expect(screen.getByText(/Practice Number: 102846748/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: "X" });
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/Practice Number: 102846748/i)).not.toBeInTheDocument();
  });

  test("Given a reason is selected and the modal is open, When 'Book Now' is clicked, Then they are navigated to /book with clinic and reason state", async () => {
    await renderDashboard();
    
    fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

    act(() => { jest.runAllTimers(); });

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /Filter by reason for visit/i })).toBeInTheDocument();
      expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox', { name: /Filter by reason for visit/i }), { target: { value: 'Dentistry' } });

    act(() => { jest.runAllTimers(); });

    await waitFor(() => {
      expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Sandton Health Clinic/i));
    fireEvent.click(screen.getByRole("button", { name: /Book Now/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/book", {
      state: expect.objectContaining({
        clinicId:    'clinic_123',
        clinicName:  'Sandton Health Clinic',
        fromBookNow: true,
        specialty:   'Dentistry',
      }),
    });
  });

  describe("Queue testing", () => {

    test("Given the queue fetch throws, Then an error is logged", async () => {
      mockApi.queues.getForPatient.mockRejectedValue(new Error("Network error"));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      render(<PatientDashboard />);
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Error fetching queue:", expect.any(Error));
      });
      consoleSpy.mockRestore();
    });

    test("Given the user is not in a queue, Then the queue card shows 'Join a Virtual Queue'", async () => {
      await renderDashboard();
      expect(screen.getByText(/Not currently in a queue/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /JOIN A VIRTUAL QUEUE/i })).toBeInTheDocument();
    });

    test("Given the user is in a queue, Then the queue card shows their position and clinic", async () => {
      mockApi.queues.getForPatient.mockResolvedValue({
        inQueue: true,
        queue: {
          queue: {
            Clinic: { practiceName: 'Sandton Health Clinic' },
            Speciality: { SpecialityName: 'General Checkup' },
          },
          position: 2,
        },
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

      fireEvent.change(
        screen.getByRole('combobox', { name: /Filter by reason for visit/i }),
        { target: { value: 'Dentistry' } }
      );
      await waitFor(() => expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument());

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

      fireEvent.change(
        screen.getByRole('combobox', { name: /Filter by reason for visit/i }),
        { target: { value: 'Dentistry' } }
      );
      await waitFor(() => expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument());

      fireEvent.click(screen.getByText(/Sandton Health Clinic/i));
      fireEvent.click(screen.getByRole("button", { name: /Join Queue/i }));
      fireEvent.click(screen.getByRole("button", { name: /Back/i }));

      expect(screen.getByText(/Practice Number: 102846748/i)).toBeInTheDocument();
    });

    test("Given the queue panel is open, When no service is selected, Then the Confirm button is invisible", async () => {
      await renderDashboard();
      fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /Filter by reason for visit/i })).toBeInTheDocument();
        expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
      });

      fireEvent.change(
        screen.getByRole('combobox', { name: /Filter by reason for visit/i }),
        { target: { value: 'Dentistry' } }
      );
      await waitFor(() => expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument());

      fireEvent.click(screen.getByText(/Sandton Health Clinic/i));
      fireEvent.click(screen.getByRole("button", { name: /Join Queue/i }));

      const allDentistryDropdowns = screen.getAllByDisplayValue('Dentistry');
      const queueServiceSelect = allDentistryDropdowns.find(
        el => !el.hasAttribute('aria-label')
      );

      fireEvent.change(queueServiceSelect, { target: { value: '' } });

      expect(screen.queryByRole("button", { name: /Confirm/i })).not.toBeInTheDocument();
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

      act(() => { jest.runAllTimers(); });

      await waitFor(() => {
        expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Sandton Health Clinic/i));
      fireEvent.click(screen.getByRole("button", { name: /Join Queue/i }));

      const queueServiceDropdown = screen.getAllByRole("combobox")[0];
      expect(queueServiceDropdown.value).toBe('Dentistry');
    });

    test("Given the queue panel, When the user confirms joining, Then addPatient is called with correct args and the queue card updates", async () => {
      let queueJoined = false;

      mockApi.queues.addPatient.mockImplementation(async () => {
        queueJoined = true;
        return { message: "Successfully joined queue" };
      });

      mockApi.queues.getForPatient.mockImplementation(async () => {
        if (queueJoined) {
          return {
            inQueue: true,
            queue: {
              queue: {
                Clinic: { practiceName: 'Sandton Health Clinic' },
                Speciality: { SpecialityName: 'Dentistry' },
              },
              position: 1,
            },
          };
        }
        return { inQueue: false };
      });

      await renderDashboard();
      fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

      act(() => { jest.runAllTimers(); });

      await waitFor(() => {
        expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
      });

      fireEvent.change(
        screen.getByRole('combobox', { name: /Filter by reason for visit/i }),
        { target: { value: 'Dentistry' } }
      );
      await waitFor(() => expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument());

      fireEvent.click(screen.getByText(/Sandton Health Clinic/i));
      fireEvent.click(screen.getByRole("button", { name: /Join Queue/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Join Queue/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Join Queue/i }));

      await waitFor(() => {
        expect(mockApi.queues.addPatient).toHaveBeenCalledWith(
          'clinic_123',
          { auth0Id: 'auth0|12345' },
          'Dentistry'
        );
      });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /LEAVE QUEUE/i })).toBeInTheDocument();
      });
    });

    test("Given joining queue throws, Then an error is logged", async () => {
      mockApi.queues.addPatient.mockRejectedValue(new Error("Network error"));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await renderDashboard();
      fireEvent.click(screen.getByRole("button", { name: /SEARCH CLINIC/i }));

      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /Filter by reason for visit/i })).toBeInTheDocument();
        expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument();
      });

      fireEvent.change(
        screen.getByRole('combobox', { name: /Filter by reason for visit/i }),
        { target: { value: 'Dentistry' } }
      );
      await waitFor(() => expect(screen.getByText(/Sandton Health Clinic/i)).toBeInTheDocument());

      fireEvent.click(screen.getByText(/Sandton Health Clinic/i));
      fireEvent.click(screen.getByRole("button", { name: /Join Queue/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Join Queue/i })).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole("button", { name: /Join Queue/i }));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Failed to join queue:", expect.any(Error));
      });
      consoleSpy.mockRestore();
    });
  });
});