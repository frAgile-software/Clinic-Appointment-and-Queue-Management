import { Link } from 'react-router';
import './AdminDashboard.css';
import bell from './bell.png';
import logo from './clinicLogo.png';
import { useAuth0 } from '@auth0/auth0-react';

function AdminDashboard() {
    const {
        logout: auth0Logout,
        //user,
    } = useAuth0();

    const logout = () => {
        auth0Logout({ logoutParams: { returnTo: window.location.origin } });
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
        <h2>Welcome to the Admin Dashboard for "Clinic Name"</h2>
        <img src={logo} alt="Clinic Logo"></img>
        <section id="dropdown_clinicList">
                <button id="dropdown_button_clinicList">Change Clinic</button>
                <section id="dropdown_content_clinicList">
                    <ul className="clinic_list">
                        <li className="dropdown_item"><button>Clinic 1</button></li>
                        <li className="dropdown_item"><button>Clinic 2</button></li>
                        <li className="dropdown_item"><button>Clinic 3</button></li>
                    </ul>
            </section>
        </section>
    </section>
    <section className="section">
        <h2>Manage "clinic name"</h2>
            <h3>Clinic details:</h3>
            <p>Address: "clinic address"</p>
            <p>Contact: "clinic contact"</p>
            <p>Operating Hours: "operating Hours"</p>
            <p>Services: "services"</p>

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
            <li><p>ID: 001, Name: John Doe</p></li>
            <li><p>ID: 002, Name: Jane Smith</p></li>
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