import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';
import Header from '../../components/Header';
import './Landing.css';
import { useApi } from '../../api/useApi';


const PAGE_LIMIT = 12; //clinics per page

function Landing() {
  const [search,      setSearch]      = useState('');    // current search input
  const [clinics,     setClinics]     = useState([]);    // results from API
  const [loadingList, setLoadingList] = useState(false); // loading spinner for search
  const [isVerifying, setIsVerifying] = useState(false); // tracks backend role check
  const [hasSearched, setHasSearched] = useState(false); // true once user has searched
  const [pagination,  setPagination]  = useState({page:1, totalPages:1, total:0});
  const [page,        setPage]        = useState(1);
  const [selectedClinic,  setSelectedClinic]  = useState(null);

  const api = useApi();
  const navigate = useNavigate();
  const clinicsSectionRef = useRef(null);

  //stores what filter options are available
  const [filterOptions, setFilterOptions] = useState({
    provinces: [],
    towns: [],
    suburbs: [],
    types: [],
    services: []
  });

  //stores currently filter choices
  const [filters, setFilters] = useState({
    province: '',
    town: '',
    suburb: '',
    type: '',
    service: '',
    _orderby: 'practiceName',
    _order: 'asc',
  });

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters(f => ({ ...f, [key]: value }));
  };

  // Debounce timer ref — waits for user to stop typing before calling API
  const debounceTimer = useRef(null);

  const {
    isLoading,
    isAuthenticated,
    loginWithRedirect: login,
    user,
  } = useAuth0();

  // Gets the current time by comparing the start and end times
