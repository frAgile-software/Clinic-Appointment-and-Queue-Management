import { useAuth0 } from '@auth0/auth0-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router";
import { LuUser, LuBell } from "react-icons/lu";
import { useApi } from "../../api/useApi";  
import { BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './AdminDashboard.css';

const STATS = {QUEUE_WAIT: 'queue-waits', APPS_MADE: 'apps-made', APPS_CANCELLED: 'apps-cancelled', DAYS_OFF: 'days-off'}

function AdminDashboard() {
    const { user, logout: auth0Logout, isAuthenticated, isLoading } = useAuth0();
    const api = useApi(); 
    const navigate = useNavigate();

    const logout = () => {
        auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    };

    const [clinics, setClinics] = useState([]);
    const [selectedClinic, setSelectedClinic] = useState(null);
    const [staffList, setStaffList] = useState([]);
    const [activeSection, setActiveSection] = useState(null);
    const contentRef = useRef(null);
    const [stats, setStats] = useState(null);
    const [statsCache, setStatsCache] = useState({});
    const [selectedStat, setSelectedStat] = useState('');
    const [loadingStats, setLoadingStats] = useState(false);
    const [queueGranularity, setQueueGranularity] = useState('day');

    const [staffEmail, setStaffEmail] = useState('');
    const [staffSearchResult, setStaffSearchResult] = useState(null); 
    const [loadingStaffSearch, setLoadingStaffSearch] = useState(false);
    const [hasSearchedStaff, setHasSearchedStaff] = useState(false);
    const [addingStaff, setAddingStaff] = useState(false);
    const staffDebounceTimer = useRef(null);
    const [specialities, setSpecialities] = useState({});
    const [selectedSpeciality, setSelectedSpeciality] = useState('');

    useEffect(() => {
        const fetchAssignedClinics = async () => {
            try {
                if (!user?.sub) return;

                const data = await api.clinics.getAssignedClinics(user.sub);

                if (Array.isArray(data) && data.length > 0) {
                    setClinics(data);
                    setSelectedClinic(data[0]);
                }
            } catch (error) {
                console.error('Error fetching assigned clinics:', error);
            }
        };
        if (!isLoading && isAuthenticated) {
            fetchAssignedClinics();
        }
    }, [user, isAuthenticated, isLoading, api]);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                if (!selectedClinic || !user?.sub) return;

                const data = await api.clinics.listStaff(selectedClinic._id);

                if (data && data.users) {
                    setStaffList(data.users || []);
                }
            } catch (error) {
                console.error('Error fetching staff:', error);
            }
        };

        fetchStaff();
    }, [selectedClinic, user, api]);


     // email search 

    useEffect(() => {
        const email = staffEmail.trim();
 
        if (!email) {
            setStaffSearchResult(null);
            setHasSearchedStaff(false);
            setLoadingStaffSearch(false);
            return;
        }
 
        clearTimeout(staffDebounceTimer.current);
        staffDebounceTimer.current = setTimeout(async () => {
            setLoadingStaffSearch(true);
            setHasSearchedStaff(true);
 
        try {
            const user = await api.users.getByEmail(email, 'Staff');
            setStaffSearchResult(user ? { user, isLinked: false } : null);
        } catch (error) {
            console.error('Staff email check error:', error);
            setStaffSearchResult(null);
        } finally {
            setLoadingStaffSearch(false);
        }
        }, 400);
 
        return () => clearTimeout(staffDebounceTimer.current);
    }, [staffEmail, api]);
   
    useEffect(() => {
        if (activeSection === 'add-staff') {
            api.specialities.getAll()
                .then(data => {
                    const map = {};
                    data.forEach(s => { map[s._id] = s.SpecialityName; });
                    setSpecialities(map);
                })
                .catch(console.error);
        }
    }, [activeSection, api]);


    // default schedule from clinic open/close times 
    const buildDefaultScheduleEntries = (clinic) => {
        const openHour  = parseInt((clinic.practiceTimes?.open  || '08:00').split(':')[0], 10);
        const closeHour = parseInt((clinic.practiceTimes?.close || '17:00').split(':')[0], 10);

        const entries = [];

        for (let day = 0; day <= 6; day++) {
            for (let hour = openHour; hour < closeHour; hour++) {
                entries.push({
                    DayOfWeek: day,
                    StartTime: `${String(hour).padStart(2, '0')}:00`,
                    EndTime:   `${String(hour + 1).padStart(2, '0')}:00`,
                });
            }
        }

        return entries;
    };

 
    // Add staff 
    const handleAddStaff = async () => {
        if (!staffSearchResult?.user || staffSearchResult.isLinked) return;
 
        try {
            setAddingStaff(true);
 
            //linking existing staff user to this clinic
            await api.clinics.linkStaff(selectedClinic._id, {
                auth0Id: staffSearchResult.user.auth0Id,
            });
 
            //create default schedule
            const defaultEntries = buildDefaultScheduleEntries(selectedClinic);
            await api.schedules.createDefault(staffSearchResult.user._id, defaultEntries);
 
            
            const data = await api.clinics.listStaff(selectedClinic._id);
            if (data?.users) setStaffList(data.users);
 
            setStaffEmail('');
            setStaffSearchResult(null);
            setHasSearchedStaff(false);
            setSelectedSpeciality('');
 
        } catch (error) {
            if (error.status === 409) {
                alert('This staff member is already linked to a clinic.');
            } else {
                console.error('Could not add staff member:', error);
                alert('Failed to add staff. Please try again.');
            }
        } finally {
            setAddingStaff(false);
        }
    };
   
    // creates a cache key for a stats query
    const buildCacheKey = (clinicId, stat, params = {}) => {
        const paramStr = Object.values(params).join('-');
        return paramStr ? `${clinicId}-${stat}-${paramStr}` : `${clinicId}-${stat}`;
    }

    useEffect(() => {
        if (activeSection === 'view-stats' && selectedClinic) {
            const fetchStats = async () => {

                // Cache stats (so we dont refetch them on every button click)
                const cacheKey = buildCacheKey(selectedClinic._id, selectedStat,
                    selectedStat === STATS.QUEUE_WAIT ? {granularity: queueGranularity } : {}
                );

                if (statsCache[cacheKey]) {
                    setStats(statsCache[cacheKey]);
                    return;
                }

                setLoadingStats(true);
                try {
                    switch(selectedStat) {
                        case STATS.QUEUE_WAIT:
                            console.log("Queue waits:");
                            const data = await api.queues.getAverageWaitTime(selectedClinic._id, {_groupby: queueGranularity});
                            setStats(data.data);
                            setStatsCache( prev => ({...prev, [cacheKey]: data.data } ));
                            break;
                        case STATS.APPS_MADE:
                            console.log("Appoitments made:");
                            break;
                        case STATS.APPS_CANCELLED:
                            console.log("Appoitments cancelled:");
                            break;
                        case STATS.DAYS_OFF:
                            console.log("Staff days off:");
                            break;
                        default:
                            console.log("No stat selected.");
                    }
                } catch (error) {
                    console.log("Error fetching stats:", error);
                    setStats(null);
                } finally {
                    setLoadingStats(false);
                }
            }
            fetchStats();
        }
    }, [activeSection, selectedClinic, queueGranularity, selectedStat, api, statsCache]);

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

    const toggleSection = (sectionName) => {
        setActiveSection(activeSection === sectionName ? null : sectionName);
        setTimeout(() => {
            contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };


    const staffEmailIndicator = (() => {
        if (loadingStaffSearch) return 'loading';
        if (!hasSearchedStaff || !staffEmail.trim()) return null;
        if (staffSearchResult?.user && !staffSearchResult.isLinked) return 'ok';
        return 'error';
    })();
    
    const QueueTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const hour = Math.floor(label)
            const formatLabel = queueGranularity === 'hour' ? `${String(hour).padStart(2, '0')}:00-${String(hour).padStart(2, '0')}:59` : label;
            return (
                <section className='custom-tooltip'>
                    <p className='tooltip-label'>{formatLabel}</p>
                    <p className='tooltip-label'>{payload[0].value} min</p>
                </section>
            )
        }
        return null;
    }

    // data is returned per hour i.e. 08:00 is the wait time for 08:00-08:59
    // this func shifts those values for display purposes (line graph)
    const shiftHours = !stats ? [] : stats.map(item => ({
        ...item,
        hourNum: parseInt(item.label) + 0.5,
    }));

    return (
        <main className="admin-dashboard-wrapper">
            <header className="admin-header-canva">
                <section className="brand-section">
                    <img src="/logo.svg" alt="Clinics and Qs Logo" className="brand-logo" />
                    <h2 className="brand-title">Clinics and Qs</h2>
                </section>
                <nav className="header-nav-canva">
                    <button className="icon-btn-user" aria-label="Profile" onClick={() => navigate('/dashboard/admin/profile')}>
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
                            className={`admin-selection-card ${selectedClinic._id === clinic._id ? 'active' : ''}`}
                            onClick={() => handleClinicChange(clinic)}
                            role="button"
                            tabIndex={0}
                        >
                            <h3 className="admin-card-title">{clinic.practiceName}</h3>
                            <p className="admin-card-desc">{clinic.practiceTypeDescription || 'General Practice'}</p>
                            <p className="admin-card-address">{clinic.physicalAddress}</p>
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
                                    <section className="staff-info">
                                        <h4>{member.title} {member.name} {member.surname}</h4>
                                        <p>{member.speciality || 'General'}</p>
                                    </section>
                                    <section className="staff-actions">
                                        <button className="pill-btn-purple">Add Speciality</button>
                                        <button className="pill-btn-purple">Remove Speciality</button>
                                        <button className="pill-btn-red">Fire</button>
                                    </section>
                                </article>
                            ))}
                        </section>
                    </article>
                )}

            {/* Add Staff*/}
            {activeSection === 'add-staff' && (
                <article className="content-block">
                    <header className="block-header">Add New Clinic Staff</header>
                    <section className="block-body">
                        <form className="add-staff-form">
                             {/* Stole from StaffDash */}
                            <fieldset className="form-row">
                                <label htmlFor="staff-email-input">Staff Email</label>
                                <section className="email-input-wrapper">
                                    <input
                                        id="staff-email-input"
                                        type="email"
                                        className="form-input"
                                        value={staffEmail}
                                        onChange={(e) => setStaffEmail(e.target.value)}
                                        placeholder="staff@example.com"
                                    />

                                    {staffEmail.trim() && hasSearchedStaff && (
                                        <span className="email-search-indicator" aria-live="polite">
                                            {staffEmailIndicator === 'loading' && (
                                                <span className="spinner" aria-label="Searching" />
                                            )}
                                            {staffEmailIndicator === 'ok' && (
                                                <span className="indicator-tick" aria-label="Staff found and available">✓</span>
                                            )}
                                            {staffEmailIndicator === 'error' && (
                                                <span className="indicator-cross" aria-label="Not found or already linked">✗</span>
                                            )}
                                        </span>
                                    )}
                                </section>
                            </fieldset>

                            <fieldset className="form-row">
                                {staffSearchResult?.user && !loadingStaffSearch && (
                                    staffSearchResult.isLinked ? (
                                        <span className="patient-found-name" style={{ color: 'red' }}>
                                            ⚠ {staffSearchResult.user.title} {staffSearchResult.user.name} {staffSearchResult.user.surname} is already linked to another clinic.
                                        </span>
                                    ) : (
                                        <span className="patient-found-name">
                                            Found: {staffSearchResult.user.title} {staffSearchResult.user.name} {staffSearchResult.user.surname}
                                        </span>
                                    )
                                )}
                                {hasSearchedStaff && !loadingStaffSearch && !staffSearchResult && (
                                    <span style={{ color: 'red', fontSize: '13px' }}>No staff account found with that email.</span>
                                )}
                            </fieldset>

                            {staffSearchResult?.user && !loadingStaffSearch && !staffSearchResult.isLinked && (
                                <fieldset className="form-row">
                                    <label htmlFor="speciality-select">Speciality</label>
                                    <select
                                        id="speciality-select"
                                        className="form-input"
                                        value={selectedSpeciality}
                                        onChange={(e) => setSelectedSpeciality(e.target.value)}
                                    >
                                        <option value="">Select a speciality</option>
                                        {Object.entries(specialities).map(([id, name]) => (
                                            <option key={id} value={id}>{name}</option>
                                        ))}
                                    </select>
                                </fieldset>
                            )}

                            <button
                                type="button"
                                aria-label="Submit add staff"
                                className="pill-btn-purple submit-staff-btn"
                                disabled={
                                    !staffSearchResult?.user ||
                                    staffSearchResult.isLinked ||
                                    !selectedSpeciality ||
                                    addingStaff
                                }
                                onClick={handleAddStaff}
                            >
                                {addingStaff ? 'Adding...' : 'Add Staff'}
                            </button>

                        </form>
                    </section>
                </article>
            )}

                

                {activeSection === 'view-stats' && (
                    <article className="content-block">
                        <header className="block-header">Clinic Stats</header>
                        <section className="block-body">
                            <nav className="stats-nav">
                                <button className={`stat-btn ${selectedStat === STATS.DAYS_OFF ? 'active' : ''}`} onClick={() => setSelectedStat("days-off")}>Staff<br/>Off Days</button>
                                <button className={`stat-btn ${selectedStat === STATS.APPS_CANCELLED ? 'active' : ''}`} onClick={() => setSelectedStat("apps-cancelled")}>Cancelled<br/>Appointments</button>
                                <button className={`stat-btn ${selectedStat === STATS.APPS_MADE ? 'active' : ''}`} onClick={() => setSelectedStat("apps-made")}>Appointments<br/>Made</button>
                                <button className={`stat-btn ${selectedStat === STATS.QUEUE_WAIT ? 'active' : ''}`} onClick={() => setSelectedStat("queue-waits")}>Queue<br/>Waits</button>
                            </nav>
                            <section className="stats-graph">
                                { loadingStats ? (
                                    <span>Loading {selectedStat}...</span>
                                ) : stats && selectedStat === STATS.QUEUE_WAIT ? (
                                    <>
                                        <h2 className="chart-title">Average Queue Wait Time</h2>
                                        <nav className="granularity-toggle">
                                            <button className={queueGranularity === 'day' ? 'active' : ''} onClick={() => setQueueGranularity('day')}>Per Day</button>
                                            <button className={queueGranularity === 'hour' ? 'active' : ''} onClick={() => setQueueGranularity('hour')}>Per Hour</button>
                                        </nav>
                                        <ResponsiveContainer width="100%" height={300}>
                                            {queueGranularity === 'hour' ? (
                                                <LineChart data={shiftHours}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis 
                                                        dataKey="hourNum"
                                                        type="number"
                                                        domain={['dataMin - 0.5', 'dataMax + 0.5']}
                                                        tickFormatter={(val) => `${String(Math.floor(val)).padStart(2, '0')}:00`}
                                                        ticks={shiftHours.map(d => d.hourNum - 0.5)}
                                                    />
                                                    <YAxis unit=' min'/>
                                                    <Tooltip content={QueueTooltip}/>
                                                    <Line type="monotone" dataKey="avgWait" stroke="#6b1fad" strokeWidth={2} dot={{ fill: '#6b1fad' }} />
                                                </LineChart>
                                            ) : (
                                                <BarChart data={stats}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="label" />
                                                    <YAxis unit=" min" />
                                                    <Tooltip content={QueueTooltip}/>
                                                    <Bar dataKey="avgWait" fill="#6b1fad" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            )}
                                        </ResponsiveContainer>
                                    </>
                                ) : (
                                    <span className="graph-icon">📈</span>
                                )}
                            </section>
                        </section>
                    </article>
                )}
            </section>
        </main>
    );
}

export default AdminDashboard;