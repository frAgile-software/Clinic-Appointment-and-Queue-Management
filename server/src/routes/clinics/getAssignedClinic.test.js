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

 
    Staff.findOne.mockResolvedValue(mockStaffRecord);

   
    Clinic.findById.mockResolvedValue(mockClinic);

    const response = await request(app)
      .get('/?auth0Id=auth0|123');

 
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockClinic);
    

    expect(User.findOne).toHaveBeenCalledWith({ auth0Id: 'auth0|123' });
    expect(Staff.findOne).toHaveBeenCalledWith({ User: 'userId' });
    expect(Clinic.findById).toHaveBeenCalledWith('clinicId1');
});


it('should return error if auth0Id is missing', async () => {
   const mockUser = { _id: 'userId', auth0Id: 'auth0|123', role: 'staff' };
    const mockStaffRecord = { Clinic: 'clinicId1' };
    const mockClinic = { _id: 'clinicId1', practiceName: 'Clinic 1' };


    User.findOne.mockResolvedValue(mockUser);

 
    Staff.findOne.mockResolvedValue(mockStaffRecord);

   
    Clinic.findById.mockResolvedValue(mockClinic);

    const response = await request(app)
      .get('/?auth0Id=auth0|123');

 
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockClinic);
    

    expect(User.findOne).toHaveBeenCalledWith({ auth0Id: 'auth0|123' });
    expect(Staff.findOne).toHaveBeenCalledWith({ User: 'userId' });
    expect(Clinic.findById).toHaveBeenCalledWith('clinicId1');
});
it('should return 400 if auth0Id is missing from the query', async () => {

    const response = await request(app)
      .get('/'); // No ?auth0Id

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Missing auth0Id" });
});

it('should return 404 if user is not found or not staff', async () => {
  const mockUser = { _id: 'userId', auth0Id: 'auth0|123', role: 'NotAStaff' };
    const mockStaffRecord = { Clinic: 'clinicId1' };
    const mockClinic = { _id: 'clinicId1', practiceName: 'Clinic 1' };


    User.findOne.mockResolvedValue(mockUser);

 
    Staff.findOne.mockResolvedValue(mockStaffRecord);

   
    Clinic.findById.mockResolvedValue(mockClinic);

    const response = await request(app)
      .get('/?auth0Id=auth0|123');

 
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Staff user not found" });
    

    expect(User.findOne).toHaveBeenCalledWith({ auth0Id: 'auth0|123' });
});
});
