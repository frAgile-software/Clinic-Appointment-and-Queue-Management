import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

import './Landing.css';

function Landing() {
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
  };

  /*
      Auth0 uses
  */
  const {
    isLoading,
    isAuthenticated,
    error,
    loginWithRedirect: login,
    user,
  } = useAuth0();

  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // TODO: ```route``` will be decided by user's role AND if they have completed registration.
      const route = "/" //changes

      navigate(`/${route}`)
    }
  }, [isLoading, isAuthenticated] );

  const signup = () => {
    login({ authorizationParams: { screen_hint: "signup" } });
  };

  return (
    <div className="landing">

      <nav className="landing-nav">
        <div className="landing-logo">CliniQ</div>
        <div className="landing-nav-btns">
          <a>
            <button className="btn" onClick={login}>Login</button>
          </a>
          <a>
            <button className="btn btn-primary" onClick={signup}>Sign Up</button>
          </a>
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