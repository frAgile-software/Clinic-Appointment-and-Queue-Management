const request = require('supertest');
const express = require('express');
const linkStaff = require('./linkStaff');
const Clinic = require('../../database/models/Clinic');
const User = require('../../database/models/User');
const Staff = require('../../database/models/Staff');

const app = express();
app.use(express.json());
app.use(linkStaff);

jest.mock('../../database/models/Clinic');
jest.mock('../../database/models/User');
jest.mock('../../database/models/Staff');

describe('linkStaff API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should link staff successfully', async () => {
    Clinic.exists.mockResolvedValue({ _id: 'clinicId' });
    User.findOne.mockResolvedValueOnce({ _id: 'senderId', role: 'Admin' });
    Staff.exists.mockResolvedValue({});
    User.findOne.mockResolvedValueOnce({ _id: 'userId', role: 'Staff' });
    Staff.prototype.save = jest.fn().mockResolvedValue({ id: 'staffId' });

    const response = await request(app)
      .post('/clinic123/staff')
      .send({ id: 'user123', email: 'user@example.com', auth0Id: 'auth123' });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Staff linked successfully.');
    expect(response.body.staffID).toBe('staffId');
  });

  it('should return 404 if clinic not found', async () => {
    Clinic.exists.mockResolvedValue(null);

    const response = await request(app)
      .post('/clinic123/staff')
      .send({ id: 'user123', email: 'user@example.com', auth0Id: 'auth123' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Clinic not found.');
  });

  it('should return 403 if sender is not Admin', async () => {
    Clinic.exists.mockResolvedValue({ _id: 'clinicId' });
    User.findOne.mockResolvedValueOnce({ _id: 'senderId', role: 'Staff' });

    const response = await request(app)
      .post('/clinic123/staff')
      .send({ id: 'user123', email: 'user@example.com', auth0Id: 'auth123' });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Unauthorized.');
  });

  it('should return 403 if sender is not staff of clinic', async () => {
    Clinic.exists.mockResolvedValue({ _id: 'clinicId' });
    User.findOne.mockResolvedValueOnce({ _id: 'senderId', role: 'Admin' });
    Staff.exists.mockResolvedValue(null);

    const response = await request(app)
      .post('/clinic123/staff')
      .send({ id: 'user123', email: 'user@example.com', auth0Id: 'auth123' });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Not authorized.');
  });

  it('should return 404 if user not found', async () => {
    Clinic.exists.mockResolvedValue({ _id: 'clinicId' });
    User.findOne.mockResolvedValueOnce({ _id: 'senderId', role: 'Admin' });
    Staff.exists.mockResolvedValue({});
    User.findOne.mockResolvedValueOnce(null);

    const response = await request(app)
      .post('/clinic123/staff')
      .send({ id: 'user123', email: 'user@example.com', auth0Id: 'auth123' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found.');
  });

  it('should return 404 if user is Patient', async () => {
    Clinic.exists.mockResolvedValue({ _id: 'clinicId' });
    User.findOne.mockResolvedValueOnce({ _id: 'senderId', role: 'Admin' });
    Staff.exists.mockResolvedValue({});
    User.findOne.mockResolvedValueOnce({ _id: 'userId', role: 'Patient' });

    const response = await request(app)
      .post('/clinic123/staff')
      .send({ id: 'user123', email: 'user@example.com', auth0Id: 'auth123' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found.');
  });

  it('should return 500 on server error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    Clinic.exists.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/clinic123/staff')
      .send({ id: 'user123', auth0Id: 'auth123' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Server error.');
    consoleSpy.mockRestore();
  });
});