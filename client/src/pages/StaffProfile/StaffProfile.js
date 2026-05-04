import React, { useState, useEffect } from 'react';
import './StaffProfile.css'; 
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router';
import { useApiAuth } from '../../hooks/apiAuth';
import { useRef } from 'react';
function StaffProfile() {
  const nameRef = useRef(); //for changing of details
  const surnameRef = useRef();
  const titleRef = useRef();
  const emailRef = useRef();


  const { user, logout: auth0Logout } = useAuth0();
  const navigate = useNavigate();
  const {apiFetch} = useApiAuth();

  const [profileData, setProfileData] = useState(null);
  const [isChangeDetailsModalOpen, setIsChangeDetailsModalOpen] = useState(false);
  const [isClinicDetailsModalOpen, setIsClinicDetailsModalOpen] = useState(false);
  const [clinics, setClinics] = useState(null);
  const [specialities, setSpecialities] = useState([]);
  console.log("Current state of clinics:", clinics?.practiceName);
  const [loading, setLoading] = useState(false);
  void clinics;
  const staffId = user?.sub;

  const logout = () => {
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const toggleChangeDetailsModal = () => {
    setIsChangeDetailsModalOpen(!isChangeDetailsModalOpen);
  };

  const toggleClinicDetailsModal = () => {
    setIsClinicDetailsModalOpen(!isClinicDetailsModalOpen);
  };



  const handleUpdate = async () => {
  if (!staffId){
    console.error("No staffId found, cannot update.");
    return;
  };
    const updatedData = {
    name: nameRef.current.value,
    surname: surnameRef.current.value,
    title: titleRef.current.value,
    email: emailRef.current.value,
  };

  try {
      console.log("Updating with data:", updatedData);    
      const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/users/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        setProfileData(updatedData);
        toggleChangeDetailsModal();
        alert("Details updated successfully!");
      }
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  useEffect(() => {
    async function fetchSpecialities() {
      try { 
        console.log("Fetching specialities...");
        const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/clinics/${staffId}/specialities`);
        const data = await response.json();
        setSpecialities(data.Specialities || []);
        console.log("Fetched specialities:", data);
        setSpecialities(data);
      } catch (error) {
        console.error("Could not fetch specialities:", error);
      };
    }
    fetchSpecialities();
  }, [apiFetch, staffId]);

    useEffect(() => {
    if (!staffId) return;
    async function fetchClinics() {
      try {
        console.log("Fetching clinics for staffId:", staffId);
        setLoading(true);
        const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/clinics/assigned?auth0Id=${staffId}`);
        const data = await response.json();
        console.log("Fetched clinics:", data);
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
    if (!staffId) return;

    const fetchProfileData = async () => {
      try {
        const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/users/${staffId}`);
        const data = await response.json();
        console.log("My Backend Data:", data);
        setProfileData(data);
      } catch (error) {
        console.error("Could not fetch profile data:", error);
      }
    };

    fetchProfileData();
  }, [staffId, apiFetch]);

return (
  <div className="landing"> 
    <nav className="landing-nav" aria-label="Main navigation">
      <span className="landing-logo">Clinics and Qs</span>
      <section className="landing-nav-btns">
        <button className="btn" onClick={logout}>Logout</button>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard/staff')}>Back</button>
      </section>
    </nav>

    <main className="profile-container">
      <header className="profile-header">
        <h1 className="profile-title">My Profile</h1>
        <p className="profile-subtitle">Manage your staff account and clinic assignments</p>
      </header>

      {loading ? (
        <div className="landing--loading">Loading profile details...</div>
      ) : (
        <section className="profile-grid">
          <div className="clinic-card profile-details-card">
            <h3 className="clinic-type">Staff Information</h3>
            <div className="details-content">
              <p><strong>Name:</strong> {profileData?.name}</p>
              <p><strong>Email:</strong> {profileData?.email}</p>
                <div><strong>Specialities:</strong>
                    <div className="speciality-list">
                        {specialities.length > 0 ? (
                            specialities.map((spec, index) => (
                                <span key={index} className="speciality-item">{spec}</span>
                            ))
                        ) : (
                            <p>No specialities found.</p>
                        )}
                    </div></div>
              <div className="clinic-assignments">
                <p><strong>Assigned Clinic:</strong> {clinics ? clinics.practiceName : 'No assigned clinic'}</p>
                <button className="btn-secondary" onClick={toggleClinicDetailsModal}>
                  View Details
                </button>
              </div>
              <span className="clinic-badge clinic-badge--open">Active Staff</span>
            </div>
          </div>


          <div className="clinic-card profile-actions-card">
            <span className="clinic-type">Account Actions</span>
            <h3 className="clinic-name">Management Requests</h3>
            <div className="action-button-list">
              <button className="action-item-btn">Request occupation change</button>
              <button className="action-item-btn">Request clinic change</button>
              <button className="action-item-btn" onClick={toggleChangeDetailsModal}>Update personal details</button>
              <button className="action-item-btn action-item-btn--danger">Request dismissal</button>
            </div>
          </div>
        </section>
      )}

      {isChangeDetailsModalOpen && (
  <div className="modal-overlay">
    <div className="modal-content clinic-card"> 
      <h3 className="clinic-name">Edit Personal Details</h3>
      
      <form className="details-content">
          
          <div className='inline-components'>
            <label>Name</label>
            <input type="text" ref={nameRef} defaultValue={profileData?.name} className="search-bar" style={{border: '1px solid var(--color-border)'}} />
          </div>
          <div className='inline-components'>
            <label>Surname</label>
            <input type="text" ref={surnameRef} defaultValue={profileData?.surname} className="search-bar" style={{border: '1px solid var(--color-border)'}} />
          </div>
          <div className='inline-components'>
            <label>Title</label>
            <input type="text" ref={titleRef} defaultValue={profileData?.title} className="search-bar" style={{border: '1px solid var(--color-border)'}} />
          </div>
          <div className='inline-components'>
            <label>Email</label> 
            <input type="email" disabled ref={emailRef} defaultValue={profileData.email} className="search-bar" style={{border: '1px solid var(--color-border)'}} />
          </div> {/*update email is disabled currently ^^*/}
          

        <div className="landing-nav-btns" style={{marginTop: '20px'}}>
          <button type="button" className="btn btn-primary" onClick={handleUpdate}>Save Changes</button>
          <button type="button" className="btn" style={{color: 'var(--color-text)'}} onClick={toggleChangeDetailsModal}>Cancel</button>
        </div>
        
      </form>
    </div>
  </div>
)}
{isClinicDetailsModalOpen && (
  <div className="modal-overlay">
    <div className="modal-content clinic-card"> 
      <h3 className="clinic-name">Your Clinic Details</h3>
      
      {clinics ? (
        <>
          <p><strong>Clinic Name:</strong> {clinics.practiceName}</p>
          <p><strong>Address:</strong> {clinics.physicalAddress}</p>
          <p><strong>Phone:</strong> {clinics.contactNumber}</p>
        </>
      ) : (
        <div className="no-clinic-message">
          <p><strong>NO CLINIC ASSIGNED</strong></p>
          <p>Please contact your administrator to have a clinic assigned.</p>
        </div>
      )}
      
      <button className="btn btn-primary" onClick={toggleClinicDetailsModal}>Close</button>
    </div>
  </div>
)}
    </main>
  </div>
  
);
}

export default StaffProfile;