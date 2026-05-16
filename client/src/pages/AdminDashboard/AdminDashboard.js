import { useAuth0 } from '@auth0/auth0-react';
import { useState, useEffect, useRef } from 'react';
import { LuUser, LuBell } from "react-icons/lu";
import { useApiAuth } from '../../hooks/apiAuth';
import { useApi } from '../../api/useApi';
import './AdminDashboard.css';

function AdminDashboard() {
    const { user, logout: auth0Logout, isAuthenticated, isLoading } = useAuth0();
    const { apiFetch } = useApiAuth();
    const api = useApi();

    const logout = () => {
        auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    };

    const [clinics, setClinics] = useState([]);
    const [selectedClinic, setSelectedClinic] = useState(null);
    const [staffList, setStaffList] = useState([]);
    const [activeSection, setActiveSection] = useState(null);
    const [staffSpecialities, setStaffSpecialities] = useState({});
    const [allSpecialities, setAllSpecialities]= useState([]);
    const [selectedSpecialityByStaff, setSelectedSpecialityByStaff]= useState({});
    const [newSpecialityByStaff, setNewSpecialityByStaff]= useState({});

    const contentRef = useRef(null);

    useEffect(() => {
        const fetchAssignedClinics = async () => {
            try {
                if (!user?.sub) return;

                const response = await apiFetch(
                    `${process.env.REACT_APP_SERVER_URL}/api/clinics/assigned?auth0Id=${encodeURIComponent(user.sub)}`
                );
                const data = await response.json();

                if (response.ok && Array.isArray(data) && data.length > 0) {
                    setClinics(data);
                    setSelectedClinic(data[0]);
                } else {
                    console.warn("Backend response was not ok, or array was empty:", data);
                }
            } catch (error) {
                console.error('Error fetching assigned clinics:', error);
            }
        };
        if (!isLoading && isAuthenticated) {
            fetchAssignedClinics();
        }
    }, [user, isAuthenticated, isLoading, apiFetch]);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                if (!selectedClinic || !user?.sub) return;

                const response = await apiFetch(
                    `${process.env.REACT_APP_SERVER_URL}/api/clinics/${selectedClinic._id}/staff?auth0Id=${encodeURIComponent(user.sub)}`
                );
                const data = await response.json();

                if (response.ok) {
                    setStaffList(data.users || []);
                }
            } catch (error) {
                console.error('Error fetching staff:', error);
            }
        };
        
        fetchStaff();
    },[selectedClinic, user, apiFetch]);

    useEffect(() => {
        const loadStaffSpecialities = async () => {
            try {
                const result = {};

                for (const member of staffList) {
                    const userId = member.userId || member._id;

                    if (!userId || !member.staffId) continue;

                    const data = await api.specialities.getForStaff(userId);

                    result[member.staffId] = data.SpecialityObjects || [];
                }

                setStaffSpecialities(result);
            } catch (error) {
                console.error("Error loading staff specialities:", error);
            }
        };

        if (staffList.length > 0) {
            loadStaffSpecialities();
        } else {
            setStaffSpecialities({});
        }
    },[staffList, api]);

    useEffect(() => {
        const loadSpecialities = async () => {
            try {
                const specialities=await api.specialities.getAll();
                setAllSpecialities(specialities || []);
            } catch (error) {
                console.error("Error loading specialities:", error);
            }
        };
        loadSpecialities();
    },[api]);
        


    if (isLoading) {
        return <p>Loading dashboard...</p>;
    }

    if (!selectedClinic) {
        return <p>No assigned clinics found.</p>;
    }

    const handleClinicChange = (clinic) => {
        setSelectedClinic(clinic);
        setActiveSection(null);
    };

    const handleAddSpeciality = async (staffId) => {
        try {
            let specialityId = selectedSpecialityByStaff[staffId];
            const newSpecialityName = newSpecialityByStaff[staffId]?.trim();
            if(!specialityId && newSpecialityName) {
                const created=await api.specialities.create({SpecialityName: newSpecialityName});
                specialityId=created.speciality._id;
                const updatedSpecialities= await api.specialities.getAll();
                setAllSpecialities(updatedSpecialities);
            }
            if(!specialityId) {
                alert("Please select or enter a speciality to add.");
                return;
            }
            
            await api.specialities.addToStaff({staffId, specialityId});

            const member = staffList.find((staff) => staff.staffId === staffId);
            const userId = member?.userId || member?._id;
            if (userId) {
                const updatedData = await api.specialities.getForStaff(userId);

                setStaffSpecialities((prev) => ({
                    ...prev,
                    [staffId]: updatedData.SpecialityObjects || []
                }));
            }

            setSelectedSpecialityByStaff((prev)=> ({
                ...prev,
                [staffId]: ""
            }));
            setNewSpecialityByStaff((prev)=> ({
                ...prev,
                [staffId]: ""
            }));
            alert("Speciality added successfully.");
        } catch (error) {
            console.error("Error adding speciality to staff:", error);
            alert("Failed to add speciality. Please try again.");
        }
    };

    const handleRemoveSpeciality = async (staffId, specialityId) => {
        try {
            await api.specialities.removeFromStaff({
                staffId,
                specialityId
            });

            setStaffSpecialities((prev) => ({
                ...prev,
                [staffId]: (prev[staffId] || []).filter(
                    (speciality) => speciality._id !== specialityId
                )
            }));

            alert("Speciality removed successfully.");
        } catch (error) {
            console.error("Error removing speciality from staff:", error);
            alert("Failed to remove speciality. Please try again.");
        }
    };

    const toggleSection = (sectionName) => {
        setActiveSection(activeSection === sectionName ? null : sectionName);
        setTimeout(() => {
            contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    return (
        <main className="admin-dashboard-wrapper">
            <header className="admin-header-canva">
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

            <section className="purple-banner-container">
                <section className="top-section">
                    <section className="welcome-area">
                        <h1 className="welcome-title-canva">Welcome Back, {user?.name || 'Admin'}!</h1>
                    </section>

                    <section className="notifications-card">
                        <section className="notif-header">
                            <h3>Notifications</h3>
                            <LuBell className="bell-icon" />
                        </section>
                        <section className="notifications-list">
                            <p style={{ marginTop: '1rem', fontSize: '14px', fontWeight: 'bold' }}>3 New Notifications</p>
                        </section>
                    </section>
                </section>
            </section>

            <section className="clinic-selection-area">
                <header className="selection-header">Select your Clinic</header>
                <ul className="clinic-cards-list">
                    {clinics.map((clinic) => (
                        <li 
                            key={clinic._id} 
                            className={`clinic-card ${selectedClinic._id === clinic._id ? 'active' : ''}`}
                            onClick={() => handleClinicChange(clinic)}
                            role="button"
                            tabIndex={0}
                        >
                            <h3 className="clinic-card-title">{clinic.practiceName}</h3>
                            <p className="clinic-card-desc">{clinic.practiceTypeDescription || 'General Practice'}</p>
                            <p className="clinic-card-address">{clinic.physicalAddress}</p>
                        </li>
                    ))}
                </ul>
            </section>

            <nav className="admin-action-buttons">
                <button className="action-btn-large" onClick={() => toggleSection('manage-clinic')}>Manage Clinic</button>
                <button className="action-btn-large" onClick={() => toggleSection('manage-staff')}>Manage Staff</button>
                <button className="action-btn-large" onClick={() => toggleSection('add-staff')}>Add Staff</button>
                <button className="action-btn-large" onClick={() => toggleSection('view-stats')}>View Stats</button>
            </nav>

            <section className="dynamic-content-area" ref={contentRef}>
                {activeSection === 'manage-clinic' && (
                    <article className="content-block">
                        <header className="block-header">Manage {selectedClinic.practiceName}</header>
                        <section className="block-body">
                            <p>Practice Type: {selectedClinic.practiceTypeDescription || 'General Practice'}</p>
                            <p>Address: {selectedClinic.physicalAddress}, {selectedClinic.physicalSuburb}, {selectedClinic.physicalTown}</p>
                            <p>Practice Number: {selectedClinic.practiceNumber}</p>
                            <p>Contact Number: {selectedClinic.contactNumber}</p>
                            <p>Times: {selectedClinic.practiceTimes?.open || '08:00'} - {selectedClinic.practiceTimes?.close || '17:00'}</p>
                            <p>Services: {selectedClinic.services?.join(', ') || ''}</p>
                            <button className="pill-btn-purple edit-times-btn">Edit Clinic Times</button>
                        </section>
                    </article>
                )}

                {activeSection === 'manage-staff' && (
                    <article className="content-block">
                        <header className="block-header">Manage Clinic Staff</header>
                        <section className="block-body flex-list">
                            {staffList.length === 0 ? <p>No staff found.</p> : staffList.map((member) => (
                                <article key={member._id} className="staff-card">
                                <section className="staff-card-header">
                                    <section>
                                        <h4 className="staff-name">
                                            {member.title} {member.name} {member.surname}
                                        </h4>
                                        <p className="staff-role">{member.role || 'Staff Member'}</p>
                                    </section>

                                    <button className="pill-btn-red staff-fire-btn">
                                        Fire
                                    </button>
                                </section>

                                <section className="staff-speciality-section">
                                    <h5 className="staff-section-title">Current Specialities</h5>

                                    {(staffSpecialities[member.staffId] || []).length === 0 ? (
                                        <p className="empty-specialities">No specialities assigned.</p>
                                    ) : (
                                        <ul className="speciality-chip-list">
                                            {(staffSpecialities[member.staffId] || []).map((speciality) => (
                                                <li key={speciality._id}>
                                                    <button
                                                        type="button"
                                                        className="speciality-chip"
                                                        onClick={() =>
                                                            handleRemoveSpeciality(member.staffId, speciality._id)
                                                        }
                                                        title="Click to remove speciality"
                                                    >
                                                        {speciality.SpecialityName || speciality.name}
                                                        <span className="chip-remove">×</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>

                                <section className="add-speciality-section">
                                    <h5 className="staff-section-title">Add Speciality</h5>

                                    <section className="speciality-controls">
                                        <select
                                            className="speciality-select"
                                            value={selectedSpecialityByStaff[member.staffId] || ""}
                                            onChange={(e) =>
                                                setSelectedSpecialityByStaff((prev) => ({
                                                    ...prev,
                                                    [member.staffId]: e.target.value
                                                }))
                                            }
                                        >
                                            <option value="">Choose existing speciality</option>
                                            {allSpecialities.map((speciality) => (
                                                <option key={speciality._id} value={speciality._id}>
                                                    {speciality.SpecialityName}
                                                </option>
                                            ))}
                                        </select>

                                        <input
                                            className="speciality-input"
                                            type="text"
                                            placeholder="Or enter new speciality"
                                            value={newSpecialityByStaff[member.staffId] || ""}
                                            onChange={(e) =>
                                                setNewSpecialityByStaff((prev) => ({
                                                    ...prev,
                                                    [member.staffId]: e.target.value
                                                }))
                                            }
                                        />
                                    </section>

                                    <button
                                        className="pill-btn-purple add-speciality-btn"
                                        onClick={() => handleAddSpeciality(member.staffId)}
                                    >
                                        Add Speciality
                                    </button>
                                </section>
                            </article>
                            ))}
                        </section>
                    </article>
                )}

                {activeSection === 'add-staff' && (
                    <article className="content-block">
                        <header className="block-header">Add New Clinic Staff</header>
                        <section className="block-body">
                            <form className="add-staff-form">
                                <fieldset className="form-row">
                                    <label>Enter Email</label>
                                    <input type="email" className="form-input" />
                                </fieldset>
                                <fieldset className="form-row">
                                    <label>Choose speciality</label>
                                    <input type="text" className="form-input" />
                                </fieldset>
                                <button type="button" className="pill-btn-purple submit-staff-btn">Add Staff</button>
                            </form>
                        </section>
                    </article>
                )}

                {activeSection === 'view-stats' && (
                    <article className="content-block">
                        <header className="block-header">Clinic Stats</header>
                        <section className="block-body">
                            <nav className="stats-nav">
                                <button className="stat-btn">Staff<br/>Off Days</button>
                                <button className="stat-btn">Cancelled<br/>Appointments</button>
                                <button className="stat-btn">Appointments<br/>Made</button>
                            </nav>
                            <section className="graph-placeholder">
                                <span className="graph-icon">📈</span>
                            </section>
                        </section>
                    </article>
                )}
            </section>
        </main>
    );
}

export default AdminDashboard;