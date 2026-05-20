const request = require("supertest");
const express = require("express");

const getOffDaysRouter = require("./getOff");
const User = require("../../database/models/User");
const Staff = require("../../database/models/Staff");
const OffDays = require("../../database/models/OffDays");

jest.mock("../../database/models/User");
jest.mock("../../database/models/Staff");
jest.mock("../../database/models/OffDays");

const app = express();
app.use(express.json());
app.use("/api/schedules/off-days", getOffDaysRouter);

describe("GET /api/schedules/off-days/:userId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    test("should return 404 if user is not found", async () => {
        User.findOne.mockResolvedValue(null);

        const response = await request(app).get(
            "/api/schedules/off-days/auth0%7C123456789012345678901234"
        );

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "User not found." });
        expect(User.findOne).toHaveBeenCalledWith({
            auth0Id: "auth0|123456789012345678901234",
        });
    });

    test("should return 404 if staff record is not found", async () => {
        const mockUser = { _id: "user123", name: "Jane" };
        User.findOne.mockResolvedValue(mockUser);
        Staff.findOne.mockResolvedValue(null);

        const response = await request(app).get(
            "/api/schedules/off-days/auth0%7C123456789012345678901234"
        );

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Staff not found." });
        expect(Staff.findOne).toHaveBeenCalledWith({ User: mockUser._id });
    });

    test("should return 200 with off days sorted by date", async () => {
        const mockUser = { _id: "user123" };
        const mockStaff = { _id: "staff123" };
        const mockOffDays = [
           { _id: "od1", staff_id: "staff123", date: "2025-08-01T12:00:00.000Z" },
           { _id: "od2", staff_id: "staff123", date: "2025-08-05T12:00:00.000Z" },
        ];

        User.findOne.mockResolvedValue(mockUser);
        Staff.findOne.mockResolvedValue(mockStaff);
        OffDays.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockOffDays),
        });

        const response = await request(app).get(
            "/api/schedules/off-days/auth0%7C123456789012345678901234"
        );

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ offDays: mockOffDays });
        expect(OffDays.find).toHaveBeenCalledWith({ staff_id: mockStaff._id });
    });

    test("should return 200 with an empty array if no off days exist", async () => {
        const mockUser = { _id: "user123" };
        const mockStaff = { _id: "staff123" };

        User.findOne.mockResolvedValue(mockUser);
        Staff.findOne.mockResolvedValue(mockStaff);
        OffDays.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([]),
        });

        const response = await request(app).get(
            "/api/schedules/off-days/auth0%7C123456789012345678901234"
        );

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ offDays: [] });
    });

    test("should return 500 if a database error occurs", async () => {
        User.findOne.mockRejectedValue(new Error("Database failure"));

        const response = await request(app).get(
            "/api/schedules/off-days/auth0%7C123456789012345678901234"
        );

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });
});