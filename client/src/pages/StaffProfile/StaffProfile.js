import React, { useState, useEffect } from 'react';
import './StaffProfile.css'; 
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router';
import { useApiAuth } from '../../hooks/apiAuth';

function StaffProfile() {
  const { user, logout: auth0Logout } = useAuth0();
  const navigate = useNavigate();
  const {apiFetch} = useApiAuth();

  const [isChangeDetailsModalOpen, setIsChangeDetailsModalOpen] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);

  void clinics; // To avoid unused variable warning

  const staffId = user?.sub;

  const logout = () => {
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const toggleChangeDetailsModal = () => {
    setIsChangeDetailsModalOpen(!isChangeDetailsModalOpen);
  };


  useEffect(() => {
    if (!staffId) return;
    async function fetchClinics() {
      try {
        setLoading(true);
        const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/clinics/assigned?auth0Id=${staffId}`);
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
              <p><strong>Name:</strong> NAME</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Occupation:</strong> OCCUPATION</p>
              <div className="clinic-assignments">
                <p><strong>Assigned Clinic:</strong> General Medical Center</p>
                <button className="btn-secondary">View Details</button>
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
            <input type="text" defaultValue={user?.name} className="search-bar" style={{border: '1px solid var(--color-border)'}} />
          </div>
          <div className='inline-components'>
            <label>Email</label>
            <input type="email" defaultValue={user?.email} className="search-bar" style={{border: '1px solid var(--color-border)'}} />
          </div>
          <div className='inline-components'>
            <label>Title</label>
            <input type="text" defaultValue={user?.title} className="search-bar" style={{border: '1px solid var(--color-border)'}} />
          </div>
          <div className='inline-components'>
            <label>Surname</label>
            <input type="text" defaultValue={user?.name} className="search-bar" style={{border: '1px solid var(--color-border)'}} />
          </div>

        <div className="landing-nav-btns" style={{marginTop: '20px'}}>
          <button type="button" className="btn btn-primary" onClick={toggleChangeDetailsModal}>Save Changes</button>
          <button type="button" className="btn" style={{color: 'var(--color-text)'}} onClick={toggleChangeDetailsModal}>Cancel</button>
        </div>
        
      </form>
    </div>
  </div>
)}
    </main>
  </div>
  
);
}

export default StaffProfile;