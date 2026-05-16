const request = require('supertest');
const express = require('express');
const getNotifRouter = require('./deleteSeen');
const User = require('../../database/models/User');
const Notif = require('../../database/models/Notif')


const app = express();
app.use(express.json());

app.use((req,res,next) => {
  req.auth = {payload: { sub: 'auth0|user' }};
  next();
});
app.use('/api/Notif', getNotifRouter);

jest.mock('../../database/models/User');
jest.mock('../../database/models/Notif');

const mockNotifsFind = (resolvedValue) => {
    const populateMock = jest.fn().mockResolvedValue(resolvedValue);
    return { populateMock };
};

describe('DELETE /api/Notifs/:userId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });
 it('should successfully delete seen notifications for a valid ObjectId', async () => {
    const validMockObjectId = "507f1f77bcf86cd799439011";
    Notif.deleteMany.mockResolvedValue({ deletedCount: 3 });

    const res = await request(app)
      .delete(`/api/Notif/${validMockObjectId}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      deletedCount: 3
    });
    expect(Notif.deleteMany).toHaveBeenCalledWith({
      Recipient: validMockObjectId,
      Seen: true
    });
  });

  it('should resolve an Auth0 ID string to an actual user account before executing deletion', async () => {
    const auth0IdString = "auth0|69e511e40a";
    const resolvedMockObjectId = "507f1f77bcf86cd799439011";

    User.findOne.mockResolvedValue({ _id: resolvedMockObjectId });
    Notif.deleteMany.mockResolvedValue({ deletedCount: 1 });

    const res = await request(app)
      .delete(`/api/Notif/${auth0IdString}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      deletedCount: 1
    });
    expect(User.findOne).toHaveBeenCalledWith({ auth0Id: auth0IdString });
    expect(Notif.deleteMany).toHaveBeenCalledWith({
      Recipient: resolvedMockObjectId,
      Seen: true
    });
  });
});
