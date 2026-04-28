jest.mock('../../database/dbConnect', () => jest.fn(() => Promise.resolve()));

jest.mock('../../middleware/auth', () => ({
    requireAuth: (req, res, next) => next() // just skip auth
}));

jest.mock('../../database/models/Appointment', () => ({
    find: jest.fn(),
}));

jest.mock('../../database/models/User', () => ({
    findOne: jest.fn(),
}));

const request = require('supertest');
const app = require('../../index');
const Appointment = require('../../database/models/Appointment');
const User = require('../../database/models/User');

describe('GET /api/appointments/:auth0Id', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns 404 when use not found by auth0Id', async () => {
        User.findOne.mockResolvedValueOnce(null);

        const res = await request(app).get('/api/appointments/user123');

        expect(res.status).toEqual(404);
    });

    test('return 200 with patient appointments', async () => {
        const mockUser = { _id: 'user123', role: 'Patient' };
        const mockAppointments = [
            { _id: 'apt1', Patient: 'user123', Staff: 'staff456', Clinic: 'clinic1', Speciality: 'General Practice' },
        ];

        User.findOne.mockResolvedValueOnce(mockUser);

        const populateMock = jest.fn().mockReturnThis();
        Appointment.find.mockReturnValueOnce({ populate: populateMock });
        populateMock.mockReturnValueOnce({ populate: populateMock })
                    .mockReturnValueOnce({ populate: populateMock })
                    .mockReturnValueOnce({ populate: populateMock })
                    .mockResolvedValueOnce(mockAppointments);

        const res = await request(app).get('/api/appointments/mockAuth0');

        expect(User.findOne).toHaveBeenCalledWith({ auth0Id: 'mockAuth0' });
        expect(Appointment.find).toHaveBeenCalledWith({ Patient: 'user123'});
        expect(res.status).toEqual(200);
        expect(res.body).toEqual(mockAppointments);
    });

    test('return 200 with staff appointments', async () => {
        const mockUser = { _id: 'staff456', role: 'Staff' };
        const mockAppointments = [
            { _id: 'apt1', Patient: 'user123', Staff: 'staff456', Clinic: 'clinic1', Speciality: 'General Practice' },
        ];

        User.findOne.mockResolvedValueOnce(mockUser);

        const populateMock = jest.fn().mockReturnThis();
        Appointment.find.mockReturnValueOnce({ populate: populateMock });
        populateMock.mockReturnValueOnce({ populate: populateMock })
                    .mockReturnValueOnce({ populate: populateMock })
                    .mockReturnValueOnce({ populate: populateMock })
                    .mockResolvedValueOnce(mockAppointments);

        const res = await request(app).get('/api/appointments/mockAuth0');

        expect(User.findOne).toHaveBeenCalledWith({ auth0Id: 'mockAuth0' });
        expect(Appointment.find).toHaveBeenCalledWith({ Staff: 'staff456'});
        expect(res.status).toEqual(200);
        expect(res.body).toEqual(mockAppointments);
    });

    test('returns 200 with empty array if no appointments found', async () => {
        const mockUser = { _id: 'staff456', role: 'Staff' };

        User.findOne.mockResolvedValueOnce(mockUser);
        const populateMock = jest.fn().mockReturnThis();
        Appointment.find.mockReturnValueOnce({ populate: populateMock });
        populateMock
            .mockReturnValueOnce({ populate: populateMock })
            .mockReturnValueOnce({ populate: populateMock })
            .mockReturnValueOnce({ populate: populateMock })
            .mockResolvedValueOnce([]);

        const res = await request(app).get('/api/appointments/mockAuth0');

        expect(User.findOne).toHaveBeenCalledWith({ auth0Id: 'mockAuth0' });
        expect(Appointment.find).toHaveBeenCalledWith({ Staff: 'staff456'});
        expect(res.status).toEqual(200);
        expect(res.body).toEqual([]);
    });

    test('return 404 if admin', async () => {
        const mockUser = { _id: 'staff456', role: 'Admin' };

        User.findOne.mockResolvedValueOnce(mockUser);

        const res = await request(app).get('/api/appointments/mockAuth0');

        expect(User.findOne).toHaveBeenCalledWith({ auth0Id: 'mockAuth0' });
        expect(res.status).toEqual(404);
        expect(res.body).toEqual({message: "Admin does not have any appointments."});
    });

    test('return 500 on server error', async () => {
        User.findOne.mockRejectedValueOnce(new Error('Server error.'));

        const res = await request(app).get('/api/appointments/mockAuth0');

        expect(res.status).toEqual(500);
    });
});