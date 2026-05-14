const request = require('supertest');
const express = require('express');
const getNotifRouter = require('./getNotifs');
const User = require('../../database/models/User');
const Notif = require('../../database/models/Notifs')


const app = express();
app.use(express.json());

app.use((req,res,next) => {
  req.auth = {payload: { sub: 'auth0|user' }};
  next();
});
app.use('/api/Notif', getNotifRouter);

jest.mock('../../database/models/User');
jest.mock('../../database/models/Notifs');

const mockNotifsFind = (resolvedValue) => {
    const populateMock = jest.fn().mockResolvedValue(resolvedValue);
    return { populateMock };
};

describe('GET /api/Notifs/:userId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  it('should return Notif list for user', async () => {
    const mockNotifs = [
        { _id: 'notif1', Recipient: 'userId', Message: 'spec1', Time: '2026-05-10T15:49:34.752+00:00', Seen: 'true'},
        { _id: 'notif2', Recipient: 'userId', Message: 'spec2', Time: '2026-05-10T15:49:35.752+00:00', Seen: 'false'}
    ];

    Notif.find.mockResolvedValue(mockNotifs)

    const res = await request(app)
      .get('/api/Notif/userId');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockNotifs);
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