const isClinicOpen = (clinic) => {
  if (!clinic.practiceTimes?.open || !clinic.practiceTimes?.close) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM]   = clinic.practiceTimes.open.split(':').map(Number);
  const [closeH, closeM] = clinic.practiceTimes.close.split(':').map(Number);

  const openMinutes  = openH  * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
};


  const signup = () => login({ authorizationParams: { screen_hint: 'signup' } });

  const hasVerified = useRef(false);

  // Redirect already-logged-in users to their dashboard 
  useEffect(() => {
    const verifyUserRole = async () => {
      if (!isLoading && isAuthenticated && user) {

        if (hasVerified.current) return;  // make sure this only runs once
        hasVerified.current = true;

        setIsVerifying(true);
        try {
          
          console.log(`Attempting to get user.`);

          const data = await api.users.get(user?.sub);

          console.log("User found. Redirecting...");

          const redirectMap = {
            Patient: '/dashboard/patient',
            Staff:   '/dashboard/staff',
            Admin:   '/dashboard/admin',
          };
          navigate(redirectMap[data.role] || '/');
        } catch (error) {
          if (error.status === 404) {
            console.log("Not registred. redirecting...");
            navigate('/register');
          } else {
            console.error('Network error during verification:', error);
            setIsVerifying(false);
          }
        }
      }
    };
    verifyUserRole();
  }, [isLoading, isAuthenticated, user, navigate, api]);

  // Search the API whenever the user types
  // Debounced by 400ms so we don't fire on every keystroke.
  // Uses the filterClinic route's ?name= query param.
  // Response shape: { data: [...clinics], pagination: {...} }
  useEffect(() => {
    // Wait for user to stop typing before calling the API
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setLoadingList(true);
      setHasSearched(true);
      try {
        console.log('Fetching clinics by filters...');
        const params = {};
        if (search.trim()) params.name = search.trim();
        if (filters.province) params.province = filters.province;
        if (filters.town) params.town = filters.town;
        if (filters.suburb) params.suburb = filters.suburb;
        if (filters.type) params.type = filters.type;
        if (filters.service) params.service = filters.service;
        params._orderby = filters._orderby;
        params._order = filters._order;
        params._page = page;
        params._page_len = PAGE_LIMIT;

        const json = await api.clinics.filterAll(params);
        console.log("Clinics found:", json);

        // filterClinic returns { data: [...], pagination: {...} }
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

    // Cleanup timer on unmount or next keystroke
    return () => clearTimeout(debounceTimer.current);
  }, [search, filters, page, api]);

  // Prevent form from refreshing the page 
  const handleSearch = (e) => e.preventDefault();

  // ── Navigate to full clinic detail page on card click ─────
  const handleClinicClick = (clinic) => setSelectedClinic(clinic);
  const closePopup = () => setSelectedClinic(null);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    clinicsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        console.log("FILTERS:", filters);

        const json = await api.clinics.getFilters(filters);

        console.log("Fetched filter options:", json);
        
        setFilterOptions(json);
      } catch (error) {
        console.error("Couldn't fetch filter options:", error);
      }
    };

    fetchFilterOptions();
  }, [filters, api]);

  const buildPageRange = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
    if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '…', current - 1, current, current + 1, '…', total];
  };

  const pageRange = buildPageRange(pagination.page, pagination.totalPages);

  // Show loading screen while Auth0 / role check runs 
  if (isLoading || isVerifying) {
    return (
      <main className="landing landing--loading">
        <p>Verifying credentials…</p>
      </main>
    );
  }

  return (
    <main className="landing">
      <Header>
          <button  onClick={login}>Login</button>
          <button  onClick={signup}>Sign Up</button>
      </Header>

      {/*  Hero + search bar*/}
      <header className="landing-hero">
        <h1>Skip the queue. Book online.</h1>
        <p>Find a clinic near you and reserve your slot in minutes.</p>

        {/* Typing calls the filterClinic API with ?name= — no page nav */}
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

      </header>

      {/* Clinic cards  */}
      <section className="clinics-section" aria-label="Clinic results">

        {/* Skeleton while API call is in-flight */}
        {loadingList && (
          <ul className="clinics-grid" aria-busy="true">
            {[...Array(4)].map((_, i) => (
              <li key={i} className="clinic-card clinic-card--skeleton" aria-hidden="true" />
            ))}
          </ul>
        )}

        {/* Matched clinic cards */}
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
                aria-label={`View details for ${clinic.practiceName}`}
              >
                <strong className="clinic-name">{clinic.practiceName}</strong>
                <span   className="clinic-type">{clinic.practiceTypeDescription}</span>
                <span   className="clinic-addr">
                  {clinic.physicalAddress}, {clinic.physicalTown}
                </span>
                <span className={`clinic-badge ${isClinicOpen(clinic) ? 'clinic-badge--open' : 'clinic-badge--closed'}`}>
                  {isClinicOpen(clinic) ? 'Open now' : 'Closed'}
                </span>
              </li>
            ))}
          </ul>

          {pagination.totalPages > 1 && (
              <nav className="pagination" aria-label="Clinic results pages" >
                <button
                  className="btn pagination__btn"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  aria-label="Previous page"
                  style={{ color: '#9ca3af' }}
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
                      aria-label={`Page ${item}`}
                      aria-current={item === pagination.page ? 'page' : undefined}
                      style={item === pagination.page ? {} : { color: '#9ca3af' }}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  className="btn pagination__btn"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  aria-label="Next page"
                  style={{ color: '#9ca3af' }}
                >
                  Next →
                </button>
              </nav>
            )}
            </>
        )}

        {/* No results — only after user has typed and nothing matched */}
        {!loadingList && hasSearched && clinics.length === 0 && (
          <p className="clinics-empty">No clinics found for "{search}".</p>
        )}

      </section> {/* closes clinics-section */}


      {selectedClinic && (
  <section className="clinic-modal-overlay" onClick={closePopup}>
    <section className="clinic-modal-outer" onClick={(e) => e.stopPropagation()}>
      <section className="clinic-modal-inner">
        <section className="clinic-modal-header">
          <h2>{selectedClinic.practiceName}</h2>
          <button className="clinic-modal-close" onClick={closePopup}>X</button>
        </section>

        <section className="clinic-modal-details">
        <p>Practice Type: {selectedClinic.practiceTypeDescription || 'General Practice'}</p>
        <p>Address: {selectedClinic.physicalAddress}, {selectedClinic.physicalTown}</p>
        <p>Practice Number: {selectedClinic.practiceNumber || 'Not provided'}</p>
        <p>Contact: {selectedClinic.contactNumber || 'Not provided'}</p>
        <p>Hours: {
        selectedClinic.practiceTimes?.open && selectedClinic.practiceTimes?.close? `${selectedClinic.practiceTimes.open} – ${selectedClinic.practiceTimes.close}`: ' Hours not set'
  }</p>
</section>

        <section className="clinic-modal-footer">
          <section className="clinic-modal-badges">
            <span className={`modal-badge ${isClinicOpen(selectedClinic) ? 'status-open' : 'status-closed'}`}>
              {isClinicOpen(selectedClinic) ? 'Open now' : 'Closed'}
           </span>
          </section>
          <section style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="clinic-modal-book-btn" onClick={() => { signup(); }}>
              Join Queue
            </button>
            <button className="clinic-modal-book-btn" onClick={() => {  signup(); }}>
              Book Now
            </button>
          </section>
        </section>
      </section>
    </section>
  </section>
)}
      

      

    </main>
  );
}

export default Landing;