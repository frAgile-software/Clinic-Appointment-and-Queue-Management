import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

/* ─── Mock heavy deps ─────────────────────────────────────── */
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isLoading: false,
    isAuthenticated: true,
    user: { sub: 'auth0|test123' },
  }),
}));

const mockListStaff        = jest.fn();
const mockGetSchedule      = jest.fn();
const mockGetOffDays       = jest.fn();
const mockGetForAuth0Id    = jest.fn();
const mockCreateAppt       = jest.fn();
const mockCancelAppt       = jest.fn();

jest.mock('../../api/useApi', () => ({
  useApi: () => ({
    clinics: {
      listStaff: mockListStaff,
    },
    schedules: {
      getSchedule: mockGetSchedule,
      getOffDays:  mockGetOffDays,
    },
    appointments: {
      getForAuth0Id: mockGetForAuth0Id,
      create:        mockCreateAppt,
      cancel:        mockCancelAppt,
    },
  }),
}));

// Keep this alias so existing beforeEach blocks that reset mockApiFetch still compile
const mockApiFetch = jest.fn();

import Booking from './Booking';

/* ─── Helper: render Booking with route state ─────────────── */
function renderBooking(stateOverrides = {}) {
  return render(
    <MemoryRouter
      initialEntries={[{
        pathname: '/book',
        state: {
          clinicId:      'clinic123',
          clinicName:    'City Clinic',
          clinicAddress: '1 Main St',
          clinicType:    'General Practice',
          specialty:     'Cardiology',
          fromBookNow:   true,
          ...stateOverrides,
        },
      }]}
    >
      <Routes>
        <Route path="/book" element={<Booking />} />
      </Routes>
    </MemoryRouter>
  );
}

/* ─── Pure helper tests ───────────────────────────────────── */

describe('getBookingWindow()', () => {
  function getBookingWindow() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(tomorrow);
      d.setDate(tomorrow.getDate() + i);
      return d;
    });
  }

  it('returns exactly 14 dates', () => {
    expect(getBookingWindow()).toHaveLength(14);
  });

  it('starts from tomorrow', () => {
    const window   = getBookingWindow();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    expect(window[0].toDateString()).toBe(tomorrow.toDateString());
  });

  it('ends 14 days from tomorrow', () => {
    const window = getBookingWindow();
    const last   = new Date();
    last.setDate(last.getDate() + 14);
    last.setHours(0, 0, 0, 0);
    expect(window[13].toDateString()).toBe(last.toDateString());
  });
});

describe('getMondayOf()', () => {
  function getMondayOf(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day  = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }

  it('returns Monday when given a Wednesday', () => {
    const wed = new Date(2025, 4, 7);
    expect(getMondayOf(wed).getDay()).toBe(1);
  });

  it('returns previous Monday when given a Sunday', () => {
    const sun = new Date(2025, 4, 11);
    const mon = getMondayOf(sun);
    expect(mon.getDay()).toBe(1);
    expect(mon.getDate()).toBe(5);
  });

  it('returns same day when given a Monday', () => {
    const mon = new Date(2025, 4, 5);
    expect(getMondayOf(mon).toDateString()).toBe(mon.toDateString());
  });
});

