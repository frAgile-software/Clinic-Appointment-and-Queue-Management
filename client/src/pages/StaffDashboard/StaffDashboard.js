import React, { useState, useEffect, useRef } from 'react';
import './StaffDashboard.css';
import { LuUser } from "react-icons/lu";
import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from '../../api/useApi';
import { useNavigate } from 'react-router';

const activeStatus = ["Waiting", "In Consult"];
const inactiveStatus = ["Completed", "Cancelled", "No-show"];

function StaffDashboard() {
  const {
    user,
    logout: auth0Logout,
  } = useAuth0();
  const api = useApi();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDetails, setModalDetails] = useState({});

  const debounceTimer = useRef(null);

  const logout = () => {
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const staffId = user?.sub;
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [patientQueue, setPatientQueue] = useState([]);
  const [viewingHistory, setViewingHistory] = useState(false); // Ok, these state things are genuinely black magic
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingQueues, setLoadingQueues] = useState(false);
  const [loadingEmailSearch, setLoadingEmailSearch] = useState(false);
  const [hasSearchedEmail, setHasSearchedEmail] = useState(false);
  const [patientEmail, setPatientEmail] = useState('');
  const [patient, setPatient] = useState(null);

  const statusList = !viewingHistory ? activeStatus : inactiveStatus;

  const [addingToQueue, setAddingToQueue] = useState(false);

  const handleCardClick = (details) => {
    setModalDetails(details);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    updateConsult(modalDetails);
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (!staffId) return;
    async function fetchClinics() {
      try {
        setLoading(true);
        const data = await api.clinics.getAssignedClinics(staffId);
        setClinics(data);
      } catch (error) {
        console.error("Could not fetch clinics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchClinics();
  }, [staffId, api]);

  useEffect(() => {
    if (!staffId || !clinics || clinics.length === 0) return;
    async function fetchQueue() {
      try {
        setLoadingQueues(true);
        console.log("Finding queues...");
        const data = await api.queues.get(clinics[0]._id, {auth0Id: staffId, statuses: statusList});
        console.log("Queues found:", data);
        setPatientQueue(data);
      } catch (error) {
        console.error("Could not fetch queue:", error);
      } finally {
        setLoadingQueues(false);
      }
    }
    fetchQueue();
  }, [staffId, clinics, api, statusList]);

  useEffect(() => {
    if (!staffId) return;
    async function fetchAppointments() {
      try {
        setLoadingAppointments(true);
        console.log("Finding appointments...");
        const data = await api.appointments.getForAuth0Id(staffId, {statuses: statusList});
        console.log("Appointments found:", data);
        setAppointments(data);
      } catch (error) {
        console.error("Could not fetch appointments:", error);
      } finally {
        setLoadingAppointments(false);
      }
    }
    fetchAppointments();
  }, [staffId, api, statusList]);

  useEffect(() => {
    const email = patientEmail.trim();

    if (!email) {
      setPatient(null);
      setHasSearchedEmail(false);
      setLoadingEmailSearch(false);
      return;
    }

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setLoadingEmailSearch(true);
      setHasSearchedEmail(true);
      
      try {
        const user = await api.users.getByEmail(email, {role: "Patient"});
        setPatient(user);
      } catch (error) {
        if (error.status !== 404) {
          console.log(error);
        }
        setPatient(null); // set patient back to null
      } finally {
        setLoadingEmailSearch(false);
      }
    }, 400);

    return () => clearTimeout(debounceTimer.current);
  }, [patientEmail, api]);

  const toAppointmentCard = (appointmentItem) => {
    const bookingDate = new Date(appointmentItem.BookingDateTime);
    const patient = appointmentItem.Patient;
    return (
      <li key={appointmentItem._id} className="data-card" onClick={() => handleCardClick(appointmentItem)} role="button" tabIndex={0}>
        <strong className="data-card-name">{patient.name}</strong>
        <span className="data-card-detail">ID: {patient._id}</span>
        <span className="data-card-detail">{bookingDate.toLocaleString()}</span>
        <span className="data-card-detail">{appointmentItem.ReasonDetails}</span>
        <span className={`status-badge ${appointmentItem.Status === 'In Consult' ? 'status-purple' : 'status-white'}`}>
          {appointmentItem.Status}
        </span>
      </li>
    );
  };

  const toQueueCard = (queueItem) => {
    const queueTime = new Date(queueItem.createdAt);
    const patient = queueItem.Patient;
    return (
      <li key={queueItem._id} className="data-card" onClick={() => handleCardClick(queueItem)} role="button" tabIndex={0}>
        <strong className="data-card-name">{patient.name}</strong>
        <span className="data-card-detail">ID: {patient._id}</span>
        <span className="data-card-detail">{queueTime.toLocaleTimeString()}</span>
        <span className="data-card-detail">{queueItem.Speciality.SpecialityName}</span>
        <span className="status-badge status-white">
          {queueItem.Status}
        </span>
      </li>
    );
  };

  const updateConsult = async (consultItem, newStatus = consultItem.Status) => {
    if (!consultItem || !consultItem._id) {
      console.error('Missing consultation item for status update');
      return;
    }

    const isQueueItem = consultItem.type === 'Queue' || (!!consultItem.createdAt && !consultItem.BookingDateTime);
    
    try {
      
      if (isQueueItem)
        await api.queues.update(consultItem._id, { status: newStatus, remarks: modalDetails.Remarks });
      else
        await api.appointments.update(consultItem._id, { status: newStatus, remarks: modalDetails.Remarks });

      const updatedItem = { ...consultItem, Status: newStatus, Remarks: modalDetails.Remarks };
      setModalDetails(updatedItem);

      if (isQueueItem) {
        setPatientQueue((prev) => prev.map((item) => (item._id === consultItem._id ? updatedItem : item)));
      } else {
        setAppointments((prev) => prev.map((item) => (item._id === consultItem._id ? updatedItem : item)));
      }
    } catch (error) {
      console.error('Could not update consult status:', error);
    }
  };

  const nav_bar = (
    <header className="staff-header-canva">
      <section className="brand-section">
        <img src="/logo.svg" alt="Clinics and Qs Logo" className="brand-logo" />
        <h2 className="brand-title">Clinics and Qs</h2>
      </section>
      <nav className="header-nav-canva">
        <button className="icon-btn-user" aria-label="Profile" onClick={() => navigate('/dashboard/staff/profile')}>
          <LuUser />
        </button>
        <button className="logout-btn-canva" onClick={logout}>Logout</button>
      </nav>
    </header>
  );

  if (loading)
    return (
      <main className="landing landing--loading">
        <p>Loading dashboard...</p>
      </main>
    );

  if (!clinics || clinics.length === 0)
    return (
      <main className="staff-dashboard-wrapper">
        {nav_bar}
        <p>You are not assigned to any clinics.</p>
        <p>Please contact the administrator for your clinic and ask to be added.</p>
      </main>
    );

  return (
    <main className="staff-dashboard-wrapper">
      {nav_bar}

      <section className="welcome-banner-canva">
        <h1 className="welcome-title-canva">Welcome Back, {user?.name}</h1>
        <p className="welcome-subtitle-canva">Here's your dashboard overview for {clinics[0].practiceName}</p>
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
          <button className="pill-btn-purple" onClick={() => setViewingHistory(!viewingHistory)}>TOGGLE HISTORY</button>
        </article>
      </section>

      <section className="data-section">
        <header className="data-section-header">Patient Appointment{viewingHistory ? " History" : "s"}</header>
        <section className="data-list-container">
          {loadingAppointments ? <p>Loading appointments...</p> : <ul className="data-cards-wrapper">
            {appointments.length > 0 ? appointments.map(appt => toAppointmentCard(appt)) : <></>}
          </ul>}
        </section>
        {/* <button className="next-action-btn">Next Appointment-&gt;</button> */}
      </section>

      <section className="data-section">
        <header className="data-section-header">Patient Queue {viewingHistory ? "History" : ""}</header>
        <section className="data-list-container">
          {loadingQueues ? <p>Loading queues...</p> : <ul className="data-cards-wrapper">
            {patientQueue.length > 0 ? patientQueue.map(patient => toQueueCard(patient)) : <></>}
          </ul>}
        </section>
        {/* <button className="next-action-btn">Next Queue Patient -&gt;</button> */}
      </section>

      <section className="data-section">
        <header className="data-section-header">Add Patient to Queue</header>
        <section className="add-queue-container">
          <form className="add-queue-form">
            <fieldset className="form-group">
              <label className="form-label">Patient Email:</label>
              <section className="email-input-wrapper">
                <input 
                  type="text" 
                  className="form-input-canva"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                />
                {patientEmail.trim() && hasSearchedEmail && (
                  <span className='email-search-indicator' aria-live='polite'>
                    {loadingEmailSearch ? (
                      <span className='spinner' aria-label='Searching' />
                    ) : patient ? (
                      <span className='indicator-tick' aria-label='Patient found'>✓</span>
                    ) : (
                      <span className='indicator-cross' aria-label='Patient not found'>✗</span>
                    )}
                  </span>
                )}
              </section>
            </fieldset>

            <fieldset className="form-group">
              {patient && !loadingEmailSearch && (
                <span className="patient-found-name">
                  Patient found: {patient.title} {patient.name} {patient.surname} - id: {patient._id}
                </span>
              )}
            </fieldset>

            <fieldset className="form-group">
              <label className="form-label">Service:</label>
              <input type="text" className="form-input-canva" />
            </fieldset>

            <section className="form-submit-row">
              <button type="button" className="pill-btn-purple form-submit-btn">
                {addingToQueue ? (
                  <>
                    Adding...
                  </>
                ) : (
                  <>
                    Add to Queue
                  </>
                )}
              </button>
            </section>
          </form>
        </section>
      </section>

      {isModalOpen && (
        <section className="modal-overlay-canva" onClick={closeModal}>
          <article className="modal-outer-box" onClick={(e) => e.stopPropagation()}>
            <section className="modal-inner-box">
              <header className="modal-header-canva">
                <h2 className="modal-patient-name">{modalDetails.Patient.name}</h2>
                <button className="modal-close-x" onClick={closeModal}>X</button>
              </header>

              <section className="modal-details-canva">
                <p>Contact Email: {modalDetails.Patient.email}</p>
                <p>Reason: {modalDetails.Speciality.SpecialityName}</p>
                <p>More info: {modalDetails.ReasonDetails ? modalDetails.ReasonDetails : `has been waiting for ${Math.round(Math.abs(Date.now() - Date.parse(modalDetails.createdAt)) / (60 * 60 * 100)) / 10} hours`}</p>
              </section>

              <section className="modal-remarks-section">
                <label className="remarks-label">Remarks:</label>
                <textarea
                  className="remarks-textarea"
                  value={modalDetails.Remarks || ''}
                  onChange={(e) => setModalDetails({ ...modalDetails, Remarks: e.target.value })}
                />
              </section>

              <footer className="modal-actions-footer">
                <button className="modal-action-btn btn-purple" onClick={() => updateConsult(modalDetails, "Waiting")}>Set waiting</button>
                <button className="modal-action-btn btn-purple" onClick={() => updateConsult(modalDetails, "In Consult")}>Check in</button>
                <button className="modal-action-btn btn-green" onClick={() => updateConsult(modalDetails, "Completed")}>Done</button>
                <button className="modal-action-btn btn-red" onClick={() => updateConsult(modalDetails, "Cancelled")}>Cancel</button>
                <button className="modal-action-btn btn-red" onClick={() => updateConsult(modalDetails, "No-show")}>No show</button>
              </footer>
            </section>
          </article>
        </section>
      )}

    </main>
  );
}

export default StaffDashboard;