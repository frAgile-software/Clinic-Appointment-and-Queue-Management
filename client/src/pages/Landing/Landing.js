import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';

import './Landing.css';
import { useApiAuth } from '../../hooks/apiAuth';


const PAGE_LIMIT = 12; //clinics per page

function Landing() {
  const [search,      setSearch]      = useState('');    // current search input
  const [clinics,     setClinics]     = useState([]);    // results from API
  const [loadingList, setLoadingList] = useState(false); // loading spinner for search
  const [isVerifying, setIsVerifying] = useState(false); // tracks backend role check
  const [hasSearched, setHasSearched] = useState(false); // true once user has searched
  const [pagination,  setPagination]  = useState({page:1, totalPages:1, total:0});
  const [page,        setPage]        = useState(1);

  const { apiFetch } = useApiAuth();
  const navigate     = useNavigate();
  const clinicsSectionRef = useRef(null);

  //stores what filter options are available
  const [filterOptions, setFilterOptions] = useState({
    provinces: [],
    towns: [],
    suburbs: [],
    types: []
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

  const signup = () => login({ authorizationParams: { screen_hint: 'signup' } });

  // Redirect already-logged-in users to their dashboard 
  useEffect(() => {
    const verifyUserRole = async () => {
      if (!isLoading && isAuthenticated && user) {
        setIsVerifying(true);
        try {
          
          console.log(`Attempting to get user from url ${process.env.REACT_APP_SERVER_URL}/api/users/${user.sub}`);
          const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/users/${user.sub}`);

          if (response.ok) {
            console.log("User found. Redirecting...");
            const data = await response.json();
            const redirectMap = {
              Patient: '/dashboard/patient',
              Staff:   '/dashboard/staff',
              Admin:   '/dashboard/admin',
            };
            navigate(redirectMap[data.role] || '/');
          } else if (response.status === 404) {
            navigate('/register');
          } else {
            console.error('Failed to verify user profile.');
            setIsVerifying(false);
          }
        } catch (error) {
          console.error('Network error during verification:', error);
          setIsVerifying(false);
        }
      }
    };
    verifyUserRole();
  }, [isLoading, isAuthenticated, user, navigate, apiFetch]);

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

        console.log("Trying to fetch:",`${process.env.REACT_APP_SERVER_URL}/clinics?${params}`);
        const res  = await fetch(`${process.env.REACT_APP_SERVER_URL}/clinics?${params}`);
        const json = await res.json();

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
  }, [search, filters, page]);

  // Prevent form from refreshing the page 
  const handleSearch = (e) => e.preventDefault();

  // ── Navigate to full clinic detail page on card click ─────
  const handleClinicClick = (clinicId) => navigate(`/clinics/${clinicId}`);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    clinicsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  useEffect(() => {
    const fetchFilterOptions = async () => {
      const params = new URLSearchParams();
      if (filters.province) params.set('province', filters.province);
      if (filters.town) params.set('town', filters.town);
      if (filters.suburb) params.set('suburb', filters.suburb);
      if (filters.type) params.set('type', filters.type);

      try {
        console.log("FILTERS:", filters);
        console.log(`Attempting to get filters from ${process.env.REACT_APP_SERVER_URL}/clinics/filters?${params}`);
        const res = await fetch(`${process.env.REACT_APP_SERVER_URL}/clinics/filters?${params}`);
        const json = await res.json();

        setFilterOptions(json);
      } catch (error) {
        console.error("Couldn't fetch filter options:", error);
      }
    };

    fetchFilterOptions();
  }, [filters.province, filters.town, filters.suburb, filters.type, filters]);

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
      <nav className="landing-nav" aria-label="Main navigation">
        <span className="landing-logo">
          {/* Use a leading slash to point to the root of the public folder */}
          <img src="/logo.svg" alt="Clinics and Qs Logo" className="nav-logo-img" />
          Clinics and Qs
        </span>
        <section className="landing-nav-btns">
          <button className="btn" onClick={login}>Login</button>
          <button className="btn btn-primary" onClick={signup}>Sign Up</button>
        </section>
      </nav>

      {/*  Hero + search bar*/}
      <header className="landing-hero">
        <h1>Skip the queue. Book online.</h1>
        <p>Find a clinic near you and reserve your slot in minutes.</p>

        {/* Typing calls the filterClinic API with ?name= — no page nav */}
        <form className="search-bar" onSubmit={handleSearch} role="search">
          <input
            type="search"
            placeholder="Search by clinic name…"
            value={search}
            onChange={(e) => {setSearch(e.target.value); setPage(1);}}
            aria-label="Search clinics"
          />
          <button type="submit">Search</button>
        </form>
        <form>
          <select value={filters.province} onChange={e => updateFilter('province', e.target.value)}>
            <option value="">All provinces</option>
            {filterOptions.provinces.map(p => (
                <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select value={filters.town} onChange={e => updateFilter('town', e.target.value)}>
            <option value="">All towns</option>
            {filterOptions.towns.map(t => (
                <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select value={filters.suburb} onChange={e => updateFilter('suburb', e.target.value)}>
            <option value="">All suburbs</option>
            {filterOptions.suburbs.map(s => (
                <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select value={filters.type} onChange={e => updateFilter('type', e.target.value)}>
            <option value="">All types</option>
            {filterOptions.types.map(t => (
                <option key={t} value={t}>{t}</option>
            ))}
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
                onClick={() => handleClinicClick(clinic._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleClinicClick(clinic._id)}
                aria-label={`View details for ${clinic.practiceName}`}
              >
                <strong className="clinic-name">{clinic.practiceName}</strong>
                <span   className="clinic-type">{clinic.practiceTypeDescription}</span>
                <span   className="clinic-addr">
                  {clinic.physicalAddress}, {clinic.physicalTown}
                </span>
                <span className={`clinic-badge ${clinic.isOpen ? 'clinic-badge--open' : 'clinic-badge--closed'}`}>
                  {clinic.isOpen ? 'Open now' : 'Closed'}
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

      </section>

    </main>
  );
}

export default Landing;