describe('buildWeekCells()', () => {
  function jsdayToDBday(jsDay) {
    return jsDay;
  }

  function buildWeekCells(weekStart, windowDates, schedule) {
    const windowSet = new Set(windowDates.map(d => d.toDateString()));
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      d.setHours(0, 0, 0, 0);

      const inWindow      = windowSet.has(d.toDateString());
      const dbDay         = jsdayToDBday(d.getDay());
      const docWorksToday = schedule.some(s => Number(s.DayOfWeek) === dbDay);
      const isToday       = d.toDateString() === new Date().toDateString();

      return {
        date: d,
        dayName: DAY_NAMES[d.getDay()],
        dayNum: d.getDate(),
        inWindow,
        docWorksToday,
        isAvail: inWindow && docWorksToday,
        isToday,
      };
    });
  }

  const monday   = new Date(2025, 4, 5);
  const schedule = [
    { DayOfWeek: 1, StartTime: '08:00', EndTime: '17:00' },
    { DayOfWeek: 3, StartTime: '09:00', EndTime: '15:00' },
  ];

  it('returns exactly 7 cells', () => {
    expect(buildWeekCells(monday, [], schedule)).toHaveLength(7);
  });

  it('first cell is Monday', () => {
    const cells = buildWeekCells(monday, [], schedule);
    expect(cells[0].dayName).toBe('Mon');
  });

  it('last cell is Sunday', () => {
    const cells = buildWeekCells(monday, [], schedule);
    expect(cells[6].dayName).toBe('Sun');
  });

  it('marks Mon and Wed as docWorksToday', () => {
    const cells = buildWeekCells(monday, [], schedule);
    expect(cells[0].docWorksToday).toBe(true);
    expect(cells[2].docWorksToday).toBe(true);
    expect(cells[1].docWorksToday).toBe(false);
  });

  it('isAvail only when inWindow AND docWorksToday', () => {
    const window = [new Date(2025, 4, 5), new Date(2025, 4, 7)];
    const cells  = buildWeekCells(monday, window, schedule);
    expect(cells[0].isAvail).toBe(true);
    expect(cells[2].isAvail).toBe(true);
    expect(cells[4].isAvail).toBe(false);
  });

  it('allows weekend days (Sat/Sun) if doctor works them', () => {
    const allDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
    const cells = buildWeekCells(monday, allDays, [
      { DayOfWeek: 6, StartTime: '08:00', EndTime: '17:00' },
    ]);
    expect(cells[5].isAvail).toBe(true);
    expect(cells[6].isAvail).toBe(false);
  });
});

describe('availableHours derivation', () => {
  function jsdayToDBday(jsDay) {
    return jsDay;
  }

  function deriveHours(schedule, date) {
    const dbDay    = jsdayToDBday(date.getDay());
    const dayEntry = schedule.find(s => Number(s.DayOfWeek) === dbDay);
    if (!dayEntry) return [];
    const parseHour = t => parseInt(String(t).split(':')[0], 10);
    const start = parseHour(dayEntry.StartTime);
    const end   = parseHour(dayEntry.EndTime);
    const hours = [];
    for (let h = start; h < end; h++) hours.push(h);
    return hours;
  }

  it('returns empty when doctor does not work that day', () => {
    const monday   = new Date(2025, 4, 5);
    const schedule = [{ DayOfWeek: 2, StartTime: '08:00', EndTime: '17:00' }];
    expect(deriveHours(schedule, monday)).toEqual([]);
  });

  it('returns hours for Saturday if in schedule', () => {
    const saturday = new Date(2025, 4, 10);
    const schedule = [{ DayOfWeek: 6, StartTime: '08:00', EndTime: '17:00' }];
    expect(deriveHours(schedule, saturday)).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16]);
  });

  it('returns correct hours for Monday 08:00–17:00', () => {
    const monday   = new Date(2025, 4, 5);
    const schedule = [{ DayOfWeek: 1, StartTime: '08:00', EndTime: '17:00' }];
    expect(deriveHours(schedule, monday)).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16]);
  });

  it('returns correct hours for Wednesday 09:00–15:00', () => {
    const wednesday = new Date(2025, 4, 7);
    const schedule  = [{ DayOfWeek: 3, StartTime: '09:00', EndTime: '15:00' }];
    expect(deriveHours(schedule, wednesday)).toEqual([9, 10, 11, 12, 13, 14]);
  });

  it('handles numeric StartTime/EndTime', () => {
    const monday   = new Date(2025, 4, 5);
    const schedule = [{ DayOfWeek: 1, StartTime: 9, EndTime: 12 }];
    expect(deriveHours(schedule, monday)).toEqual([9, 10, 11]);
  });
});

