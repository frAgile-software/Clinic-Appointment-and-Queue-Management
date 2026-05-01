const request = require("supertest");
const express = require("express");

const getUserScheduleRouter = require("./getUserSchedule");
const User = require("../../database/models/User");
const Schedule = require("../../database/models/Schedule");

jest.mock("../../database/models/User");
jest.mock("../../database/models/Schedule");

const app = express();
app.use(express.json());
app.use("/api/schedules", getUserScheduleRouter);

describe("GET /api/schedules/:userId/schedule", () => {
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

    test("should return 404 if user does not exist", async () => {
        User.findById.mockResolvedValue(null);

        const response = await request(app).get("/api/schedules/123456789012345678901234/schedule");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "User not found." });
        expect(User.findById).toHaveBeenCalledWith("123456789012345678901234");
    });

    test("should return 200 with schedule if user exists", async () => {
        const mockUser = {
            _id: "123456789012345678901234",
            name: "John"
        };

        const mockSchedule = [
            {
                _id: "1",
                Staff: "123456789012345678901234",
                DayOfWeek: 1,
                StartTime: "08:00",
                EndTime: "16:00"
            },
            {
                _id: "2",
                Staff: "123456789012345678901234",
                DayOfWeek: 3,
                StartTime: "09:00",
                EndTime: "17:00"
            }
        ];

        User.findById.mockResolvedValue(mockUser);

        Schedule.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockSchedule)
        });

        const response = await request(app).get("/api/schedules/123456789012345678901234/schedule");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ schedule: mockSchedule });
        expect(User.findById).toHaveBeenCalledWith("123456789012345678901234");
        expect(Schedule.find).toHaveBeenCalledWith({
            Staff: "123456789012345678901234"
        });
    });

    test("should return 500 if an error occurs", async () => {
        User.findById.mockRejectedValue(new Error("Database failure"));

        const response = await request(app).get("/api/schedules/123456789012345678901234/schedule");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });
});