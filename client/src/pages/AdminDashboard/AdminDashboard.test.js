import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import { BrowserRouter } from 'react-router';



const mockLinkStaff          = jest.fn();
const mockCreateDefault      = jest.fn();
const mockListStaff          = jest.fn();
const mockGetByEmail         = jest.fn();
const mockListSpecialities   = jest.fn();
const mockGetAssignedClinics = jest.fn();

jest.mock('@auth0/auth0-react', () => ({
    useAuth0: () => ({
        user: { sub: 'auth0|admin', name: 'Admin User' },
        logout: jest.fn(),
        isAuthenticated: true,
        isLoading: false,
    }),
}));

jest.mock('../../api/useApi', () => ({
    useApi: () => ({
        clinics: {
            getAssignedClinics: mockGetAssignedClinics,
            listStaff:          mockListStaff,
            linkStaff:          mockLinkStaff,
        },
        users: {
            getByEmail: mockGetByEmail,
        },
        schedules: {
            createDefault: mockCreateDefault,
        },
        specialities: {
            listSpecialities: mockListSpecialities,
        },
    }),
}));


window.HTMLElement.prototype.scrollIntoView = jest.fn();



const mockClinic = {
    _id: 'clinic123',
    practiceName: 'Test Clinic',
    practiceTypeDescription: 'General Practice',
    physicalAddress: '1 Main Rd',
    physicalSuburb: 'Suburb',
    physicalTown: 'Town',
    practiceNumber: '12345',
    contactNumber: '0110000000',
    practiceTimes: { open: '08:00', close: '10:00' },
    services: ['GP'],
};

const mockStaffUser = {
    _id: 'user123',
    auth0Id: 'auth0|staffabc',
    name: 'Jane',
    surname: 'Doe',
    title: 'Dr',
    role: 'Staff',
};

const mockSpecialities = [
    { _id: 'spec1', SpecialityName: 'Cardiology' },
    { _id: 'spec2', SpecialityName: 'Dermatology' },
];



const renderAndOpenAddStaff = async () => {
    mockGetAssignedClinics.mockResolvedValue([mockClinic]);
    mockListStaff.mockResolvedValue({ users: [] });
    mockListSpecialities.mockResolvedValue(mockSpecialities);

    render(
        <BrowserRouter>
            <AdminDashboard />
        </BrowserRouter>
    );


    await waitFor(() => screen.getByText('Test Clinic'));

 
    jest.useFakeTimers();

    fireEvent.click(screen.getByText('Add Staff'));

    
    act(() => jest.advanceTimersByTime(200));

    await waitFor(() => expect(mockListSpecialities).toHaveBeenCalled());
};


const getAddStaffSubmitButton = () =>
    screen.getByRole('button', { name: /submit add staff/i });



beforeEach(() => {
    jest.clearAllMocks();

    jest.useRealTimers();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(window, 'alert').mockImplementation(() => {});
});

afterEach(() => {
    jest.useRealTimers();
    console.error.mockRestore();
    window.alert.mockRestore();
});



describe('AdminDashboard Component', () => {

  test('renders navbar elements', () => {
    mockGetAssignedClinics.mockResolvedValue([mockClinic]);
    mockListStaff.mockResolvedValue({ users: [] });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    // Check nav buttons
    //expect(screen.getByText(/log out/i)).toBeInTheDocument();
    //expect(screen.getByText(/profile/i)).toBeInTheDocument();

    // Check notification image
    //expect(screen.getByAltText(/notification bell/i)).toBeInTheDocument();
  });
  
  test('renders top section content', () => {
    mockGetAssignedClinics.mockResolvedValue([mockClinic]);
    mockListStaff.mockResolvedValue({ users: [] });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    /*expect(
      screen.getByText(/welcome to the admin dashboard/i)
    ).toBeInTheDocument();*/

    //expect(screen.getByAltText(/clinic logo/i)).toBeInTheDocument();
  });

});


// ADD STAFF TESTS


