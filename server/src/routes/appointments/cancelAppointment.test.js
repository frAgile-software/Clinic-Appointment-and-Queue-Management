const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const cancelRouter = require("./cancelAppointment");
const Appointment = require("../../database/models/Appointment");
const User = require("../../database/models/User");

jest.mock("../../database/models/Appointment");
jest.mock("../../database/models/User");

const app = express();
app.use(express.json());
// Mocking auth middleware
app.use((req, res, next) => {
    req.auth = { payload: { sub: "auth0|testuser" } };
    next();
});
app.use("/api/appointments/cancel", cancelRouter);

describe("PATCH /api/appointments/cancel/:id", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should return 404 if appointment not found", async () => {
        Appointment.findById.mockResolvedValue(null);
        const id = new mongoose.Types.ObjectId();
        const res = await request(app).patch(`/api/appointments/cancel/${id}`);
        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Not found.");
    });

    test("should cancel appointment successfully if more than 24 hours away", async () => {
        const id = new mongoose.Types.ObjectId();
        const mockAppt = {
            _id: id,
            BookingDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours away
        };

        Appointment.findById.mockResolvedValue(mockAppt);
        User.findOne.mockResolvedValue({ role: "Patient" });
        Appointment.collection = { updateOne: jest.fn().mockResolvedValue({}) };

        const res = await request(app).patch(`/api/appointments/cancel/${id}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Appointment cancelled");
    });

    test("should return 400 if patient tries to cancel within 24 hours", async () => {
        const id = new mongoose.Types.ObjectId();
        const mockAppt = {
            _id: id,
            BookingDateTime: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours away
        };

        Appointment.findById.mockResolvedValue(mockAppt);
        User.findOne.mockResolvedValue({ role: "Patient" });

        const res = await request(app).patch(`/api/appointments/cancel/${id}`);
        expect(res.status).toBe(400);
        expect(res.body.message).toContain("less than 24 hours before the scheduled time");
    });
});