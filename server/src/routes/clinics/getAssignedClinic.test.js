const request = require('supertest');
const express = require('express');
const getAssignedClinic = require('./getAssignedClinic');
const Clinic = require('../../database/models/Clinic');
const User = require('../../database/models/User');
const Staff = require('../../database/models/Staff');

const app = express();
app.use(express.json());
app.use('/', getAssignedClinic);

jest.mock('../../database/models/Clinic');
jest.mock('../../database/models/User');
jest.mock('../../database/models/Staff');

describe('getAssignedClinic API', () => {
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
    beforeEach(() => {
        jest.clearAllMocks();
    });

it('should return clinic successfully', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|123', role: 'staff' };
    const mockStaffRecord = { Clinic: 'clinicId1' };
    const mockClinic = { _id: 'clinicId1', practiceName: 'Clinic 1' };

    User.findOne.mockResolvedValue(mockUser);
    Staff.find.mockResolvedValue(mockStaffRecord);
    Clinic.find.mockResolvedValue(mockClinic);

    const response = await request(app)
      .get('/?auth0Id=auth0|123');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockClinic);
    expect(User.findOne).toHaveBeenCalledWith({ auth0Id: 'auth0|123' });
    expect(Staff.find).toHaveBeenCalledWith({ User: 'userId' });
    expect(Clinic.find).toHaveBeenCalledWith({ _id:  'clinicId1' });
  });
});

