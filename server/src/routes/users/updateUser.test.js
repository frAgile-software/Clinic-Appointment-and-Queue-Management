jest.mock('../../database/dbConnect', () => jest.fn(() => Promise.resolve()));

jest.mock('express-oauth2-jwt-bearer', () => ({
    auth: jest.fn(() => (req, res, next) => {
        req.auth = {
            payload: {
                sub: 'auth0-mockUserId123',
                aud: process.env.SERVER_URL,
                iss: 'https://clinicsandqs-users.eu.auth0.com/',
                scope: 'openid profile email',
            }
        };
        next();
    })
}));

jest.mock('../../database/models/User', () => ({
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
}));

const request = require('supertest');
const app = require('../../index');
const User = require('../../database/models/User');

describe('PATCH /api/users/:auth0Id', () => {

    const validUser = {
        auth0Id: 'auth0-mockUserId123',
        name: 'Test',
        surname: 'User',
        title: 'Ms',
        email: 'test@example.com',
        role: 'Admin',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Suppress console output to prevent CI pipeline failures on expected errors
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    test('Returns 404 when user not found', async () => {
        User.findOne.mockResolvedValueOnce(null);

        const res = await request(app).patch('/api/users/auth0-mockUserId123')
            .send({name: 'Tset', surname: 'Resu'});

        expect(res.statusCode).toEqual(404);
    });

    test('Returns 200 on PATCH success', async () => {
        User.findOne.mockResolvedValueOnce(validUser);
        User.findOneAndUpdate.mockResolvedValueOnce(validUser);

        const res = await request(app).patch('/api/users/auth0-mockUserId123')
            .send({name: 'Tset', surname: 'Resu'});

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            message: "User updated.",
            user: validUser
        });
    });

    test('Returns 500 for server failure', async () => {
        User.findOne.mockRejectedValueOnce(new Error('Server error.'));

        const res = await request(app).patch('/api/users/auth0-mockUserId123')
            .send({name: 'Tset', surname: 'Resu'});

        expect(res.statusCode).toEqual(500);
    });
});