import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import "./PatientDashboard.css";
import { useAuth0 } from '@auth0/auth0-react';
// import logo from './logo.svg';

import { useApiAuth } from '../../hooks/apiAuth'; 

const PAGE_LIMIT = 12;

function PatientDashboard() {
  const { user, logout: auth0Logout } = useAuth0();
  const { apiFetch } = useApiAuth();
  const navigate = useNavigate();
  
  const [patientName, setPatientName] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [cancelAppId, setCancelAppId] = useState(null);
  const [patientQueue, setPatientQueue] = useState(null);

  // --- Search & Filter State ---
  const [showSearch, setShowSearch] = useState(false); 
  const [search, setSearch] = useState('');
  const [clinics, setClinics] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [pagination, setPagination] = useState({page:1, totalPages:1, total:0});
  const [page, setPage] = useState(1);
  const [selectionError, setSelectionError] = useState("");
  
  // --- Modal State ---
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [showQueuePanel, setShowQueuePanel] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  
  const clinicsSectionRef = useRef(null);
  const debounceTimer = useRef(null);

  // Added 'services' to store the list of specialities from the backend
  const [filterOptions, setFilterOptions] = useState({
    provinces: [], towns: [], suburbs: [], types: [], services: []
  });

  const [filters, setFilters] = useState({
    province: '', town: '', suburb: '', type: '', service: '', _orderby: 'practiceName', _order: 'asc',
  });

  const logout = () => {
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.sub) {
        try {
          const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/users/${user.sub}`);
          if (response.ok) {
            const data = await response.json();
            setPatientName(data.name); 
          } else {
            console.error("Failed to fetch user profile.");
          }
        } catch (error) {
          console.error("Network error fetching user:", error);
        }
      }
    };
    fetchUserData();
  }, [user, apiFetch]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (user?.sub) {
        try {
          const res = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/appointments/${user.sub}`);
          if (res.ok) {
            const data = await res.json();
            setAppointments(data);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoadingAppointments(false);
        }
      }
    };
    fetchAppointments();
  }, [user, apiFetch]);

  useEffect(() => {
    const fetchPatientQueue = async () => {
      if (user?.sub) {
        try {
          const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/queues/patient/${user.sub}`);
          if (response.ok) {
            const data = await response.json();
            if (data.inQueue) setPatientQueue(data.queue);
          }
        } catch (error) {
          console.error("Network error fetching queue:", error);
        }
      }
    };
    fetchPatientQueue();
  }, [user, apiFetch]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      const params = new URLSearchParams();
      if (filters.province) params.set('province', filters.province);
      if (filters.town) params.set('town', filters.town);
      if (filters.suburb) params.set('suburb', filters.suburb);
      if (filters.type) params.set('type', filters.type);

      try {
        const res = await fetch(`${process.env.REACT_APP_SERVER_URL}/clinics/filters?${params}`);
        const json = await res.json();
        setFilterOptions({ ...json, services: json.services || [] });
      } catch (error) {
        console.error("Couldn't fetch filter options:", error);
      }
    };
    if (showSearch) fetchFilterOptions();
  }, [filters.province, filters.town, filters.suburb, filters.type, showSearch]);

  useEffect(() => {
    if (!showSearch) return;

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setLoadingList(true);
      setHasSearched(true);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set('name', search.trim());
        if (filters.province) params.set('province', filters.province);
        if (filters.town) params.set('town', filters.town);
        if (filters.suburb) params.set('suburb', filters.suburb);
        if (filters.type) params.set('type', filters.type);
        if (filters.service) params.set('service', filters.service); 
        params.set('_orderby', filters._orderby);
        params.set('_order', filters._order);
        params.set("_page", page);
        params.set("_page_len", PAGE_LIMIT);

        const res  = await fetch(`${process.env.REACT_APP_SERVER_URL}/clinics?${params}`);
        const json = await res.json();

        setClinics(json.data || []);
        setPagination({
          page: json.pagination?.page ?? page,
          totalPages: json.pagination?.totalPages ?? 1,
          total: json.pagination?.total ?? (json.data?.length ?? 0),
        });
      } catch (err) {
        console.error('Could not search clinics:', err);
        setClinics([]);
      } finally {
        setLoadingList(false);
      }
    }, 400);

    return () => clearTimeout(debounceTimer.current);
  }, [search, filters, page, showSearch]);

  const handleStartSearch = () => {
    setShowSearch(true);
    setTimeout(() => {
      clinicsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleConfirmQueue =async () => {
    if (!selectedService) return;

    try {
      const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/queues/`, {
        method: 'POST',
        body: JSON.stringify({
          clinicID: selectedClinic._id,
          specialityName: selectedService,
          auth0ID: user.sub,
        })
      });

      if (response.ok) {
        const queueResponse = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/queues/patient/${user.sub}`);
        const data = await queueResponse.json();
        if (data.inQueue) setPatientQueue(data.queue);
        
        setShowQueuePanel(false);
        closePopup();
      }
    } catch (error) {
      console.error("Failed to join queue:", error);
    }
  }

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters(f => ({ ...f, [key]: value }));
    if (key === 'service' && value !== '') {
      setSelectionError("");
    }
  };

  const handleSearch = (e) => e.preventDefault();
  
  const handleClinicClick = (clinic) => {
    if (!filters.service) {
      setSelectionError("Please select a reason for your visit before selecting a clinic.");
      return;
    }
    setSelectionError("");
    setSelectedClinic(clinic);
  };
  
  const closePopup = () => setSelectedClinic(null);
  
  const handlePageChange = (newPage) => {
    setPage(newPage);
    clinicsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleConfirmCancel = async () => {
    if (!cancelAppId) return;
    try {
      const res = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/appointments/${cancelAppId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAppointments(prev => prev.filter(a => a._id !== cancelAppId));
        setCancelAppId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReschedule = (app) => {
    navigate('/book', {
      state: {
        clinicId:     app.Clinic?._id,
        clinicName:   app.Clinic?.practiceName,
        clinicAddress: `${app.Clinic?.physicalAddress}, ${app.Clinic?.physicalTown}`,
        clinicType:   app.Clinic?.practiceTypeDescription,
        specialty:    app.Speciality?.SpecialityName || app.Speciality?.name || (typeof app.Speciality === 'string' ? app.Speciality : null),
        fromBookNow:  true,
        rescheduleAppointmentId: app._id,
      },
    });
  };

  // --- Navigates to booking page, passing the reason as a URL parameter ---
  const handleBookNow = () => {
    navigate('/book', {
      state: {
        clinicId:     selectedClinic._id,
        clinicName:   selectedClinic.practiceName,
        clinicAddress: `${selectedClinic.physicalAddress}, ${selectedClinic.physicalTown}`,
        clinicType:   selectedClinic.practiceTypeDescription,
        specialty:    filters.service || null,
        fromBookNow:  true,
      },
    });
  };

  const handleJoinQueue = () => {
    //shows queue joining panel, and fills in service if selected
    setSelectedService(filters.service || '');
    setShowQueuePanel(true);
  };
  
  const handleLeaveQueue = async () => {
    try {
      console.log("Queue:", patientQueue);
      const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/queues/${patientQueue.queue._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPatientQueue(null);
      }
    } catch (error) {
      console.log("Error leaving queue:", error);
    }
  };

  const buildPageRange = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
    if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '…', current - 1, current, current + 1, '…', total];
  };
  const pageRange = buildPageRange(pagination.page, pagination.totalPages);

  return (
    <section className="dashboard-container">
      <section className="dashboard-header">
        <section className="header-logo">
          <img src="/logo.svg" alt="Logo" className="logo-icon" />
          <h2>Clinics and Qs</h2>
        </section>
        
        <section className="header-nav hidden-for-mockup" aria-label="Main Navigation">
          <button className="nav-btn active">HOME</button>
          <button className="nav-btn">APPOINTMENTS</button>
          <button className="nav-btn">QUEUE STATUS</button>
        </section>

        <section className="header-actions">
          <button className="profile-btn" aria-label="Profile">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </section>
      </section>

      <section className="dashboard-main">
        <section className="purple-banner-container">
          <section className="top-section" aria-labelledby="welcome-heading">
            <section className="welcome-area">
              <h1 id="welcome-heading" className="greeting">
                Welcome Back, {patientName || "..."}!
              </h1>
              <p className="subtitle">Manage your health easily and skip the waiting room</p>
              
              <section className="action-banner">
                <section className="action-text">
                  <h3>Need to see a doctor?</h3>
                  <p>Schedule your next visit</p>
                </section>
                <button className="book-btn" onClick={handleStartSearch}>BOOK AN APPOINTMENT</button>
              </section>
            </section>

            <section className="notifications-card" aria-labelledby="notifications-heading">
              <section className="notif-header">
                <h3 id="notifications-heading">Notifications</h3>
                <span className="bell-icon" aria-hidden="true">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                </span>
              </section>
              <section className="notifications-list">
              </section>
            </section>
          </section>
        </section>

        <section className="action-grid" aria-label="Quick Actions">
          <section className="grid-card">
            <h3>Upcoming Appointments</h3>
            <p>{loadingAppointments ? 'Loading appointments...' : `You have ${appointments.length} appointment(s) upcoming`}</p>
            <button className="card-btn" onClick={() => setShowAppointmentsModal(true)}>VIEW DETAILS</button>
          </section>
          
          <section className="grid-card">
            {patientQueue ? (
              <>
                <h3>My Queue Status</h3>
                <p>{patientQueue.queue.Clinic.practiceName}</p>
                <p>{patientQueue.queue.Speciality.SpecialityName}</p>
                <p>Position: <strong>{patientQueue.position}</strong></p>
                <button className="card-btn" onClick={handleLeaveQueue}>LEAVE QUEUE</button>
              </>
            ) : (
              <>
                <h3>My Queue Status</h3>
                <p>Not currently in a queue.</p>
                <button className="card-btn" onClick={handleStartSearch}>JOIN A VIRTUAL QUEUE</button>
              </>
            )}
          </section>
        </section>

        <section className="bottom-section" aria-label="Clinic Search" ref={clinicsSectionRef}>
          {!showSearch ? (
            <section className="grid-card full-width-card">
              <h3>Find Nearest Clinic</h3>
              <p>Discover clinics in your area and their opening times</p>
              <button className="card-btn" onClick={handleStartSearch}>SEARCH CLINIC</button>
            </section>
          ) : (
            <section className="grid-card full-width-card extended-search-card">
              <section className="extended-search-header">
                <h3>Search Clinics</h3>
                <p>Find a clinic near you by name or the reason for your visit.</p>
              </section>
              
              {/* --- DUAL SEARCH BAR --- */}
              <form className="dashboard-dual-search" onSubmit={handleSearch} role="search">
                <section className="search-input-group">
                  <input
                    type="search"
                    placeholder="Clinic name (e.g. Parkmed)"
                    value={search}
                    onChange={(e) => {setSearch(e.target.value); setPage(1);}}
                    aria-label="Search by clinic name"
                  />
                </section>
                <hr className="search-divider" />
                <section className="search-select-group">
                  <select 
                    value={filters.service} 
                    onChange={e => updateFilter('service', e.target.value)}
                    aria-label="Filter by reason for visit"
                  >
                    <option value="">Reason for visit (All)</option>
                    {filterOptions.services?.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </section>
                <button type="submit" className="dual-search-btn">Search</button>
              </form>
              
              <form className="dashboard-filters">
                <select value={filters.province} onChange={e => updateFilter('province', e.target.value)}>
                  <option value="">All provinces</option>
                  {filterOptions.provinces?.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={filters.town} onChange={e => updateFilter('town', e.target.value)}>
                  <option value="">All towns</option>
                  {filterOptions.towns?.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={filters.suburb} onChange={e => updateFilter('suburb', e.target.value)}>
                  <option value="">All suburbs</option>
                  {filterOptions.suburbs?.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filters.type} onChange={e => updateFilter('type', e.target.value)}>
                  <option value="">All types</option>
                  {filterOptions.types?.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </form>

              <section className="clinics-section">
                {selectionError && (
                  <p style={{ color: '#b91c1c', backgroundColor: '#fee2e2', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontWeight: '500', fontSize: '14px' }} role="alert">
                    {selectionError}
                  </p>
                )}
                {loadingList && (
                  <ul className="clinics-grid" aria-busy="true">
                    {[...Array(4)].map((_, i) => (
                      <li key={i} className="clinic-card clinic-card--skeleton" aria-hidden="true" />
                    ))}
                  </ul>
                )}

                {!loadingList && clinics.length > 0 && (
                  <>
                    <p className="clinics-count">
                        Showing {((pagination.page - 1) * PAGE_LIMIT) + 1}–
                        {Math.min(pagination.page * PAGE_LIMIT, pagination.total)} of {pagination.total} clinics
                    </p>

                    <ul className="clinics-grid">
                      {clinics.map((clinic) => (
                        <li
                          key={clinic._id}
                          className="clinic-card"
                          onClick={() => handleClinicClick(clinic)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleClinicClick(clinic)}
                        >
                          <strong className="clinic-name">{clinic.practiceName}</strong>
                          <span className="clinic-type">{clinic.practiceTypeDescription}</span>
                          <span className="clinic-addr">
                            {clinic.physicalAddress}, {clinic.physicalTown}
                          </span>
                          <span className={`clinic-badge ${clinic.isOpen ? 'clinic-badge--open' : 'clinic-badge--closed'}`}>
                            {clinic.isOpen ? 'Open now' : 'Closed'}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {pagination.totalPages > 1 && (
                      <section className="pagination" aria-label="Clinic results pages" >
                        <button
                          className="btn pagination__btn"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                        >
                          ← Prev
                        </button>
                        {pageRange.map((item, idx) =>
                          item === '…' ? (
                            <span key={`ellipsis-${idx}`} className="pagination__ellipsis" aria-hidden="true">…</span>
                          ) : (
                            <button
                              key={item}
                              className={`btn pagination__btn ${item === pagination.page ? 'btn-primary pagination__btn--active' : ''}`}
                              onClick={() => handlePageChange(item)}
                            >
                              {item}
                            </button>
                          )
                        )}
                        <button
                          className="btn pagination__btn"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.totalPages}
                        >
                          Next →
                        </button>
                      </section>
                    )}
                  </>
                )}

                {!loadingList && hasSearched && clinics.length === 0 && (
                  <p className="clinics-empty">No clinics found matching your criteria.</p>
                )}
              </section>
            </section>
          )}
        </section>
      </section>

      {/* --- MODAL RENDERING --- */}
      {selectedClinic && (
        <section className="clinic-modal-overlay" onClick={closePopup}>
          <section className="clinic-modal-outer" onClick={(e) => e.stopPropagation()}>
            <section className="clinic-modal-inner">
              {showQueuePanel ? (
                <>
                  <section className="clinic-modal-header">
                    <p>Join Queue at</p>
                    <button className="clinic-modal-close" onClick={closePopup}>X</button>
                  </section>

                  <section className="clinic-modal-details">
                    <h3>{selectedClinic.practiceName}</h3>
                    <p>{selectedClinic.physicalAddress}</p>
                  </section>

                  <section className="clinic-modal-details">
                    <p>for the service  
                      <select
                        className=""
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                      >
                        <option value="">Select a service</option>
                        {filterOptions.services?.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </p>

                    <section className="clinic-modal-footer">
                      <button className="clinic-modal-book-btn" onClick={() => setShowQueuePanel(false)}>
                        Back
                      </button>
                      {selectedService && (
                        <button
                          className="clinic-modal-book-btn"
                          onClick={handleConfirmQueue}
                        >
                          Confirm
                        </button>
                      )}
                    </section>
                  </section>
                </>
              ) : (
                <>
                  <section className="clinic-modal-header">
                    <h2>{selectedClinic.practiceName}</h2>
                    <button className="clinic-modal-close" onClick={closePopup}>X</button>
                  </section>
                  
                  <section className="clinic-modal-details">
                    <p>Practice Type: {selectedClinic.practiceTypeDescription || 'General Practice'}</p>
                    <p>Address: {selectedClinic.physicalAddress}, {selectedClinic.physicalTown}</p>
                    <p>Practice Number: {selectedClinic.practiceNumber || 'Not provided'}</p>
                  </section>
                  
                  <section className="clinic-modal-footer">
                    <section className="clinic-modal-badges">
                      <span className={`modal-badge ${selectedClinic.isOpen ? 'status-open' : 'status-closed'}`}>
                        {selectedClinic.isOpen ? 'Open now' : 'Closed'}
                      </span>
                    </section>

                    {!patientQueue ? (
                      <button
                        className="clinic-modal-book-btn"
                        onClick={handleJoinQueue}
                      >
                        Join Queue
                      </button>
                    ): null}
                    
                    <button 
                      className="clinic-modal-book-btn" 
                      onClick={handleBookNow} 
                    >
                      Book Now
                    </button>
                  </section>
                </>
              )}
            </section>
          </section>
        </section>
      )}

      {showAppointmentsModal && (
        <section className="clinic-modal-overlay" onClick={() => setShowAppointmentsModal(false)}>
          <section className="clinic-modal-outer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <section className="clinic-modal-inner" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <section className="clinic-modal-header">
                <h2>Your Appointments</h2>
                <button className="clinic-modal-close" onClick={() => setShowAppointmentsModal(false)}>X</button>
              </section>
              
              <section className="clinic-modal-details" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loadingAppointments ? (
                  <p>Loading appointments...</p>
                ) : appointments.length === 0 ? (
                  <p>You have no upcoming appointments.</p>
                ) : (
                  appointments.map((app) => (
                    <article key={app._id} style={{ border: '1px solid #e2e4e9', padding: '1rem', borderRadius: '8px', background: '#fff' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{app.Clinic?.practiceName || 'Unknown Clinic'}</p>
                      <p>Doctor: {app.Staff?.name} {app.Staff?.surname}</p>
                      <p>Date: {new Date(app.BookingDateTime).toLocaleString('en-ZA')}</p>
                      
                      <section style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <button className="clinic-modal-book-btn" onClick={() => handleReschedule(app)}>Reschedule</button>
                        <button className="btn pagination__btn" style={{ color: '#b91c1c', borderColor: '#b91c1c' }} onClick={() => setCancelAppId(app._id)}>Cancel Appointment</button>
                      </section>
                    </article>
                  ))
                )}
              </section>
            </section>
          </section>
        </section>
      )}

      {cancelAppId && (
        <section className="clinic-modal-overlay" onClick={() => setCancelAppId(null)}>
          <section className="clinic-modal-outer" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <section className="clinic-modal-inner">
              <h3 style={{ marginTop: 0 }}>Confirm Cancellation</h3>
              <p>Are you sure you want to cancel this appointment? This action cannot be undone.</p>
              <section style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="btn pagination__btn" onClick={() => setCancelAppId(null)}>No, Keep it</button>
                <button className="clinic-modal-book-btn" style={{ backgroundColor: '#b91c1c' }} onClick={() => handleConfirmCancel()}>Yes, Cancel</button>
              </section>
            </section>
          </section>
        </section>
      )}

    </section>
  );
}

export default PatientDashboard;
