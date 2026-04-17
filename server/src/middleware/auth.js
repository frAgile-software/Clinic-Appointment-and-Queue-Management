import {auth} from 'express-oauth2-jwt-bearer';

export const requireAuth = auth({
    audience: `${process.env.SERVER_URL}`,
    issuerBaseURL: `https://clinicsandqs-users.eu.auth0.com`,
    tokenSigningAlg: 'RS256',
});