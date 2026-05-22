import React, { useState, useEffect, useRef } from 'react';
import './PatientProfile.css'; 
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router';
import { useApi } from '../../api/useApi';
import Header from '../../components/Header';
import NotificationCenter from '../../components/NotificationCenter';

function PatientProfile() {
    const nameRef = useRef(); //for changing of details
    const surnameRef = useRef();
    const titleRef = useRef();
    const emailRef = useRef();

    const { user, logout: auth0Logout } = useAuth0();
    const navigate = useNavigate();
    const api = useApi();
 
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

    // update user's details
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
            return; 
        }

        try {
            console.log("Updating with data:", updatedData);    
            await api.users.update(patientId, updatedData);

            setProfileData(prev => ({ ...prev, ...updatedData }));
            toggleChangeDetailsModal();
            alert("Details updated successfully!");

        } catch (error) {
            console.error("Update failed:", error);
        };
    };

    // fetch all user's profile data
    useEffect(() => {
        if (!patientId) {
            console.log("No user, cannot find profile details.");
            return;
        };

        const fetchProfileData = async () => {
            try {
                setLoading(true);
                const data = await api.users.get(patientId);

                console.log("User data", data);
                setProfileData(data);
            } catch (error) {
                console.error("Could not fetch profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [patientId, api]);

    return (
        <section className="landing">
            <Header>
                <button  onClick={logout}>Logout</button>
                <button  onClick={() => navigate('/dashboard/patient')}>Back</button>
                <NotificationCenter userId={user?.sub} />
            </Header>

            <main className="profile-container">
                <header className="profile-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h1 className="profile-title">My Profile</h1>
                    {user?.picture && (
                        <img 
                            src={user.picture} 
                            alt="Profile" 
                            className="profile-picture" 
                            style={{
                                width: '150px',
                                height: '150px',
                                borderRadius: '50%',
                                objectFit: 'cover'
                            }}
                        />
                    )}
                </header>

                {loading ? (
                    <p className="landing--loading">Loading profile details...</p>
                ) : (
                    <section className="profile-grid">
                        <article className="profile-actions-card">
                            <h3 className='profile-subtitle'>Account Details</h3>
                            {profileData && (
                                <section className='profile-display'>
                                    <fieldset className='inline-components'>
                                        <label>Title</label>
                                        <p>{profileData?.title}</p>
                                    </fieldset>
                                    <fieldset className='inline-components'>
                                        <label>Name</label>
                                        <p>{profileData?.name}</p>
                                    </fieldset>
                                    <fieldset className='inline-components'>
                                        <label>Surname</label>
                                        <p>{profileData?.surname}</p>
                                    </fieldset>
                                    <fieldset className='inline-components'>
                                        <label>Email</label>
                                        <p>{profileData?.email}</p>
                                    </fieldset>
                                </section>
                            )}
                            <nav className="action-button-list">
                                <button className="action-item-btn" onClick={toggleChangeDetailsModal}>Update account details</button>
                            </nav>
                        </article>
                    </section>
                )}

                {isChangeDetailsModalOpen && (
                    <aside className="modal-overlay">
                        <section className="modal-content details-card">
                            <h3 className="sub-heading">Edit Account Details</h3>

                            <form className="details-content">

                                <fieldset className='inline-components'>
                                    <label>Name</label>
                                    <input type="text" ref={nameRef} defaultValue={profileData?.name} className="search-bar" style={{border: '1px solid var(--color-border)'}} />
                                </fieldset>
                                <fieldset className='inline-components'>
                                    <label>Surname</label>
                                    <input type="text" ref={surnameRef} defaultValue={profileData?.surname} className="search-bar" style={{border: '1px solid var(--color-border)'}} />
                                </fieldset>
                                <fieldset className='inline-components'>
                                    <label>Title</label>
                                    <input type="text" ref={titleRef} defaultValue={profileData?.title} className="search-bar" style={{border: '1px solid var(--color-border)'}} />
                                </fieldset>
                                <fieldset className='inline-components'>
                                    <label>Email</label> 
                                    <input type="email" disabled={!patientId || !patientId?.startsWith("auth0|")} ref={emailRef} defaultValue={profileData?.email} className="search-bar" style={{border: '1px solid var(--color-border)'}} />
                                </fieldset>

                                <footer className="landing-nav-btns" style={{marginTop: '20px'}}>
                                <button type="button" className="btn btn-primary" onClick={handleUpdate}>Save Changes</button>
                                <button type="button" className="btn" style={{color: 'var(--color-text)'}} onClick={toggleChangeDetailsModal}>Cancel</button>
                                </footer>

                            </form>
                        </section>
                    </aside>
                )}
            </main>
        </section>   
    );
}

export default PatientProfile;