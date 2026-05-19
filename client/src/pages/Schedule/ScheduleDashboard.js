import React, { useState, useEffect, useCallback } from 'react';
import './ScheduleDashboard.css';
import { useAuth0 } from '@auth0/auth0-react';
import { useApiAuth } from '../../hooks/apiAuth';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Generate 1-hour blocks between two "HH:mm" strings
function generateHourBlocks(startTime, endTime) {
  const blocks = [];
  const [startH] = startTime.split(':').map(Number);
  const [endH]   = endTime.split(':').map(Number);
  for (let h = startH; h < endH; h++) {
    const pad = (n) => String(n).padStart(2, '0');
    blocks.push({ StartTime: `${pad(h)}:00`, EndTime: `${pad(h + 1)}:00` });
  }
  return blocks;
}

function fmt12(time24) {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function EditSchedule() {
  const { apiFetch } = useApiAuth();
  const { user }     = useAuth0();
  const staffId      = user?.sub;

  const [clinicHours, setClinicHours] = useState({});
  const [mySchedule,  setMySchedule]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(null);
  const [activeDay,   setActiveDay]   = useState(1);
  const [toast,       setToast]       = useState(null);

  //fetch clinic hours + staff schedule
  useEffect(() => {
    if (!staffId) return;
    async function load() {
      setLoading(true);

      // 1. Get assigned clinic  
      try {
        const cRes  = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/clinics/assigned/?auth0Id=${staffId}`);
        const cData = await cRes.json();
        if (cRes.ok) {
          const clinic = Array.isArray(cData) ? cData[0] : cData;
          
          const hoursMap = {};
          (clinic?.OperatingHours || []).forEach((oh) => {
            hoursMap[oh.DayOfWeek] = { StartTime: oh.StartTime, EndTime: oh.EndTime };
          });
          setClinicHours(hoursMap);
        } else {
          console.error('Could not load clinic hours:', cData);
          setClinicHours({});
        }
      } catch (err) {
        console.error('Could not load clinic hours:', err);
        setClinicHours({});
      }

      // 2. Get staff's existing schedule blocks
     
      try {
        const sRes  = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/schedules/${staffId}`);
        const sData = await sRes.json();
        setMySchedule(Array.isArray(sData.schedule) ? sData.schedule : []);
      } catch (err) {
        console.error('Could not load schedule:', err);
        setMySchedule([]);
      }

      setLoading(false);
    }
    load();
  }, [staffId, apiFetch]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  //toggle a block on/off 
  const toggleBlock = useCallback(async (dayIndex, block) => {
    const key = `${dayIndex}-${block.StartTime}`;
    setSaving(key);

    const existing = mySchedule.find(
      (s) =>
        Number(s.DayOfWeek) === dayIndex &&
        s.StartTime === block.StartTime &&
        s.EndTime   === block.EndTime
    );

    try {
      if (existing) {
        // DELETE staff unchecks slot
        const res = await apiFetch(
          `${process.env.REACT_APP_SERVER_URL}/api/schedules/${existing._id}?staffId=${staffId}`,
          { method: 'DELETE' }
        );
        if (!res.ok) throw new Error('Delete failed');
        setMySchedule((prev) => prev.filter((s) => s._id !== existing._id));
        showToast(`Removed ${fmt12(block.StartTime)} – ${fmt12(block.EndTime)}`, 'remove');
      } else {
        // POST — staff checks slot back in
        const res = await apiFetch(
          `${process.env.REACT_APP_SERVER_URL}/api/schedules`,
          {
            method: 'POST',
            body: JSON.stringify({
              staffId,
              DayOfWeek: dayIndex,
              StartTime: block.StartTime,
              EndTime:   block.EndTime,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Create failed');
        setMySchedule((prev) => [...prev, data.schedule]);
        showToast(`Added ${fmt12(block.StartTime)} – ${fmt12(block.EndTime)}`);
      }
    } catch (err) {
      console.error('Toggle error:', err);
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setSaving(null);
    }
  }, [mySchedule, staffId, apiFetch]);

  // ── derived data ─────────────────────────────────────────────
  const activeDayHours = clinicHours?.[activeDay];
  const allBlocks      = activeDayHours
    ? generateHourBlocks(activeDayHours.StartTime, activeDayHours.EndTime)
    : [];

  const isSelected = (dayIndex, block) =>
    mySchedule.some(
      (s) =>
        Number(s.DayOfWeek) === dayIndex &&
        s.StartTime === block.StartTime &&
        s.EndTime   === block.EndTime
    );

  const selectedCountForDay = (dayIndex) => {
    if (!clinicHours?.[dayIndex]) return null;
    return mySchedule.filter((s) => Number(s.DayOfWeek) === dayIndex).length;
  };

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

      {/* ── Header ── */}
      
       <header className="es-header">
         <nav className="es-header-nav">
           <button className="es-back-btn" onClick={() => window.history.back()}>
                ← Back
           </button>
        </nav>
      <section className="es-header-brand">
        <img src="/logo.svg" alt="Clinics and Qs" className="es-logo" />
        <span className="es-brand-name">Clinics and Qs</span>
    </section>
       </header>

      {/* Hero banner  */}
      <section className="es-hero">
        <h1 className="es-hero-title">Edit Your Schedule</h1>
       
      </section>

      {/* Page body*/}
      <section className="es-body">

        {/* ── Weekly Schedule ── */}
        <article className="es-section">
          <header className="es-section-header">
            <span className="es-step-badge">1</span>
            <section className="es-section-header-text">
              <h2 className="es-section-title">Weekly Availability</h2>
              <p className="es-section-sub">Tap blocks to toggle your working hours</p>
            </section>
          </header>

          {/* Day tabs */}
          <nav className="es-day-tabs">
            {DAYS.map((day, i) => {
              const count  = selectedCountForDay(i);
              const closed = count === null;
              return (
                <button
                  key={i}
                  className={`es-day-tab ${activeDay === i ? 'es-day-tab--active' : ''} ${closed ? 'es-day-tab--closed' : ''}`}
                  onClick={() => !closed && setActiveDay(i)}
                  disabled={closed}
                  title={closed ? `${day} — clinic closed` : day}
                >
                  <span className="es-day-tab-short">{DAY_SHORT[i]}</span>
                  {!closed && <span className="es-day-tab-badge">{count}</span>}
                {/*  {closed  && <span className="es-day-tab-closed-label">Off</span>} */}
                </button>
              );
            })}
          </nav>

          {/* Block grid */}
          <section className="es-blocks-area">
            <header className="es-day-label">
              <strong>{DAYS[activeDay]}</strong>
              {activeDayHours && (
                <span className="es-day-hours">
                  Clinic: {fmt12(activeDayHours.StartTime)} – {fmt12(activeDayHours.EndTime)}
                </span>
              )}
            </header>

            {allBlocks.length === 0 ? (
              <p className="es-no-blocks">No blocks available for this day.</p>
            ) : (
              <ul className="es-blocks-grid">
                {allBlocks.map((block) => {
                  const selected = isSelected(activeDay, block);
                  const key      = `${activeDay}-${block.StartTime}`;
                  const busy     = saving === key;
                  return (
                    <li key={key}>
                      <button
                        className={`es-block-btn ${selected ? 'es-block-btn--on' : 'es-block-btn--off'} ${busy ? 'es-block-btn--saving' : ''}`}
                        onClick={() => toggleBlock(activeDay, block)}
                        disabled={busy}
                        aria-pressed={selected}
                      >
                        {busy ? (
                          <span className="es-block-spinner" />
                        ) : (
                          <>
                            <span className="es-block-time">{fmt12(block.StartTime)}</span>
                            <span className="es-block-sep">→</span>
                            <span className="es-block-time">{fmt12(block.EndTime)}</span>
                            <span className="es-block-status">{selected ? '✓ On' : '+ Add'}</span>
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

        {/*  Days Off Section (placeholder) */}
        <article className="es-section es-section--coming">
          <header className="es-section-header">
            <span className="es-step-badge">2</span>
            <section className="es-section-header-text">
              <h2 className="es-section-title">Days Off</h2>
              <p className="es-section-sub">Request specific dates off</p>
            </section>
          </header>
          <section className="es-coming-soon-body"></section>
        </article>

      </section>

      {/* Toast */}
      {toast && (
        <aside className={`es-toast es-toast--${toast.type}`} role="status" aria-live="polite">
          {toast.type === 'success' && '✓ '}
          {toast.type === 'remove'  && '– '}
          {toast.type === 'error'   && '! '}
          {toast.msg}
        </aside>
      )}

    </main>
  );
}