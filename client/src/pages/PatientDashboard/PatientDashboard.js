import React from "react";
import "./PatientDashboard.css";
import { useAuth0 } from '@auth0/auth0-react';
import logo from './logo.svg';

function PatientDashboard() {
  const mockPatientName = "John Doe";
  const { logout: auth0Logout } = useAuth0();

  const logout = () => {
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-logo">
          <img src={logo} alt="Logo" className="logo-icon" />
          <h2>Clinics and Qs</h2>
        </div>
        
        <nav className="header-nav hidden-for-mockup" aria-label="Main Navigation">
          <button className="nav-btn active">HOME</button>
          <button className="nav-btn">APPOINTMENTS</button>
          <button className="nav-btn">QUEUE STATUS</button>
        </nav>

        <div className="header-actions">
          <button className="profile-btn" aria-label="Profile">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="purple-banner-container">
          <section className="top-section" aria-labelledby="welcome-heading">
            <article className="welcome-area">
              <h1 id="welcome-heading" className="greeting">Welcome Back, {mockPatientName}!</h1>
              <p className="subtitle">Manage your health easily and skip the waiting room</p>
              
              <div className="action-banner">
                <div className="action-text">
                  <h3>Need to see a doctor?</h3>
                  <p>Schedule your next visit</p>
                </div>
                <button className="book-btn">BOOK AN APPOINTMENT</button>
              </div>
            </article>

            <aside className="notifications-card" aria-labelledby="notifications-heading">
              <header className="notif-header">
                <h3 id="notifications-heading">Notifications</h3>
                <span className="bell-icon" aria-hidden="true">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                </span>
              </header>
              <div className="notifications-list">
              </div>
            </aside>
          </section>
        </div>

        <section className="action-grid" aria-label="Quick Actions">
          <article className="grid-card">
            <h3>Upcoming Appointments</h3>
            <p>You have 1 appointment upcoming</p>
            <button className="card-btn">VIEW DETAILS</button>
          </article>
          
          <article className="grid-card">
            <h3>Join Virtual Queue</h3>
            <p>Join the queue remotely</p>
            <button className="card-btn">JOIN QUEUE</button>
          </article>
          
          <article className="grid-card">
            <h3>My Queue Status</h3>
            <p>Currently not in a queue</p>
            <button className="card-btn">CHECK STATUS</button>
          </article>
        </section>

        <section className="bottom-section" aria-label="Clinic Search">
          <article className="grid-card full-width-card">
            <h3>Find Nearest Clinic</h3>
            <p>Discover clinics in your area and their opening times</p>
            <button className="card-btn">SEARCH CLINIC</button>
          </article>
        </section>
      </main>
    </div>
  );
}

export default PatientDashboard;