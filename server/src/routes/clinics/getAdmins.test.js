const request = require('supertest');
const express = require('express');
const getAdmins = require('./getAdmins');
const Clinic = require('../../database/models/Clinic');
const User = require('../../database/models/User');
const Staff = require('../../database/models/Staff');

const app = express();
app.use(express.json());
app.use(getAdmins);

jest.mock('../../database/models/Clinic');
jest.mock('../../database/models/User');
jest.mock('../../database/models/Staff');

describe('getAdmins API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve linked admins successfully', async () => {
    Clinic.exists.mockResolvedValue({ _id: 'clinicId' });
    Staff.find.mockImplementation(() => ({
      populate: jest.fn().mockResolvedValue([
        { User: { _id: 'userId', name: 'John', surname: 'Doe', email: 'john@example.com', role: 'Admin' } }
      ])
    }));

    const response = await request(app)
      .get('/clinic123/admins');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Retrieved linked admin successfully.');
    expect(response.body.users).toEqual([
      { _id: 'userId', name: 'John', surname: 'Doe', email: 'john@example.com', role: 'Admin' }
    ]);
  });

  it('should return 404 if clinic not found', async () => {
    Clinic.exists.mockResolvedValue(null);

    const response = await request(app)
      .get('/clinic123/admins');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Clinic not found.');
  });

  it('should return 200 with empty array if no admins linked', async () => {
    Clinic.exists.mockResolvedValue({ _id: 'clinicId' });
    Staff.find.mockImplementation(() => ({
      populate: jest.fn().mockResolvedValue([])
    }));

    const response = await request(app)
      .get('/clinic123/admins');

    expect(response.status).toBe(200);
    expect(response.body.users).toEqual([]);
  });

  it('should return 500 on server error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    Clinic.exists.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .get('/clinic123/admins');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Server error.');
    consoleSpy.mockRestore();
  });
});