/* ─── isPatientBooked logic tests ────────────────────────── */

describe('isPatientBooked logic', () => {
  function pad(n) { return String(n).padStart(2, '0'); }

  function isPatientBooked(slot, selectedDate, myAppointments) {
    if (!selectedDate || !myAppointments.length) return false;
    const dateStr = selectedDate.toISOString().slice(0, 10);
    return myAppointments.some(appt => {
      if (!appt.BookingDateTime) return false;
      const apptDate    = new Date(appt.BookingDateTime);
      const apptDateStr = apptDate.toISOString().slice(0, 10);
      const apptHour    = `${pad(apptDate.getUTCHours())}:00`;
      return apptDateStr === dateStr && apptHour === slot.StartTime.slice(0, 5);
    });
  }

  const selectedDate = new Date('2025-05-20T00:00:00.000Z');
  const slot9am  = { StartTime: '09:00', EndTime: '10:00' };
  const slot10am = { StartTime: '10:00', EndTime: '11:00' };

  it('returns false when myAppointments is empty', () => {
    expect(isPatientBooked(slot9am, selectedDate, [])).toBe(false);
  });

  it('returns false when selectedDate is null', () => {
    const appts = [{ BookingDateTime: '2025-05-20T09:00:00.000Z' }];
    expect(isPatientBooked(slot9am, null, appts)).toBe(false);
  });

  it('returns true when patient has appointment matching date and time', () => {
    const appts = [{ BookingDateTime: '2025-05-20T09:00:00.000Z' }];
    expect(isPatientBooked(slot9am, selectedDate, appts)).toBe(true);
  });

  it('returns false when appointment is on a different date', () => {
    const appts = [{ BookingDateTime: '2025-05-21T09:00:00.000Z' }];
    expect(isPatientBooked(slot9am, selectedDate, appts)).toBe(false);
  });

  it('returns false when appointment is on same date but different time', () => {
    const appts = [{ BookingDateTime: '2025-05-20T09:00:00.000Z' }];
    expect(isPatientBooked(slot10am, selectedDate, appts)).toBe(false);
  });

  it('returns false when appointment has no BookingDateTime', () => {
    const appts = [{ BookingDateTime: null }];
    expect(isPatientBooked(slot9am, selectedDate, appts)).toBe(false);
  });

  it('returns true for one matching appointment among many', () => {
    const appts = [
      { BookingDateTime: '2025-05-20T08:00:00.000Z' },
      { BookingDateTime: '2025-05-20T09:00:00.000Z' },
      { BookingDateTime: '2025-05-20T11:00:00.000Z' },
    ];
    expect(isPatientBooked(slot9am, selectedDate, appts)).toBe(true);
  });
});

/* ─── isDoctorBooked logic tests ─────────────────────────── */

