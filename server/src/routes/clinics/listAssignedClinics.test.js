const request = require('supertest');
const express = require('express');
const listAssignedClinics = require('./listAssignedClinics');
const Clinic = require('../../database/models/Clinic');
const User = require('../../database/models/User');
const Staff = require('../../database/models/Staff');

const app = express();
app.use(express.json());
app.use('/', listAssignedClinics);

jest.mock('../../database/models/Clinic');
jest.mock('../../database/models/User');
jest.mock('../../database/models/Staff');

describe('listAssignedClinics API', () => {
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return clinics successfully', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|123' };
    const mockStaffRecords = [{ Clinic: 'clinicId1' }, { Clinic: 'clinicId2' }];
    const mockClinics = [
      { _id: 'clinicId1', practiceName: 'Clinic 1' },
      { _id: 'clinicId2', practiceName: 'Clinic 2' }
    ];

    User.findOne.mockResolvedValue(mockUser);
    Staff.find.mockResolvedValue(mockStaffRecords);
    Clinic.find.mockResolvedValue(mockClinics);

    const response = await request(app)
      .get('/?auth0Id=auth0|123');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockClinics);
    expect(User.findOne).toHaveBeenCalledWith({ auth0Id: 'auth0|123' });
    expect(Staff.find).toHaveBeenCalledWith({ User: 'userId' });
    expect(Clinic.find).toHaveBeenCalledWith({ _id: { $in: ['clinicId1', 'clinicId2'] } });
  });

  it('should return 400 if auth0Id is missing', async () => {
    const response = await request(app)
      .get('/');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Missing required field');
  });

  it('should return 404 if user not found', async () => {
    User.findOne.mockResolvedValue(null);

    const response = await request(app)
      .get('/?auth0Id=auth0|123');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User not found');
  });

  it('should return 404 if user is not a staff member', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|123' };
    User.findOne.mockResolvedValue(mockUser);
    Staff.find.mockResolvedValue([]);

    const response = await request(app)
      .get('/?auth0Id=auth0|123');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User is not a staff member');
  });

  it('should return 404 if no clinic assigned to this staff member', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|123' };
    const mockStaffRecords = [{ Clinic: 'clinicId1' }];
    User.findOne.mockResolvedValue(mockUser);
    Staff.find.mockResolvedValue(mockStaffRecords);
    Clinic.find.mockResolvedValue([]);

    const response = await request(app)
      .get('/?auth0Id=auth0|123');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('No clinic assigned to this staff member');
  });

  it('should return 500 on server error', async () => {
    User.findOne.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .get('/?auth0Id=auth0|123');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Server error');
  });
});