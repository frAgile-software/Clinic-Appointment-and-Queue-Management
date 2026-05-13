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

jest.mock('../../database/models/Staff', () => ({
    find: jest.fn()
}));

jest.mock('../../database/models/Speciality', () => ({
    find: jest.fn()
}));

jest.mock('../../database/models/StaffSpeciality', () => ({
    find: jest.fn().mockReturnValue({
        populate: jest.fn()
    })
}));

const request = require('supertest');
const app = require('../../index');
const Staff = require('../../database/models/Staff');
const StaffSpeciality = require('../../database/models/StaffSpeciality');
const Speciality = require('../../database/models/Speciality');

const VALID_CLINIC_ID = '507f1f77bcf86cd799439011';
const INVALID_CLINIC_ID = 'not-a-valid-objectid';

const MOCK_STAFF = [
    { _id: 'staff1' },
    { _id: 'staff2' },
];

const MOCK_STAFF_SPECIALITIES = [
    { Speciality: { _id: 'sp1', SpecialityName: 'Cardiology' } },
    { Speciality: { _id: 'sp2', SpecialityName: 'Neurology' } },
];

beforeEach(() => {
    jest.clearAllMocks();
});

const runSuite = (basePath) => {

    test('Returns 200 with specialities map when found', async () => {
        Staff.find.mockReturnValueOnce({
            select: jest.fn().mockResolvedValueOnce(MOCK_STAFF)
        });
        StaffSpeciality.find.mockReturnValueOnce({
            populate: jest.fn().mockReturnValueOnce({
                lean: jest.fn().mockResolvedValueOnce(MOCK_STAFF_SPECIALITIES)
            })
        });

        const res = await request(app).get(`${basePath}/${VALID_CLINIC_ID}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            sp1: 'Cardiology',
            sp2: 'Neurology'
        });
    });

    test('Returns 200 with empty object when no specialities found', async () => {
        Staff.find.mockReturnValueOnce({
            select: jest.fn().mockResolvedValueOnce(MOCK_STAFF)
        });
        StaffSpeciality.find.mockReturnValueOnce({
            populate: jest.fn().mockReturnValueOnce({
                lean: jest.fn().mockResolvedValueOnce([])
            })
        });

        const res = await request(app).get(`${basePath}/${VALID_CLINIC_ID}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({});
    });

    test('Returns 200 with empty object when no staff at clinic', async () => {
        Staff.find.mockReturnValueOnce({
            select: jest.fn().mockResolvedValueOnce([])
        });
        StaffSpeciality.find.mockReturnValueOnce({
            populate: jest.fn().mockReturnValueOnce({
                lean: jest.fn().mockResolvedValueOnce([])
            })
        });

        const res = await request(app).get(`${basePath}/${VALID_CLINIC_ID}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({});
    });

    test('Dedupes when multiple staff share a speciality', async () => {
        Staff.find.mockReturnValueOnce({
            select: jest.fn().mockResolvedValueOnce(MOCK_STAFF)
        });
        StaffSpeciality.find.mockReturnValueOnce({
            populate: jest.fn().mockReturnValueOnce({
                lean: jest.fn().mockResolvedValueOnce([
                    { Speciality: { _id: 'sp1', SpecialityName: 'Cardiology' } },
                    { Speciality: { _id: 'sp1', SpecialityName: 'Cardiology' } },
                    { Speciality: { _id: 'sp2', SpecialityName: 'Neurology' } },
                ])
            })
        });

        const res = await request(app).get(`${basePath}/${VALID_CLINIC_ID}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            sp1: 'Cardiology',
            sp2: 'Neurology'
        });
    });

    test('Skips records with missing Speciality', async () => {
        Staff.find.mockReturnValueOnce({
            select: jest.fn().mockResolvedValueOnce(MOCK_STAFF)
        });
        StaffSpeciality.find.mockReturnValueOnce({
            populate: jest.fn().mockReturnValueOnce({
                lean: jest.fn().mockResolvedValueOnce([
                    { Speciality: { _id: 'sp1', SpecialityName: 'Cardiology' } },
                    { Speciality: null },
                ])
            })
        });

        const res = await request(app).get(`${basePath}/${VALID_CLINIC_ID}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ sp1: 'Cardiology' });
    });

    test('Returns 400 when clinicId is not a valid ObjectId', async () => {
        const res = await request(app).get(`${basePath}/${INVALID_CLINIC_ID}`);

        expect(res.statusCode).toEqual(400);
        expect(Staff.find).not.toHaveBeenCalled();
    });

    test('Returns 500 on server error', async () => {
        Staff.find.mockImplementationOnce(() => {
            throw new Error('Server error.');
        });

        const res = await request(app).get(`${basePath}/${VALID_CLINIC_ID}`);

        expect(res.statusCode).toEqual(500);
    });
};

describe('GET /api/specialities/clinic/:clinicId', () => runSuite('/api/specialities/clinic'));