import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';

function Registration() {
    const navigate = useNavigate();
    const { user, isAuthenticated, loginWithRedirect } = useAuth0();
    
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        title: '',
        role: 'Patient'
    });

    // Force Auth0 login if they arrive here unauthenticated
    useEffect(() => {
        if (!isAuthenticated) {
            loginWithRedirect({ appState: { returnTo: '/register' } });
        }
    }, [isAuthenticated, loginWithRedirect]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Assemble the final payload combining form data and Auth0 secure data
        const payload = {
            ...formData,
            auth0Id: user.sub,
            email: user.email
        };

        try {
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                const redirectMap = {
                    Patient: '/dashboard/patient',
                    Staff: '/dashboard/staff',
                    Admin: '/dashboard/admin',
                };
                navigate(redirectMap[data.role] || '/');
            } else {
                console.error('Registration failed:', data.message);
            }
        } catch (error) {
            console.error('Network error:', error);
        }
    };

    // Prevent rendering the form until Auth0 has verified their identity
    if (!isAuthenticated || !user) {
        return <div>Authenticating with Auth0...</div>;
    }

    return (
        <main>
            <h1>Complete Your Profile</h1>
            <p>Logged in as: {user.email}</p>
            <form data-testid="register-form" onSubmit={handleSubmit}>
                <fieldset>
                    <legend>Personal Information</legend>
                    <input type="text" name="title" placeholder="Title (e.g. Mr, Dr)" onChange={handleChange} />
                    <input type="text" name="name" placeholder="First Name" required onChange={handleChange} />
                    <input type="text" name="surname" placeholder="Surname" required onChange={handleChange} />
                </fieldset>

                <fieldset>
                    <legend>I am a</legend>
                    {['Patient', 'Staff', 'Admin'].map((roleOption) => (
                        <label key={roleOption} htmlFor={roleOption.toLowerCase()}>
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
                    ))}
                </fieldset>

                <button type="submit" data-testid="register-button">
                    Complete Registration
                </button>
            </form>
        </main>
    );
}

export default Registration;