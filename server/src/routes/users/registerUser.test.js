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

jest.mock('../../database/models/User', () => {

    const mockUser = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValueOnce({
            auth0Id: 'auth0|mockUserId123',
            name: 'Test',
            surname: 'User',
            title: 'Ms',
            email: 'test@example.com',
            role: 'Admin',
        })
    }));

    mockUser.findOne = jest.fn();

    return mockUser;
});

const request = require('supertest');
const app = require('../../index');
const User = require('../../database/models/User');

describe('POST /api/users/register', () => {

    const validUser = {
        auth0Id: 'auth0|mockUserId123',
        name: 'Test',
        surname: 'User',
        title: 'Ms',
        email: 'test@example.com',
        role: 'Admin',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Returns 400 when required fields missing', async () => {
        const res = await request(app).post('/api/users/register')
            .send({ name: 'Test' });

        expect(res.statusCode).toEqual(400);
    });

    test('Returns 409 when already exists', async () => {
        User.findOne.mockResolvedValueOnce(validUser);

        const res = await request(app).post('/api/users/register')
            .send(validUser);
        
        expect(res.statusCode).toEqual(409);
    });

    test('Return 201 for successful registration', async () => {
        User.findOne.mockResolvedValueOnce(null);

        User.prototype.save = jest.fn().mockResolvedValueOnce(validUser);

        const res = await request(app).post('/api/users/register')
            .send(validUser);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual({
            message: "Registration successful.",
            role: validUser.role,
        });
    });

    test('Return 500 for server failure', async () => {
        User.findOne.mockResolvedValueOnce(null);

        User.mockImplementationOnce(() => ({
            save: jest.fn().mockRejectedValueOnce(new Error('Server error.'))
        }));
        
        const res = await request(app).post('/api/users/register')
            .send(validUser);

        expect(res.statusCode).toEqual(500);
    });
});