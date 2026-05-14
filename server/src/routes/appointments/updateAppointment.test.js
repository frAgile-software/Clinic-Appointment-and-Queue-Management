const request = require("supertest");
const express = require("express");

const updateAppointmentRouter = require("./updateAppointment");
const Appointment = require("../../database/models/Appointment");
const User = require("../../database/models/User");
const Clinic = require("../../database/models/Clinic");
const Speciality = require("../../database/models/Speciality");

jest.mock("../../database/models/Appointment");
jest.mock("../../database/models/User");
jest.mock("../../database/models/Clinic");
jest.mock("../../database/models/Speciality");

const app = express();
app.use(express.json());
app.use("/api/appointments", updateAppointmentRouter);

describe("PUT /api/appointments/:appointmentID", () => {
    
    const safeFutureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);

    afterEach(() => {
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
        Appointment.findById.mockResolvedValue(null);

        const response = await request(app)
            .put("/api/appointments/123456789012345678901234")
            .send({});

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Appointment not found." });
        expect(Appointment.findById).toHaveBeenCalledWith("123456789012345678901234");
    });

    test("should return 400 if appointment is within 24 hours and core details are modified", async () => {
        const mockAppointment = {
            _id: "123456789012345678901234",
            BookingDateTime: new Date(Date.now() + 12 * 60 * 60 * 1000), 
            save: jest.fn()
        };

        Appointment.findById.mockResolvedValue(mockAppointment);

        const response = await request(app)
            .put("/api/appointments/123456789012345678901234")
            .send({ BookingDateTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() }); 

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Appointments cannot be rescheduled or updated less than 24 hours before the scheduled time." });
    });
    
    test("should return 400 if patient ID is invalid", async () => {
        const mockAppointment = {
            _id: "123456789012345678901234",
            BookingDateTime: safeFutureDate,
            save: jest.fn()
        };

        Appointment.findById.mockResolvedValue(mockAppointment);

        const response = await request(app)
            .put("/api/appointments/123456789012345678901234")
            .send({ Patient: "bad-id" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Invalid patient ID." });
    });

    test("should return 404 if patient does not exist", async () => {
        const mockAppointment = {
            _id: "123456789012345678901234",
            BookingDateTime: safeFutureDate,
            save: jest.fn()
        };

        Appointment.findById.mockResolvedValue(mockAppointment);
        User.findById.mockResolvedValue(null);

        const response = await request(app)
            .put("/api/appointments/123456789012345678901234")
            .send({ Patient: "111111111111111111111111" });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Patient not found." });
    });

    test("should return 400 if staff ID is invalid", async () => {
        const mockAppointment = {
            _id: "123456789012345678901234",
            BookingDateTime: safeFutureDate,
            save: jest.fn()
        };

        Appointment.findById.mockResolvedValue(mockAppointment);

        const response = await request(app)
            .put("/api/appointments/123456789012345678901234")
            .send({ Staff: "bad-id" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Invalid staff ID." });
    });

    test("should return 404 if staff does not exist", async () => {
        const mockAppointment = {
            _id: "123456789012345678901234",
            BookingDateTime: safeFutureDate,
            save: jest.fn()
        };

        Appointment.findById.mockResolvedValue(mockAppointment);
        User.findById.mockResolvedValue(null);

        const response = await request(app)
            .put("/api/appointments/123456789012345678901234")
            .send({ Staff: "111111111111111111111111" });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Staff member not found." });
    });

    test("should return 400 if clinic ID is invalid", async () => {
        const mockAppointment = {
            _id: "123456789012345678901234",
            BookingDateTime: safeFutureDate,
            save: jest.fn()
        };

        Appointment.findById.mockResolvedValue(mockAppointment);

        const response = await request(app)
            .put("/api/appointments/123456789012345678901234")
            .send({ Clinic: "bad-id" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Invalid clinic ID." });
    });

    test("should return 404 if clinic does not exist", async () => {
        const mockAppointment = {
            _id: "123456789012345678901234",
            BookingDateTime: safeFutureDate,
            save: jest.fn()
        };

        Appointment.findById.mockResolvedValue(mockAppointment);
        Clinic.findById.mockResolvedValue(null);

        const response = await request(app)
            .put("/api/appointments/123456789012345678901234")
            .send({ Clinic: "111111111111111111111111" });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Clinic not found." });
    });

    test("should return 400 if booking date is invalid", async () => {
        const mockAppointment = {
            _id: "123456789012345678901234",
            BookingDateTime: safeFutureDate,
            save: jest.fn()
        };

        Appointment.findById.mockResolvedValue(mockAppointment);

        const response = await request(app)
            .put("/api/appointments/123456789012345678901234")
            .send({ BookingDateTime: "not-a-date" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Invalid booking date." });
    });

    test("should return 400 if speciality ID is invalid", async () => {
        const mockAppointment = {
            _id: "123456789012345678901234",
            BookingDateTime: safeFutureDate,
            save: jest.fn()
        };

        Appointment.findById.mockResolvedValue(mockAppointment);

        const response = await request(app)
            .put("/api/appointments/123456789012345678901234")
            .send({ Speciality: "bad-id" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Invalid speciality ID." });
    });

    test("should return 404 if speciality does not exist", async () => {
        const mockAppointment = {
            _id: "123456789012345678901234",
            BookingDateTime: safeFutureDate,
            save: jest.fn()
        };

        Appointment.findById.mockResolvedValue(mockAppointment);
        Speciality.findById.mockResolvedValue(null);

        const response = await request(app)
            .put("/api/appointments/123456789012345678901234")
            .send({ Speciality: "111111111111111111111111" });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Speciality not found." });
    });

    test("should update appointment successfully", async () => {
        const newDate = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
        const savedAppointment = {
            _id: "123456789012345678901234",
            Patient: "111111111111111111111111",
            Staff: "222222222222222222222222",
            Clinic: "333333333333333333333333",
            BookingDateTime: newDate,
            Speciality: "444444444444444444444444"
        };

        const mockAppointment = {
            _id: "123456789012345678901234",
            Patient: "oldPatient",
            Staff: "oldStaff",
            Clinic: "oldClinic",
            BookingDateTime: safeFutureDate, 
            Speciality: "oldSpeciality",
            save: jest.fn().mockResolvedValue(savedAppointment)
        };

        Appointment.findById.mockResolvedValue(mockAppointment);
        User.findById
            .mockResolvedValueOnce({ _id: "111111111111111111111111" })
            .mockResolvedValueOnce({ _id: "222222222222222222222222" });
        Clinic.findById.mockResolvedValue({ _id: "333333333333333333333333" });
        Speciality.findById.mockResolvedValue({ _id: "444444444444444444444444" });

        const response = await request(app)
            .put("/api/appointments/123456789012345678901234")
            .send({
                Patient: "111111111111111111111111",
                Staff: "222222222222222222222222",
                Clinic: "333333333333333333333333",
                BookingDateTime: newDate,
                Speciality: "444444444444444444444444"
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: "Appointment updated successfully.",
            appointment: savedAppointment
        });

        expect(mockAppointment.Patient).toBe("111111111111111111111111");
        expect(mockAppointment.Staff).toBe("222222222222222222222222");
        expect(mockAppointment.Clinic).toBe("333333333333333333333333");
        expect(mockAppointment.Speciality).toBe("444444444444444444444444");
        expect(mockAppointment.save).toHaveBeenCalled();
    });

    test("should return 500 if an error occurs", async () => {
        Appointment.findById.mockRejectedValue(new Error("Database failure"));

        const response = await request(app)
            .put("/api/appointments/123456789012345678901234")
            .send({});

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });
});