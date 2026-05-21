const express = require("express");

const request = require("supertest");
const createScheduleRouter = require("./createBulk");
const Schedule = require("../../database/models/Schedule");

jest.mock("../../database/models/Schedule");

const app = express();
app.use(express.json());
app.use("/api/schedules", createScheduleRouter);

describe("POST /api/schedules/bulk", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    test("should return 400 if userId is missing", async () => {
        const response = await request(app)
            .post("/api/schedules/bulk")
            .send({ schedules: [{ DayOfWeek: 1, StartTime: "08:00", EndTime: "16:00" }] });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "userId is required." });
        expect(Schedule.insertMany).not.toHaveBeenCalled();
    });

    test("should return 400 if schedules is missing", async () => {
        const response = await request(app)
            .post("/api/schedules/bulk")
            .send({ userId: "123456789012345678901234" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "schedules array is required." });
        expect(Schedule.insertMany).not.toHaveBeenCalled();
    });

    test("should return 400 if schedules is an empty array", async () => {
        const response = await request(app)
            .post("/api/schedules/bulk")
            .send({ userId: "123456789012345678901234", schedules: [] });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "schedules array is required." });
        expect(Schedule.insertMany).not.toHaveBeenCalled();
    });

    test("should return 400 if schedules is not an array", async () => {
        const response = await request(app)
            .post("/api/schedules/bulk")
            .send({ userId: "123456789012345678901234", schedules: "monday" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "schedules array is required." });
        expect(Schedule.insertMany).not.toHaveBeenCalled();
    });

    test("should return 201 and created schedules on success", async () => {
        const mockUserId = "123456789012345678901234";

        const mockCreated = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
            _id: `s${day}`,
            Staff: mockUserId,
            DayOfWeek: day,
            StartTime: "08:00",
            EndTime: "16:00",
        }));

        const inputSchedules = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
            DayOfWeek: day,
            StartTime: "08:00",
            EndTime: "16:00",
        }));

        Schedule.insertMany.mockResolvedValue(mockCreated);

        const response = await request(app)
            .post("/api/schedules/bulk")
            .send({ userId: mockUserId, schedules: inputSchedules });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            message: "Default schedule created.",
            schedules: mockCreated,
        });
        expect(Schedule.insertMany).toHaveBeenCalledWith(
            inputSchedules.map(({ DayOfWeek, StartTime, EndTime }) => ({
                Staff: mockUserId,
                DayOfWeek,
                StartTime,
                EndTime,
            }))
        );
    });

    test("should return 500 if Schedule.insertMany throws", async () => {
        Schedule.insertMany.mockRejectedValue(new Error("Insert failed"));

        const response = await request(app)
            .post("/api/schedules/bulk")
            .send({
                userId: "123456789012345678901234",
                schedules: [{ DayOfWeek: 1, StartTime: "08:00", EndTime: "16:00" }],
            });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });
});