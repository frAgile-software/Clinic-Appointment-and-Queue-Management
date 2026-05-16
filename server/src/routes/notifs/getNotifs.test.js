const request = require('supertest');
const express = require('express');
const getNotifRouter = require('./getNotifs');
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
    const validMockObjectId = "507f1f77bcf86cd799439011";
    const mockNotifs = [
        { _id: 'notif1', Recipient: validMockObjectId, Message: 'spec1', Time: '2026-05-10T15:49:34.752+00:00', Seen: true },
        { _id: 'notif2', Recipient: validMockObjectId, Message: 'spec2', Time: '2026-05-10T15:49:35.752+00:00', Seen: false }
    ];

    Notif.find.mockResolvedValue(mockNotifs);

    const res = await request(app)
      .get(`/api/Notif/${validMockObjectId}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockNotifs);
});


  it('should return an empty array if no notifications exist', async () => {
    const mockNotifs = [];
    Notif.find.mockResolvedValue(mockNotifs);
    const validMockObjectId = "507f1f77bcf86cd799439011";

    const res = await request(app)
      .get(`/api/Notif/${validMockObjectId}`);
      
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
});
  });
