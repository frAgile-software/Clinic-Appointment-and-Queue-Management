jest.mock('../../database/dbConnect', () => jest.fn(() => Promise.resolve()));

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

jest.mock('../../database/models/User', () => ({
    findOne: jest.fn()
}));

const request = require('supertest');
const app = require('../../index');
const User = require('../../database/models/User');

describe('GET /api/users/:auth0Id', () => {

    afterAll((done) => {
        if (app.listener) {
            app.listener.close(done);
        } else {
            done();
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Returns 200 user when found', async () => {
        User.findOne.mockResolvedValueOnce({
            auth0Id: 'auth0|mockUserId123',
            name: 'Test',
            surname: 'User',
            title: 'Ms',
            email: 'test@example.com',
            role: 'Admin',
        });

        const res = await request(app).get('/api/users/auth0|mockUserId123');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject({
            role: 'Admin',
            name: 'Test',
        });
    });

    test('Returns 404 if not found', async() => {
        User.findOne.mockResolvedValueOnce(null);

        const res = await request(app).get('/api/users/auth0|mockUserId123');

        expect(res.statusCode).toEqual(404);
    });

    test('Returns 500 for server failure', async () => {
        User.findOne.mockRejectedValueOnce(new Error('Server error.'));

        const res = await request(app).get('/api/users/auth0|mockUserId123');

        expect(res.statusCode).toEqual(500);
    });
});