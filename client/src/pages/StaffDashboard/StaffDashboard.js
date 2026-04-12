import React from 'react';
import './StaffDashboard.css'; // Ensure this filename matches exactly (case-sensitive on WSL/Linux)
import { LuBell } from "react-icons/lu";

const patientQueue = [
  { id: "p1", name: "Jane Smith", time: "08:15 AM", reason: "Flu Shot", status: "In Progress" },
  { id: "p2", name: "John Doe", time: "09:00 AM", reason: "Check-up", status: "Waiting" }
  
];

function StaffDashboard() {
  return (
    <>
      <header className="staff-header">
        <div className="logo">ClinIQ</div>
        <nav className="nav-links">
          <button className="nav-btn">Profile</button>
          <button className="nav-btn">Logout</button>
          <button className="icon-btn" aria-label="Notifications"><LuBell /></button>
        </nav>
      </header>

      <section className="welcome-section">
        <h1 className="welcome-title">Welcome back, Staff Member!</h1>
        <p className="welcome-subtitle">Here's your dashboard overview.</p>
      </section>

      <section className="patient-queue-section">
        <h2>Patient Queue</h2>
        <div className="queue-container">
          {patientQueue.map(patient => (
            <article key={patient.id} className="patient-card">
              <p className="patient-name">{patient.name}</p>
              <p>{patient.time}</p>
              <p>{patient.reason}</p>
              {/* Using a dynamic class for status color logic later */}
              <p className={`status-text ${patient.status.toLowerCase().replace(' ', '-')}`}>
                {patient.status}
              </p>
            </article>
          ))}
        </div>
      </section>
      
      <section className="action-section">
        <div className="action-card"> 
          <h3>Update Patient Status</h3>
          <input type="text" placeholder="Patient ID" className="form-input" />
          <button className="action-btn">Update</button> 
        </div>

        <div className="action-card">
          <h3>Add Patient</h3>
          <input type="text" placeholder="Patient Name" className="form-input" />
          <input type="text" placeholder="Appointment Time" className="form-input" />
          <input type="text" placeholder="Reason for Visit" className="form-input" />
          <button className="action-btn">Add</button>
        </div>
      </section>
    </>
  );
}

export default StaffDashboard;