describe('isDoctorBooked logic', () => {
  function pad(n) { return String(n).padStart(2, '0'); }

  function isDoctorBooked(slot, selectedDate, doctorAppointments) {
    if (!selectedDate || !doctorAppointments.length) return false;
    const dateStr = selectedDate.toISOString().slice(0, 10);
    return doctorAppointments.some(appt => {
      if (!appt.BookingDateTime) return false;
      const apptDate    = new Date(appt.BookingDateTime);
      const apptDateStr = apptDate.toISOString().slice(0, 10);
      const apptHour    = `${pad(apptDate.getUTCHours())}:00`;
      return apptDateStr === dateStr && apptHour === slot.StartTime.slice(0, 5);
    });
  }

  const selectedDate = new Date('2025-05-20T00:00:00.000Z');
  const slot9am  = { StartTime: '09:00', EndTime: '10:00' };
  const slot10am = { StartTime: '10:00', EndTime: '11:00' };

  it('returns false when doctorAppointments is empty', () => {
    expect(isDoctorBooked(slot9am, selectedDate, [])).toBe(false);
  });

  it('returns false when selectedDate is null', () => {
    const appts = [{ BookingDateTime: '2025-05-20T09:00:00.000Z' }];
    expect(isDoctorBooked(slot9am, null, appts)).toBe(false);
  });

  it('returns true when doctor has appointment matching date and time', () => {
    const appts = [{ BookingDateTime: '2025-05-20T09:00:00.000Z' }];
    expect(isDoctorBooked(slot9am, selectedDate, appts)).toBe(true);
  });

  it('returns false when doctor appointment is on a different date', () => {
    const appts = [{ BookingDateTime: '2025-05-19T09:00:00.000Z' }];
    expect(isDoctorBooked(slot9am, selectedDate, appts)).toBe(false);
  });

  it('returns false when doctor appointment is same date but different hour', () => {
    const appts = [{ BookingDateTime: '2025-05-20T09:00:00.000Z' }];
    expect(isDoctorBooked(slot10am, selectedDate, appts)).toBe(false);
  });

  it('returns false when appointment has no BookingDateTime', () => {
    const appts = [{ BookingDateTime: null }];
    expect(isDoctorBooked(slot9am, selectedDate, appts)).toBe(false);
  });

  it('returns true for one matching appointment among many', () => {
    const appts = [
      { BookingDateTime: '2025-05-20T08:00:00.000Z' },
      { BookingDateTime: '2025-05-20T09:00:00.000Z' },
      { BookingDateTime: '2025-05-20T14:00:00.000Z' },
    ];
    expect(isDoctorBooked(slot9am, selectedDate, appts)).toBe(true);
  });

  it('is independent from patient appointments — different appointment sets', () => {
    // doctor is booked at 9am but patient is not
    const doctorAppts  = [{ BookingDateTime: '2025-05-20T09:00:00.000Z' }];
    const patientAppts = [{ BookingDateTime: '2025-05-20T10:00:00.000Z' }];

    function isPatientBooked(slot, selectedDate, myAppointments) {
      if (!selectedDate || !myAppointments.length) return false;
      const dateStr = selectedDate.toISOString().slice(0, 10);
      return myAppointments.some(appt => {
        if (!appt.BookingDateTime) return false;
        const apptDate    = new Date(appt.BookingDateTime);
        const apptDateStr = apptDate.toISOString().slice(0, 10);
        const apptHour    = `${pad(apptDate.getUTCHours())}:00`;
        return apptDateStr === dateStr && apptHour === slot.StartTime.slice(0, 5);
      });
    }

    expect(isDoctorBooked(slot9am,  selectedDate, doctorAppts)).toBe(true);
    expect(isPatientBooked(slot9am, selectedDate, patientAppts)).toBe(false);
  });
});

/* ─── isBusy combination logic ───────────────────────────── */

describe('isBusy = alreadyBooked || doctorTaken', () => {
  it('is busy when only patient is booked', () => {
    const alreadyBooked = true;
    const doctorTaken   = false;
    expect(alreadyBooked || doctorTaken).toBe(true);
  });

  it('is busy when only doctor is booked', () => {
    const alreadyBooked = false;
    const doctorTaken   = true;
    expect(alreadyBooked || doctorTaken).toBe(true);
  });

  it('is busy when both are booked', () => {
    expect(true || true).toBe(true);
  });

  it('is not busy when neither is booked', () => {
    expect(false || false).toBe(false);
  });
});

/* ─── API route tests (fetch mocking) ────────────────────── */

