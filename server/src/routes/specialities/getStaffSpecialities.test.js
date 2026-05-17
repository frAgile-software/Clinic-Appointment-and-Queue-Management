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
    findById: jest.fn()
}));

jest.mock('../../database/models/Staff', () => ({
    findOne: jest.fn()
}));

jest.mock('../../database/models/StaffSpeciality', () => ({
    find: jest.fn()
}));

const request = require('supertest');
const app = require('../../index');

const User = require('../../database/models/User');
const Staff = require('../../database/models/Staff');
const StaffSpeciality = require('../../database/models/StaffSpeciality');

const VALID_USER = {
    _id: '1234',
    role: 'Staff',
};

const VALID_STAFF_DOC = {
    _id: 'staffDoc1',
};

const MOCK_SPECIALITIES = [
    {
        Speciality: {
            _id: 'sp1',
            SpecialityName: 'Cardiology'
        }
    },
    {
        Speciality: {
            _id: 'sp2',
            SpecialityName: 'Neurology'
        }
    },
];

beforeEach(() => {
    jest.clearAllMocks();
});

const mockPopulate = (resolvedValue) => {
    StaffSpeciality.find.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(resolvedValue)
    });
};

const runSuite = (basePath) => {
    test('Returns 200 specialities when found', async () => {
        User.findById.mockResolvedValueOnce(VALID_USER);
        Staff.findOne.mockResolvedValueOnce(VALID_STAFF_DOC);
        mockPopulate(MOCK_SPECIALITIES);

        const res = await request(app).get(`${basePath}/1234`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            UserId: '1234',
            Specialities: ['Cardiology', 'Neurology'],
            staffId: 'staffDoc1',
            SpecialityObjects: [
                {
                    _id: 'sp1',
                    SpecialityName: 'Cardiology'
                },
                {
                    _id: 'sp2',
                    SpecialityName: 'Neurology'
                }
            ]
        });

        expect(User.findById).toHaveBeenCalledWith('1234');
        expect(Staff.findOne).toHaveBeenCalledWith({ User: '1234' });
        expect(StaffSpeciality.find).toHaveBeenCalledWith({ Staff: 'staffDoc1' });
    });

    test('Returns 200 with empty Specialities when none found', async () => {
        User.findById.mockResolvedValueOnce(VALID_USER);
        Staff.findOne.mockResolvedValueOnce(VALID_STAFF_DOC);
        mockPopulate([]);

        const res = await request(app).get(`${basePath}/1234`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            UserId: '1234',
            Specialities: [],
            staffId: 'staffDoc1',
            SpecialityObjects: []
        });
    });

    test('Returns 403 when user is not a staff member', async () => {
        User.findById.mockResolvedValueOnce({
            _id: '1234',
            role: 'Patient',
        });

        const res = await request(app).get(`${basePath}/1234`);

        expect(res.statusCode).toEqual(403);
        expect(res.body).toEqual({
            message: 'User is not a staff member.'
        });
    });

    test('Returns 404 when staff user not found', async () => {
        User.findById.mockResolvedValueOnce(null);

        const res = await request(app).get(`${basePath}/1234`);

        expect(res.statusCode).toEqual(404);
        expect(res.body).toEqual({
            message: 'Specified staff not found.'
        });
    });

    test('Returns 404 when staff document not found', async () => {
        User.findById.mockResolvedValueOnce(VALID_USER);
        Staff.findOne.mockResolvedValueOnce(null);

        const res = await request(app).get(`${basePath}/1234`);

        expect(res.statusCode).toEqual(404);
        expect(res.body).toEqual({
            message: 'User not assigned to a clinic.'
        });
    });

    test('Returns 500 on server error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        User.findById.mockRejectedValueOnce(new Error('Server error.'));

        const res = await request(app).get(`${basePath}/1234`);

        expect(res.statusCode).toEqual(500);
        expect(res.body).toEqual({
            message: 'Server error.'
        });

        consoleSpy.mockRestore();
    });
};

describe('GET /specialities/staff/:staffID', () => {
    runSuite('/specialities/staff');
});

describe('GET /api/specialities/staff/:staffID', () => {
    runSuite('/api/specialities/staff');
});
