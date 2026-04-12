import React from 'react';

function Registration() {
    const [userType, setUserType] = React.useState('patient');

    const handleSubmit = (event) => {
        event.preventDefault();

        const registrationData = {
            // OAuth token thing?
            userType,
        };

        console.log('Registration submitted:', registrationData); // we gotta agree on a way to pass data between pages

        const redirectMap = {
            patient: '/dashboard/patient',
            staff: '/dashboard/staff',
            admin: '/dashboard/admin',
        };

        window.location.href = redirectMap[userType] || '/';
    };

    return (
        <body>
            <h1>Register</h1>

            <form data-testid="register-form" onSubmit={handleSubmit}>
                <fieldset>
                    <legend>I am a</legend>

                    <label for="patient">
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

                    <label for="staff">
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

                    <label for="admin">
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
        </body>
    );
}

export default Registration;