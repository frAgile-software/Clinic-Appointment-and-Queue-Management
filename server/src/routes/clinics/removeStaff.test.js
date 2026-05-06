const request = require("supertest");
const express = require("express");

const removeStaffRouter = require("./removeStaff");
const Staff = require("../../database/models/Staff");

jest.mock("../../database/models/Staff");

const app = express();
app.use(express.json());
app.use("/api/clinics", removeStaffRouter);

describe("DELETE /api/clinics/:clinicID/staff/:staffID", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return 400 if clinic ID is invalid", async () => {
        const response = await request(app)
            .delete("/api/clinics/invalid-clinic-id/staff/123456789012345678901234");

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Invalid clinic ID" });
    });

    test("should return 400 if staff ID is invalid", async () => {
        const response = await request(app)
            .delete("/api/clinics/111111111111111111111111/staff/invalid-staff-id");

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Invalid staff ID" });
    });

    test("should return 404 if staff is not found", async () => {
        Staff.findById.mockResolvedValue(null);

        const response = await request(app)
            .delete("/api/clinics/111111111111111111111111/staff/222222222222222222222222");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Staff not found" });
        expect(Staff.findById).toHaveBeenCalledWith("222222222222222222222222");
    });

    test("should return 403 if staff does not belong to clinic", async () => {
        Staff.findById.mockResolvedValue({
            _id: "222222222222222222222222",
            Clinic: {
                toString: () => "333333333333333333333333"
            }
        });

        const response = await request(app)
            .delete("/api/clinics/111111111111111111111111/staff/222222222222222222222222");

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            message: "Staff does not belong to the specified clinic"
        });
    });

    test("should remove staff successfully", async () => {
        const mockStaff = {
            _id: "222222222222222222222222",
            Clinic: {
                toString: () => "111111111111111111111111"
            }
        };

        Staff.findById.mockResolvedValue(mockStaff);
        Staff.findByIdAndDelete.mockResolvedValue(mockStaff);

        const response = await request(app)
            .delete("/api/clinics/111111111111111111111111/staff/222222222222222222222222");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: "Staff member removed successfully",
            staffID: "222222222222222222222222"
        });

        expect(Staff.findByIdAndDelete).toHaveBeenCalledWith("222222222222222222222222");
    });

    test("should return 500 if an error occurs", async () => {
        Staff.findById.mockRejectedValue(new Error("Database failure"));

        const response = await request(app)
            .delete("/api/clinics/111111111111111111111111/staff/222222222222222222222222");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Internal server error" });
    });
});