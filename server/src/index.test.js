jest.mock('./database/dbConnect', () => jest.fn(() => Promise.resolve()));

jest.mock('express-oauth2-jwt-bearer', () => ({
    auth: jest.fn(() => (req, res, next) => {
        req.auth = {
            payload: {
                sub: 'auth0|mockUserId123',
                aud: process.env.SERVER_URL,
                iss: 'https://clinicsandqs-users.eu.auth0.com/',
                scope: 'openid profile email',
            }
        };
        next();
    })
}));

const request = require('supertest');
const app = require('./index');

describe('Server Basic Integrity', () => {

    afterAll((done) => {
        if (app.listener) {
            app.listener.close(done);
        } else {
            done();
        }
    });

    test('Health Check: GET /hello returns 200', async () => {
        const res = await request(app).get('/hello');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Hello world!');
    });

    test('App instance is properly initialized', () => {
        expect(app).toBeDefined();
    });
});