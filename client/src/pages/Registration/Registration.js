import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from '../../api/useApi';
import './Registration.css';
import { useUserRole } from '../../context/UserRoleContext';


function Registration() {
    const navigate = useNavigate();
    const { user, isAuthenticated, loginWithRedirect, isLoading } = useAuth0();
    const api = useApi();
    const { refreshRole } = useUserRole();
    
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        title: '',
        role: 'Patient'
    });

    // Force Auth0 login if they arrive here unauthenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            loginWithRedirect({ appState: { returnTo: '/register' } });
        }
    }, [isAuthenticated, loginWithRedirect, isLoading]);

    //check if already registered (manual url change protection)
    useEffect(() => {
    const verifyUserRole = async () => {
      if (!isLoading && isAuthenticated && user) {
        try {
          console.log(`Attempting to get user.`);

          const data = await api.users.get(user.sub);

          console.log("User found. Redirecting...");
          const redirectMap = {
            Patient: '/dashboard/patient',
            Staff:   '/dashboard/staff',
            Admin:   '/dashboard/admin',
          };

          navigate(redirectMap[data.role] || '/');
          
        } catch (error) {
          if (error.status !== 404) {
            console.error('Network error during verification:', error);
          }
        }
      }
    };
    verifyUserRole();
  }, [isLoading, isAuthenticated, user, navigate, api]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // submit registration
    const handleSubmit = async (event) => {
        event.preventDefault();

        // Assemble the final payload combining form data and Auth0 secure data
        const payload = {
            ...formData,
            auth0Id: user.sub,
            email: user.email
        };

        try {
            const data = await api.users.register(payload);

            await refreshRole();

            const redirectMap = {
                Patient: '/dashboard/patient',
                Staff: '/dashboard/staff',
                Admin: '/dashboard/admin',
            };
            navigate(redirectMap[data.role] || '/');

        } catch (error) {
            console.error('Registration error:', error);
        }
    };

    if (isLoading) return <p className="landing--loading">Loading...</p>

    // Prevent rendering the form until Auth0 has verified their identity
    if (!isAuthenticated || !user) {
        return <p className="landing--loading">Authenticating with Auth0...</p>;
    }

    return (
        <section className="landing">
            <main className="registration-container">
                <article className="registration-card">

                    <header className="registration-card-header">
                        <h1 className="registration-title">Complete Your Profile</h1>
                        <p className="registration-subtitle">Logged in as: {user.email}</p>
                    </header>

                    <section className="registration-card-body">
                        <form data-testid="register-form" onSubmit={handleSubmit}>

                            <fieldset>
                                <legend>Personal Information</legend>
                                <input className="search-bar" type="text" name="title" placeholder="Title (e.g. Mr, Dr)" onChange={handleChange} />
                                <input className="search-bar" type="text" name="name" placeholder="First Name" required onChange={handleChange} />
                                <input className="search-bar" type="text" name="surname" placeholder="Surname" required onChange={handleChange} />
                            </fieldset>

                            <fieldset>
                                <legend>I am a</legend>
                                <menu className="registration-role-group">
                                    {['Patient', 'Staff', 'Admin'].map((roleOption) => (
                                        <li key={roleOption}>
                                            <label
                                                className={`registration-role-label${formData.role === roleOption ? ' registration-role-label--selected' : ''}`}
                                                htmlFor={roleOption.toLowerCase()}
                                            >
                                                <input
                                                    type="radio"
                                                    id={roleOption.toLowerCase()}
                                                    name="role"
                                                    value={roleOption}
                                                    checked={formData.role === roleOption}
                                                    onChange={handleChange}
                                                    data-testid="role-select"
                                                />
                                                {roleOption}
                                            </label>
                                        </li>
                                    ))}
                                </menu>
                            </fieldset>

                            <button type="submit" className="action-item-btn" data-testid="register-button">
                                Complete Registration
                            </button>

                        </form>
                    </section>

                </article>
            </main>
        </section>
    );
}

export default Registration;