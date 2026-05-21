const request = require("supertest");
const express = require("express");
const deleteStaffSchedulesRouter = require("./deleteStaffSchedules");
const Schedule = require("../../database/models/Schedule");
const User = require("../../database/models/User");
jest.mock("../../database/models/Schedule");
jest.mock("../../database/models/User");

const app = express();
app.use(express.json());
app.use("/api/schedules", deleteStaffSchedulesRouter);

describe("DELETE /api/schedules/staff/:userId", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return 400 if userId is invalid", async () => {
        const response = await request(app)
            .delete("/api/schedules/staff/bad-id");

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: "Invalid user ID."
        });
    });

    test("should return 404 if user does not exist", async () => {
        User.findById.mockResolvedValue(null);

        const response = await request(app)
            .delete("/api/schedules/staff/111111111111111111111111");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            message: "User not found."
        });

        expect(User.findById).toHaveBeenCalledWith("111111111111111111111111");
    });

    test("should delete all schedules for staff user successfully", async () => {
        User.findById.mockResolvedValue({
            _id: "111111111111111111111111",
            role: "Staff"
        });

        Schedule.deleteMany.mockResolvedValue({
            deletedCount: 5
        });

        const response = await request(app)
            .delete("/api/schedules/staff/111111111111111111111111");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: "Staff schedules deleted successfully.",
            deletedCount: 5
        });

        expect(Schedule.deleteMany).toHaveBeenCalledWith({
            Staff: "111111111111111111111111"
        });
    });

    test("should return 200 even if staff user has no schedules", async () => {
        User.findById.mockResolvedValue({
            _id: "111111111111111111111111",
            role: "Staff"
        });

        Schedule.deleteMany.mockResolvedValue({
            deletedCount: 0
        });

        const response = await request(app)
            .delete("/api/schedules/staff/111111111111111111111111");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: "Staff schedules deleted successfully.",
            deletedCount: 0
        });
    });

    test("should return 500 if database error occurs", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        User.findById.mockRejectedValue(new Error("Database failure"));

        const response = await request(app)
            .delete("/api/schedules/staff/111111111111111111111111");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            message: "Server error."
        });

        consoleSpy.mockRestore();
    });
});