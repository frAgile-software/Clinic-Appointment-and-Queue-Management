import React from 'react';
import { useNavigate } from 'react-router';

function Registration() {
    const [userType, setUserType] = React.useState('patient');
    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();

        const registrationData = {
            userType,
        };

        console.log('Registration submitted:', registrationData); // we gotta agree on a way to pass data between pages

        const redirectMap = {
            patient: '/dashboard/patient',
            staff: '/dashboard/staff',
            admin: '/dashboard/admin',
        };

        navigate(redirectMap[userType] || '/');
    };

    return (
        <main>
            <h1>Register</h1>

            <form data-testid="register-form" onSubmit={handleSubmit}>
                <fieldset>
                    <legend>I am a</legend>

                    <label htmlFor="patient">
                        <input
                            type="radio"
                            id="patient"
                            name="userType"
                            value="patient"
                            checked={userType === 'patient'}
                            onChange={(event) => setUserType(event.target.value)}
                            data-testid="role-select"
                        />
                        Patient
                    </label>

                    <label htmlFor="staff">
                        <input
                            type="radio"
                            id="staff"
                            name="userType"
                            value="staff"
                            checked={userType === 'staff'}
                            onChange={(event) => setUserType(event.target.value)}
                            data-testid="role-select"
                        />
                        Staff
                    </label>

                    <label htmlFor="admin">
                        <input
                            type="radio"
                            id="admin"
                            name="userType"
                            value="admin"
                            checked={userType === 'admin'}
                            onChange={(event) => setUserType(event.target.value)}
                            data-testid="role-select"
                        />
                        Admin
                    </label>
                </fieldset>

                <button type="submit" data-testid="register-button">
                    Continue
                </button>
            </form>
        </main>
    );
}

export default Registration;