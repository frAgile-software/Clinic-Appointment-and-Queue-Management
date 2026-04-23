const request = require("supertest");
const express = require("express");

const updateScheduleRouter = require("./updateSchedule");
const Schedule = require("../../database/models/Schedule");
const User = require("../../database/models/User");

jest.mock("../../database/models/Schedule");
jest.mock("../../database/models/User");

const app = express();
app.use(express.json());
app.use("/api/users", updateScheduleRouter);

describe("PUT /api/users/schedule/:scheduleId", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return 400 if scheduleId is invalid", async () => {
        const response = await request(app)
            .put("/api/users/schedule/invalid-id")
            .send({
                DayOfWeek: 2,
                StartTime: "09:00",
                EndTime: "17:00"
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Invalid schedule ID." });
    });

    test("should return 404 if schedule entry does not exist", async () => {
        Schedule.findById.mockResolvedValue(null);

        const response = await request(app)
            .put("/api/users/schedule/123456789012345678901234")
            .send({
                DayOfWeek: 2,
                StartTime: "09:00",
                EndTime: "17:00"
            });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Schedule entry not found." });
        expect(Schedule.findById).toHaveBeenCalledWith("123456789012345678901234");
    });

    test("should return 400 if DayOfWeek is outside valid range", async () => {
        const mockSchedule = {
            _id: "123456789012345678901234",
            Staff: "987654321098765432109876",
            DayOfWeek: 1,
            StartTime: "08:00",
            EndTime: "16:00",
            save: jest.fn()
        };

        Schedule.findById.mockResolvedValue(mockSchedule);

        const response = await request(app)
            .put("/api/users/schedule/123456789012345678901234")
            .send({
                DayOfWeek: 9
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "DayOfWeek must be between 0 and 6." });
    });

    test("should return 400 if EndTime is earlier than StartTime", async () => {
        const mockSchedule = {
            _id: "123456789012345678901234",
            Staff: "987654321098765432109876",
            DayOfWeek: 1,
            StartTime: "08:00",
            EndTime: "16:00",
            save: jest.fn()
        };

        Schedule.findById.mockResolvedValue(mockSchedule);

        const response = await request(app)
            .put("/api/users/schedule/123456789012345678901234")
            .send({
                StartTime: "17:00",
                EndTime: "09:00"
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "EndTime must be later than StartTime." });
    });

    test("should return 404 if updated user does not exist", async () => {
        const mockSchedule = {
            _id: "123456789012345678901234",
            Staff: "987654321098765432109876",
            DayOfWeek: 1,
            StartTime: "08:00",
            EndTime: "16:00",
            save: jest.fn()
        };

        Schedule.findById.mockResolvedValue(mockSchedule);
        User.findById.mockResolvedValue(null);

        const response = await request(app)
            .put("/api/users/schedule/123456789012345678901234")
            .send({
                Staff: "111111111111111111111111"
            });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "User not found." });
        expect(User.findById).toHaveBeenCalledWith("111111111111111111111111");
    });

    test("should update and return schedule successfully", async () => {
        const mockUpdatedSchedule = {
            _id: "123456789012345678901234",
            Staff: "111111111111111111111111",
            DayOfWeek: 2,
            StartTime: "09:00",
            EndTime: "17:00"
        };

        const mockSchedule = {
            _id: "123456789012345678901234",
            Staff: "987654321098765432109876",
            DayOfWeek: 1,
            StartTime: "08:00",
            EndTime: "16:00",
            save: jest.fn().mockResolvedValue(mockUpdatedSchedule)
        };

        const mockUser = {
            _id: "111111111111111111111111",
            name: "John"
        };

        Schedule.findById.mockResolvedValue(mockSchedule);
        User.findById.mockResolvedValue(mockUser);

        const response = await request(app)
            .put("/api/users/schedule/123456789012345678901234")
            .send({
                Staff: "111111111111111111111111",
                DayOfWeek: 2,
                StartTime: "09:00",
                EndTime: "17:00"
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: "Schedule entry updated successfully.",
            schedule: mockUpdatedSchedule
        });

        expect(mockSchedule.Staff).toBe("111111111111111111111111");
        expect(mockSchedule.DayOfWeek).toBe(2);
        expect(mockSchedule.StartTime).toBe("09:00");
        expect(mockSchedule.EndTime).toBe("17:00");
        expect(mockSchedule.save).toHaveBeenCalled();
    });

    test("should return 500 if an error occurs", async () => {
        Schedule.findById.mockRejectedValue(new Error("Database failure"));

        const response = await request(app)
            .put("/api/users/schedule/123456789012345678901234")
            .send({
                DayOfWeek: 2,
                StartTime: "09:00",
                EndTime: "17:00"
            });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });
});