import React, { useState, useEffect } from 'react';
import './StaffProfile.css'; 
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router';
import { useApiAuth } from '../../hooks/apiAuth';
import { useRef } from 'react';
import NotificationCenter from '../../components/NotificationCenter';

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
  const [loading, setLoading] = useState(false);
  void clinics;
  const staffId = user?.sub;

  const logout = () => {
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const toggleChangeDetailsModal = () => {
    setIsChangeDetailsModalOpen(!isChangeDetailsModalOpen);
  };

  const toggleClinicDetailsModal = async () => {
    setIsClinicDetailsModalOpen(!isClinicDetailsModalOpen);
  };

  const handleUpdate = async () => {
  if (!staffId){
    console.error("No user found, cannot update.");
    return;
  };
    const changes = {
            name: nameRef.current.value,
            surname: surnameRef.current.value,
            title: titleRef.current.value,
            email: emailRef.current.value,
        };
     const updatedData = Object.fromEntries(
      Object.entries(changes).filter(([key, value]) => value !== profileData?.[key])
    );
    
    if (Object.keys(updatedData).length === 0) {
      alert("No changes detected.");
      toggleChangeDetailsModal();
      return;
  };
  try {
    if (emailRef.current.value !== profileData.email && !staffId?.startsWith("auth0|")) {
      alert("auth0 Email change is not allowed. Please contact support.");
      emailRef.current.value = profileData.email;
      return;
    }

    console.log("Updating with data:", updatedData);    
    const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/users/${staffId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        setProfileData(prev=> ({ ...prev, ...updatedData }));
        toggleChangeDetailsModal();
        alert("Details updated successfully!");
      }
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  

  //fetch profile data
  useEffect(() => {
    if (!staffId) return;

    const fetchProfileData = async () => {
      try {
        const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/users/${staffId}`);
        const data = await response.json();
        console.log("User data", data);
       console.log("USER _ID: ", data._id);
        setProfileData(data);
      } catch (error) {
        console.error("Could not fetch profile data:", error);
      }
      console.log("USER SUB: ", user?.sub);
      
    };

    fetchProfileData();

  }, [staffId, apiFetch, user?.sub]);

  //fetch specialities
  useEffect(() => {
    if (!profileData) return;
    async function fetchSpecialities() {
      try { 
        console.log("Fetching specialities...");
        const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/specialities/staff/${profileData._id}`);
        const data = await response.json();
        console.log("Fetched specialities response:", data);
        setSpecialities(data.Specialities || []);
        console.log("Fetched specialities:", data);
      } catch (error) {
        console.error("Could not fetch specialities:", error);
      };
    }
    fetchSpecialities();
  }, [apiFetch, staffId, profileData]);

  //fetch clinics
    useEffect(() => {
    if (!staffId) return;
    async function fetchClinics() {
      try {
        console.log("Fetching clinics for staffId:", staffId);
        setLoading(true);
        const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/clinics/assigned?auth0Id=${staffId}`);
        const data = await response.json();
        console.log("Fetched clinics:", data);
        setClinics(data[0]);
        
      } catch (error) {
        console.error("Could not fetch clinics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchClinics();

  }, [staffId, apiFetch]);

return (
  <section className="landing"> 
    <nav className="landing-nav" aria-label="Main navigation">
      <span className="landing-logo">Clinics and Qs</span>
      <section className="landing-nav-btns">
        <button className="btn" onClick={logout}>Logout</button>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard/staff')}>Back</button>
        <NotificationCenter userId={profileData?._id} />
      </section>
    </nav>

    <main className="profile-container">
      <header className="profile-header">
        <h1 className="profile-title">My Profile</h1>
        <p className="profile-subtitle">Manage your staff account and clinic assignments</p>
      </header>

      {loading ? (
        <section className="landing--loading">Loading profile details...</section>
      ) : (
        <section className="profile-grid">
          <article className="clinic-card profile-details-card">
            <h3 className="clinic-type">Staff Information</h3>
            <section className="details-content">
              <p><strong>Name:</strong> {profileData?.name}</p>
              <p><strong>Email:</strong> {profileData?.email}</p>
                <section><strong>Specialities:</strong>
                    <section className="speciality-list">
                        {specialities.length > 0 ? (
                            specialities.map((spec, index) => (
                                <span key={index} className="speciality-item">{spec}</span>
                            ))
                        ) : (
                            <p>No specialities found.</p>
                        )}
                    </section></section>
              <section className="clinic-assignments">
                <p><strong>Assigned Clinic:</strong> {clinics ? clinics.practiceName : 'No assigned clinic'}</p>
                <button className="btn-secondary" onClick={toggleClinicDetailsModal}>
                  View Details
                </button>
              </section>
              <span className="clinic-badge clinic-badge--open">Active Staff</span>
            </section>
          </article>


          <article className="clinic-card profile-actions-card">
            <span className="clinic-type">Account Actions</span>
            <h3 className="clinic-name">Management Requests</h3>
            <section className="action-button-list">
              <button className="action-item-btn">Request occupation change</button>
              <button className="action-item-btn">Request clinic change</button>
              <button className="action-item-btn" onClick={toggleChangeDetailsModal}>Update personal details</button>
              <button className="action-item-btn action-item-btn--danger">Request dismissal</button>
            </section>
          </article>
        </section>
      )}

      {isChangeDetailsModalOpen && (
  <section className="modal-overlay">
    <article className="modal-content clinic-card" role="dialog" aria-modal="true" aria-labelledby="edit-profile-heading"> 
      <h3 id="edit-profile-heading" className="clinic-name">Edit Personal Details</h3>
      
      <form className="details-content">
          
          <section className='inline-components'>
            <label>Name</label>
            <input type="text" ref={nameRef} defaultValue={profileData?.name} className="search-bar" style={{border: '1px solid var(--color-border)'}} />
          </section>
          <section className='inline-components'>
            <label>Surname</label>
            <input type="text" ref={surnameRef} defaultValue={profileData?.surname} className="search-bar" style={{border: '1px solid var(--color-border)'}} />
          </section>
          <section className='inline-components'>
            <label>Title</label>
            <input type="text" ref={titleRef} defaultValue={profileData?.title} className="search-bar" style={{border: '1px solid var(--color-border)'}} />
          </section>
          <section className='inline-components'>
            <label>Email</label> 
            <input type="email" ref={emailRef} disabled={!staffId?.startsWith("auth0|")} defaultValue={profileData.email} className="search-bar" style={{border: '1px solid var(--color-border)'}} />
          </section> 
          

        <footer className="landing-nav-btns" style={{marginTop: '20px'}}>
          <button type="button" className="btn btn-primary" onClick={handleUpdate}>Save Changes</button>
          <button type="button" className="btn" style={{color: 'var(--color-text)'}} onClick={toggleChangeDetailsModal}>Cancel</button>
        </footer>
        
      </form>
    </article>
  </section>
)}
{isClinicDetailsModalOpen && (
  <section className="modal-overlay">
    <article className="modal-content clinic-card" role="dialog" aria-modal="true" aria-labelledby="clinic-details-heading"> 
      <h3 id="clinic-details-heading" className="clinic-name">Your Clinic Details</h3>
      
      {clinics ? (
        <>
          <p><strong>Clinic Name:</strong> {clinics.practiceName}</p>
          <p><strong>Address:</strong> {clinics.physicalAddress}</p>
          <p><strong>Phone:</strong> {clinics.contactNumber}</p>
        </>
      ) : (
        <section className="no-clinic-message">
          <p><strong>NO CLINIC ASSIGNED</strong></p>
          <p>Please contact your administrator to have a clinic assigned.</p>
        </section>
      )}
      
      <button className="btn btn-primary" onClick={toggleClinicDetailsModal}>Close</button>
    </article>
  </section>
)}
    </main>
  </section>
  
);
}

export default StaffProfile;
