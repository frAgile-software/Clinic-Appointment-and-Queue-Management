const request = require("supertest");
const express = require("express");

const removeSpecialityFromStaffRouter = require("./removeSpecialityFromStaff");
const StaffSpeciality = require("../../database/models/StaffSpeciality");

jest.mock("../../database/models/StaffSpeciality");

const app = express();
app.use(express.json());
app.use("/api/specialities", removeSpecialityFromStaffRouter);

describe("DELETE /api/specialities/staff/:staffId/:specialityId", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return 400 if staff ID is invalid", async () => {
        const response = await request(app)
            .delete("/api/specialities/staff/bad-id/222222222222222222222222");

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Invalid staff ID." });
    });

    test("should return 400 if speciality ID is invalid", async () => {
        const response = await request(app)
            .delete("/api/specialities/staff/111111111111111111111111/bad-id");

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Invalid speciality ID." });
    });

    test("should return 404 if staff speciality link is not found", async () => {
        StaffSpeciality.findOneAndDelete.mockResolvedValue(null);

        const response = await request(app)
            .delete("/api/specialities/staff/111111111111111111111111/222222222222222222222222");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Staff speciality link not found." });
    });

    test("should remove speciality from staff successfully", async () => {
        const mockDeletedLink = {
            _id: "333333333333333333333333",
            Staff: "111111111111111111111111",
            Speciality: "222222222222222222222222"
        };

        StaffSpeciality.findOneAndDelete.mockResolvedValue(mockDeletedLink);

        const response = await request(app)
            .delete("/api/specialities/staff/111111111111111111111111/222222222222222222222222");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: "Speciality removed from staff successfully.",
            staffSpeciality: mockDeletedLink
        });

        expect(StaffSpeciality.findOneAndDelete).toHaveBeenCalledWith({
            Staff: "111111111111111111111111",
            Speciality: "222222222222222222222222"
        });
    });

    test("should return 500 if an error occurs", async () => {
        StaffSpeciality.findOneAndDelete.mockRejectedValue(new Error("Database failure"));

        const response = await request(app)
            .delete("/api/specialities/staff/111111111111111111111111/222222222222222222222222");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });
});