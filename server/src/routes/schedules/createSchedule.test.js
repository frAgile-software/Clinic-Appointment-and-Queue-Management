const request = require("supertest");
const express = require("express");

const createScheduleRouter = require("./createSchedule");
const Schedule = require("../../database/models/Schedule");
const User = require("../../database/models/User");
const Staff = require("../../database/models/Staff");

jest.mock("../../database/models/Schedule");
jest.mock("../../database/models/User");
jest.mock("../../database/models/Staff");

const app = express();
app.use(express.json());
app.use("/api/schedules", createScheduleRouter);



const STAFF_AUTH0_ID = "auth0|staff-001";
const mockUser       = { _id: "user-mongo-001" };
const mockStaff      = { _id: "staff-mongo-001" };
const mockBlock      = { _id: "block-001", Staff: mockStaff._id, DayOfWeek: 1, StartTime: "08:00", EndTime: "09:00" };

const validBody = { staffId: STAFF_AUTH0_ID, DayOfWeek: 1, StartTime: "08:00", EndTime: "09:00" };

describe("POST /api/schedules", () => {
    beforeEach(() => {
        jest.clearAllMocks();
       
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

   

    test("should return 400 if staffId is missing", async () => {
        const response = await request(app)
            .post("/api/schedules")
            .send({ DayOfWeek: 1, StartTime: "08:00", EndTime: "09:00" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "staffId is required." });
        expect(Schedule.create).not.toHaveBeenCalled();
    });

    test("should return 400 if DayOfWeek is missing", async () => {
        const response = await request(app)
            .post("/api/schedules")
            .send({ staffId: STAFF_AUTH0_ID, StartTime: "08:00", EndTime: "09:00" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "DayOfWeek must be 0–6." });
        expect(Schedule.create).not.toHaveBeenCalled();
    });

    test("should return 400 if DayOfWeek is out of range", async () => {
        const response = await request(app)
            .post("/api/schedules")
            .send({ staffId: STAFF_AUTH0_ID, DayOfWeek: 7, StartTime: "08:00", EndTime: "09:00" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "DayOfWeek must be 0–6." });
        expect(Schedule.create).not.toHaveBeenCalled();
    });

    test("should return 400 if StartTime is missing", async () => {
        const response = await request(app)
            .post("/api/schedules")
            .send({ staffId: STAFF_AUTH0_ID, DayOfWeek: 1, EndTime: "09:00" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "StartTime and EndTime are required." });
        expect(Schedule.create).not.toHaveBeenCalled();
    });

    test("should return 400 if EndTime is not later than StartTime", async () => {
        const response = await request(app)
            .post("/api/schedules")
            .send({ staffId: STAFF_AUTH0_ID, DayOfWeek: 1, StartTime: "09:00", EndTime: "08:00" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "EndTime must be later than StartTime." });
        expect(Schedule.create).not.toHaveBeenCalled();
    });



    test("should return 404 if user is not found", async () => {
        User.findOne.mockResolvedValue(null);

        const response = await request(app).post("/api/schedules").send(validBody);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "User not found." });
        expect(User.findOne).toHaveBeenCalledWith({ auth0Id: STAFF_AUTH0_ID });
    });

    test("should return 404 if staff record is not found", async () => {
        User.findOne.mockResolvedValue(mockUser);
        Staff.findOne.mockResolvedValue(null);

        const response = await request(app).post("/api/schedules").send(validBody);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Staff record not found." });
        expect(Staff.findOne).toHaveBeenCalledWith({ User: mockUser._id });
    });

   

    test("should return 409 if schedule block already exists", async () => {
        User.findOne.mockResolvedValue(mockUser);
        Staff.findOne.mockResolvedValue(mockStaff);
        Schedule.findOne.mockResolvedValue(mockBlock);

        const response = await request(app).post("/api/schedules").send(validBody);

        expect(response.status).toBe(409);
        expect(response.body).toEqual({ message: "Schedule block already exists.", schedule: mockBlock });
        expect(Schedule.create).not.toHaveBeenCalled();
    });

    

    test("should return 201 and the created schedule block on success", async () => {
        User.findOne.mockResolvedValue(mockUser);
        Staff.findOne.mockResolvedValue(mockStaff);
        Schedule.findOne.mockResolvedValue(null);
        Schedule.create.mockResolvedValue(mockBlock);

        const response = await request(app).post("/api/schedules").send(validBody);

        expect(response.status).toBe(201);
        expect(response.body).toEqual({ message: "Schedule block created.", schedule: mockBlock });
        expect(Schedule.create).toHaveBeenCalledWith({
            Staff:     mockStaff._id,
            DayOfWeek: validBody.DayOfWeek,
            StartTime: validBody.StartTime,
            EndTime:   validBody.EndTime,
        });
    });


    test("should return 500 if Schedule.create throws", async () => {
        User.findOne.mockResolvedValue(mockUser);
        Staff.findOne.mockResolvedValue(mockStaff);
        Schedule.findOne.mockResolvedValue(null);
        Schedule.create.mockRejectedValue(new Error("Insert failed"));

        const response = await request(app).post("/api/schedules").send(validBody);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });
});