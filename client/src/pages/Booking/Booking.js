import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';
import { useApiAuth } from '../../hooks/apiAuth';
import './Booking.css';
import Header from '../../components/Header';
// import logo from '../PatientDashboard/logo.svg';

/* ── Helpers ── */

/** Returns 14 dates starting from tomorrow */
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

/** Returns the Monday of the week containing `date` */
function getMondayOf(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day  = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Builds 7 day cells Mon–Sun for the given weekStart.
 * DB convention: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
 */
function buildWeekCells(weekStart, windowDates, schedule) {
  const windowSet = new Set(windowDates.map(d => d.toDateString()));

  function jsdayToDBday(jsDay) {
    return jsDay;
  }

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
      date:         d,
      dayName:      DAY_NAMES[d.getDay()],
      dayNum:       d.getDate(),
      inWindow,
      docWorksToday,
      isAvail:      inWindow && docWorksToday,
      isToday,
    };
  });
}

function formatDate(date) {
  return date.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatHour(h) {
  return `${String(h).padStart(2, '0')}:00`;
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

/* ── Component ── */
export default function Booking() {
  const navigate     = useNavigate();
  const location     = useLocation();
  const { apiFetch } = useApiAuth();
  const { user, isLoading } = useAuth0();

  const {
    clinicId,
    clinicName,
    clinicAddress,
    clinicType,
    specialty,
    fromBookNow,
    rescheduleAppointmentId,
  } = location.state || {};

  /* ── State ── */
  const [visitDescription, setVisitDescription] = useState('');

  const [doctors,        setDoctors]        = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [schedule,        setSchedule]        = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return getMondayOf(today);
  });
  const [selectedDate, setSelectedDate] = useState(null);

  const [bookedSlots,   setBookedSlots]   = useState([]);
  const [loadingBooked, setLoadingBooked] = useState(false);
  const [selectedSlot,  setSelectedSlot]  = useState(null);

  const [confirming, setConfirming] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState('');

  /* ── Derived ── */
  const windowDates = getBookingWindow();
  const weekCells   = buildWeekCells(weekStart, windowDates, schedule);

  const weekLabel = (() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    const opts = { day: 'numeric', month: 'short' };
    return `${weekStart.toLocaleDateString('en-ZA', opts)} – ${end.toLocaleDateString('en-ZA', opts)}`;
  })();

  const prevWeek = () => setWeekStart(w => {
    const d = new Date(w); d.setDate(d.getDate() - 7); return d;
  });
  const nextWeek = () => setWeekStart(w => {
    const d = new Date(w); d.setDate(d.getDate() + 7); return d;
  });

  const docFullName = (doc) => {
    if (!doc) return '';
    return `${doc.name || ''} ${doc.surname || ''}`.trim();
  };

  /* ── Available hours derived from schedule entry for selected day ── */
  const availableHours = (() => {
    if (!selectedDate || !schedule.length) return [];
    const dbDay    = selectedDate.getDay();
    const dayEntry = schedule.find(s => Number(s.DayOfWeek) === dbDay);
    if (!dayEntry) return [];
    const parseHour = t => parseInt(String(t).split(':')[0], 10);
    const start = parseHour(dayEntry.StartTime);
    const end   = parseHour(dayEntry.EndTime);
    const hours = [];
    for (let h = start; h < end; h++) hours.push(h);
    return hours;
  })();

  const isBooked = (h) => {
    if (!selectedDate) return false;
    const dateStr = selectedDate.toISOString().split('T')[0];
    return bookedSlots.includes(`${dateStr}T${formatHour(h)}`);
  };

  /* ── Load doctors ── */
  useEffect(() => {
    if (!clinicId) return;
    (async () => {
      setLoadingDoctors(true);
      try {
        const res  = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/clinics/${clinicId}/staff`);
        const json = await res.json();
        setDoctors(json.users || []);
      } catch {
        setDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    })();
  }, [clinicId, apiFetch]);

  /* ── Load doctor schedule ── */
  const loadSchedule = useCallback(async (doctor) => {
    setSchedule([]);
    setLoadingSchedule(true);
    setSelectedDate(null);
    setSelectedSlot(null);
    setBookedSlots([]);
    try {
      const res  = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/schedules/${doctor._id}`);
      const json = await res.json();
      setSchedule(json.schedule || []);
    } catch {
      setSchedule([]);
    } finally {
      setLoadingSchedule(false);
    }
  }, [apiFetch]);

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    loadSchedule(doctor);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setWeekStart(getMondayOf(today));
  };

  /* ── Load booked slots when date chosen ── */
  useEffect(() => {
    if (!selectedDate || !selectedDoctor) return;
    (async () => {
      setLoadingBooked(true);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const res     = await apiFetch(
          `${process.env.REACT_APP_SERVER_URL}/appointments/booked?doctorId=${selectedDoctor._id}&date=${dateStr}`
        );
        const json = await res.json();
        setBookedSlots(json.bookedSlots || []);
      } catch {
        setBookedSlots([]);
      } finally {
        setLoadingBooked(false);
      }
    })();
  }, [selectedDate, selectedDoctor, apiFetch]);

  /* ── Confirm booking ── */
  const handleConfirm = async () => {
    setConfirming(true);
    setError('');
    try {
      const bookingDate = new Date(selectedDate);
      bookingDate.setHours(selectedSlot, 0, 0, 0);

      const body = {
        Clinic:          clinicId,
        Staff:           selectedDoctor._id,
        patientAuth0Id:  user?.sub,
        BookingDateTime: bookingDate.toISOString(),
        description:     visitDescription,
        Speciality:      specialty,
        rescheduleAppointmentId: rescheduleAppointmentId,
      };

      const res = await apiFetch(
        `${process.env.REACT_APP_SERVER_URL}/api/appointments`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Booking failed.');
      }

      if (rescheduleAppointmentId) {
        await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/appointments/${rescheduleAppointmentId}`, {
          method: 'DELETE'
        });
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  /* ── Guards ── */
  if (isLoading) return (
    <main className="booking-page booking-loading"><p>Loading…</p></main>
  );

  if (!fromBookNow || !clinicId) return (
    <main className="booking-page booking-error">
      <p>No clinic selected. Please find a clinic first.</p>
      <button className="go-home-btn" onClick={() => navigate('/dashboard/patient')}>
        Go to Dashboard
      </button>
    </main>
  );

  /* ── Success screen ── */
  if (success) return (
    <main className="booking-page">
      <nav className="booking-nav" aria-label="Main navigation">
        <span style={{ flex: 1 }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' }}>
          <img src="/logo.svg" alt="Clinics and Qs logo" style={{ width: 32, height: 32 }} />
        </span>
        <span style={{ flex: 1 }} />
      </nav>
      <section className="booking-body">
        <article className="booking-section">
          <section className="booking-success" aria-label="Booking confirmation">
            <p className="success-icon" aria-hidden="true">✓</p>
            <h2 className="success-title">Appointment Booked!</h2>
            <p className="success-sub">{formatDate(selectedDate)} at {formatHour(selectedSlot)}</p>
            <p className="success-sub">Dr {docFullName(selectedDoctor)} · {clinicName}</p>
            <button className="success-btn" onClick={() => navigate('/dashboard/patient')}>
              Go to My Appointments
            </button>
          </section>
        </article>
      </section>
    </main>
  );

  /* ── Main render ── */
  return (
    <main className="booking-page">

      
      <Header>
          <button className="booking-nav-back" onClick={() => navigate(-1)}>← Back</button>
      </Header>

      {/* Hero */}
      <header className="booking-hero" aria-label="Booking context">
        <h1 className="booking-hero-title">
          {rescheduleAppointmentId ? 'Reschedule Appointment' : 'Booking An Appointment'}
        </h1>
        <section className="booking-context-row" style={{ justifyContent: 'center' }}>
          <article className="booking-context-card">
            <p className="context-card-label">Selected Clinic</p>
            <p className="context-card-name">{clinicName || clinicId}</p>
            {clinicType    && <p className="context-card-sub">{clinicType}</p>}
            {clinicAddress && <p className="context-card-sub">{clinicAddress}</p>}
          </article>
          <article className="booking-context-card">
            <p className="context-card-label">Reason</p>
            <p className="context-card-name">{specialty || '—'}</p>
          </article>
        </section>
      </header>

      <section className="booking-body" aria-label="Booking steps">

        {/* ── Steps 1 + 2 side by side ── */}
        <section className="steps-row">

          {/* Step 1: Visit Description */}
          <article className="booking-section steps-row-item" aria-labelledby="step1-heading">
            <header className="section-header">
              <span className="section-step-badge" aria-hidden="true">1</span>
              <hgroup>
                <p className="section-title" id="step1-heading">Visit Description</p>
                <p className="section-subtitle">Briefly describe the purpose of your visit</p>
              </hgroup>
            </header>
            <section className="description-wrap">
              <textarea
                className="visit-description-input"
                placeholder="e.g. Follow-up on blood pressure medication, persistent headache for 3 days…"
                value={visitDescription}
                onChange={e => setVisitDescription(e.target.value)}
                rows={5}
                maxLength={500}
                aria-label="Visit description"
              />
              <p className="description-char-count">{visitDescription.length}/500</p>
            </section>
          </article>

          {/* Step 2: Select Doctor */}
          <article className="booking-section steps-row-item" aria-labelledby="step2-heading">
            <header className="section-header">
              <span className="section-step-badge" aria-hidden="true">2</span>
              <hgroup>
                <p className="section-title" id="step2-heading">Select a Doctor</p>
                <p className="section-subtitle">Choose from available doctors at this clinic</p>
              </hgroup>
            </header>

            {loadingDoctors ? (
              <ul className="doctor-pills" aria-busy="true">
                {[...Array(3)].map((_, i) => (
                  <li key={i} className="skeleton" style={{ width: 160, height: 54, borderRadius: 40 }} aria-hidden="true" />
                ))}
              </ul>
            ) : doctors.length === 0 ? (
              <p className="no-doctors">No doctors found for this clinic.</p>
            ) : (
              <ul className="doctor-pills">
                {doctors.map(doc => {
                  const displayName = `${doc.name || ''} ${doc.surname || ''}`.trim() || 'Unknown';
                  const spec        = doc.specialization || specialty || 'General';
                  return (
                    <li
                      key={doc._id}
                      className={`doctor-pill${selectedDoctor?._id === doc._id ? ' doctor-pill--selected' : ''}`}
                      onClick={() => handleSelectDoctor(doc)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && handleSelectDoctor(doc)}
                      aria-pressed={selectedDoctor?._id === doc._id}
                    >
                      <span className="doctor-pill-avatar" aria-hidden="true">
                        {initials(displayName)}
                      </span>
                      <span>
                        <p className="doctor-pill-name">Dr {displayName}</p>
                        <p className="doctor-pill-spec">{spec}</p>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>

        </section>

        {/* ── Step 3: Week Calendar ── */}
        {selectedDoctor && (
          <article className="booking-section" aria-labelledby="step3-heading">
            <header className="section-header">
              <span className="section-step-badge" aria-hidden="true">3</span>
              <hgroup>
                <p className="section-title" id="step3-heading">Select a Date</p>
                <p className="section-subtitle">
                  Availability for Dr {docFullName(selectedDoctor)} · Next 14 days from tomorrow
                </p>
              </hgroup>
            </header>

            {loadingSchedule ? (
              <section className="calendar-wrap" aria-busy="true">
                <span className="skeleton" style={{ display: 'block', height: 120, borderRadius: 10 }} aria-hidden="true" />
              </section>
            ) : (
              <section className="calendar-wrap">
                <header className="calendar-month-nav" aria-label="Week navigation">
                  <button className="cal-nav-btn" onClick={prevWeek} aria-label="Previous week">‹</button>
                  <h2 className="cal-month-label">{weekLabel}</h2>
                  <button className="cal-nav-btn" onClick={nextWeek} aria-label="Next week">›</button>
                </header>

                <ol className="week-grid" aria-label="Week calendar">
                  {weekCells.map((cell) => {
                    const isSelected = selectedDate?.toDateString() === cell.date.toDateString();
                    let cls = 'week-cell';
                    if (isSelected)        cls += ' cal-cell--selected';
                    else if (cell.isAvail) cls += ' cal-cell--available';
                    else                   cls += ' cal-cell--unavailable';
                    if (cell.isToday)      cls += ' cal-cell--today';

                    return (
                      <li
                        key={cell.date.toDateString()}
                        className={cls}
                        onClick={() => {
                          if (cell.isAvail) {
                            setSelectedDate(cell.date);
                            setSelectedSlot(null);
                          }
                        }}
                        role={cell.isAvail ? 'button' : undefined}
                        tabIndex={cell.isAvail ? 0 : undefined}
                        onKeyDown={e => cell.isAvail && e.key === 'Enter' && (setSelectedDate(cell.date), setSelectedSlot(null))}
                        aria-label={cell.isAvail ? `Select ${formatDate(cell.date)}` : undefined}
                        aria-pressed={isSelected || undefined}
                      >
                        <span className="week-cell-name">{cell.dayName}</span>
                        <span className="week-cell-num">{cell.dayNum}</span>
                      </li>
                    );
                  })}
                </ol>

                <section className="cal-legend">
                  <span className="legend-dot legend-dot--avail" /> Available
                  <span className="legend-dot legend-dot--unavail" style={{ marginLeft: 16 }} /> Unavailable
                </section>
              </section>
            )}
          </article>
        )}

        {/* ── Step 4: Time slots ── */}
        {selectedDate && (
          <article className="booking-section" aria-labelledby="step4-heading">
            <header className="section-header">
              <span className="section-step-badge" aria-hidden="true">4</span>
              <hgroup>
                <p className="section-title" id="step4-heading">Select a Time</p>
                <p className="section-subtitle">Hourly slots for {formatDate(selectedDate)}</p>
              </hgroup>
            </header>

            <section className="slots-wrap">
              {loadingBooked ? (
                <span className="skeleton" style={{ display: 'block', height: 90, borderRadius: 10 }} aria-hidden="true" />
              ) : availableHours.length === 0 ? (
                <p className="slots-empty">No availability on this day. Please pick another date.</p>
              ) : (
                <ul className="slots-grid" aria-label="Available time slots">
                  {availableHours.map(h => {
                    const booked   = isBooked(h);
                    const selected = selectedSlot === h;
                    return (
                      <li key={h}>
                        <button
                          className={`slot-btn${selected ? ' slot-btn--selected' : ''}`}
                          disabled={booked}
                          onClick={() => !booked && setSelectedSlot(h)}
                          aria-pressed={selected}
                          aria-label={booked ? `${formatHour(h)} unavailable` : `Book ${formatHour(h)}`}
                        >
                          <span className="slot-time">{formatHour(h)}</span>
                          <span className="slot-end">– {formatHour(h + 1)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </article>
        )}

        {/* ── Step 5: Confirm ── */}
        {selectedSlot !== null && (
          <article className="booking-section" aria-labelledby="step5-heading">
            <header className="section-header">
              <span className="section-step-badge" aria-hidden="true">5</span>
              <hgroup>
                <p className="section-title" id="step5-heading">Confirm Booking</p>
                <p className="section-subtitle">Review your details and confirm</p>
              </hgroup>
            </header>

            <section className="confirm-wrap">
              <ul className="confirm-summary" aria-label="Booking summary">
                <li className="confirm-row">
                  <span className="confirm-row-label">Clinic</span>
                  <span className="confirm-row-value">{clinicName}</span>
                </li>
                {specialty && (
                  <li className="confirm-row">
                    <span className="confirm-row-label">Reason</span>
                    <span className="confirm-row-value">{specialty}</span>
                  </li>
                )}
                {visitDescription && (
                  <li className="confirm-row">
                    <span className="confirm-row-label">Description</span>
                    <span className="confirm-row-value">{visitDescription}</span>
                  </li>
                )}
                <li className="confirm-row">
                  <span className="confirm-row-label">Doctor</span>
                  <span className="confirm-row-value">Dr {docFullName(selectedDoctor)}</span>
                </li>
                <li className="confirm-row">
                  <span className="confirm-row-label">Date</span>
                  <span className="confirm-row-value">{formatDate(selectedDate)}</span>
                </li>
                <li className="confirm-row">
                  <span className="confirm-row-label">Time</span>
                  <span className="confirm-row-value">{formatHour(selectedSlot)} – {formatHour(selectedSlot + 1)}</span>
                </li>
              </ul>

              {error && <p role="alert" className="confirm-error">{error}</p>}

              <button className="book-btn" onClick={handleConfirm} disabled={confirming}>
                {confirming ? 'Booking…' : 'Confirm Appointment'}
              </button>
            </section>
          </article>
        )}

      </section>
    </main>
  );
}