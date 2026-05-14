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

  it('should delete existing seen notifications', async () => {

    const mockDeletedNotifEntry = [ 
    { _id: '1234', 
    Recipient: '123456789012345678901234', 
    Message: 'spec1',
    Time: '2026-05-10T15:49:34.752+00:00',
    Seen: 'true'},

    { _id: '1235', 
    Recipient: '123456789012345678901234', 
    Message: 'spec1',
    Time: '2026-05-10T15:49:34.752+00:00',
    Seen: 'true'}
    ]

    Notif.deleteMany.mockResolvedValue(mockDeletedNotifEntry);
    const res = await request(app)
      .delete('/api/Notif/123456789012345678901234');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockDeletedNotifEntry);
  });

  it('should work on no seen notifications', async () => {

   const mockDeletedNotifEntry = [ 
    { _id: '1234', 
    Recipient: '123456789012345678901234', 
    Message: 'spec1',
    Time: '2026-05-10T15:49:34.752+00:00',
    Seen: 'false'},

    { _id: '1235', 
    Recipient: '123456789012345678901234', 
    Message: 'spec1',
    Time: '2026-05-10T15:49:34.752+00:00',
    Seen: 'false'}
    ]

    Notif.deleteMany.mockResolvedValue(mockDeletedNotifEntry);
    const res = await request(app)
      .delete('/api/Notif/123456789012345678901234');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockDeletedNotifEntry);
  });
  
});
