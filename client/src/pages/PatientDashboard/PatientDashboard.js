import React, { useState } from "react";
import "./PatientDashboard.css";

function PatientDashboard() {
  // 1. MOCK DATA: Simple data to populate the UI for Sprint 1
  const mockPatientName = "John Doe";
  const [notifications] = useState([
    { id: 1, text: "Your appointment is confirmed for 10:30 AM", time: "09:00" },
    { id: 2, text: "Please update your profile details", time: "Yesterday" }
  ]);

  return (
    <div className="dashboard-container">
      
      {/* HEADER: Top navigation bar */}
      <header className="dashboard-header">
        <div className="header-logo">
          <h2>Clinics and Qs</h2>
        </div>
        <nav className="header-nav">
          <button className="nav-btn active">HOME</button>
          <button className="nav-btn">APPOINTMENTS</button>
          <button className="nav-btn">QUEUE STATUS</button>
        </nav>
        <div className="header-actions">
          <button className="profile-btn">👤 Profile</button>
          <button className="logout-btn">Logout</button>
        </div>
      </header>

      {/* MAIN CONTENT: The central grid layout */}
      <main className="dashboard-main">
        
        {/* ROW 1: Welcome Banner & Notifications Box */}
        <section className="top-section">
          
          {/* Left Side: Welcome & Call to Action */}
          <div className="welcome-card">
            <h1 className="greeting">Welcome back, {mockPatientName}!</h1>
            <p className="subtitle">Manage your health easily and skip the waiting room.</p>
            
            <div className="action-banner">
              <div>
                <h3>Need to see a doctor?</h3>
                <p>Schedule your next visit at your nearest clinic.</p>
              </div>
              <button className="book-btn">BOOK AN APPOINTMENT</button>
            </div>
          </div>

          {/* Right Side: Notifications */}
          <aside className="notifications-card">
            <h3>Notifications 🔔</h3>
            <div className="notifications-list">
              {notifications.map((notif) => (
                <div key={notif.id} className="notif-item">
                  <span className="notif-time">{notif.time}</span>
                  <p className="notif-text">{notif.text}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        {/* ROW 2: The 3-Column Action Grid */}
        <section className="action-grid">
          <article className="grid-card">
            <h3>Upcoming Appointments</h3>
            <p>You have 1 appointment scheduled.</p>
            <button className="card-btn">VIEW DETAILS</button>
          </article>
          
          <article className="grid-card">
            <h3>Join Virtual Queue</h3>
            <p>Join the queue remotely before arriving.</p>
            <button className="card-btn">JOIN QUEUE</button>
          </article>
          
          <article className="grid-card status-card">
            <h3>My Queue Status</h3>
            <p>You are currently not in any queue.</p>
            <button className="card-btn card-btn-outline">CHECK STATUS</button>
          </article>
        </section>

        {/* ROW 3: Full-width bottom section */}
        <section className="bottom-section">
          <article className="grid-card full-width-card">
            <h3>Find Nearest Clinics</h3>
            <p>Discover clinics in your ward and view their operating hours.</p>
            <button className="card-btn">SEARCH CLINICS</button>
          </article>
        </section>

      </main>
    </div>
  );
}

export default PatientDashboard;