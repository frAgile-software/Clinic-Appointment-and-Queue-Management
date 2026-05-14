const { auth } = require('express-oauth2-jwt-bearer');

const requireAuth = auth({
    audience: `${process.env.SERVER_URL}`,
    issuerBaseURL: `https://clinicsandqs-users.eu.auth0.com/`, 
    tokenSigningAlg: 'RS256',
});

const getAuth0ManagementToken = async () => {
    const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            grant_type: "client_credentials",
            client_id: process.env.AUTH0_CLIENT_ID,
            client_secret: process.env.AUTH0_CLIENT_SECRET,
            audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error("Auth0 token error:", error);
        throw new Error(error.error_description || "Failed to fetch Auth0 management token.");
    }

    const data = await response.json();
    return data.access_token;
};

module.exports = {requireAuth, getAuth0ManagementToken};