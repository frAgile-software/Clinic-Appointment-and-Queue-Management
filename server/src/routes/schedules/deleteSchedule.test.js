const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");

const deleteScheduleRouter = require("./deleteSchedule");
const Schedule = require("../../database/models/Schedule");
const User = require("../../database/models/User");
const Staff = require("../../database/models/Staff");

jest.mock("../../database/models/Schedule");
jest.mock("../../database/models/User");
jest.mock("../../database/models/Staff");

const app = express();
app.use(express.json());
app.use("/api/schedules", deleteScheduleRouter);



const VALID_SCHEDULE_ID = new mongoose.Types.ObjectId().toHexString();
const INVALID_SCHEDULE_ID = "not-a-valid-id";
const STAFF_AUTH0_ID = "auth0|staff-001";

const mockStaffUser = { _id: new mongoose.Types.ObjectId() };
const mockStaffRecord = { _id: new mongoose.Types.ObjectId() };
const mockScheduleBlock = {
  _id: VALID_SCHEDULE_ID,
  Staff: mockStaffRecord._id,
};



describe("DELETE /api/schedules/:scheduleId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  

  describe("Request validation", () => {
    test("Given an invalid schedule ID, Then it returns 400 with an appropriate message", async () => {
      const res = await request(app).delete(
        `/api/schedules/${INVALID_SCHEDULE_ID}`
      );

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Invalid schedule ID." });
    });

    test("Given a valid schedule ID format, Then it does not return 400", async () => {
      Schedule.findById.mockResolvedValue(null);

      const res = await request(app).delete(
        `/api/schedules/${VALID_SCHEDULE_ID}`
      );

      expect(res.status).not.toBe(400);
    });
  });

 

  describe("Schedule lookup", () => {
    test("Given the schedule block does not exist, Then it returns 404", async () => {
      Schedule.findById.mockResolvedValue(null);

      const res = await request(app).delete(
        `/api/schedules/${VALID_SCHEDULE_ID}`
      );

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Schedule block not found." });
    });

    test("Given the schedule block exists, Then Schedule.findById is called with the schedule ID", async () => {
      Schedule.findById.mockResolvedValue(mockScheduleBlock);
      Schedule.findByIdAndDelete.mockResolvedValue({});

      await request(app).delete(`/api/schedules/${VALID_SCHEDULE_ID}`);

      expect(Schedule.findById).toHaveBeenCalledWith(VALID_SCHEDULE_ID);
    });
  });

  
  describe("Ownership verification (staffId provided)", () => {
    test("Given the staffId user does not exist, Then it returns 404 with 'User not found'", async () => {
      Schedule.findById.mockResolvedValue(mockScheduleBlock);
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/schedules/${VALID_SCHEDULE_ID}`)
        .query({ staffId: STAFF_AUTH0_ID });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "User not found." });
    });

    test("Given the user has no staff record, Then it returns 403 with ownership error", async () => {
      Schedule.findById.mockResolvedValue(mockScheduleBlock);
      User.findOne.mockResolvedValue(mockStaffUser);
      Staff.findOne.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/schedules/${VALID_SCHEDULE_ID}`)
        .query({ staffId: STAFF_AUTH0_ID });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: "You do not own this schedule block." });
    });

    test("Given the staff record does not match the schedule's Staff field, Then it returns 403", async () => {
      const differentStaffId = new mongoose.Types.ObjectId();
      Schedule.findById.mockResolvedValue({ ...mockScheduleBlock, Staff: differentStaffId });
      User.findOne.mockResolvedValue(mockStaffUser);
      Staff.findOne.mockResolvedValue(mockStaffRecord);

      const res = await request(app)
        .delete(`/api/schedules/${VALID_SCHEDULE_ID}`)
        .query({ staffId: STAFF_AUTH0_ID });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: "You do not own this schedule block." });
    });

    test("Given the staffId matches the schedule owner, Then it deletes and returns 200", async () => {
      Schedule.findById.mockResolvedValue({
        _id: VALID_SCHEDULE_ID,
        Staff: { toString: () => mockStaffRecord._id.toString() },
      });
      User.findOne.mockResolvedValue(mockStaffUser);
      Staff.findOne.mockResolvedValue({
        _id: { toString: () => mockStaffRecord._id.toString() },
      });
      Schedule.findByIdAndDelete.mockResolvedValue({});

      const res = await request(app)
        .delete(`/api/schedules/${VALID_SCHEDULE_ID}`)
        .query({ staffId: STAFF_AUTH0_ID });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Schedule block deleted." });
      expect(Schedule.findByIdAndDelete).toHaveBeenCalledWith(VALID_SCHEDULE_ID);
    });

    test("Given a staffId with special characters, Then it is decoded before lookup", async () => {
      const encodedStaffId = encodeURIComponent(STAFF_AUTH0_ID);

      Schedule.findById.mockResolvedValue({
        _id: VALID_SCHEDULE_ID,
        Staff: { toString: () => mockStaffRecord._id.toString() },
      });
      User.findOne.mockResolvedValue(mockStaffUser);
      Staff.findOne.mockResolvedValue({
        _id: { toString: () => mockStaffRecord._id.toString() },
      });
      Schedule.findByIdAndDelete.mockResolvedValue({});

      await request(app)
        .delete(`/api/schedules/${VALID_SCHEDULE_ID}`)
        .query({ staffId: encodedStaffId });

      expect(User.findOne).toHaveBeenCalledWith({ auth0Id: STAFF_AUTH0_ID });
    });
  });

  
  describe("Deletion without staffId (no ownership check)", () => {
    test("Given no staffId query param, Then the block is deleted without ownership checks", async () => {
      Schedule.findById.mockResolvedValue(mockScheduleBlock);
      Schedule.findByIdAndDelete.mockResolvedValue({});

      const res = await request(app).delete(
        `/api/schedules/${VALID_SCHEDULE_ID}`
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Schedule block deleted." });
      expect(User.findOne).not.toHaveBeenCalled();
      expect(Staff.findOne).not.toHaveBeenCalled();
    });

    test("Given no staffId, Then Schedule.findByIdAndDelete is called with the correct ID", async () => {
      Schedule.findById.mockResolvedValue(mockScheduleBlock);
      Schedule.findByIdAndDelete.mockResolvedValue({});

      await request(app).delete(`/api/schedules/${VALID_SCHEDULE_ID}`);

      expect(Schedule.findByIdAndDelete).toHaveBeenCalledWith(VALID_SCHEDULE_ID);
    });
  });

  

  describe("Server / database errors", () => {
    test("Given Schedule.findById throws, Then it returns 500", async () => {
      Schedule.findById.mockRejectedValue(new Error("DB failure"));

      const res = await request(app).delete(
        `/api/schedules/${VALID_SCHEDULE_ID}`
      );

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: "Server error." });
    });

    test("Given Schedule.findByIdAndDelete throws, Then it returns 500", async () => {
      Schedule.findById.mockResolvedValue(mockScheduleBlock);
      Schedule.findByIdAndDelete.mockRejectedValue(new Error("Delete failure"));

      const res = await request(app).delete(
        `/api/schedules/${VALID_SCHEDULE_ID}`
      );

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: "Server error." });
    });

    test("Given a server error, Then console.error is called", async () => {
      Schedule.findById.mockRejectedValue(new Error("DB failure"));

      await request(app).delete(`/api/schedules/${VALID_SCHEDULE_ID}`);

      expect(console.error).toHaveBeenCalledWith(
        "Error deleting schedule block:",
        expect.any(Error)
      );
    });
  });
});