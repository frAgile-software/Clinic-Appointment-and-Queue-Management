import React, { useState } from 'react';
import './Landing.css';



function Landing() {
  const [search, setSearch] = useState('');



  const handleSearch = (e) => {
    e.preventDefault();
  };

  return (
    <div className="landing">

      <nav className="landing-nav">
        <div className="landing-logo">CliniQ</div>
        <div className="landing-nav-btns">
          <a href="/login">
            <button className="btn">Login</button>
          </a>
          <a href="/register">
            <button className="btn btn-primary">Register</button>
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