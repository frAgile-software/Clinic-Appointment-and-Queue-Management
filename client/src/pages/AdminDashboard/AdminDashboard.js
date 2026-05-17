import { useAuth0 } from '@auth0/auth0-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router";
import { LuUser, LuBell } from "react-icons/lu";
import { useApi } from "../../api/useApi";  
import { BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as statExport from './exportHelper';
import './AdminDashboard.css';

const STATS = {QUEUE_WAIT: 'queue-waits', APPOINTMENTS: 'appointments', DAYS_OFF: 'days-off'}

// ----- a little bit of 'outsourcing' -----

// Source - https://stackoverflow.com/a/2536445
// Posted by T.J. Crowder, modified by community. See post 'Timeline' for change history
// Retrieved 2026-05-17, License - CC BY-SA 4.0

function monthDiff(d1, d2) {
    var months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
}

// Source - https://stackoverflow.com/a/64215557
// Posted by localhost
// Retrieved 2026-05-17, License - CC BY-SA 4.0

const week = 7 * 24 * 60 * 60 * 1000;
const day = 24 * 60 * 60 * 1000;

function startOfWeek(dt) {
    const weekday = dt.getDay();
    return new Date(dt.getTime() - Math.abs(0 - weekday) * day);
}

function weeksBetween(d1, d2) {
    return Math.ceil((startOfWeek(d2) - startOfWeek(d1)) / week);
}

// ----- end of 'outsourcing' -----

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
    const [apptGranularity, setApptGranularity] = useState('week');
    const [apptSearchOptions, setApptSearchOptions] = useState({});

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
                const cacheKey = buildCacheKey(selectedClinic._id, selectedStat, {
                    ...(selectedStat === STATS.QUEUE_WAIT ? { granularity: queueGranularity } : {}),
                    ...(selectedStat === STATS.APPOINTMENTS ? apptSearchOptions : {}),
                }
                );

                if (statsCache[cacheKey]) {
                    setStats(statsCache[cacheKey]);
                    return;
                }

                setLoadingStats(true);
                try {
                    let data;
                    switch(selectedStat) {
                        case STATS.QUEUE_WAIT:
                            console.log("Queue waits:");
                            data = await api.queues.getAverageWaitTime(selectedClinic._id, {_groupby: queueGranularity});
                            setStats(data.data);
                            setStatsCache( prev => ({...prev, [cacheKey]: data.data } ));
                            break;
                        case STATS.APPOINTMENTS:
                            console.log("Appointments:");
                            data = await api.appointments.summary(selectedClinic._id, apptSearchOptions);
                            setStats(data);
                            setStatsCache( prev => ({...prev, [cacheKey]: data } ));
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
    }, [activeSection, selectedClinic, queueGranularity, apptSearchOptions, selectedStat, api, statsCache]);

    if (isLoading) {
        return <p>Loading dashboard...</p>;
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

    const granularityDiff = (d1, d2) => {
        if (apptGranularity === 'month') return monthDiff(d1,d2);
        return weeksBetween(d1,d2)
    };

    const startOfByGranularity = (d) => {
        if (apptGranularity === 'month') return new Date(d.getFullYear(), d.getMonth())
        if (apptGranularity === 'week') return startOfWeek(d);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };

    const getProcessedApptStats = () => {
        if (!stats) return [];
        let processed = {};
        const startDate = new Date(stats[0].BookingDateTime);
        const endDate = new Date(stats[stats.length - 1].BookingDateTime);
        let itrDate = startOfByGranularity(startDate);
        for (let i = -1; i < granularityDiff(startDate, endDate); i++) {
            const dateStamp = apptGranularity === 'month' ? itrDate.toLocaleString('default', {month: 'long', year: 'numeric'}) : startOfWeek(itrDate).toLocaleDateString();
            processed[itrDate.toDateString()] = {DateStamp: dateStamp, "Scheduled": 0, "Completed": 0, "Cancelled": 0, "No-show": 0 };
            if (apptGranularity === 'month') itrDate.setMonth(itrDate.getMonth() + 1);
            else itrDate.setDate(itrDate.getDate() + 7);
        }
        if (Object.entries(processed).length === 0) return [];
        stats.forEach((a) => {
            const d = startOfByGranularity(new Date(a.BookingDateTime)).toDateString();
            if (a.Status === 'Waiting' || a.Status === 'In Consult')
                processed[d]["Scheduled"] += 1;
            else 
                processed[d][a.Status] += 1;
        });
        return Object.entries(processed).map((o) => o[1]);
    };

    const chart = () => {
        if (!stats)
            return (<span className="graph-icon">📈</span>);

        switch (selectedStat) {
            case STATS.QUEUE_WAIT:
                return (
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
                                    <YAxis unit=' min' />
                                    <Tooltip content={QueueTooltip} />
                                    <Line type="monotone" dataKey="avgWait" stroke="#6b1fad" strokeWidth={2} dot={{ fill: '#6b1fad' }} />
                                </LineChart>
                            ) : (
                                <BarChart data={stats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="label" />
                                    <YAxis unit=" min" />
                                    <Tooltip content={QueueTooltip} />
                                    <Bar dataKey="avgWait" fill="#6b1fad" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </>
                );
            case STATS.APPOINTMENTS:
                const apstats = getProcessedApptStats();
                return (
                    <>
                        <h2 className="chart-title">Appointment history summary</h2>
                        <nav className="granularity-toggle">
                            <button className={apptGranularity === 'week' ? 'active' : ''} onClick={() => setApptGranularity('week')}>Per Week</button>
                            <button className={apptGranularity === 'month' ? 'active' : ''} onClick={() => setApptGranularity('month')}>Per Month</button>
                            <input
                                type="date"
                                value={!apptSearchOptions._fromdate ? "" : apptSearchOptions._fromdate}
                                onChange={(e) => setApptSearchOptions(prev => ({ ...prev, _fromdate: e.target.value }))}
                            />
                            <input
                                type="date"
                                value={!apptSearchOptions._todate ? "" : apptSearchOptions._todate}
                                onChange={(e) => setApptSearchOptions(prev => ({ ...prev, _todate: e.target.value }))}
                            />
                        </nav>
                        <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={apstats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="DateStamp" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="Scheduled" stackId="a" fill="#5cc3ff" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Completed" stackId="a" fill="#6b1fad" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Cancelled" stackId="a" fill="#ffa600" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="No-show" stackId="a" fill="#df1616" radius={[4, 4, 0, 0]} />
                                </BarChart>
                        </ResponsiveContainer>
                    </>
                );
            default:
                return (<span className="graph-icon">📈</span>);
        }
    }
    
    const exportCSV = () => {
        if (!stats) return;
        const csvUri = statExport.convertCsv(stats);
        statExport.downloadFile(csvUri, `${selectedStat}_${new Date().toISOString()}.csv`);
    };

    const exportPDF = () => {
        const graph = document.getElementsByClassName("stats-graph");
        if (!graph || graph.length === 0) return;
        statExport.convertPdf(graph[0]).then((pdfUri) => 
            statExport.downloadFile(pdfUri, `${selectedStat}_${new Date().toISOString()}.pdf`));
    };

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
    <section className="clinic-selection-area">
        <header className="selection-header">Select your Clinic</header>
        <ul className="clinic-cards-list">
            {clinics.map((clinic) => (
                <li 
                    key={clinic._id} 
                    className={`admin-selection-card ${selectedClinic?._id === clinic._id ? 'active' : ''}`}
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
)}
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
                                <button className={`stat-btn ${selectedStat === STATS.DAYS_OFF ? 'active' : ''}`} onClick={() => setSelectedStat(STATS.DAYS_OFF)}>Staff<br/>Off Days</button>
                                <button className={`stat-btn ${selectedStat === STATS.APPOINTMENTS ? 'active' : ''}`} onClick={() => setSelectedStat(STATS.APPOINTMENTS)}>Appointments</button>
                                <button className={`stat-btn ${selectedStat === STATS.QUEUE_WAIT ? 'active' : ''}`} onClick={() => setSelectedStat(STATS.QUEUE_WAIT)}>Queue<br/>Waits</button>
                            </nav>
                            <section className="stats-graph">
                                { loadingStats ? (
                                    <span>Loading {selectedStat}...</span>
                                ) : chart()}
                            </section>
                        </section>
                        <nav className="export-nav" align='right'>
                            <h2>Export to: </h2>
                            <button className="pill-btn-purple submit-staff-btn" onClick={exportCSV}>CSV</button>
                            <button className="pill-btn-purple submit-staff-btn" onClick={exportPDF}>PDF</button>
                        </nav>
                    </article>
                )}
            </section>
        </main>
    );
}

export default AdminDashboard;