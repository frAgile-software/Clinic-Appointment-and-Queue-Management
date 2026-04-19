const request = require('supertest');
const express = require('express');
const listStaff = require('./listStaff');
const Clinic = require('../../database/models/Clinic');
const User = require('../../database/models/User');
const Staff = require('../../database/models/Staff');

const app = express();
app.use(express.json());
app.use(listStaff);

jest.mock('../../database/models/Clinic');
jest.mock('../../database/models/User');
jest.mock('../../database/models/Staff');

describe('listStaff API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve linked staff successfully', async () => {
    Clinic.exists.mockResolvedValue({ _id: 'clinicId' });
    User.findOne.mockResolvedValueOnce({ _id: 'senderId' });
    Staff.exists.mockResolvedValue({});
    Staff.find.mockImplementation(() => ({
      populate: jest.fn().mockResolvedValue([
        { User: { _id: 'userId', name: 'Alice', surname: 'Smith', email: 'alice@example.com', role: 'Staff' } }
      ])
    }));

    const response = await request(app)
      .get('/clinic123/staff')
      .send({ auth0Id: 'auth123' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Retrieved linked staff successfully.');
    expect(response.body.users).toEqual([
      { _id: 'userId', name: 'Alice', surname: 'Smith', email: 'alice@example.com', role: 'Staff' }
    ]);
  });

  it('should return 404 if clinic not found', async () => {
    Clinic.exists.mockResolvedValue(null);

    const response = await request(app)
      .get('/clinic123/staff')
      .send({ auth0Id: 'auth123' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Clinic not found.');
  });

  it('should return 403 if sender is not found', async () => {
    Clinic.exists.mockResolvedValue({ _id: 'clinicId' });
    User.findOne.mockResolvedValue(null);

    const response = await request(app)
      .get('/clinic123/staff')
      .send({ auth0Id: 'auth123' });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Unauthorized.');
  });

  it('should return 403 if sender is not staff of clinic', async () => {
    Clinic.exists.mockResolvedValue({ _id: 'clinicId' });
    User.findOne.mockResolvedValueOnce({ _id: 'senderId' });
    Staff.exists.mockResolvedValue(null);

    const response = await request(app)
      .get('/clinic123/staff')
      .send({ auth0Id: 'auth123' });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Unauthorized.');
  });

  it('should return 500 on server error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    Clinic.exists.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .get('/clinic123/staff')
      .send({ auth0Id: 'auth123' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Server error.');
    consoleSpy.mockRestore();
  });
});
