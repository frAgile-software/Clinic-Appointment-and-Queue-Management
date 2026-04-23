import React, { useState, useEffect } from 'react';
//import './StaffProfile.css';
import { useAuth0 } from '@auth0/auth0-react';

  function StaffProfile({}) {
  const { user } = useAuth0();
  const [clinics, setClinics] = useState([]);
  const staffId = user?.sub;


    
  useEffect(() => {
    if (!staffId) return; 

    async function fetchClinics() {
      try {
        const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/clinics?staffId=${staffId}`);
        const data = await response.json();
        setClinics(data);
      } catch (error) {
        console.error("Could not fetch clinics:", error);
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {clinics.map(function(clinic) {
            return (
              <div key={clinic._id} style={{ border: '2px solid black', padding: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', textTransform: 'uppercase' }}>
                  {clinic.name}
                </h3>
                <p><strong>Location:</strong> {clinic.address}</p>
                <p><strong>Specialty:</strong> {clinic.speciality}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default StaffProfile;