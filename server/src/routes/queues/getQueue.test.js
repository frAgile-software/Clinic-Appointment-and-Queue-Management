const request = require('supertest');
const express = require('express');
const getQueueRouter = require('./getQueue');
const User = require('../../database/models/User');
const Queue = require('../../database/models/Queue');
const Staff = require('../../database/models/Staff');
const StaffSpeciality = require('../../database/models/StaffSpeciality');

const app = express();
app.use(express.json());
app.use('/api/queue', getQueueRouter);

jest.mock('../../database/models/User');
jest.mock('../../database/models/Queue');
jest.mock('../../database/models/Staff');
jest.mock('../../database/models/StaffSpeciality');

describe('GET /api/queue/:clinicID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  it('should return queue for clinic successfully', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|doctor' };
    const mockStaff = { _id: 'staffId', User: mockUser._id, Clinic: 'clinicId' };
    const mockQueue = [
      { _id: 'queue1', Clinic: 'clinicId', Speciality: 'spec1', Patient: 'patient1', updatedAt: new Date().toISOString() },
      { _id: 'queue2', Clinic: 'clinicId', Speciality: 'spec2', Patient: 'patient2', updatedAt: new Date().toISOString() }
    ];

    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue(mockStaff);
    Queue.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockQueue)
    });

    const res = await request(app)
      .get('/api/queue/clinicId')
      .send({ auth0Id: 'auth0|doctor' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockQueue);
    expect(User.findOne).toHaveBeenCalledWith({ auth0Id: 'auth0|doctor' });
    expect(Staff.findOne).toHaveBeenCalledWith({ User: mockUser._id, Clinic: 'clinicId' });
  });

  it('should return 403 if user not found', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/queue/clinicId')
      .send({ auth0Id: 'invalid_auth0' });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Unauthorized.');
  });

  it('should return 403 if staff not found', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|doctor' };
    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/queue/clinicId')
      .send({ auth0Id: 'auth0|doctor' });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Unauthorized.');
  });

  it('should return 404 if staff link not found', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|doctor' };
    const mockStaff = { _id: 'staffId', User: mockUser._id, Clinic: 'clinicId' };
    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValueOnce(mockStaff);
    Staff.findOne.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/queue/clinicId')
      .send({ auth0Id: 'auth0|doctor' })
      .query({ userID: 'userId' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Could not find staff member.');
  });

  it('should return 404 if staff specialities not found', async () => {
    const mockUser = { _id: 'userId', id: 'userId', auth0Id: 'auth0|doctor' };
    const mockStaff = { _id: 'staffId', User: 'userId', Clinic: 'clinicId' };
    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue(mockStaff);
    StaffSpeciality.find.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/queue/clinicId')
      .send({ auth0Id: 'auth0|doctor' })
      .query({ userID: 'userId2' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Could not find staff member.');
  });

  it('should return queue for a staff', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|doctor' };
    const mockStaff = { _id: 'staffId', User: mockUser._id, Clinic: 'clinicId' };
    const mockQueue = [
      { _id: 'queue1', Clinic: 'clinicId', Speciality: 'spec1', Patient: 'patient1', updatedAt: new Date() }
    ];

    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue(mockStaff);
    Queue.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockQueue)
    });
    StaffSpeciality.find.mockResolvedValue([{ Speciality: 'spec1' }]);

    const res = await request(app)
      .get('/api/queue/clinicId')
      .send({ auth0Id: 'auth0|doctor' })
      .query({ userID: 'userId' });

    expect(res.status).toBe(200);
    expect(Queue.find).toHaveBeenCalledWith({
      Clinic: mockStaff.Clinic,
      Speciality: { $in: ['spec1'] }
    });
  });

  it('should return queue filtered by multiple specialities', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|doctor' };
    const mockStaff = { _id: 'staffId', User: mockUser._id, Clinic: 'clinicId' };
    const mockQueue = [
      { _id: 'queue1', Clinic: 'clinicId', Speciality: 'spec1', Patient: 'patient1', updatedAt: new Date() }
    ];

    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue(mockStaff);
    Queue.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockQueue)
    });

    const res = await request(app)
      .get('/api/queue/clinicId')
      .send({ auth0Id: 'auth0|doctor', specialityIDs: ['spec1', 'spec2'] });

    expect(res.status).toBe(200);
    expect(Queue.find).toHaveBeenCalledWith({
      Clinic: mockStaff.Clinic,
      Speciality: { $in: ['spec1', 'spec2'] }
    });
  });

  it('should return 500 on server error', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|doctor' };
    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue({ _id: 'staffId', User: mockUser._id, Clinic: 'clinicId' });
    Queue.find.mockReturnValue({
      sort: jest.fn().mockRejectedValue(new Error('Database error'))
    });

    const res = await request(app)
      .get('/api/queue/clinicId')
      .send({ auth0Id: 'auth0|doctor' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Server error.');
  });
});