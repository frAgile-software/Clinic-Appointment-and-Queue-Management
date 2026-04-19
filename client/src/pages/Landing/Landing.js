import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';

import './Landing.css';
import { useApiAuth } from '../../hooks/apiAuth';

function Landing() {
  const [search, setSearch] = useState('');
  const [isVerifying, setIsVerifying] = useState(false); // Tracks our backend check
  const {apiFetch} = useApiAuth();

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const {
    isLoading,
    isAuthenticated,
    loginWithRedirect: login,
    user, // We must extract the user object to get their Auth0 ID
  } = useAuth0();

  const navigate = useNavigate();

  useEffect(() => {
    const verifyUserRole = async () => {
      // Only fire if Auth0 has finished loading and confirmed they are logged in
      if (!isLoading && isAuthenticated && user) {
        setIsVerifying(true);
        try {
          // 1. Query our database for this specific Auth0 ID
          const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/users/${user.sub}`);

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
            console.error("Failed to verify user profile.");
            setIsVerifying(false);
          }
        } catch (error) {
          console.error("Network error during verification:", error);
          setIsVerifying(false);
        }
      }
    };

    verifyUserRole();
  }, [isLoading, isAuthenticated, user, navigate, apiFetch]);

  const signup = () => {
    login({ authorizationParams: { screen_hint: "signup" } });
  };

  // Prevent the page from flashing the main layout while verifying credentials
  if (isLoading || isVerifying) {
    return (
      <div className="landing" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Verifying credentials...</h2>
      </div>
    );
  }

  return (
    <div className="landing">

      <nav className="landing-nav">
        <div className="landing-logo">CliniQ</div>
        <div className="landing-nav-btns">
            <button className="btn" onClick={login}>Login</button>
            <button className="btn btn-primary" onClick={signup}>Sign Up</button>
        </div>
      </nav>

      <div className="landing-hero">
        <h1>Skip the queue. Book online.</h1>
        <p>Find a clinic near you and reserve your slot in minutes.</p>
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search clinics by name or area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

    </div>
  );
}

export default Landing;