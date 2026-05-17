import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminDashboard from "./AdminDashboard";

import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from '../../api/useApi';

jest.mock('@auth0/auth0-react');
jest.mock('../../api/useApi');

jest.mock('react-router', () => ({ 
    ...jest.requireActual('react-router'),
    useNavigate: () => jest.fn(),
}));

window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe("Admin Dashboard - Component and Feature Tests", () => {
    const mockLogout = jest.fn();
    let mockApi;

    const mockClinics = [
        {
            _id: 'clinic_001',
            practiceName: 'Sandton Medical Centre',
            practiceTypeDescription: 'General Practice',
            physicalAddress: '1 Sandton Drive',
            physicalSuburb: 'Sandton',
            physicalTown: 'Johannesburg',
            practiceNumber: '123456789',
            contactNumber: '0118001234',
            practiceTimes: { open: '08:00', close: '17:00' },
            services: ['Dentistry', 'Cardiology'],
        },
        {
            _id: 'clinic_002',
            practiceName: 'Rosebank Clinic',
            practiceTypeDescription: 'Specialist Practice',
            physicalAddress: '5 Oxford Road',
            physicalSuburb: 'Rosebank',
            physicalTown: 'Johannesburg',
            practiceNumber: '987654321',
            contactNumber: '0118005678',
            practiceTimes: { open: '09:00', close: '18:00' },
            services: ['Dermatology'],
        },
    ];

    const mockStaff = [
        {
            _id: 'staff_001',
            title: 'Dr.',
            name: 'Jane',
            surname: 'Smith',
            speciality: 'Dentistry',
            auth0Id: 'auth0|staff_001',
        },
        {
            _id: 'staff_002',
            title: 'Dr.',
            name: 'John',
            surname: 'Doe',
            speciality: 'Cardiology',
            auth0Id: 'auth0|staff_002',
        },
    ];

    const mockSpecialities = [
        { _id: 'spec_001', SpecialityName: 'Dentistry' },
        { _id: 'spec_002', SpecialityName: 'Cardiology' },
        { _id: 'spec_003', SpecialityName: 'Dermatology' },
    ];

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();

        if (window.HTMLElement.prototype.scrollIntoView.mockClear) {
            window.HTMLElement.prototype.scrollIntoView.mockClear();
        }

        useAuth0.mockReturnValue({
            user: { sub: 'auth0|admin_001', name: 'Admin User' },
            logout: mockLogout,
            isAuthenticated: true,
            isLoading: false,
        });

        mockApi = {
            clinics: {
                getAssignedClinics: jest.fn().mockResolvedValue(mockClinics),
                listStaff: jest.fn().mockResolvedValue({ users: mockStaff }),
                linkStaff: jest.fn().mockResolvedValue({ message: 'Staff linked successfully' }),
            },
            users: {
              get: jest.fn().mockResolvedValue({ name: 'Admin User' }),
                getByEmail: jest.fn().mockResolvedValue({
                    _id: 'user_new',
                    title: 'Dr.',
                    name: 'Alice',
                    surname: 'Brown',
                    auth0Id: 'auth0|new_staff',
                }),
            },
            schedules: {
                createDefault: jest.fn().mockResolvedValue({ message: 'Schedule created' }),
            },
            specialities: {
                getAll: jest.fn().mockResolvedValue(mockSpecialities),
            },
        };

        useApi.mockReturnValue(mockApi);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

   const renderDashboard = async () => {
    render(<AdminDashboard />);
    await waitFor(() => {
        expect(screen.getByText(/Welcome Back, Admin User!/i)).toBeInTheDocument();
        expect(screen.getByText(/Sandton Medical Centre/i)).toBeInTheDocument();
    });
};


    test("Given the dashboard loads, Then the header with brand name is displayed", async () => {
        await renderDashboard();
        expect(screen.getByText(/Clinics and Qs/i)).toBeInTheDocument();
    });

    test("Given the dashboard loads, Then the logout button is visible", async () => {
        await renderDashboard();
        expect(screen.getByRole("button", { name: /Logout/i })).toBeInTheDocument();
    });

    test("Given the user is logged in, Then they see a personalized welcome message", async () => {
        await renderDashboard();
        expect(screen.getByText(/Welcome Back, Admin User!/i)).toBeInTheDocument();
    });

    test("Given the dashboard loads, Then the notifications card is shown", async () => {
        await renderDashboard();
        expect(screen.getByRole('heading', { name: /^Notifications$/i })).toBeInTheDocument();
        expect(screen.getByText(/3 New Notifications/i)).toBeInTheDocument();
    });

    

    test("Given the user clicks Logout, Then auth0Logout is called with correct params", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Logout/i }));
        expect(mockLogout).toHaveBeenCalledWith({
            logoutParams: { returnTo: window.location.origin },
        });
    });

    

    test("Given auth0 is still loading, Then a loading message is shown", () => {
        useAuth0.mockReturnValue({
            user: null,
            logout: mockLogout,
            isAuthenticated: false,
            isLoading: true,
        });
        render(<AdminDashboard />);
        expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();
    });

    test("Given no clinics are assigned, Then a fallback message is shown", async () => {
        mockApi.clinics.getAssignedClinics.mockResolvedValue([]);
        render(<AdminDashboard />);
        await waitFor(() => {
            expect(screen.getByText(/You are not assigned to any clinics yet/i)).toBeInTheDocument();
    });

});   

    test("Given the dashboard loads, Then it fetches assigned clinics using the admin's auth0 ID", async () => {
        await renderDashboard();
        expect(mockApi.clinics.getAssignedClinics).toHaveBeenCalledWith('auth0|admin_001');
    });

    test("Given clinics are fetched, Then clinic cards are rendered in the selection list", async () => {
        await renderDashboard();
        expect(screen.getByText(/Sandton Medical Centre/i)).toBeInTheDocument();
        expect(screen.getByText(/Rosebank Clinic/i)).toBeInTheDocument();
    });

    test("Given clinics are fetched, Then the first clinic is selected by default", async () => {
        await renderDashboard();
        
        const clinicCard = screen.getByRole("button", { name: /Sandton Medical Centre/i });
        expect(clinicCard).toHaveClass('active');
    });

    test("Given the user clicks a different clinic card, Then that clinic becomes active", async () => {
        await renderDashboard();
        const secondClinicCard = screen.getByText(/Rosebank Clinic/i).closest('li');
        fireEvent.click(secondClinicCard);
        expect(secondClinicCard).toHaveClass('active');
    });

    test("Given the clinic fetch fails, Then an error is logged", async () => {
        mockApi.clinics.getAssignedClinics.mockRejectedValue(new Error("Network error"));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        render(<AdminDashboard />);
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
                'Error fetching assigned clinics:',
                expect.any(Error)
            );
        });
        consoleSpy.mockRestore();
    });

    

    test("Given a clinic is selected, Then staff are fetched for that clinic", async () => {
        await renderDashboard();
        expect(mockApi.clinics.listStaff).toHaveBeenCalledWith('clinic_001');
    });

    test("Given the staff fetch fails, Then an error is logged", async () => {
        mockApi.clinics.listStaff.mockRejectedValue(new Error("Staff fetch error"));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        render(<AdminDashboard />);
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
                'Error fetching staff:',
                expect.any(Error)
            );
        });
        consoleSpy.mockRestore();
    });


    test("Given the dashboard loads, Then all four action buttons are visible", async () => {
        await renderDashboard();
        expect(screen.getByRole("button", { name: /Manage Clinic/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Manage Staff/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Add Staff/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /View Stats/i })).toBeInTheDocument();
    });

    

    test("Given the user clicks 'Manage Clinic', Then the clinic details section is shown", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Manage Clinic/i }));
        
        expect(screen.getByText(/Practice Type:/i)).toBeInTheDocument();
        
        expect(screen.getAllByText(/General Practice/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/123456789/i)).toBeInTheDocument();
        expect(screen.getByText(/Dentistry, Cardiology/i)).toBeInTheDocument();
    });

    test("Given the clinic detail section is open, Then the clinic's open and close times are shown", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Manage Clinic/i }));
        expect(screen.getByText(/08:00 - 17:00/i)).toBeInTheDocument();
    });

    test("Given the clinic detail section is open, Then the address is displayed", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Manage Clinic/i }));
        
        expect(screen.getByText((content, element) =>
            element?.tagName === 'P' && /Address:/.test(content) && /1 Sandton Drive/.test(content)
        )).toBeInTheDocument();
        expect(screen.getByText(/Johannesburg/i)).toBeInTheDocument();
    });

    test("Given the user clicks 'Manage Clinic' again, Then the section collapses", async () => {
        await renderDashboard();
        const btn = screen.getByRole("button", { name: /Manage Clinic/i });
        fireEvent.click(btn);
        expect(screen.getByText(/Practice Type:/i)).toBeInTheDocument();
        fireEvent.click(btn);
        expect(screen.queryByText(/Practice Type:/i)).not.toBeInTheDocument();
    });

    test("Given the user switches clinics with Manage Clinic open, Then the active section resets", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Manage Clinic/i }));
        expect(screen.getByText(/Practice Type:/i)).toBeInTheDocument();

        const secondClinicCard = screen.getByText(/Rosebank Clinic/i).closest('li');
        fireEvent.click(secondClinicCard);

        expect(screen.queryByText(/Practice Type:/i)).not.toBeInTheDocument();
    });



    test("Given the user clicks 'Manage Staff', Then the staff list is shown", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Manage Staff/i }));
        await waitFor(() => {
            expect(screen.getByText(/Dr. Jane Smith/i)).toBeInTheDocument();
            expect(screen.getByText(/Dr. John Doe/i)).toBeInTheDocument();
        });
    });

    test("Given the staff list is shown, Then each staff card has action buttons", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Manage Staff/i }));
        await waitFor(() => {
            const addSpecButtons = screen.getAllByRole("button", { name: /Add Speciality/i });
            const removeSpecButtons = screen.getAllByRole("button", { name: /Remove Speciality/i });
            const fireButtons = screen.getAllByRole("button", { name: /Fire/i });
            expect(addSpecButtons).toHaveLength(2);
            expect(removeSpecButtons).toHaveLength(2);
            expect(fireButtons).toHaveLength(2);
        });
    });

    test("Given there are no staff, Then a 'No staff found' message is shown", async () => {
        mockApi.clinics.listStaff.mockResolvedValue({ users: [] });
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Manage Staff/i }));
        await waitFor(() => {
            expect(screen.getByText(/No staff found/i)).toBeInTheDocument();
        });
    });

    test("Given the user switches clinics, Then the staff list is re-fetched for the new clinic", async () => {
        await renderDashboard();

        const secondClinicCard = screen.getByText(/Rosebank Clinic/i).closest('li');
        fireEvent.click(secondClinicCard);

        await waitFor(() => {
            expect(mockApi.clinics.listStaff).toHaveBeenCalledWith('clinic_002');
        });
    });



    test("Given the user clicks 'Add Staff', Then the add-staff form is shown", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Add Staff/i }));
        await waitFor(() => {
            expect(screen.getByPlaceholderText(/staff@example.com/i)).toBeInTheDocument();
        });
    });

    test("Given the add-staff section opens, Then specialities are fetched", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Add Staff/i }));
        await waitFor(() => {
            expect(mockApi.specialities.getAll).toHaveBeenCalled();
        });
    });

    test("Given the specialities fetch fails, Then an error is logged", async () => {
        mockApi.specialities.getAll.mockRejectedValue(new Error("Spec error"));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Add Staff/i }));
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
        consoleSpy.mockRestore();
    });

    test("Given the user types an email, Then the staff search is debounced and the API is called", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Add Staff/i }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/staff@example.com/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'alice@clinic.com' },
        });

        act(() => { jest.runAllTimers(); });

        await waitFor(() => {
            expect(mockApi.users.getByEmail).toHaveBeenCalledWith('alice@clinic.com', 'Staff');
        });
    });

    test("Given a valid staff email is entered, Then the found staff member's name is shown", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Add Staff/i }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/staff@example.com/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'alice@clinic.com' },
        });

        act(() => { jest.runAllTimers(); });

        await waitFor(() => {
            expect(screen.getByText(/Found: Dr. Alice Brown/i)).toBeInTheDocument();
        });
    });

    test("Given a valid staff email is entered, Then the tick indicator is shown", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Add Staff/i }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/staff@example.com/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'alice@clinic.com' },
        });

        act(() => { jest.runAllTimers(); });

        await waitFor(() => {
            expect(screen.getByLabelText(/Staff found and available/i)).toBeInTheDocument();
        });
    });

    test("Given no staff account matches the email, Then a 'No staff account found' message is shown", async () => {
        mockApi.users.getByEmail.mockResolvedValue(null);

        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Add Staff/i }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/staff@example.com/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'notfound@clinic.com' },
        });

        act(() => { jest.runAllTimers(); });

        await waitFor(() => {
            expect(screen.getByText(/No staff account found with that email/i)).toBeInTheDocument();
        });
    });

    test("Given no staff account matches the email, Then the cross indicator is shown", async () => {
        mockApi.users.getByEmail.mockResolvedValue(null);

        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Add Staff/i }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/staff@example.com/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'notfound@clinic.com' },
        });

        act(() => { jest.runAllTimers(); });

        await waitFor(() => {
            expect(screen.getByLabelText(/Not found or already linked/i)).toBeInTheDocument();
        });
    });

    test("Given the email search errors, Then an error is logged and no result is shown", async () => {
        mockApi.users.getByEmail.mockRejectedValue(new Error("Search error"));

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Add Staff/i }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/staff@example.com/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'error@clinic.com' },
        });

        act(() => { jest.runAllTimers(); });

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Staff email check error:', expect.any(Error));
        });

        expect(screen.queryByText(/Found:/i)).not.toBeInTheDocument();
        consoleSpy.mockRestore();
    });

    test("Given a staff member is found, Then the speciality dropdown is shown", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Add Staff/i }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/staff@example.com/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'alice@clinic.com' },
        });

        act(() => { jest.runAllTimers(); });

        await waitFor(() => {
            expect(screen.getByRole('combobox', { name: /Speciality/i })).toBeInTheDocument();
        });
    });

    test("Given a staff member is found but no speciality is selected, Then the Add Staff button is disabled", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Add Staff/i }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/staff@example.com/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'alice@clinic.com' },
        });

        act(() => { jest.runAllTimers(); });

        await waitFor(() => {
           
            expect(screen.getByRole('button', { name: /Submit add staff/i })).toBeDisabled();
        });
    });

    test("Given a staff member and speciality are selected, Then clicking 'Add Staff' calls linkStaff and createDefault", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Add Staff/i }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/staff@example.com/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'alice@clinic.com' },
        });

        act(() => { jest.runAllTimers(); });

        await waitFor(() => {
            expect(screen.getByRole('combobox', { name: /Speciality/i })).toBeInTheDocument();
        });

        fireEvent.change(screen.getByRole('combobox', { name: /Speciality/i }), {
            target: { value: 'spec_001' },
        });

        const submitBtn = screen.getByRole("button", { name: /Submit add staff/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockApi.clinics.linkStaff).toHaveBeenCalledWith('clinic_001', {
                auth0Id: 'auth0|new_staff',
            });
            expect(mockApi.schedules.createDefault).toHaveBeenCalledWith(
                'user_new',
                expect.any(Array)
            );
        });
    });

    test("Given 'Add Staff' succeeds, Then the form resets (email cleared)", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Add Staff/i }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/staff@example.com/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'alice@clinic.com' },
        });

        act(() => { jest.runAllTimers(); });

        await waitFor(() => {
            expect(screen.getByRole('combobox', { name: /Speciality/i })).toBeInTheDocument();
        });

        fireEvent.change(screen.getByRole('combobox', { name: /Speciality/i }), {
            target: { value: 'spec_001' },
        });

        fireEvent.click(screen.getByRole("button", { name: /Submit add staff/i }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/staff@example.com/i)).toHaveValue('');
        });
    });

    test("Given 'Add Staff' succeeds, Then the staff list is refreshed", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Add Staff/i }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/staff@example.com/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'alice@clinic.com' },
        });

        act(() => { jest.runAllTimers(); });

        await waitFor(() => {
            expect(screen.getByRole('combobox', { name: /Speciality/i })).toBeInTheDocument();
        });

        fireEvent.change(screen.getByRole('combobox', { name: /Speciality/i }), {
            target: { value: 'spec_001' },
        });

        const callsBefore = mockApi.clinics.listStaff.mock.calls.length;

        fireEvent.click(screen.getByRole("button", { name: /Submit add staff/i }));

        await waitFor(() => {
            expect(mockApi.clinics.listStaff.mock.calls.length).toBeGreaterThan(callsBefore);
        });
    });

    test("Given linkStaff returns 409, Then an alert is shown for already-linked staff", async () => {
        const conflict = new Error("Conflict");
        conflict.status = 409;
        mockApi.clinics.linkStaff.mockRejectedValue(conflict);

        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Add Staff/i }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/staff@example.com/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'alice@clinic.com' },
        });

        act(() => { jest.runAllTimers(); });

        await waitFor(() => {
            expect(screen.getByRole('combobox', { name: /Speciality/i })).toBeInTheDocument();
        });

        fireEvent.change(screen.getByRole('combobox', { name: /Speciality/i }), {
            target: { value: 'spec_001' },
        });

        fireEvent.click(screen.getByRole("button", { name: /Submit add staff/i }));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('This staff member is already linked to a clinic.');
        });

        alertSpy.mockRestore();
    });

    test("Given linkStaff returns a generic error, Then a generic failure alert is shown", async () => {
        mockApi.clinics.linkStaff.mockRejectedValue(new Error("Server error"));

        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Add Staff/i }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/staff@example.com/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'alice@clinic.com' },
        });

        act(() => { jest.runAllTimers(); });

        await waitFor(() => {
            expect(screen.getByRole('combobox', { name: /Speciality/i })).toBeInTheDocument();
        });

        fireEvent.change(screen.getByRole('combobox', { name: /Speciality/i }), {
            target: { value: 'spec_001' },
        });

        fireEvent.click(screen.getByRole("button", { name: /Submit add staff/i }));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Failed to add staff. Please try again.');
        });

        alertSpy.mockRestore();
    });

    

    test("Given the user clicks 'View Stats', Then the stats section is shown", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /View Stats/i }));
        expect(screen.getByText(/Clinic Stats/i)).toBeInTheDocument();
    });

    test("Given the stats section is open, Then the three stat navigation buttons are shown", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /View Stats/i }));
        expect(screen.getByRole("button", { name: /Staff.*Off Days/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Appointments/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Queue.*Waits/i })).toBeInTheDocument();
    });



    test("Given the user clicks an action button, Then the content area scrolls into view", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Manage Clinic/i }));

        act(() => { jest.runAllTimers(); });

        await waitFor(() => {
            expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
                behavior: 'smooth',
                block: 'start',
            });
        });
    });

    test("Given one section is open and the user clicks a different action button, Then only the new section is shown", async () => {
        await renderDashboard();
        fireEvent.click(screen.getByRole("button", { name: /Manage Clinic/i }));
        expect(screen.getByText(/Practice Type:/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /View Stats/i }));
        expect(screen.queryByText(/Practice Type:/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Clinic Stats/i)).toBeInTheDocument();
    });
});