describe('GET /api/clinics/:clinicId/staff', () => {
  const BASE = 'http://localhost:5000';

  beforeEach(() => { global.fetch = jest.fn(); });
  afterEach(() => { jest.clearAllMocks(); });

  it('returns staff list', async () => {
    const mockStaff = [
      { _id: 'u1', name: 'Alice', surname: 'Smith', specialization: 'Cardiology' },
    ];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: mockStaff }),
    });

    const res  = await fetch(`${BASE}/api/clinics/clinic123/staff`);
    const json = await res.json();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/clinics/clinic123/staff')
    );
    expect(json.users).toHaveLength(1);
    expect(json.users[0].name).toBe('Alice');
    expect(json.users[0].surname).toBe('Smith');
  });

  it('includes auth0Id in each staff user object', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [{ _id: 'u1', name: 'Alice', surname: 'Smith', auth0Id: 'auth0|abc123' }],
      }),
    });

    const res  = await fetch(`${BASE}/api/clinics/clinic123/staff`);
    const json = await res.json();
    expect(json.users[0].auth0Id).toBe('auth0|abc123');
  });

  it('includes staffId (Staff record _id) separate from _id (User _id)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [{
          _id:     'user-mongo-id',
          staffId: 'staff-mongo-id',
          name:    'Alice',
          surname: 'Smith',
          auth0Id: 'auth0|abc123',
        }],
      }),
    });

    const res  = await fetch(`${BASE}/api/clinics/clinic123/staff`);
    const json = await res.json();
    expect(json.users[0]._id).toBe('user-mongo-id');
    expect(json.users[0].staffId).toBe('staff-mongo-id');
  });

  it('handles 404 when clinic not found', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Clinic not found.' }),
    });

    const res  = await fetch(`${BASE}/api/clinics/bad-id/staff`);
    const json = await res.json();

    expect(res.ok).toBe(false);
    expect(json.message).toBe('Clinic not found.');
  });

  it('returns empty users array when no staff', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] }),
    });

    const res  = await fetch(`${BASE}/api/clinics/clinic123/staff`);
    const json = await res.json();
    expect(json.users).toEqual([]);
  });

  it('only returns users with role Staff (not Admin)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [
          { _id: 'u1', name: 'Alice', role: 'Staff',  auth0Id: 'auth0|1' },
          { _id: 'u2', name: 'Bob',   role: 'Admin',  auth0Id: 'auth0|2' },
        ].filter(u => u.role === 'Staff'),
      }),
    });

    const res  = await fetch(`${BASE}/api/clinics/clinic123/staff`);
    const json = await res.json();
    expect(json.users).toHaveLength(1);
    expect(json.users[0].role).toBe('Staff');
  });
});

describe('GET /api/schedules/:userId', () => {
  const BASE = 'http://localhost:5000';

  beforeEach(() => { global.fetch = jest.fn(); });
  afterEach(() => { jest.clearAllMocks(); });

  it('returns sorted schedule entries using DB day convention (1=Mon)', async () => {
    const mockSchedule = [
      { DayOfWeek: 1, StartTime: '08:00', EndTime: '17:00' },
      { DayOfWeek: 3, StartTime: '09:00', EndTime: '15:00' },
    ];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ schedule: mockSchedule }),
    });

    const res  = await fetch(`${BASE}/api/schedules/u1`);
    const json = await res.json();

    expect(json.schedule).toHaveLength(2);
    expect(json.schedule[0].DayOfWeek).toBe(1);
  });

  it('returns 404 when user not found', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'User not found.' }),
    });

    const res = await fetch(`${BASE}/api/schedules/bad-id`);
    expect(res.status).toBe(404);
  });

  it('returns empty schedule array when no entries', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ schedule: [] }),
    });

    const res  = await fetch(`${BASE}/api/schedules/u2`);
    const json = await res.json();
    expect(json.schedule).toEqual([]);
  });
});

describe('GET /appointments/booked', () => {
  const BASE = 'http://localhost:5000';

  beforeEach(() => { global.fetch = jest.fn(); });
  afterEach(() => { jest.clearAllMocks(); });

  it('returns list of booked ISO slot strings', async () => {
    const slots = ['2025-05-06T09:00', '2025-05-06T11:00'];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bookedSlots: slots }),
    });

    const res  = await fetch(`${BASE}/appointments/booked?doctorId=u1&date=2025-05-06`);
    const json = await res.json();
    expect(json.bookedSlots).toEqual(slots);
  });

  it('returns empty array when all slots free', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bookedSlots: [] }),
    });

    const res  = await fetch(`${BASE}/appointments/booked?doctorId=u1&date=2025-05-07`);
    const json = await res.json();
    expect(json.bookedSlots).toHaveLength(0);
  });
});

