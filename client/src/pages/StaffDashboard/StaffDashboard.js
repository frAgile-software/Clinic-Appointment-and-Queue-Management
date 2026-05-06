import React, { useState, useEffect } from 'react';
import './StaffDashboard.css';
import { LuUser } from "react-icons/lu";
import { useAuth0 } from '@auth0/auth0-react';
import { useApiAuth } from '../../hooks/apiAuth';


const mockAppointments = [
  { id: "67890", name: "Jane Doe", time: "08:00 am", reason: "Flu shoot", status: "In Consult" },
  { id: "12345", name: "John Doe", time: "09:00 am", reason: "Check-up", status: "Upcoming" }
];

const mockQueue = [
  { id: "53820", name: "Janet Doe", time: "08:11", reason: "Maternity", status: "Waiting" },
  { id: "74387", name: "Jack Doe", time: "08:23", reason: "Check-up", status: "Waiting" }
];

function StaffDashboard() {
  const { apiFetch } = useApiAuth();
  const {
    user,
    logout: auth0Logout,
  } = useAuth0();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQueueModal, setIsQueueModal] = useState(false);

  const logout = () => {
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const staffId = user?.sub;
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patientQueue, setPatientQueue] = useState([]);

  const handleCardClick = (isQueue) => {
    setIsQueueModal(isQueue);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

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
    <main className="staff-dashboard-wrapper">
      <header className="staff-header-canva">
        <section className="brand-section">
          <img src="/logo.svg" alt="Clinics and Qs Logo" className="brand-logo" />
          <h2 className="brand-title">Clinics and Qs</h2>
        </section>
        <nav className="header-nav-canva">
          <button className="icon-btn-user" aria-label="Profile">
            <LuUser />
          </button>
          <button className="logout-btn-canva" onClick={logout}>Logout</button>
        </nav>
      </header>

      <section className="welcome-banner-canva">
        <h1 className="welcome-title-canva">Welcome Back, Staff Member</h1>
        <p className="welcome-subtitle-canva">Here's your dashboard overview for (this clinic)</p>
      </section>

      <section className="quick-actions-row">
        <article className="quick-action-card">
          <h3 className="quick-action-title">Add Patient to Queue</h3>
          <button className="pill-btn-purple">ADD TO QUEUE</button>
        </article>

        <article className="quick-action-card">
          <h3 className="quick-action-title">Update Schedule</h3>
          <button className="pill-btn-purple">VIEW SCHEDULE</button>
        </article>

        <article className="quick-action-card">
          <h3 className="quick-action-title">View Appointment History</h3>
          <button className="pill-btn-purple">VIEW HISTORY</button>
        </article>
      </section>

      <section className="data-section">
        <header className="data-section-header">Patient Appointments</header>
        <section className="data-list-container">
          <ul className="data-cards-wrapper">
            {mockAppointments.map(appt => (
              <li key={appt.id} className="data-card" onClick={() => handleCardClick(false)} role="button" tabIndex={0}>
                <strong className="data-card-name">{appt.name}</strong>
                <span className="data-card-detail">ID: {appt.id}</span>
                <span className="data-card-detail">{appt.time}</span>
                <span className="data-card-detail">{appt.reason}</span>
                <span className={`status-badge ${appt.status === 'In Consult' ? 'status-purple' : 'status-white'}`}>
                  {appt.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <button className="next-action-btn">Next Appointment-&gt;</button>
      </section>

      <section className="data-section">
        <header className="data-section-header">Patient Queue</header>
        <section className="data-list-container">
          <ul className="data-cards-wrapper">
          {/* patientQueue.length > 0 ? patientQueue.map(patient => toCard(patient)) : <></>} */}
            {mockQueue.map(patient => (
              <li key={patient.id} className="data-card" onClick={() => handleCardClick(true)} role="button" tabIndex={0}>
                <strong className="data-card-name">{patient.name}</strong>
                <span className="data-card-detail">ID: {patient.id}</span>
                <span className="data-card-detail">{patient.time}</span>
                <span className="data-card-detail">{patient.reason}</span>
                <span className="status-badge status-white">
                  {patient.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <button className="next-action-btn">Next Queue Patient -&gt;</button>
      </section>

      <section className="data-section">
        <header className="data-section-header">Add Patient to Queue</header>
        <section className="add-queue-container">
          <form className="add-queue-form">
            <fieldset className="form-group">
              <label className="form-label">Patient Name:</label>
              <input type="text" className="form-input-canva" />
            </fieldset>
            
            <fieldset className="form-group">
              <label className="form-label">Arrival time:</label>
              <input type="text" className="form-input-canva" />
            </fieldset>

            <fieldset className="form-group">
              <label className="form-label">Reason:</label>
              <input type="text" className="form-input-canva" />
            </fieldset>

            <section className="form-submit-row">
              <button type="button" className="pill-btn-purple form-submit-btn">ADD TO QUEUE</button>
            </section>
          </form>
        </section>
      </section>

      {isModalOpen && (
        <section className="modal-overlay-canva" onClick={closeModal}>
          <article className="modal-outer-box" onClick={(e) => e.stopPropagation()}>
            <section className="modal-inner-box">
              <header className="modal-header-canva">
                <h2 className="modal-patient-name">{isQueueModal ? "Janet Doe" : "Jane Doe"}</h2>
                <button className="modal-close-x" onClick={closeModal}>X</button>
              </header>

              <section className="modal-details-canva">
                <p>Contact Number: 0858761234</p>
                <p>Reason: {isQueueModal ? "Maternity" : "Flu shoot"}</p>
                <p>More info: Ultrasound</p>
              </section>

              <section className="modal-remarks-section">
                <label className="remarks-label">Remarks:</label>
                <textarea className="remarks-textarea"></textarea>
              </section>

              <footer className="modal-actions-footer">
                <button className="modal-action-btn btn-purple">Check in</button>
                <button className="modal-action-btn btn-purple">In Consult</button>
                <button className="modal-action-btn btn-green">Done</button>
                <button className="modal-action-btn btn-red">No show</button>
              </footer>
            </section>
          </article>
        </section>
      )}

    </main>
  );
}

export default StaffDashboard;