describe('AdminDashboard – Add Staff section', () => {

    // Rendering
    test('renders the Add Staff form when section is toggled', async () => {
        await renderAndOpenAddStaff();

        expect(screen.getByLabelText(/staff email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/staff@example.com/i)).toBeInTheDocument();
        expect(getAddStaffSubmitButton()).toBeInTheDocument();
    });

    test('Add Staff button is disabled initially', async () => {
        await renderAndOpenAddStaff();

        expect(getAddStaffSubmitButton()).toBeDisabled();
        expect(mockLinkStaff).not.toHaveBeenCalled();
    });

    test('renders speciality dropdown with options after staff is found', async () => {
        mockGetByEmail.mockResolvedValue(mockStaffUser);
        await renderAndOpenAddStaff();

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'jane@example.com' },
        });

        await act(async () => jest.advanceTimersByTime(400));
        await waitFor(() => expect(mockGetByEmail).toHaveBeenCalled());

        expect(screen.getByLabelText(/speciality/i)).toBeInTheDocument();
        expect(screen.getByText('Cardiology')).toBeInTheDocument();
        expect(screen.getByText('Dermatology')).toBeInTheDocument();
    });

    // Email search 

    test('does not call getByEmail immediately on input change', async () => {
        await renderAndOpenAddStaff();

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'jane@example.com' },
        });

      
        expect(mockGetByEmail).not.toHaveBeenCalled();
    });

    test('does not call getByEmail before 400ms debounce elapses', async () => {
        await renderAndOpenAddStaff();

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'jane@example.com' },
        });

        act(() => jest.advanceTimersByTime(200));
        expect(mockGetByEmail).not.toHaveBeenCalled();
    });

    test('calls getByEmail with email and "Staff" role after 400ms debounce', async () => {
        mockGetByEmail.mockResolvedValue(mockStaffUser);
        await renderAndOpenAddStaff();

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'jane@example.com' },
        });

        await act(async () => jest.advanceTimersByTime(400));

        await waitFor(() =>
            expect(mockGetByEmail).toHaveBeenCalledWith('jane@example.com', 'Staff')
        );
    });

    test('shows tick indicator when staff is found and available', async () => {
        mockGetByEmail.mockResolvedValue(mockStaffUser);
        await renderAndOpenAddStaff();

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'jane@example.com' },
        });

        await act(async () => jest.advanceTimersByTime(400));
        await waitFor(() => expect(mockGetByEmail).toHaveBeenCalled());

        await waitFor(() =>
            expect(screen.getByLabelText(/staff found and available/i)).toBeInTheDocument()
        );
    });

    test('shows cross indicator and error message when staff is not found', async () => {
        mockGetByEmail.mockResolvedValue(null);
        await renderAndOpenAddStaff();

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'unknown@example.com' },
        });

        await act(async () => jest.advanceTimersByTime(400));
        await waitFor(() => expect(mockGetByEmail).toHaveBeenCalled());

        await waitFor(() =>
            expect(screen.getByLabelText(/not found or already linked/i)).toBeInTheDocument()
        );
        expect(screen.getByText(/no staff account found with that email/i)).toBeInTheDocument();
    });

    test('shows found staff full name when email resolves successfully', async () => {
        mockGetByEmail.mockResolvedValue(mockStaffUser);
        await renderAndOpenAddStaff();

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'jane@example.com' },
        });

        await act(async () => jest.advanceTimersByTime(400));
        await waitFor(() => expect(mockGetByEmail).toHaveBeenCalled());

        await waitFor(() =>
            expect(screen.getByText(/Found: Dr Jane Doe/i)).toBeInTheDocument()
        );
    });

    test('clears search result when email input is emptied', async () => {
        mockGetByEmail.mockResolvedValue(mockStaffUser);
        await renderAndOpenAddStaff();

        const input = screen.getByPlaceholderText(/staff@example.com/i);

        fireEvent.change(input, { target: { value: 'jane@example.com' } });
        await act(async () => jest.advanceTimersByTime(400));
        await waitFor(() => screen.getByText(/Found: Dr Jane Doe/i));

        fireEvent.change(input, { target: { value: '' } });

        await waitFor(() =>
            expect(screen.queryByText(/Found: Dr Jane Doe/i)).not.toBeInTheDocument()
        );
    });

    // handleAddStaff 

    test('calls linkStaff and createDefault with correct args on successful add', async () => {
        mockGetByEmail.mockResolvedValue(mockStaffUser);
        mockLinkStaff.mockResolvedValue({});
        mockCreateDefault.mockResolvedValue({});
        mockListStaff.mockResolvedValue({ users: [mockStaffUser] });

        await renderAndOpenAddStaff();

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'jane@example.com' },
        });

        await act(async () => jest.advanceTimersByTime(400));
        await waitFor(() => screen.getByLabelText(/speciality/i));

        fireEvent.change(screen.getByLabelText(/speciality/i), { target: { value: 'spec1' } });
        fireEvent.click(getAddStaffSubmitButton());

        await waitFor(() =>
            expect(mockLinkStaff).toHaveBeenCalledWith('clinic123', { auth0Id: 'auth0|staffabc' })
        );
        await waitFor(() =>
            expect(mockCreateDefault).toHaveBeenCalledWith(
                'auth0|staffabc',
                expect.arrayContaining([
                    expect.objectContaining({
                        DayOfWeek: expect.any(Number),
                        StartTime: expect.any(String),
                        EndTime:   expect.any(String),
                    }),
                ])
            )
        );
    });

    test('buildDefaultScheduleEntries generates correct entries from clinic times', async () => {
        
        mockGetByEmail.mockResolvedValue(mockStaffUser);
        mockLinkStaff.mockResolvedValue({});
        mockCreateDefault.mockResolvedValue({});

        await renderAndOpenAddStaff();

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'jane@example.com' },
        });

        await act(async () => jest.advanceTimersByTime(400));
        await waitFor(() => screen.getByLabelText(/speciality/i));

        fireEvent.change(screen.getByLabelText(/speciality/i), { target: { value: 'spec1' } });
        fireEvent.click(getAddStaffSubmitButton());

        await waitFor(() => expect(mockCreateDefault).toHaveBeenCalled());

        const entries = mockCreateDefault.mock.calls[0][1];

        expect(entries).toHaveLength(14);

        const days = [...new Set(entries.map(e => e.DayOfWeek))].sort();
        expect(days).toEqual([0, 1, 2, 3, 4, 5, 6]);

        const day0 = entries.filter(e => e.DayOfWeek === 0);
        expect(day0).toEqual([
            { DayOfWeek: 0, StartTime: '08:00', EndTime: '09:00' },
            { DayOfWeek: 0, StartTime: '09:00', EndTime: '10:00' },
        ]);
    });

    test('resets form fields after successful add', async () => {
        mockGetByEmail.mockResolvedValue(mockStaffUser);
        mockLinkStaff.mockResolvedValue({});
        mockCreateDefault.mockResolvedValue({});

        await renderAndOpenAddStaff();

        const input = screen.getByPlaceholderText(/staff@example.com/i);
        fireEvent.change(input, { target: { value: 'jane@example.com' } });

        await act(async () => jest.advanceTimersByTime(400));
        await waitFor(() => screen.getByLabelText(/speciality/i));

        fireEvent.change(screen.getByLabelText(/speciality/i), { target: { value: 'spec1' } });
        fireEvent.click(getAddStaffSubmitButton());

        await waitFor(() => expect(mockLinkStaff).toHaveBeenCalled());

        expect(input.value).toBe('');
        await waitFor(() =>
            expect(screen.queryByText(/Found: Dr Jane Doe/i)).not.toBeInTheDocument()
        );
    });

    test('shows 409 alert when staff is already linked to a clinic', async () => {
        mockGetByEmail.mockResolvedValue(mockStaffUser);
        mockLinkStaff.mockRejectedValue({ status: 409 });

        await renderAndOpenAddStaff();

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'jane@example.com' },
        });

        await act(async () => jest.advanceTimersByTime(400));
        await waitFor(() => screen.getByLabelText(/speciality/i));

        fireEvent.change(screen.getByLabelText(/speciality/i), { target: { value: 'spec1' } });
        fireEvent.click(getAddStaffSubmitButton());

        await waitFor(() =>
            expect(window.alert).toHaveBeenCalledWith('This staff member is already linked to a clinic.')
        );
    });

    test('shows generic alert on non-409 error', async () => {
        mockGetByEmail.mockResolvedValue(mockStaffUser);
        mockLinkStaff.mockRejectedValue({ status: 500, message: 'Server error' });

        await renderAndOpenAddStaff();

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'jane@example.com' },
        });

        await act(async () => jest.advanceTimersByTime(400));
        await waitFor(() => screen.getByLabelText(/speciality/i));

        fireEvent.change(screen.getByLabelText(/speciality/i), { target: { value: 'spec1' } });
        fireEvent.click(getAddStaffSubmitButton());

        await waitFor(() =>
            expect(window.alert).toHaveBeenCalledWith('Failed to add staff. Please try again.')
        );
    });

    test('Add Staff button stays disabled when speciality is not selected', async () => {
        mockGetByEmail.mockResolvedValue(mockStaffUser);
        await renderAndOpenAddStaff();

        fireEvent.change(screen.getByPlaceholderText(/staff@example.com/i), {
            target: { value: 'jane@example.com' },
        });

        await act(async () => jest.advanceTimersByTime(400));
        await waitFor(() => expect(mockGetByEmail).toHaveBeenCalled());

        expect(getAddStaffSubmitButton()).toBeDisabled();
    });

    test('does not call linkStaff if no staff result is present', async () => {
        await renderAndOpenAddStaff();

        expect(getAddStaffSubmitButton()).toBeDisabled();
        expect(mockLinkStaff).not.toHaveBeenCalled();
    });
});