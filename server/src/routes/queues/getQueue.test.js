const request = require('supertest');
const express = require('express');
const getQueueRouter = require('./getQueue');
const User = require('../../database/models/User');
const Queue = require('../../database/models/Queue');
const Staff = require('../../database/models/Staff');

const app = express();
app.use(express.json());
app.use('/api/queue', getQueueRouter);

jest.mock('../../database/models/User');
jest.mock('../../database/models/Queue');
jest.mock('../../database/models/Staff');

describe('GET /api/queue/:clinicID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  it('should return queue for clinic successfully', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|doctor' };
    const mockStaff = { _id: 'staffId', User: mockUser._id, Clinic: 'clinicId' };
    const mockQueue = [
      { _id: 'queue1', Clinic: 'clinicId', Speciality: 'spec1', Patient: 'patient1', BookingDateTime: new Date().toString() },
      { _id: 'queue2', Clinic: 'clinicId', Speciality: 'spec2', Patient: 'patient2', BookingDateTime: new Date().toString() }
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

  it('should return queue filtered by speciality', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|doctor' };
    const mockStaff = { _id: 'staffId', User: mockUser._id, Clinic: 'clinicId' };
    const mockQueue = [
      { _id: 'queue1', Clinic: 'clinicId', Speciality: 'spec1', Patient: 'patient1', BookingDateTime: new Date() }
    ];

    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue(mockStaff);
    Queue.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockQueue)
    });

    const res = await request(app)
      .get('/api/queue/clinicId')
      .send({ auth0Id: 'auth0|doctor', specialityID: 'spec1' });

    expect(res.status).toBe(200);
    expect(Queue.find).toHaveBeenCalledWith({
      Clinic: mockStaff.Clinic,
      Speciality: { $in: ['spec1'] }
    });
  });

  it('should return queue with multiple specialities', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|doctor' };
    const mockStaff = { _id: 'staffId', User: mockUser._id, Clinic: 'clinicId' };
    const mockQueue = [
      { _id: 'queue1', Clinic: 'clinicId', Speciality: 'spec1', Patient: 'patient1', BookingDateTime: new Date() }
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

  it('should handle non-array specialityIDs gracefully', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|doctor' };
    const mockStaff = { _id: 'staffId', User: mockUser._id, Clinic: 'clinicId' };
    const mockQueue = [
      { _id: 'queue1', Clinic: 'clinicId', Speciality: 'spec1', Patient: 'patient1', BookingDateTime: new Date().toString() }
    ];

    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue(mockStaff);
    Queue.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockQueue)
    });

    const res = await request(app)
      .get('/api/queue/clinicId')
      .send({ auth0Id: 'auth0|doctor', specialityIDs: 'not_an_array' });

    expect(res.status).toBe(200);
    expect(Queue.find).toHaveBeenCalledWith({
      Clinic: mockStaff.Clinic
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