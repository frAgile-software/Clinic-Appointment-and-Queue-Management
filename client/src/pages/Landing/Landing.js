import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';

import './Landing.css';
import { useApiAuth } from '../../hooks/apiAuth';

function Landing() {
  const [search, setSearch] = useState('');
  const [clinics, setClinics] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);// Tracks our backend check

  const { apiFetch } = useApiAuth();
  const navigate = useNavigate();

  const {
    isLoading,
    isAuthenticated,
    loginWithRedirect: login,
    user,// We must extract the user object to get their Auth0 ID
  } = useAuth0();

  const signup = () =>
    login({ authorizationParams: { screen_hint: 'signup' } });

  // Verify user role after login
  useEffect(() => {
    const verifyUserRole = async () => {
       // Only fire if Auth0 has finished loading and confirmed they are logged in
      if (!isLoading && isAuthenticated && user) {
        setIsVerifying(true);

        try {
          // 1. Query our database for this specific Auth0 ID
          const response = await apiFetch(
            `${process.env.REACT_APP_SERVER_URL}/api/users/${user.sub}`
          );

          if (response.ok) {
                 // 2. User exists. Grab their role and route them.
            const data = await response.json();

            const redirectMap = {
              Patient: '/dashboard/patient',
              Staff: '/dashboard/staff',
              Admin: '/dashboard/admin',
            };

            navigate(redirectMap[data.role] || '/');
          } else if (response.status === 404) {
            // 3. User authenticated via Auth0, but is not in our MongoDB yet.
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

  // Fetch nearby clinics
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_SERVER_URL}/api/clinics`
        );
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

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/clinics/search?q=${encodeURIComponent(search.trim())}`);
  };

  // Clinic click handler
  const handleClinicClick = (clinicId) => {
    navigate(`/clinics/${clinicId}`);
  };

  // Loading gate
  if (isLoading || isVerifying) {
    return (
      <main className="landing landing--loading">
        <p>Verifying credentials…</p>
      </main>
    );
  }

  return (
    <main className="landing">
      {/* Navigation */}
      <nav className="landing-nav" aria-label="Main navigation">
        <span className="landing-logo">CliniQ</span>

        <section className="landing-nav-btns">
          <button className="btn" onClick={login}>
            Login
          </button>
          <button className="btn btn-primary" onClick={signup}>
            Sign Up
          </button>
        </section>
      </nav>

      {/* Hero */}
      <header className="landing-hero">
        <h1>Skip the queue. Book online.</h1>
        <p>Find a clinic near you and reserve your slot in minutes.</p>

        <form className="search-bar" onSubmit={handleSearch} role="search">
          <input
            type="search"
            placeholder="Search clinics by name or area…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search clinics"
          />
          <button type="submit">Search</button>
        </form>
      </header>

      {/* Clinics Section */}
      <section className="clinics-section" aria-label="Featured clinics">
        {loadingList && (
          <ul className="clinics-grid" aria-busy="true">
            {[...Array(4)].map((_, i) => (
              <li
                key={i}
                className="clinic-card clinic-card--skeleton"
                aria-hidden="true"
              />
            ))}
          </ul>
        )}

        {!loadingList && clinics.length > 0 && (
          <ul className="clinics-grid">
            {clinics.map((clinic) => (
              <li
                key={clinic._id}
                className="clinic-card"
                onClick={() => handleClinicClick(clinic._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleClinicClick(clinic._id)
                }
                aria-label={`View details for ${clinic.practiceName}`}
              >
                <strong className="clinic-name">
                  {clinic.practiceName}
                </strong>

                <span className="clinic-type">
                  {clinic.practiceTypeDescription}
                </span>

                <span className="clinic-addr">
                  {clinic.physicalAddress}, {clinic.physicalTown}
                </span>

                <span
                  className={`clinic-badge ${
                    clinic.isOpen
                      ? 'clinic-badge--open'
                      : 'clinic-badge--closed'
                  }`}
                >
                  {clinic.isOpen ? 'Open now' : 'Closed'}
                </span>
              </li>
            ))}
          </ul>
        )}

        {!loadingList && clinics.length === 0 && (
          <p className="clinics-empty">
            No clinics found. Try a different search.
          </p>
        )}
      </section>
    </main>
  );
}

export default Landing;