import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from '../../api/useApi';
import './Booking.css';
import Header from '../../components/Header';

/* ── Helpers ── */

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

function getMondayOf(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day  = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function buildWeekCells(weekStart, windowDates, schedule, offDays) {
  const windowSet = new Set(windowDates.map(d => d.toDateString()));
  const offDaySet = new Set((offDays || []).map(od => od.date?.slice(0, 10)));
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    d.setHours(0, 0, 0, 0);

    const inWindow      = windowSet.has(d.toDateString());
    const dbDay         = d.getDay();
    const docWorksToday = schedule.some(s => Number(s.DayOfWeek) === dbDay);
    const isToday       = d.toDateString() === new Date().toDateString();
    const dateStr       = d.toISOString().slice(0, 10);
    const isOffDay      = offDaySet.has(dateStr);

    return {
      date:         d,
      dayName:      DAY_NAMES[d.getDay()],
      dayNum:       d.getDate(),
      inWindow,
      docWorksToday,
      isOffDay,
      isAvail:      inWindow && docWorksToday && !isOffDay,
      isToday,
    };
  });
}

function fmt12(time24) {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function pad(n) { return String(n).padStart(2, '0'); }

function formatDate(date) {
  return date.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function docFullName(doc) {
  if (!doc) return '';
  return `${doc.name || ''} ${doc.surname || ''}`.trim();
}

/* ── Component ── */
export default function Booking() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const api       = useApi();
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
  const [visitDescription,    setVisitDescription]    = useState('');
  const [doctors,             setDoctors]             = useState([]);
  const [loadingDoctors,      setLoadingDoctors]      = useState(false);
  const [selectedDoctor,      setSelectedDoctor]      = useState(null);
  const [schedule,            setSchedule]            = useState([]);
  const [loadingSchedule,     setLoadingSchedule]     = useState(false);
  const [offDays,             setOffDays]             = useState([]);
  const [loadingOffDays,      setLoadingOffDays]      = useState(false);
  const [weekStart,           setWeekStart]           = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return getMondayOf(today);
  });
  const [selectedDate,        setSelectedDate]        = useState(null);
  const [myAppointments,      setMyAppointments]      = useState([]);
  const [loadingMyAppts,      setLoadingMyAppts]      = useState(false);
  const [doctorAppointments,  setDoctorAppointments]  = useState([]);
  const [loadingDoctorAppts,  setLoadingDoctorAppts]  = useState(false);
  const [selectedSlot,        setSelectedSlot]        = useState(null);
  const [confirming,          setConfirming]          = useState(false);
  const [success,             setSuccess]             = useState(false);
  const [error,               setError]               = useState('');

  /* ── Derived ── */
  const windowDates = getBookingWindow();
  const weekCells   = buildWeekCells(weekStart, windowDates, schedule, offDays);

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

  /* ── Check if a slot is already booked by the patient ── */
  const isPatientBooked = useCallback((slot) => {
    if (!selectedDate || !myAppointments.length) return false;
    const dateStr = selectedDate.toISOString().slice(0, 10);
    return myAppointments.some(appt => {
      if (!appt.BookingDateTime) return false;
      const apptDate    = new Date(appt.BookingDateTime);
      const apptDateStr = apptDate.toISOString().slice(0, 10);
      const apptHour    = `${pad(apptDate.getUTCHours())}:00`;
      return apptDateStr === dateStr && apptHour === slot.StartTime.slice(0, 5);
    });
  }, [selectedDate, myAppointments]);

  /* ── Check if a slot is already booked by the doctor ── */
  const isDoctorBooked = useCallback((slot) => {
    if (!selectedDate || !doctorAppointments.length) return false;
    const dateStr = selectedDate.toISOString().slice(0, 10);
    return doctorAppointments.some(appt => {
      if (!appt.BookingDateTime) return false;
      const apptDate    = new Date(appt.BookingDateTime);
      const apptDateStr = apptDate.toISOString().slice(0, 10);
      const apptHour    = `${pad(apptDate.getUTCHours())}:00`;
      return apptDateStr === dateStr && apptHour === slot.StartTime.slice(0, 5);
    });
  }, [selectedDate, doctorAppointments]);

  /* ── Slots for the selected day ── */
  const slotsForDay = (() => {
    if (!selectedDate || !schedule.length) return [];
    const dbDay = selectedDate.getDay();
    return schedule
      .filter(s => Number(s.DayOfWeek) === dbDay)
      .sort((a, b) => a.StartTime.localeCompare(b.StartTime));
  })();

  /* ── Load doctors ── */
  useEffect(() => {
    if (!clinicId) return;
    (async () => {
      setLoadingDoctors(true);
      try {
        const data = await api.clinics.listStaff(clinicId);
        setDoctors(data.users || []);
      } catch {
        setDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    })();
  }, [clinicId, api]);

  /* ── Load patient's own appointments once ── */
  useEffect(() => {
    if (!user?.sub) return;
    (async () => {
      setLoadingMyAppts(true);
      try {
        const data = await api.appointments.getForAuth0Id(user.sub, { statuses: ['Scheduled', 'Waiting', 'In Consult'] });
        setMyAppointments(Array.isArray(data) ? data : data.appointments || []);
      } catch {
        setMyAppointments([]);
      } finally {
        setLoadingMyAppts(false);
      }
    })();
  }, [user?.sub, api]);

  /* ── Load doctor's appointments when date or doctor changes ── */
  useEffect(() => {
    if (!selectedDate || !selectedDoctor) return;
    (async () => {
      setLoadingDoctorAppts(true);
      try {
        const data = await api.appointments.getForAuth0Id(selectedDoctor.auth0Id, {
          statuses: ['Scheduled', 'Waiting', 'In Consult'],
        });
        setDoctorAppointments(Array.isArray(data) ? data : data.appointments || []);
      } catch {
        setDoctorAppointments([]);
      } finally {
        setLoadingDoctorAppts(false);
      }
    })();
  }, [selectedDate, selectedDoctor, api]);

  /* ── Load schedule + off days when doctor selected ── */
  const loadDoctorData = useCallback(async (doctor) => {
    const staffId = doctor.auth0Id;

    setSchedule([]);
    setOffDays([]);
    setDoctorAppointments([]);
    setSelectedDate(null);
    setSelectedSlot(null);
    setLoadingSchedule(true);
    setLoadingOffDays(true);

    try {
      const schedData = await api.schedules.getSchedule(staffId);
      setSchedule(Array.isArray(schedData.schedule) ? schedData.schedule : []);
    } catch {
      setSchedule([]);
    } finally {
      setLoadingSchedule(false);
    }

    try {
      const offData = await api.schedules.getOffDays(staffId);
      setOffDays(Array.isArray(offData.offDays) ? offData.offDays : []);
    } catch {
      setOffDays([]);
    } finally {
      setLoadingOffDays(false);
    }
  }, [api]);

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    loadDoctorData(doctor);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setWeekStart(getMondayOf(today));
  };

  /* ── Confirm booking ── */
  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setConfirming(true);
    setError('');
    try {
      const bookingDate = new Date(selectedDate);
      const [slotHour]  = selectedSlot.StartTime.split(':').map(Number);
      bookingDate.setHours(slotHour, 0, 0, 0);

      await api.appointments.create({
        clinicId,
        staffUserId:     selectedDoctor._id,
        patientAuth0Id:  user?.sub,
        bookingDateTime: bookingDate.toISOString(),
        description:     visitDescription,
        specialityName:  specialty,
      });

      if (rescheduleAppointmentId) {
        await api.appointments.cancel(rescheduleAppointmentId);
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
      <Header />
      <section className="booking-body">
        <article className="booking-section">
          <section className="booking-success" aria-label="Booking confirmation">
            <p className="success-icon" aria-hidden="true">✓</p>
            <h2 className="success-title">Appointment Booked!</h2>
            <p className="success-sub">
              {formatDate(selectedDate)} at {fmt12(selectedSlot.StartTime)}
            </p>
            <p className="success-sub">Dr {docFullName(selectedDoctor)} · {clinicName}</p>
            <button className="success-btn" onClick={() => navigate('/dashboard/patient')}>
              Go to My Appointments
            </button>
          </section>
        </article>
      </section>
    </main>
  );

  const isLoadingCalendar = loadingSchedule || loadingOffDays;

  /* ── Main render ── */
  return (
    <main className="booking-page">

      <Header>
        <button className="booking-nav-back" onClick={() => navigate(-1)}>← Back</button>
      </Header>

      {/* Hero */}
      <header className="booking-hero" aria-label="Booking context">
        <h1 className="booking-hero-title">
          {rescheduleAppointmentId ? 'Reschedule Appointment' : 'Book an Appointment'}
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

            {isLoadingCalendar ? (
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
                    if (isSelected)         cls += ' cal-cell--selected';
                    else if (cell.isOffDay) cls += ' cal-cell--offday';
                    else if (cell.isAvail)  cls += ' cal-cell--available';
                    else                    cls += ' cal-cell--unavailable';
                    if (cell.isToday)       cls += ' cal-cell--today';

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
                        aria-label={
                          cell.isOffDay
                            ? `${formatDate(cell.date)} — day off`
                            : cell.isAvail
                            ? `Select ${formatDate(cell.date)}`
                            : undefined
                        }
                        aria-pressed={isSelected || undefined}
                        title={cell.isOffDay ? 'Day off' : undefined}
                      >
                        <span className="week-cell-name">{cell.dayName}</span>
                        <span className="week-cell-num">{cell.dayNum}</span>
                        {cell.isOffDay && <span className="week-cell-offday-label">Off</span>}
                      </li>
                    );
                  })}
                </ol>

                <section className="cal-legend">
                  <span className="legend-dot legend-dot--avail" /> Available
                  <span className="legend-dot legend-dot--unavail" style={{ marginLeft: 16 }} /> Unavailable
                  <span className="legend-dot legend-dot--offday" style={{ marginLeft: 16 }} /> Day Off
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
                <p className="section-subtitle">Available slots for {formatDate(selectedDate)}</p>
              </hgroup>
            </header>

            <section className="slots-wrap">
              {loadingMyAppts || loadingDoctorAppts ? (
                <span className="skeleton" style={{ display: 'block', height: 90, borderRadius: 10 }} aria-hidden="true" />
              ) : slotsForDay.length === 0 ? (
                <p className="slots-empty">No availability on this day. Please pick another date.</p>
              ) : (
                <>
                  <ul className="es-blocks-grid" aria-label="Available time slots">
                    {slotsForDay.map(slot => {
                      const alreadyBooked = isPatientBooked(slot);
                      const doctorTaken   = isDoctorBooked(slot);
                      const isBusy        = alreadyBooked || doctorTaken;
                      const isSelected    = selectedSlot?._id === slot._id ||
                                            selectedSlot?.StartTime === slot.StartTime;

                      return (
                        <li key={slot._id || slot.StartTime}>
                          <button
                            className={`es-block-btn ${isSelected ? 'es-block-btn--on' : 'es-block-btn--off'} ${isBusy ? 'es-block-btn--busy' : ''}`}
                            aria-pressed={isSelected}
                            disabled={isBusy}
                            onClick={() => !isBusy && setSelectedSlot(slot)}
                            title={
                              alreadyBooked
                                ? 'You already have an appointment at this time'
                                : doctorTaken
                                ? 'This slot is already booked'
                                : isSelected
                                ? 'Selected'
                                : 'Click to select'
                            }
                          >
                            <span className="es-block-time">{fmt12(slot.StartTime.slice(0, 5))}</span>
                            <span className="es-block-sep">→</span>
                            <span className="es-block-time">{fmt12(slot.EndTime.slice(0, 5))}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <footer className="es-legend">
                    <span className="es-legend-item">
                      <span className="es-legend-dot es-legend-dot--on" /> Selected
                    </span>
                    <span className="es-legend-item">
                      <span className="es-legend-dot es-legend-dot--off" /> Available
                    </span>
                    <span className="es-legend-item">
                      <span className="es-legend-dot es-legend-dot--busy" /> Unavailable
                    </span>
                  </footer>
                </>
              )}
            </section>
          </article>
        )}

        {/* ── Step 5: Confirm ── */}
        {selectedSlot && (
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
                  <span className="confirm-row-value">
                    {fmt12(selectedSlot.StartTime.slice(0, 5))} – {fmt12(selectedSlot.EndTime.slice(0, 5))}
                  </span>
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