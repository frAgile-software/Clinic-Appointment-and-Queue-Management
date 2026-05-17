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
    const [adminName, setAdminName] = useState("");
    const contentRef = useRef(null);
    const [stats, setStats] = useState(null);
    const [statsCache, setStatsCache] = useState({});
    const [selectedStat, setSelectedStat] = useState('');
    const [loadingStats, setLoadingStats] = useState(false);
    const [queueGranularity, setQueueGranularity] = useState('day');

    const [editingTimes, setEditingTimes] = useState(false);
    const [timesForm, setTimesForm] = useState({ open: '', close: '' });
    const [savingTimes, setSavingTimes] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user?.sub) {
            try {
                const data = await api.users.get(user.sub);
                setAdminName(data.name);
            } catch (error) {
                console.error("Failed to fetch user profile:", error);
            }
            }
        };
        fetchUserData();
    }, [user, api]);

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



    const handleEditTimesClick = () => {
    setTimesForm({
        open: selectedClinic.practiceTimes?.open || '',
        close: selectedClinic.practiceTimes?.close || '',
    });
    setEditingTimes(true);
    };

    const handleSaveTimes = async () => {
    setSavingTimes(true);
    setSaveSuccess(false);
    setTimeout(() => setSaveSuccess(false), 3000);
    try {
        await api.clinics.updateClinic(selectedClinic._id, {
            'practiceTimes.open': timesForm.open,
            'practiceTimes.close': timesForm.close,
        });
        setSelectedClinic(prev => ({
            ...prev,
            practiceTimes: { open: timesForm.open, close: timesForm.close }
        }));
        setClinics(prev => prev.map(c =>
            c._id === selectedClinic._id
                ? { ...c, practiceTimes: { open: timesForm.open, close: timesForm.close } }
                : c
        ));
        setSaveSuccess(true);
        setEditingTimes(false);
    } catch (error) {
        console.error('Failed to update clinic times:', error);
    } finally {
        setSavingTimes(false);
    }
    };


    const handleClinicChange = (clinic) => {
        setSelectedClinic(clinic);
        setActiveSection(null);
        setEditingTimes(false);
    };

    const toggleSection = (sectionName) => {
        setActiveSection(activeSection === sectionName ? null : sectionName);
        setTimeout(() => {
            contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

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
                        <h1 className="welcome-title-canva">Welcome Back, {adminName || 'Admin'}!</h1>
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

            {!clinics || clinics.length === 0 ? (
                <section className="clinic-selection-area">
                    <header className="selection-header">You are not assigned to any clinics yet.</header>
                </section>
            ) : (
            <section>
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
            <p>Times: {selectedClinic.practiceTimes?.open && selectedClinic.practiceTimes?.close
                ? `${selectedClinic.practiceTimes.open} - ${selectedClinic.practiceTimes.close}`
                : 'Not set'}
            </p>
            <p>Services: {selectedClinic.services?.join(', ') || ''}</p>
            {saveSuccess && (
                <p style={{ color: '#16a34a', fontSize: '13px', fontWeight: '600', marginTop: '8px' }}>
                    Clinic times saved successfully
                </p>
            )}
            {editingTimes ? (
                <section className="edit-times-form">
                    <fieldset className="times-fields">
                        <label>
                            Open
                            <input
                                type="time"
                                value={timesForm.open}
                                onChange={e => setTimesForm(prev => ({ ...prev, open: e.target.value }))}
                                className="time-input"
                            />
                        </label>
                        <label>
                            Close
                            <input
                                type="time"
                                value={timesForm.close}
                                onChange={e => setTimesForm(prev => ({ ...prev, close: e.target.value }))}
                                className="time-input"
                            />
                        </label>
                    </fieldset>
                    <section className="times-actions">
                        <button className="pill-btn-purple" onClick={handleSaveTimes} disabled={savingTimes}>
                            {savingTimes ? 'Saving...' : 'Save Times'}
                        </button>
                        <button className="pill-btn-grey" onClick={() => setEditingTimes(false)}>
                            Cancel
                        </button>
                    </section>
                </section>
            ) : (
                <button className="pill-btn-purple edit-times-btn" onClick={handleEditTimesClick}>
                    Edit Clinic Times
                </button>
            )}
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
            </section>
            )}
            
        </main>
    );
}

export default AdminDashboard;