const request = require("supertest");
const express = require("express");

const createScheduleRouter = require("./createSchedule");
const User = require("../../database/models/User");
const Schedule = require("../../database/models/Schedule");

jest.mock("../../database/models/User");
jest.mock("../../database/models/Schedule");

const app = express();
app.use(express.json());
app.use("/api/schedules", createScheduleRouter);

describe("POST /api/schedules/bulk", () => {
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
            .post("/api/schedules/bulk")
            .send({ schedules: [{ DayOfWeek: 1, StartTime: "08:00", EndTime: "16:00" }] });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "staffId is required." });
        expect(User.findOne).not.toHaveBeenCalled();
    });

    test("should return 400 if schedules is missing", async () => {
        const response = await request(app)
            .post("/api/schedules/bulk")
            .send({ staffId: "auth0|abc123" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "schedules array is required." });
        expect(User.findOne).not.toHaveBeenCalled();
    });

    test("should return 400 if schedules is an empty array", async () => {
        const response = await request(app)
            .post("/api/schedules/bulk")
            .send({ staffId: "auth0|abc123", schedules: [] });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "schedules array is required." });
        expect(User.findOne).not.toHaveBeenCalled();
    });

    test("should return 400 if schedules is not an array", async () => {
        const response = await request(app)
            .post("/api/schedules/bulk")
            .send({ staffId: "auth0|abc123", schedules: "monday" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "schedules array is required." });
        expect(User.findOne).not.toHaveBeenCalled();
    });



    test("should return 404 if staff member is not found", async () => {
        User.findOne.mockResolvedValue(null);

        const response = await request(app)
            .post("/api/schedules/bulk")
            .send({
                staffId: "auth0|unknown",
                schedules: [{ DayOfWeek: 1, StartTime: "08:00", EndTime: "16:00" }],
            });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Staff member not found." });
        expect(User.findOne).toHaveBeenCalledWith({ auth0Id: "auth0|unknown" });
        expect(Schedule.insertMany).not.toHaveBeenCalled();
    });



    test("should return 201 and created schedules on success", async () => {
        const mockUser = { _id: "123456789012345678901234", name: "Jane" };

        const mockCreated = [
            { _id: "s1", Staff: mockUser._id, DayOfWeek: 0, StartTime: "08:00", EndTime: "16:00" },
            { _id: "s2", Staff: mockUser._id, DayOfWeek: 1, StartTime: "08:00", EndTime: "16:00" },
            { _id: "s3", Staff: mockUser._id, DayOfWeek: 2, StartTime: "08:00", EndTime: "16:00" },
            { _id: "s4", Staff: mockUser._id, DayOfWeek: 3, StartTime: "08:00", EndTime: "16:00" },
            { _id: "s5", Staff: mockUser._id, DayOfWeek: 4, StartTime: "08:00", EndTime: "16:00" },
            { _id: "s6", Staff: mockUser._id, DayOfWeek: 5, StartTime: "08:00", EndTime: "16:00" },
            { _id: "s7", Staff: mockUser._id, DayOfWeek: 6, StartTime: "08:00", EndTime: "16:00" },
        ];

        const inputSchedules = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
            DayOfWeek: day,
            StartTime: "08:00",
            EndTime: "16:00",
        }));

        User.findOne.mockResolvedValue(mockUser);
        Schedule.insertMany.mockResolvedValue(mockCreated);

        const response = await request(app)
            .post("/api/schedules/bulk")
            .send({ staffId: "auth0|abc123", schedules: inputSchedules });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            message: "Default schedule created.",
            schedules: mockCreated,
        });
        expect(User.findOne).toHaveBeenCalledWith({ auth0Id: "auth0|abc123" });
        expect(Schedule.insertMany).toHaveBeenCalledWith(
            inputSchedules.map(({ DayOfWeek, StartTime, EndTime }) => ({
                Staff: mockUser._id,
                DayOfWeek,
                StartTime,
                EndTime,
            }))
        );
    });

    test("should map Staff from the resolved user _id, not from the request body", async () => {
        const mockUser = { _id: "aabbccddeeff001122334455", name: "Bob" };

        User.findOne.mockResolvedValue(mockUser);
        Schedule.insertMany.mockResolvedValue([]);

        await request(app)
            .post("/api/schedules/bulk")
            .send({
                staffId: "auth0|bob",
                schedules: [{ DayOfWeek: 2, StartTime: "09:00", EndTime: "17:00" }],
            });

        expect(Schedule.insertMany).toHaveBeenCalledWith([
            { Staff: "aabbccddeeff001122334455", DayOfWeek: 2, StartTime: "09:00", EndTime: "17:00" },
        ]);
    });



    test("should return 500 if User.findOne throws", async () => {
        User.findOne.mockRejectedValue(new Error("DB connection lost"));

        const response = await request(app)
            .post("/api/schedules/bulk")
            .send({
                staffId: "auth0|abc123",
                schedules: [{ DayOfWeek: 1, StartTime: "08:00", EndTime: "16:00" }],
            });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });

    test("should return 500 if Schedule.insertMany throws", async () => {
        User.findOne.mockResolvedValue({ _id: "123456789012345678901234" });
        Schedule.insertMany.mockRejectedValue(new Error("Insert failed"));

        const response = await request(app)
            .post("/api/schedules/bulk")
            .send({
                staffId: "auth0|abc123",
                schedules: [{ DayOfWeek: 1, StartTime: "08:00", EndTime: "16:00" }],
            });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });
});