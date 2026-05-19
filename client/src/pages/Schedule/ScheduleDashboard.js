import React, { useState, useEffect, useCallback } from 'react';
import './ScheduleDashboard.css';
import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from '../../api/useApi';

const DAYS      = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


function fmt12(time24) {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function pad(n) { return String(n).padStart(2, '0'); }

// Generate 1-hour slots: "08:00", "09:00".
function buildSlots(openTime, closeTime) {
  if (!openTime || !closeTime) return [];
  const [oh] = openTime.split(':').map(Number);
  const [ch] = closeTime.split(':').map(Number);
  const slots = [];
  for (let h = oh; h < ch; h++) {
    slots.push(`${pad(h)}:00`);
  }
  return slots;
}

function endOf(startTime) {
  const [h] = startTime.split(':').map(Number);
  return `${pad(h + 1)}:00`;
}


export default function EditSchedule() {
  
const { user }     = useAuth0();
 const api          = useApi();              
 const staffId      = user?.sub;

  const [mySchedule,  setMySchedule]  = useState([]);
  const [clinicSlots, setClinicSlots] = useState([]); // 1-hour slots from clinic hours
  const [loading,     setLoading]     = useState(true);
  const [activeDay,   setActiveDay]   = useState(1);
  const [pending,     setPending]     = useState(new Set());
  const [toast,       setToast]       = useState(null);

  // load staff + clinic + schedule 
  useEffect(() => {
  if (!staffId) return;
  async function load() {
    setLoading(true);
    try {
      const clinics   = await api.clinics.getAssignedClinics(staffId);
      const clinic    = clinics?.[0];
      const open      = clinic?.practiceTimes?.open;
      const close     = clinic?.practiceTimes?.close;
      setClinicSlots(buildSlots(open, close));

      const schedData = await api.schedules.getSchedule(staffId);
      setMySchedule(Array.isArray(schedData.schedule) ? schedData.schedule : []);
    } catch (err) {
      console.error('Could not load schedule:', err);
      setMySchedule([]);
      setClinicSlots([]);
    }
    setLoading(false);
  }
  load();
}, [staffId, api]);

  //toast 
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  
  const blockMap = mySchedule.reduce((acc, b) => {
  const day   = Number(b.DayOfWeek);
  const start = b.StartTime.slice(0, 5);  
  acc[`${day}-${start}`] = b;
  return acc;
}, {});

  const countForDay = (dayIndex) =>
    mySchedule.filter(b => Number(b.DayOfWeek) === dayIndex).length;

  // delete a block 
  const deleteBlock = useCallback(async (block) => {
  const key = block._id;
  if (pending.has(key)) return;
  setPending(prev => new Set(prev).add(key));
  try {
    await api.schedules.delete(block._id, staffId);
    setMySchedule(prev => prev.filter(b => b._id !== block._id));
    showToast('Timeslot removed', 'remove');
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Something went wrong', 'error');
  } finally {
    setPending(prev => { const n = new Set(prev); n.delete(key); return n; });
  }
}, [pending, staffId, api]);

const addBlock = useCallback(async (dayIndex, startSlot) => {
  const key = `add-${dayIndex}-${startSlot}`;
  if (pending.has(key)) return;
  setPending(prev => new Set(prev).add(key));
  try {
    const { schedule } = await api.schedules.create({
      staffId,
      DayOfWeek: dayIndex,
      StartTime: startSlot,
      EndTime:   endOf(startSlot),
    });
    setMySchedule(prev => [...prev, schedule]);
    showToast('Timeslot added');
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Something went wrong', 'error');
  } finally {
    setPending(prev => { const n = new Set(prev); n.delete(key); return n; });
  }
}, [pending, staffId, api]);
  //render 
  if (loading) {
    return (
      <main className="es-page">
        <section className="es-loading">
          <span className="es-spinner" />
          <p>Loading your schedule…</p>
        </section>
      </main>
    );
  }

  return (
    <main className="es-page">

      <header className="es-header">
        <nav className="es-header-nav">
          <button className="es-back-btn" onClick={() => window.history.back()}>← Back</button>
        </nav>
        <section className="es-header-brand">
          <img src="/logo.svg" alt="Clinics and Qs" className="es-logo" />
          <span className="es-brand-name">Clinics and Qs</span>
        </section>
      </header>

      <section className="es-hero">
        <h1 className="es-hero-title">Edit Your Schedule</h1>
      </section>

      <section className="es-body">
        <article className="es-section">
          <header className="es-section-header">
            <span className="es-step-badge">1</span>
            <section className="es-section-header-text">
              <h2 className="es-section-title">Weekly Availability</h2>
              
            </section>
          </header>

          {/* Day tabs */}
          <nav className="es-day-tabs">
            {DAYS.map((day, i) => (
              <button
                key={i}
                className={`es-day-tab ${activeDay === i ? 'es-day-tab--active' : ''}`}
                onClick={() => setActiveDay(i)}
                title={day}
              >
                <span className="es-day-tab-short">{DAYS[i]}</span>
                <span className="es-day-tab-badge">{countForDay(i)}</span>
              </button>
            ))}
          </nav>

          {/* Slot grid */}
          <section className="es-blocks-area">
            <header className="es-day-label">
              <strong>{DAYS[activeDay]}</strong>
            </header>

            {clinicSlots.length === 0 ? (
              <p className="es-no-blocks">Clinic hours not set — contact your administrator.</p>
            ) : (
              <ul className="es-blocks-grid">
                {clinicSlots.map((slot) => {
                  const mapKey    = `${activeDay}-${slot}`;
                  const block     = blockMap[mapKey];   // exists if staff works this slot
                  const isOn      = !!block;
                  const pendKey   = isOn ? block._id : `add-${activeDay}-${slot}`;
                  const isBusy    = pending.has(pendKey);

                  return (
                    <li key={slot}>
                      <button
                        className={`es-block-btn ${isOn ? 'es-block-btn--on' : 'es-block-btn--off'} ${isBusy ? 'es-block-btn--busy' : ''}`}
                        aria-pressed={isOn}
                        disabled={isBusy}
                        onClick={() => isOn ? deleteBlock(block) : addBlock(activeDay, slot)}
                        title={isOn ? 'Click to mark unavailable' : 'Click to mark available'}
                      >
                        {isBusy ? (
                          <span className="es-block-spinner" />
                        ) : (
                          <>
                            <span className="es-block-time">{fmt12(slot)}</span>
                            <span className="es-block-sep">→</span>
                            <span className="es-block-time">{fmt12(endOf(slot))}</span>
                           
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <footer className="es-legend">
              <span className="es-legend-item">
                <span className="es-legend-dot es-legend-dot--on" /> Working
              </span>
              <span className="es-legend-item">
                <span className="es-legend-dot es-legend-dot--off" /> Not working
              </span>
            </footer>
          </section>
        </article>

        <article className="es-section es-section--coming">
          <header className="es-section-header">
            <span className="es-step-badge">2</span>
            <section className="es-section-header-text">
              <h2 className="es-section-title">Days Off</h2>
              <p className="es-section-sub">Request specific dates off</p>
            </section>
          </header>
          <section className="es-coming-soon-body" />
        </article>
      </section>

      {toast && (
        <aside className={`es-toast es-toast--${toast.type}`} role="status" aria-live="polite">
          {toast.type === 'success'  }
          {toast.type === 'remove'  }
          {toast.type === 'error'  }
          {toast.msg}
        </aside>
      )}

    </main>
  );
}