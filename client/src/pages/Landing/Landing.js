import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';

import './Landing.css';
import { useApiAuth } from '../../hooks/apiAuth';

function Landing() {
  const [search,      setSearch]      = useState('');    // current search input
  const [clinics,     setClinics]     = useState([]);    // all clinics from API
  const [loadingList, setLoadingList] = useState(true);  // skeleton while fetching
  const [isVerifying, setIsVerifying] = useState(false); // tracks backend role check

  const { apiFetch } = useApiAuth();
  const navigate     = useNavigate();

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
          const response = await apiFetch(
            `${process.env.REACT_APP_SERVER_URL}/api/users/${user.sub}`
          );
          if (response.ok) {
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

  // Fetch all clinics once on mount 
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const res  = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/clinics`);
        const data = await res.json();
        setClinics(data);
      } catch (err) {
        console.error('Could not load clinic list:', err);
      } finally {
        setLoadingList(false);
      }
    };
    fetchClinics();
  }, []);

  //  Filter by practice name only 
  // Only filter when user has typed something.
  // When search is empty, show NO cards (clean state).
  const hasSearched = search.trim().length > 0;

  const filteredClinics = hasSearched
    ? clinics.filter((clinic) =>
        clinic.practiceName?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  //Prevent form from refreshing the page 
  const handleSearch = (e) => e.preventDefault();

  // Navigate to full clinic detail page on card click 
  const handleClinicClick = (clinicId) => navigate(`/clinics/${clinicId}`);

  //Show loading screen while Auth0 / role check runs
  if (isLoading || isVerifying) {
    return (
      <main className="landing landing--loading">
        <p>Verifying credentials…</p>
      </main>
    );
  }

  return (
    <main className="landing">

      {/*  Navigation bar*/}
      <nav className="landing-nav" aria-label="Main navigation">
        <span className="landing-logo">CliniQ</span>
        <section className="landing-nav-btns">
          <button className="btn"             onClick={login}>Login</button>
          <button className="btn btn-primary" onClick={signup}>Sign Up</button>
        </section>
      </nav>

      {/* Hero and search bar  */}
      <header className="landing-hero">
        <h1>Skip the queue. Book online.</h1>
        <p>Find a clinic near you and reserve your slot in minutes.</p>

        {/* Typing filters the cards below  */}
        <form className="search-bar" onSubmit={handleSearch} role="search">
          <input
            type="search"
            placeholder="Search by clinic name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search clinics"
          />
          <button type="submit">Search</button>
        </form>
      </header>

      {/* Clinic cards */}
      <section className="clinics-section" aria-label="Clinic results">

        {/* Skeleton while the API call is in-flight */}
        {loadingList && (
          <ul className="clinics-grid" aria-busy="true">
            {[...Array(4)].map((_, i) => (
              <li key={i} className="clinic-card clinic-card--skeleton" aria-hidden="true" />
            ))}
          </ul>
        )}

        {/* Matched clinic cards — only shown once user has typed */}
        {!loadingList && filteredClinics.length > 0 && (
          <ul className="clinics-grid">
            {filteredClinics.map((clinic) => (
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
        )}

        {/* No results, only shows after user has typed and nothing matched */}
        {!loadingList && hasSearched && filteredClinics.length === 0 && (
          <p className="clinics-empty">No clinics found for "{search}".</p>
        )}

      </section>

    </main>
  );
}

export default Landing;