import './StaffDashboard.css'; // Ensure this filename matches exactly (case-sensitive on WSL/Linux)
import { LuBell } from "react-icons/lu";
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router';
import { useState, useEffect } from "react";
import { useApiAuth } from '../../hooks/apiAuth';

function StaffDashboard() {
    const {
        user,
        logout: auth0Logout,
    } = useAuth0();
    const navigate = useNavigate();

    const logout = () => {
        auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    };
    const { apiFetch } = useApiAuth();

    const staffId = user?.sub;
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [patientQueue, setPatientQueue] = useState([]);

    useEffect(() => {
        if (!staffId) return;
        async function fetchClinics() {
            try {
                setLoading(true);
                const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/clinics/assigned?auth0Id=${staffId}`, {
                    method: 'POST',
                    body: JSON.stringify({
                        auth0ID: staffId,
                    })
                });

                const data = await response.json();
                setClinics(data);
            } catch (error) {
                console.error("Could not fetch clinics:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchClinics();
    }, [staffId, apiFetch]);

    useEffect(() => {
        if (!staffId || !clinics) return;
        async function fetchQueue() {
            try {
                const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/queues/${clinics[0]}`);
                const data = await response.json();
                setPatientQueue(data);
            } catch (error) {
                console.error("Could not fetch clinics:", error);
            }
        }
        fetchQueue();
    }, [staffId, clinics, apiFetch]);

    /*
    queueItem {
    Clinic,
    Speciality: { SpecialityName: string },
    Patient: {
      name,
      surname,
      title,
      email,
      role: ["Patient", "Admin", "Staff"] 
    },
    createdAt, updatedAt, id, ...
    }
     */

    const toCard = (queueItem) => {
        queueItem.status = "Waiting";
        const date = new Date(queueItem.updatedAt);
        return (
            <article key={queueItem.id} className="patient-card">
                <p className="patient-name">{queueItem.Patient.name} {queueItem.Patient.surname}</p>
                <p>{date.toLocaleTimeString()}</p>
                <p>{date.toLocaleDateString()}</p>
                <p>{queueItem.Speciality.SpecialityName}</p>
                <p className={`status-text ${queueItem.status.toLowerCase().replace(' ', '-')}`}>
                    {queueItem.status}
                </p>
            </article>
        );
    };


    if (loading)
        return (
            <main className="landing landing--loading">
                <p>Loading dashboard...</p>
            </main>
        );


  return (
    <>
      <header className="staff-header">
        <div className="logo">ClinIQ</div>
        <nav className="nav-links">
          <button className="nav-btn" onClick={() => navigate('/dashboard/staff/profile')}>Profile</button>
          <button className="nav-btn" onClick={logout}>Logout</button>
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
          {patientQueue.length > 0 ? patientQueue.map(patient => toCard(patient)) : <></>}
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