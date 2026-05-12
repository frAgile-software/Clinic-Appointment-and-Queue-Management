const request = require("supertest");
const express = require("express");

const getAppointmentStatsRouter = require("./getAppointmentStats");
const Appointment = require("../../database/models/Appointment");
const Clinic = require("../../database/models/Clinic");
const Staff = require("../../database/models/Staff");
const User = require("../../database/models/User");

jest.mock("../../database/models/Appointment");
jest.mock("../../database/models/Clinic");
jest.mock("../../database/models/Staff");
jest.mock("../../database/models/User");

const app = express();
app.use(express.json());
app.use("/api/appointments", getAppointmentStatsRouter);

describe("GET /api/appointments/:clinicID/stats", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return 404 if clinic not found", async () => {
        Clinic.findById.mockResolvedValue(null);

        const response = await request(app)
            .get("/api/appointments/clinic123/stats")
            .query({ auth0Id: "auth0|admin" });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Clinic not found." });
        expect(Clinic.findById).toHaveBeenCalledWith({ id: "clinic123" });
    });

    test("should return 403 if requester is not an admin", async () => {
        Clinic.findById.mockResolvedValue({ _id: "clinicObjId" });
        User.findOne.mockResolvedValue({ _id: "userId", role: "Patient" });

        const response = await request(app)
            .get("/api/appointments/clinic123/stats")
            .query({ auth0Id: "auth0|patient" });

        expect(response.status).toBe(403);
        expect(response.body).toEqual({ message: "Unauthorized." });
    });

    test("should return 403 if admin is not linked to the clinic", async () => {
        Clinic.findById.mockResolvedValue({ _id: "clinicObjId" });
        User.findOne.mockResolvedValue({ _id: "adminId", role: "Admin" });
        Staff.exists.mockResolvedValue(false);

        const response = await request(app)
            .get("/api/appointments/clinic123/stats")
            .query({ auth0Id: "auth0|admin" });

        expect(response.status).toBe(403);
        expect(response.body).toEqual({ message: "Not authorized." });
        expect(Staff.exists).toHaveBeenCalledWith({ Clinic: "clinicObjId", User: "adminId" });
    });

    test("should return 200 and filtered appointment stats", async () => {
        Clinic.findById.mockResolvedValue({ _id: "clinicObjId" });
        User.findOne.mockResolvedValue({ _id: "adminId", role: "Admin" });
        Staff.exists.mockResolvedValue(true);

        const mockAppointments = [
            {
                _id: "appt1",
                Patient: { name: "Patient One" },
                Staff: { name: "Staff One" },
                Speciality: { SpecialityName: "General Practice" },
                BookingDateTime: "2026-05-10T09:00:00.000Z",
            },
        ];

        const findChain = {
            sort: jest.fn().mockReturnThis(),
            populate: jest.fn().mockResolvedValueOnce(mockAppointments),
        };
        Appointment.find.mockReturnValueOnce(findChain);

        const response = await request(app)
            .get("/api/appointments/clinic123/stats")
            .query({
                auth0Id: "auth0|admin",
                _fromdate: "2026-05-01",
                _todate: "2026-05-31",
                _order: "desc",
                statuses: "Confirmed,Pending",
                specialityIDs: "spec1,spec2",
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockAppointments);

        expect(Appointment.find).toHaveBeenCalledWith(
            {
                Clinic: "clinicObjId",
                BookingDateTime: { $gte: new Date("2026-05-01"), $lt: new Date("2026-05-31") },
                Status: { $in: ["Confirmed", "Pending"] },
                Speciality: { $in: ["spec1", "spec2"] },
            },
            "-Remarks -ReasonDetails"
        );
        expect(findChain.sort).toHaveBeenCalledWith({ BookingDateTime: -1 });
        expect(findChain.populate).toHaveBeenCalledWith([
            { path: "Patient", select: "name" },
            { path: "Staff", select: "name" },
            { path: "Speciality", select: "SpecialityName" },
        ]);
    });

    test("should return 500 if an error occurs", async () => {
        Clinic.findById.mockRejectedValue(new Error("Database failure"));

        const response = await request(app)
            .get("/api/appointments/clinic123/stats")
            .query({ auth0Id: "auth0|admin" });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });
});