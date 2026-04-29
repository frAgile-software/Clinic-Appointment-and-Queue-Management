import React, { useState, useEffect } from 'react';
//import './StaffProfile.css';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router';
  function StaffProfile() {
    const {
    logout: auth0Logout,
  } = useAuth0();

  const navigate = useNavigate();

  const logout = () => {
        auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };
    const { user } = useAuth0();
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(false); // loading spinner for search
   
    
    const staffId = user?.sub; 

    useEffect(() => { // Fetch clinics assigned to the staff member
      if (!staffId) return;
      async function fetchClinics() {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/clinics/assigned?auth0Id=${staffId}`);
            const data = await response.json();
            setClinics(data);
          } catch (error) {
            console.error("Could not fetch clinics:", error);
          
        } finally {
      setLoading(false); // Stop loading
        }
      }
      fetchClinics();
    }, [staffId]);

    return (
      <>
      <nav className="staff-profile-nav" aria-label="Main navigation">
        <span className="landing-logo">Clinics and Qs</span>
        <section className="landing-nav-btns">
          <button className="btn" onClick={logout}>
            Logout
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard/staff')}>
            Back
          </button>
        </section>
      </nav>
      <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <header>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', borderBottom: '4px solid black' }}>
            MY PROFILE
          </h1>
        </header>

       <section className="action-section">
        <div className="action-card"> 
          <h3>My details</h3>
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Occupation(s):</strong> Occupation </p> 
          <p><strong>Assigned Clinic:</strong> Clinic name</p>
          <p><strong>Clinic Address:</strong>Clinic address</p>
          <p><strong>Staff member since:</strong> Date hired </p> 
        </div>

        <div className="action-card">
          <h3>Actions</h3>
          <button className="action-btn">Request occupation change</button>
          <button className="action-btn">Request clinic change</button>
          <button className="action-btn">Request update to personal details</button>
          <button className="action-btn">Request dismissal</button>
          
        </div>
      </section>
  </div>
  </>
);
}

export default StaffProfile;