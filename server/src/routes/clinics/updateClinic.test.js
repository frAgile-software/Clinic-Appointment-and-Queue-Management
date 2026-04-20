const request = require('supertest');
const express = require('express');
const updateClinicRouter = require('./updateClinic');
const Clinic = require('../../database/models/Clinic');

const app = express();
app.use(express.json());
app.use('/api/clinic', updateClinicRouter);

jest.mock('../../database/models/Clinic');

describe('PUT /api/clinic/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  it('should update clinic successfully', async () => {
    const mockUpdatedClinic = {
      _id: 'clinicId',
      province: 'Gauteng',
      physicalTown: 'Johannesburg',
      physicalSuburb: 'Sandton',
      physicalAddress: '123 Plae Grownd Stret',
      practiceName: 'Updated Clinic',
      practiceType: '1',
      practiceTypeDescription: 'General Practice',
      practiceNumber: '42',
      contactNumber: '555-555-5555'
    };

    Clinic.findByIdAndUpdate.mockResolvedValue(mockUpdatedClinic);

    const updateData = { practiceName: 'Updated Clinic', contactNumber: '555-555-5555' };

    const res = await request(app)
      .put('/api/clinic/clinicId')
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Clinic updated successfully');
    expect(res.body.clinic).toEqual(mockUpdatedClinic);
    expect(Clinic.findByIdAndUpdate).toHaveBeenCalledWith('clinicId', updateData);
  });

  it('should return 404 if clinic not found', async () => {
    Clinic.findByIdAndUpdate.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/clinic/invalidId')
      .send({ practiceName: 'Test' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Clinic not found');
  });

  it('should return 500 on server error', async () => {
    Clinic.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));

    const res = await request(app)
      .put('/api/clinic/clinicId')
      .send({ practiceName: 'Test' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Server error');
  });
});