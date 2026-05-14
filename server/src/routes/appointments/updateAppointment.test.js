const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const updateAppointmentRouter = require("./updateAppointment");
const Appointment = require("../../database/models/Appointment");
const User = require("../../database/models/User");

jest.mock("../../database/models/Appointment");
jest.mock("../../database/models/User");
jest.mock("../../database/models/Clinic");
jest.mock("../../database/models/Speciality");

const app = express();
app.use(express.json());
app.use((req, res, next) => {
    req.auth = { payload: { sub: "auth0|testuser" } };
    next();
});
app.use("/api/appointments", updateAppointmentRouter);

describe("PUT /api/appointments/:appointmentID", () => {
    
    const safeFutureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should return 400 if appointment ID is invalid", async () => {
        const response = await request(app)
            .put("/api/appointments/invalid-id")
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Invalid appointment ID." });
    });

    test("should return 404 if appointment does not exist", async () => {
        const validId = new mongoose.Types.ObjectId().toString();
        Appointment.findById.mockResolvedValue(null);

        const response = await request(app)
            .put(`/api/appointments/${validId}`)
            .send({});

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Appointment not found." });
    });

    test("should return 400 if appointment is within 24 hours and core details are modified", async () => {
        const mockId = new mongoose.Types.ObjectId().toString();
        const mockAppointment = {
            _id: mockId,
            BookingDateTime: new Date(Date.now() + 12 * 60 * 60 * 1000), 
            save: jest.fn()
        };

        Appointment.findById.mockResolvedValue(mockAppointment);
        User.findOne.mockResolvedValue({ role: "Patient" });

        const response = await request(app)
            .put(`/api/appointments/${mockId}`)
            .send({ BookingDateTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() }); 

        expect(response.status).toBe(400);
        expect(response.body.message).toContain("less than 24 hours before the scheduled time");
    });

    test("should update appointment successfully", async () => {
        const mockId = new mongoose.Types.ObjectId().toString();
        const mockAppointment = {
            _id: mockId,
            Patient: "oldPatient",
            Staff: "oldStaff",
            Clinic: "oldClinic",
            BookingDateTime: safeFutureDate, 
            Speciality: "oldSpeciality",
            save: jest.fn().mockImplementation(function() { return Promise.resolve(this); })
        };

        Appointment.findById.mockResolvedValue(mockAppointment);
        User.findOne.mockResolvedValue({ role: "Patient" });

        const response = await request(app)
            .put(`/api/appointments/${mockId}`)
            .send({
                Status: "Confirmed",
                Remarks: "Looking forward to it"
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Appointment updated successfully.");
        expect(mockAppointment.save).toHaveBeenCalled();
    });

    test("should return 500 if an error occurs", async () => {
        const mockId = new mongoose.Types.ObjectId().toString();
        Appointment.findById.mockRejectedValue(new Error("Database failure"));

        const response = await request(app)
            .put(`/api/appointments/${mockId}`)
            .send({});

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });
});