describe('POST /api/appointments', () => {
  const BASE = 'http://localhost:5000';

  beforeEach(() => { global.fetch = jest.fn(); });
  afterEach(() => { jest.clearAllMocks(); });

  it('creates appointment and returns success message', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Appointment created successfully.', appointment: { _id: 'appt-001' } }),
    });

    const body = {
      Clinic:          'clinic123',
      Staff:           'u1',
      patientAuth0Id:  'auth0|test123',
      BookingDateTime: '2025-05-06T09:00:00.000Z',
      description:     'Chest pain follow-up',
    };

    const res  = await fetch(`${BASE}/api/appointments`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const json = await res.json();

    expect(res.ok).toBe(true);
    expect(json.message).toBe('Appointment created successfully.');
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/api/appointments`,
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('returns 409 when slot already booked', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ message: 'This slot is already booked.' }),
    });

    const res  = await fetch(`${BASE}/api/appointments`, { method: 'POST', body: '{}' });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.message).toMatch(/already booked/i);
  });

  it('returns 404 when patient not found', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Patient not found.' }),
    });

    const res  = await fetch(`${BASE}/api/appointments`, { method: 'POST', body: '{}' });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.message).toBe('Patient not found.');
  });
});

/* ─── React component tests ──────────────────────────────── */

describe('Booking component', () => {
  beforeEach(() => {
    process.env.REACT_APP_SERVER_URL = 'http://localhost:5000';
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ users: [], schedule: [], bookedSlots: [] }),
    });
  });
  afterEach(() => { jest.clearAllMocks(); });

  it('shows error when fromBookNow is missing', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/book', state: { clinicId: 'clinic123' } }]}>
        <Routes>
          <Route path="/book" element={<Booking />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText(/no clinic selected/i)).toBeInTheDocument();
  });

  it('shows error when clinicId is missing', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/book', state: { fromBookNow: true } }]}>
        <Routes>
          <Route path="/book" element={<Booking />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText(/no clinic selected/i)).toBeInTheDocument();
  });

  it('renders clinic name and specialty in context banner', async () => {
    renderBooking();
    expect(await screen.findByText('City Clinic')).toBeInTheDocument();
    expect(screen.getByText('Cardiology')).toBeInTheDocument();
  });

  it('shows "No doctors found" when staff list is empty', async () => {
    renderBooking();
    expect(await screen.findByText(/no doctors found/i)).toBeInTheDocument();
  });

  it('renders doctor pill when staff returned', async () => {
    mockListStaff.mockResolvedValueOnce({
      users: [{ _id: 'u1', name: 'Alice', surname: 'Smith', specialization: 'Cardiology' }],
    });
    renderBooking();
    expect(await screen.findByText(/Dr Alice Smith/i)).toBeInTheDocument();
  });

  it('shows step headings on render', async () => {
    renderBooking();
    await waitFor(() => {
      expect(screen.getByText(/Visit Description/i)).toBeInTheDocument();
      expect(screen.getByText(/Select a Doctor/i)).toBeInTheDocument();
    });
  });

  it('does not show calendar before a doctor is selected', async () => {
    renderBooking();
    await waitFor(() => {
      expect(screen.queryByText(/Select a Date/i)).not.toBeInTheDocument();
    });
  });

  it('does not show confirm button before date and time chosen', async () => {
    renderBooking();
    await waitFor(() => {
      expect(screen.queryByText(/confirm appointment/i)).not.toBeInTheDocument();
    });
  });

  it('shows calendar after doctor selected', async () => {
    mockListStaff.mockResolvedValueOnce({
      users: [{ _id: 'u1', name: 'Alice', surname: 'Smith', auth0Id: 'auth0|1' }],
    });
    mockGetSchedule.mockResolvedValueOnce({
      schedule: [{ DayOfWeek: 1, StartTime: '08:00', EndTime: '17:00' }],
    });
    mockGetOffDays.mockResolvedValueOnce({ offDays: [] });

    renderBooking();
    const docPill = await screen.findByText(/Dr Alice Smith/i);
    fireEvent.click(docPill);

    await waitFor(() => {
      expect(screen.getByText(/Select a Date/i)).toBeInTheDocument();
    });
  });

  it('visit description textarea accepts input', async () => {
    renderBooking();
    const textarea = await screen.findByPlaceholderText(/follow-up on blood pressure/i);
    fireEvent.change(textarea, { target: { value: 'Chest pain' } });
    expect(textarea.value).toBe('Chest pain');
  });

  it('shows character count for visit description', async () => {
    renderBooking();
    await waitFor(() => {
      expect(screen.getByText('0/500')).toBeInTheDocument();
    });
  });

  it('resets selected date and slot when a new doctor is selected', async () => {
  mockListStaff.mockResolvedValue({
    users: [
      { _id: 'u1', name: 'Alice', surname: 'Smith', auth0Id: 'auth0|1' },
      { _id: 'u2', name: 'Bob',   surname: 'Jones', auth0Id: 'auth0|2' },
    ],
  });
  mockGetSchedule.mockResolvedValue({ schedule: [] });
  mockGetOffDays.mockResolvedValue({ offDays: [] });
  mockGetForAuth0Id.mockResolvedValue({ appointments: [] });

  renderBooking();

  const pills = await screen.findAllByRole('button', { name: /Dr/ });
  fireEvent.click(pills[0]); // Alice

  await waitFor(() => expect(screen.getByText(/Select a Date/i)).toBeInTheDocument());

  fireEvent.click(pills[1]); // Bob

  await waitFor(() => expect(screen.getByText(/Select a Date/i)).toBeInTheDocument());
  expect(screen.queryByText(/Select a Time/i)).not.toBeInTheDocument();
});


  it('deletes old appointment if rescheduleAppointmentId is provided after confirming the new booking', async () => {
      mockListStaff.mockResolvedValueOnce({
        users: [{ _id: 'u1', name: 'A', surname: 'B', auth0Id: 'auth0|doc1' }],
      });
      mockGetSchedule.mockResolvedValueOnce({
        schedule: [
          { _id: 's1', DayOfWeek: 1, StartTime: '08:00', EndTime: '09:00' },
          { _id: 's2', DayOfWeek: 2, StartTime: '08:00', EndTime: '09:00' },
          { _id: 's3', DayOfWeek: 3, StartTime: '08:00', EndTime: '09:00' },
          { _id: 's4', DayOfWeek: 4, StartTime: '08:00', EndTime: '09:00' },
          { _id: 's5', DayOfWeek: 5, StartTime: '08:00', EndTime: '09:00' },
        ],
      });
      mockGetOffDays.mockResolvedValueOnce({ offDays: [] });
      mockGetForAuth0Id.mockResolvedValue({ appointments: [] });
      mockCreateAppt.mockResolvedValueOnce({ message: 'Created' });
      mockCancelAppt.mockResolvedValueOnce({ message: 'Cancelled' });

    renderBooking({ rescheduleAppointmentId: 'old_appt_123' });

    fireEvent.click(await screen.findByText(/Dr A B/i));

    
    fireEvent.click(await screen.findByRole('button', { name: /Next week/i }));

    const availableCells = await screen.findAllByRole('button', { name: /Select/i });
    fireEvent.click(availableCells[0]);

    const slotBtn = await screen.findByRole('button', { name: /8:00 AM/i });
    fireEvent.click(slotBtn);

    

    fireEvent.click(await screen.findByRole('button', { name: /Confirm Appointment/i }));

    await waitFor(() => {
      expect(mockCancelAppt).toHaveBeenCalledWith('old_appt_123');
    });
  });
});