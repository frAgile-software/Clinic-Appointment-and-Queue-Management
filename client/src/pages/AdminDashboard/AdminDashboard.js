import { Link } from 'react-router';
import './AdminDashboard.css';
import bell from './bell.png';
import logo from './clinicLogo.png';
import { useAuth0 } from '@auth0/auth0-react';
import { useState, useEffect } from 'react';
import { useApiAuth } from '../../hooks/apiAuth'; 


function AdminDashboard() {
    const { user, logout: auth0Logout, isAuthenticated, isLoading } = useAuth0();
    const { apiFetch } = useApiAuth();

    //const [dashboardData] = useState(adminDashboardStub);
   // const [selectedClinic, setSelectedClinic] = useState(adminDashboardStub.clinics[0]);
    const logout = () => {
        auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    };
    const [clinics, setClinics] = useState([]);
    const [selectedClinic, setSelectedClinic] = useState(null);
    const [staffList, setStaffList] = useState([]);
    useEffect(() => {
        const fetchAssignedClinics = async () => {
            try {
                if (!user?.sub) return;

                const response = await apiFetch(
                    `${process.env.REACT_APP_SERVER_URL}/api/clinics/assigned-list?auth0Id=${encodeURIComponent(user.sub)}`
                );
                const data = await response.json();

                if (response.ok && data.length > 0) {
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
                    setStaffList(data.users);
                }
            } catch (error) {
                console.error('Error fetching staff:', error);
            }
        };

        fetchStaff();
    }, [selectedClinic, user, apiFetch]);

    if (isLoading) {
    return <p>Loading dashboard...</p>;
    }

    if (!selectedClinic) {
    return <p>No assigned clinics found.</p>;
    }
        



    const handleClinicChange = (clinic) => {
        setSelectedClinic(clinic);
    };

  return (
    <main className="dashboard">
    <header className="navbar">
        <h2 id="navCliniQ">CliniQ</h2>
      <nav className="nav">
          <Link to="/" className="nav_button">Profile</Link>{/*profile page not implemented*/}
          <button className="nav_button" onClick={logout}>Log Out</button>
          <img src={bell} width={50} height={50} alt="notification bell" className="nav_button"></img>
        </nav>
      
    </header>
    <section id="top_section">
        <h2>Welcome to the Admin Dashboard for {selectedClinic.practiceName}</h2>
        <img src={logo} alt="Clinic Logo"></img>
        <section id="dropdown_clinicList">
                <button id="dropdown_button_clinicList">Change Clinic</button>
                <section id="dropdown_content_clinicList">
                    <ul className="clinic_list">
                        {clinics.map((clinic) => (
                                <li key={clinic._id} className="dropdown_item">
                                    <button onClick={() => handleClinicChange(clinic)}>
                                        {clinic.practiceName}
                                    </button>
                                </li>
                            ))}
                    </ul>
            </section>
        </section>
    </section>
    <section className="section">
        <h2>Manage {selectedClinic.practiceName}</h2>
            <h3>Clinic details:</h3>
            <p>Address: {selectedClinic.physicalAddress}</p>
            <p>Town: {selectedClinic.physicalTown}</p>
            <p>Suburb: {selectedClinic.physicalSuburb}</p>
            <p>Contact: {selectedClinic.contactNumber}</p>
            <p>Operating Hours: {selectedClinic.operatingHours}</p>
            <p>Services: {selectedClinic.services?.join(', ') || 'Not available'}</p>

            <section id="dropdown_clinic">
                <button id="dropdown_button_clinic">Edit Clinic Details</button>
                <section id="dropdown_content_clinic">
                    <ul className="clinic_list">
                        <li className="dropdown_item"><button>Change Address</button></li>
                        <li className="dropdown_item"><button>Change Contact</button></li>
                        <li className="dropdown_item"><button>Change Operating Hours</button></li>
                        <li className="dropdown_item"><button>Add Service</button></li>
                        <li className="dropdown_item"><button>Remove Service</button></li>
                    </ul>
            </section>
        </section>
    </section>

    <section className="section" >
        <h2>Manage Staff</h2>
        <h3>Staff List:</h3>
        <ul className="clinic_list">
            {staffList.map((member) => (
                <li key={member._id}>
                    <p>ID: {member._id}, Name: {member.name} {member.surname}, Role: {member.role}</p>
                </li>
            ))}
        </ul>
        <section id="dropdown_staff">
                <button id="dropdown_button_staff">Manage Staff</button>
                <section id="dropdown_content_staff">
                    <ul className="clinic_list">
                        <li className="dropdown_item"><button>Add Staff</button></li>
                        <li className="dropdown_item"><button>Edit Staff</button></li>
                        <li className="dropdown_item"><button>Remove Staff</button></li>
                    </ul>
            </section>
        </section>

    </section>

    <section className="section">
        <h2>"Clinic Name" Stats</h2>
        <p>Average Waiting Time at 2:00 PM: 15 minutes</p>
        <button>Search Time</button>
        <input type="text" placeholder="Enter time"></input>
        <p>Appointments no-show-rates: 50% </p>
        <section id="dropdown_stats">
                <button id="dropdown_button_stats">Custom View</button>
                <section id="dropdown_content_stats">
                    <ul className="clinic_list">
                        <li className="dropdown_item"><button>View CVS</button></li>
                        <li className="dropdown_item"><button>Download CVS</button></li>
                        <li className="dropdown_item"><button>Download PDF</button></li>
                    </ul>
            </section>
        </section>
    </section>
    <footer>
        <p>© 2026 CliniQ. All rights reserved.</p>
        </footer>
    </main>
    

     

   
  );
}

export default AdminDashboard;