const request = require("supertest");
const express = require("express");

const addSpecialityToStaffRouter = require("./addSpecialityToStaff");
const Staff = require("../../database/models/Staff");
const Speciality = require("../../database/models/Speciality");
const StaffSpeciality = require("../../database/models/StaffSpeciality");

jest.mock("../../database/models/Staff");
jest.mock("../../database/models/Speciality");
jest.mock("../../database/models/StaffSpeciality");

const app = express();
app.use(express.json());
app.use("/api/specialities", addSpecialityToStaffRouter);

describe("POST /api/specialities/staff", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return 400 if staff ID is invalid", async () => {
        const response = await request(app)
            .post("/api/specialities/staff")
            .send({
                Staff: "bad-id",
                Speciality: "222222222222222222222222"
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Invalid staff ID." });
    });

    test("should return 400 if speciality ID is invalid", async () => {
        const response = await request(app)
            .post("/api/specialities/staff")
            .send({
                Staff: "111111111111111111111111",
                Speciality: "bad-id"
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Invalid speciality ID." });
    });

    test("should return 404 if staff does not exist", async () => {
        Staff.findById.mockResolvedValue(null);

        const response = await request(app)
            .post("/api/specialities/staff")
            .send({
                Staff: "111111111111111111111111",
                Speciality: "222222222222222222222222"
            });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Staff not found." });
    });

    test("should return 404 if speciality does not exist", async () => {
        Staff.findById.mockResolvedValue({ _id: "111111111111111111111111" });
        Speciality.findById.mockResolvedValue(null);

        const response = await request(app)
            .post("/api/specialities/staff")
            .send({
                Staff: "111111111111111111111111",
                Speciality: "222222222222222222222222"
            });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Speciality not found." });
    });

    test("should return 409 if staff already has this speciality", async () => {
        Staff.findById.mockResolvedValue({ _id: "111111111111111111111111" });
        Speciality.findById.mockResolvedValue({ _id: "222222222222222222222222" });
        StaffSpeciality.findOne.mockResolvedValue({
            Staff: "111111111111111111111111",
            Speciality: "222222222222222222222222"
        });

        const response = await request(app)
            .post("/api/specialities/staff")
            .send({
                Staff: "111111111111111111111111",
                Speciality: "222222222222222222222222"
            });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({ message: "Staff already has this speciality." });
    });

    test("should add speciality to staff successfully", async () => {
        const mockCreatedLink = {
            _id: "333333333333333333333333",
            Staff: "111111111111111111111111",
            Speciality: "222222222222222222222222"
        };

        Staff.findById.mockResolvedValue({ _id: "111111111111111111111111" });
        Speciality.findById.mockResolvedValue({ _id: "222222222222222222222222" });
        StaffSpeciality.findOne.mockResolvedValue(null);
        StaffSpeciality.create.mockResolvedValue(mockCreatedLink);

        const response = await request(app)
            .post("/api/specialities/staff")
            .send({
                Staff: "111111111111111111111111",
                Speciality: "222222222222222222222222"
            });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            message: "Speciality added to staff successfully.",
            staffSpeciality: mockCreatedLink
        });

        expect(StaffSpeciality.create).toHaveBeenCalledWith({
            Staff: "111111111111111111111111",
            Speciality: "222222222222222222222222"
        });
    });

    test("should return 500 if an error occurs", async () => {
        Staff.findById.mockRejectedValue(new Error("Database failure"));

        const response = await request(app)
            .post("/api/specialities/staff")
            .send({
                Staff: "111111111111111111111111",
                Speciality: "222222222222222222222222"
            });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });
});