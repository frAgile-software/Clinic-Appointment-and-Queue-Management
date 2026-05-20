const request = require("supertest");
const express = require("express");

const getUserScheduleRouter = require("./getUserSchedule");
const User = require("../../database/models/User");
const Staff = require("../../database/models/Staff");
const Schedule = require("../../database/models/Schedule");

jest.mock("../../database/models/User");
jest.mock("../../database/models/Staff");
jest.mock("../../database/models/Schedule");

const app = express();
app.use(express.json());
app.use("/api/schedules", getUserScheduleRouter);

describe("GET /api/schedules/:userId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Suppress console output to prevent CI pipeline failures on expected errors
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    test("should return 500 if user does not exist", async () => {
        User.findOne.mockResolvedValue(null);

        const response = await request(app).get("/api/schedules/auth0%7C123456789012345678901234");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
        expect(User.findOne).toHaveBeenCalledWith({ auth0Id: "auth0|123456789012345678901234" });
    });

    test("should return 500 if staff record does not exist", async () => {
        const mockUser = {
            _id: "123456789012345678901234",
            name: "John"
        };

        User.findOne.mockResolvedValue(mockUser);
        Staff.findOne.mockResolvedValue(null);

        const response = await request(app).get("/api/schedules/auth0%7C123456789012345678901234");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
        expect(Staff.findOne).toHaveBeenCalledWith({ User: mockUser._id });
    });

    test("should return 200 with schedule if user and staff record exist", async () => {
        const mockUser = {
            _id: "123456789012345678901234",
            name: "John"
        };

        const mockStaffRecord = {
            _id: "staff456789012345678901234"
        };

        const mockSchedule = [
            {
                _id: "1",
                Staff: mockStaffRecord._id,
                DayOfWeek: 1,
                StartTime: "08:00",
                EndTime: "16:00"
            },
            {
                _id: "2",
                Staff: mockStaffRecord._id,
                DayOfWeek: 3,
                StartTime: "09:00",
                EndTime: "17:00"
            }
        ];

        User.findOne.mockResolvedValue(mockUser);
        Staff.findOne.mockResolvedValue(mockStaffRecord);

        Schedule.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockSchedule)
        });

        const response = await request(app).get("/api/schedules/auth0%7C123456789012345678901234");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ schedule: mockSchedule });
        expect(User.findOne).toHaveBeenCalledWith({ auth0Id: "auth0|123456789012345678901234" });
        expect(Staff.findOne).toHaveBeenCalledWith({ User: mockUser._id });
        expect(Schedule.find).toHaveBeenCalledWith({ Staff: mockStaffRecord._id });
    });

    test("should return 500 if an error occurs", async () => {
        User.findOne.mockRejectedValue(new Error("Database failure"));

        const response = await request(app).get("/api/schedules/auth0%7C123456789012345678901234");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });
});