import React, { useState, useEffect } from 'react';
//import './StaffProfile.css';
import { useAuth0 } from '@auth0/auth0-react';

  function StaffProfile() {
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
      <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <header>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', borderBottom: '4px solid black' }}>
            MY PROFILE
          </h1>
        </header>

        <section style={{ marginTop: '20px' }}>
          <h2>Assigned Clinics</h2>

          {loading ? (
        <div className="loader-container">
          <p>Fetching clinics...</p>
          
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {clinics.length > 0 ? (
            clinics.map((clinic) => (
              <div key={clinic._id} style={{ border: '2px solid black', padding: '20px' }}>
                <h3 style={{ textTransform: 'uppercase' }}>{clinic.practiceName}</h3>
                <p><strong>Location:</strong> {clinic.physicalAddress}</p>
              </div>
            ))
          ) : (
            <p>No clinics found for your ID.</p>
          )}
        </div>
      )}
    </section>
  </div>
);
}

export default StaffProfile;