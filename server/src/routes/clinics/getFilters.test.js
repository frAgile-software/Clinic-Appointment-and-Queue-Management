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

jest.mock('../../database/models/Clinic', () => ({
    distinct: jest.fn()
}));

const request = require('supertest');
const app = require('../../index');
const Clinic = require('../../database/models/Clinic');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GET /clinics/filters', () => {

    test('Returns 200 and filters', async () => {
        Clinic.distinct
            .mockResolvedValueOnce(['PoongProvince', 'MoongProvince'])
            .mockResolvedValueOnce(['Poong Town', 'Moong Town'])
            .mockResolvedValueOnce(['Suburp'])
            .mockResolvedValueOnce(['Lobotomy Centre']);

        const res = await request(app).get('/clinics/filters');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject({
            provinces: ['MoongProvince','PoongProvince'],
            towns: ['Moong Town','Poong Town'],
            suburbs: ['Suburp'],
            types: ['Lobotomy Centre'],
        });
    });

    test('Applies filters from query', async () => {
        Clinic.distinct.mockResolvedValue([]);

        await request(app).get('/clinics/filters?province=Poong&town=Moong&suburb=Suburp&type=Lobotomy');

        expect(Clinic.distinct).toHaveBeenCalledWith("province", {
            province: { $regex: 'Poong', $options: 'i' },
            physicalTown: { $regex: 'Moong', $options: 'i' },
            physicalSuburb: { $regex: 'Suburp', $options: 'i' },
            practiceTypeDescription: { $regex: 'Lobotomy', $options: 'i' },
        });
    });

    test('Returns 500 on server error', async () => {
        Clinic.distinct.mockRejectedValueOnce(new Error('Server error.'));

        const res = await request(app).get('/clinics/filters');

        expect(res.statusCode).toEqual(500);
    });
});