const request = require("supertest");
const express = require("express");

const createOffDaysRouter = require("./addOff");
const User = require("../../database/models/User");
const Staff = require("../../database/models/Staff");
const OffDays = require("../../database/models/OffDays");

jest.mock("../../database/models/User");
jest.mock("../../database/models/Staff");
jest.mock("../../database/models/OffDays");

const app = express();
app.use(express.json());
app.use("/api/schedules/off-days", createOffDaysRouter);

describe("POST /api/schedules/off-days", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    test("should return 400 if staffId is missing", async () => {
        const response = await request(app)
            .post("/api/schedules/off-days")
            .send({ dates: ["2025-08-01"] });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "staffId and dates are required." });
    });

    test("should return 400 if dates array is missing", async () => {
        const response = await request(app)
            .post("/api/schedules/off-days")
            .send({ staffId: "auth0|123" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "staffId and dates are required." });
    });

    test("should return 400 if dates array is empty", async () => {
        const response = await request(app)
            .post("/api/schedules/off-days")
            .send({ staffId: "auth0|123", dates: [] });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "staffId and dates are required." });
    });

    test("should return 404 if user is not found", async () => {
        User.findOne.mockResolvedValue(null);

        const response = await request(app)
            .post("/api/schedules/off-days")
            .send({ staffId: "auth0|123", dates: ["2025-08-01"] });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "User not found." });
        expect(User.findOne).toHaveBeenCalledWith({ auth0Id: "auth0|123" });
    });

    test("should return 404 if staff record is not found", async () => {
        const mockUser = { _id: "user123", name: "Jane" };
        User.findOne.mockResolvedValue(mockUser);
        Staff.findOne.mockResolvedValue(null);

        const response = await request(app)
            .post("/api/schedules/off-days")
            .send({ staffId: "auth0|123", dates: ["2025-08-01"] });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Staff not found." });
        expect(Staff.findOne).toHaveBeenCalledWith({ User: mockUser._id });
    });

    test("should return 409 if all dates already exist", async () => {
        const mockUser = { _id: "user123" };
        const mockStaff = { _id: "staff123" };
        User.findOne.mockResolvedValue(mockUser);
        Staff.findOne.mockResolvedValue(mockStaff);
        OffDays.find.mockResolvedValue([
            { date: new Date("2025-08-01T12:00:00Z") },
        ]);

        const response = await request(app)
            .post("/api/schedules/off-days")
            .send({ staffId: "auth0|123", dates: ["2025-08-01"] });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({ message: "All selected dates are already taken off." });
    });

    test("should return 201 with created off days on success", async () => {
        const mockUser = { _id: "user123" };
        const mockStaff = { _id: "staff123" };
        const mockCreated = [
            { _id: "od1", staff_id: "staff123", date: new Date("2025-08-01T12:00:00Z") },
            { _id: "od2", staff_id: "staff123", date: new Date("2025-08-02T12:00:00Z") },
        ];

        User.findOne.mockResolvedValue(mockUser);
        Staff.findOne.mockResolvedValue(mockStaff);
        OffDays.find.mockResolvedValue([]);
        OffDays.insertMany.mockResolvedValue(mockCreated);

        const response = await request(app)
            .post("/api/schedules/off-days")
            .send({ staffId: "auth0|123", dates: ["2025-08-01", "2025-08-02"] });

        expect(response.status).toBe(201);
        expect(response.body.offDays).toHaveLength(2);
        expect(OffDays.insertMany).toHaveBeenCalled();
    });

    test("should skip dates that already exist and only create new ones", async () => {
        const mockUser = { _id: "user123" };
        const mockStaff = { _id: "staff123" };
        const mockCreated = [
            { _id: "od2", staff_id: "staff123", date: new Date("2025-08-02T12:00:00Z") },
        ];

        User.findOne.mockResolvedValue(mockUser);
        Staff.findOne.mockResolvedValue(mockStaff);
        OffDays.find.mockResolvedValue([{ date: new Date("2025-08-01T12:00:00Z") }]);
        OffDays.insertMany.mockResolvedValue(mockCreated);

        const response = await request(app)
            .post("/api/schedules/off-days")
            .send({ staffId: "auth0|123", dates: ["2025-08-01", "2025-08-02"] });

        expect(response.status).toBe(201);
        expect(response.body.offDays).toHaveLength(1);
        const insertedDates = OffDays.insertMany.mock.calls[0][0].map(d => d.date.toISOString().slice(0, 10));
        expect(insertedDates).toEqual(["2025-08-02"]);
    });

    test("should return 500 if a database error occurs", async () => {
        User.findOne.mockRejectedValue(new Error("Database failure"));

        const response = await request(app)
            .post("/api/schedules/off-days")
            .send({ staffId: "auth0|123", dates: ["2025-08-01"] });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });
});