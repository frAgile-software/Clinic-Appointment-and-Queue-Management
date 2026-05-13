import React, { useState, useEffect } from 'react';
import './PatientProfile.css'; 
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router';
import { useApiAuth } from '../../hooks/apiAuth';
import { useRef } from 'react';

function PatientProfile() {
    const nameRef = useRef(); 
    const surnameRef = useRef();
    const titleRef = useRef();
    const emailRef = useRef();

    const { user, logout: auth0Logout } = useAuth0();
    const navigate = useNavigate();
    const {apiFetch} = useApiAuth();
 
    const [isChangeDetailsModalOpen, setIsChangeDetailsModalOpen] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(false);
    const patientId = user?.sub;

    const logout = () => {
        auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    };

    const toggleChangeDetailsModal = () => {
        setIsChangeDetailsModalOpen(!isChangeDetailsModalOpen);
    };

    const handleUpdate = async () => {
        if (!patientId){
            console.error("No userId found, cannot update.");
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
            alert('No changes made.');
            toggleChangeDetailsModal();
            return;
        }

        try {
            console.log("Updating with data:", updatedData);    
            const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/users/${patientId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            if (response.ok) {
                setProfileData(prev => ({ ...prev, ...updatedData }));
                toggleChangeDetailsModal();
                alert("Details updated successfully!");
            };

        } catch (error) {
            console.error("Update failed:", error);
        };
    };

    useEffect(() => {
        if (!patientId) {
            console.log("No user, cannot find profile details.");
            return;
        };

        const fetchProfileData = async () => {
            try {
                setLoading(true);
                const response = await apiFetch(`${process.env.REACT_APP_SERVER_URL}/api/users/${patientId}`);
                const data = await response.json();
                console.log("User data", data);
                setProfileData(data);
            } catch (error) {
                console.error("Could not fetch profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [patientId, apiFetch]);

    return (
        <div className="landing"> 
            <nav className="landing-nav" aria-label="Main navigation">
            <span className="landing-logo">Clinics and Qs</span>
            <section className="landing-nav-btns">
                <button className="btn" onClick={logout}>Logout</button>
                <button className="btn btn-primary" onClick={() => navigate('/dashboard/patient')}>Back</button>
            </section>
            </nav>

            <main className="profile-container">
                <header className="profile-header">
                    <h1 className="profile-title">My Profile</h1>
                </header>

                {loading ? (
                    <div className="landing--loading">Loading profile details...</div>
                ) : (
                    <section className="profile-grid">
                        <div className="profile-actions-card">
                            <h3 className='profile-subtitle'>Account Details</h3>
                            {profileData && (
                                <section className='profile-display'>
                                    {user?.picture && (
                                        <div className="profile-avatar-container">
                                            <img 
                                                src={user.picture} 
                                                alt="Profile Avatar" 
                                                className="profile-avatar" 
                                                referrerPolicy="no-referrer"
                                            />
                                        </div>
                                    )}
                                    <div className='inline-components'>
                                        <label>Title</label>
                                        <p>{profileData?.title}</p>
                                    </div>
                                    <div className='inline-components'>
                                        <label>Name</label>
                                        <p>{profileData?.name}</p>
                                    </div>
                                    <div className='inline-components'>
                                        <label>Surname</label>
                                        <p>{profileData?.surname}</p>
                                    </div>
                                    <div className='inline-components'>
                                        <label>Email</label> 
                                        <p>{profileData?.email}</p>
                                    </div>
                                </section>
                            )}
                            <div className="action-button-list">
                                <button className="action-item-btn" onClick={toggleChangeDetailsModal}>Update account details</button>
                            </div>
                        </div>
                    </section>
                )}

                {isChangeDetailsModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content details-card"> 
                            <h3 className="sub-heading">Edit Account Details</h3>
                            
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
                                    <input type="email" disabled={!patientId || !patientId?.startsWith("auth0|")} ref={emailRef} defaultValue={profileData.email} className="search-bar" style={{border: '1px solid var(--color-border)'}} />
                                </div>
                                

                                <div className="landing-nav-btns" style={{marginTop: '20px'}}>
                                <button type="button" className="btn btn-primary" onClick={handleUpdate}>Save Changes</button>
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

export default PatientProfile;