const request = require('supertest');
const express = require('express');
const getQueueRouter = require('./getQueue');
const User = require('../../database/models/User');
const Queue = require('../../database/models/Queue');
const Staff = require('../../database/models/Staff');
const StaffSpeciality = require('../../database/models/StaffSpeciality');

const app = express();
app.use(express.json());
app.use((req,res,next) => {
  req.auth = {payload: { sub: 'auth0|doctor' }};
  next();
});
app.use('/api/queue', getQueueRouter);

jest.mock('../../database/models/User');
jest.mock('../../database/models/Queue');
jest.mock('../../database/models/Staff');
jest.mock('../../database/models/StaffSpeciality');

const mockQueueFind = (resolvedValue) => {
    const populateMock = jest.fn().mockResolvedValue(resolvedValue);
    const sortMock = jest.fn().mockReturnValue({ populate: populateMock });
    Queue.find.mockReturnValue({ sort: sortMock });
    return { sortMock, populateMock };
};

describe('POST /api/queue/:clinicID', () => {
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
      { _id: 'queue1', Clinic: 'clinicId', Speciality: 'spec1', Patient: 'patient1', updatedAt: new Date().toString() },
      { _id: 'queue2', Clinic: 'clinicId', Speciality: 'spec2', Patient: 'patient2', updatedAt: new Date().toString() }
    ];

    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue(mockStaff);
    StaffSpeciality.find.mockResolvedValue([{ Speciality: 'spec1' }]);
    mockQueueFind(mockQueue);

    const res = await request(app)
      .get('/api/queue/clinicId');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockQueue);
    expect(User.findOne).toHaveBeenCalledWith({ auth0Id: 'auth0|doctor' });
    expect(Staff.findOne).toHaveBeenCalledWith({ User: mockUser._id, Clinic: 'clinicId' });
  });

  it('should return 403 if calling user not found', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/queue/clinicId')
      .query({ userId: 'invalid_userId' });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Unauthorized.');
  });

  it('should return 404 if user not found by auth0Id', async () => {
    const mockCallingUser = { _id: 'userId', auth0Id: 'auth0|doctor' };
    const mockCallingStaff = { _id: 'staffId', User: mockCallingUser._id, Clinic: 'clinicId' };

    User.findOne
        .mockResolvedValueOnce(mockCallingUser)
        .mockResolvedValueOnce(null);

    Staff.findOne.mockResolvedValue(mockCallingStaff);

    const res = await request(app)
      .get('/api/queue/clinicId')
      .query({ auth0Id: 'invalid_auth0' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Could not find staff member.');
  });

  it('should return 403 if staff link not found', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|doctor' };
    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/queue/clinicId')
      .query({ auth0Id: 'auth0|doctor' });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Unauthorized.');
  });

  it('should return 404 if target staff link not found', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|doctor' };
    const mockCallingStaff = { _id: 'staffId', User: mockUser._id, Clinic: 'clinicId' };
    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne
        .mockResolvedValueOnce(mockCallingStaff)
        .mockResolvedValue(null);

    const res = await request(app)
      .get('/api/queue/clinicId')
      .query({ userId: 'someUserId' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Could not find staff member.');
  });

  it('should return 404 if staff specialities not found', async () => {
    const mockUser = { _id: 'userId', id: 'userId', auth0Id: 'auth0|doctor' };
    const mockStaff = { _id: 'staffId', User: 'userId', Clinic: 'clinicId' };
    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue(mockStaff);
    StaffSpeciality.find.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/queue/clinicId')
      .query({ userId: 'userId' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Could not find staff member.');
  });

  it('should return queue for a staff by userId', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|doctor' };
    const mockStaff = { _id: 'staffId', User: mockUser._id, Clinic: 'clinicId' };
    const mockQueue = [
      { _id: 'queue1', Clinic: 'clinicId', Speciality: 'spec1', Patient: 'patient1', updatedAt: new Date() }
    ];

    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue(mockStaff);
    StaffSpeciality.find.mockResolvedValue([{ Speciality: 'spec1' }]);
    mockQueueFind(mockQueue);

    const res = await request(app)
      .get('/api/queue/clinicId')
      .query({ userId: 'userId' });

    expect(res.status).toBe(200);
    expect(Queue.find).toHaveBeenCalledWith({
      Clinic: 'clinicId',
      Speciality: { $in: ['spec1'] }
    });
  });

  it('should return queue for a staff member by auth0Id', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|doctor' };
    const mockStaff = { _id: 'staffId', User: mockUser._id, Clinic: 'clinicId' };
    const mockQueue = [
      { _id: 'queue1', Clinic: 'clinicId', Speciality: 'spec1', Patient: 'patient1', updatedAt: new Date().toString() },
      { _id: 'queue2', Clinic: 'clinicId', Speciality: 'spec2', Patient: 'patient2', updatedAt: new Date().toString() }
    ];

    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue(mockStaff);
    StaffSpeciality.find.mockResolvedValue([{ Speciality: 'spec1' }]);
    mockQueueFind(mockQueue);

    const res = await request(app)
      .get('/api/queue/clinicId')
      .query({ auth0Id: 'auth0|doctor' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockQueue);
  });

  it('should return queue filtered by multiple specialities', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|doctor' };
    const mockStaff = { _id: 'staffId', User: mockUser._id, Clinic: 'clinicId' };
    const mockQueue = [
      { _id: 'queue1', Clinic: 'clinicId', Speciality: 'spec1', Patient: 'patient1', updatedAt: new Date() }
    ];

    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue(mockStaff);
    mockQueueFind(mockQueue);

    const res = await request(app)
      .get('/api/queue/clinicId')
      .query({ specialityIDs: 'spec1,spec2' });

    expect(res.status).toBe(200);
    expect(Queue.find).toHaveBeenCalledWith({
      Clinic: mockStaff.Clinic,
      Speciality: { $in: ['spec1', 'spec2'] }
    });
  });

  it('should return whole clinic queue if no filters provided', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|doctor' };
    const mockStaff = { _id: 'staffId', User: mockUser._id, Clinic: 'clinicId' };
    const mockQueue = [
      { _id: 'queue1', Clinic: 'clinicId', Speciality: 'spec1', Patient: 'patient1', updatedAt: new Date() },
      { _id: 'queue2', Clinic: 'clinicId', Speciality: 'spec2', Patient: 'patient2', updatedAt: new Date() }
    ];

    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue(mockStaff);
    mockQueueFind(mockQueue);

    const res = await request(app)
      .get('/api/queue/clinicId');

    expect(res.status).toBe(200);
    expect(Queue.find).toHaveBeenCalledWith({ Clinic: 'clinicId' });
  });

  it('should return 500 on server error', async () => {
    const mockUser = { _id: 'userId', auth0Id: 'auth0|doctor' };
    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue({ _id: 'staffId', User: mockUser._id, Clinic: 'clinicId' });
    StaffSpeciality.find.mockResolvedValue([{ Speciality: 'spec1' }]);

    Queue.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
            populate: jest.fn().mockRejectedValue(new Error('Database error'))
        })
    });

    const res = await request(app)
      .get('/api/queue/clinicId')
      .query({ auth0Id: 'auth0|doctor' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Server error.');
  });
});