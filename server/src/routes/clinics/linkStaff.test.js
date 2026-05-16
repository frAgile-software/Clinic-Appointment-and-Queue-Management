const request = require("supertest");
const express = require("express");

const linkStaffRouter = require("./linkStaff");
const User = require("../../database/models/User");
const Clinic = require("../../database/models/Clinic");
const Staff = require("../../database/models/Staff");

jest.mock("../../database/models/User");
jest.mock("../../database/models/Clinic");
jest.mock("../../database/models/Staff");

const app = express();
app.use(express.json());
app.use("/clinics", linkStaffRouter);

describe("POST /clinics/:clinicId/staff", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    // Not Found 

    test("should return 404 if clinic does not exist", async () => {
        Clinic.findById.mockResolvedValue(null);

        const response = await request(app)
            .post("/clinics/clinic123/staff")
            .send({ auth0Id: "auth0|abc123" });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Clinic not found." });
        expect(Clinic.findById).toHaveBeenCalledWith("clinic123");
        expect(User.findOne).not.toHaveBeenCalled();
    });

    test("should return 404 if no staff account is found for the given auth0Id", async () => {
        Clinic.findById.mockResolvedValue({ _id: "clinic123", name: "Test Clinic" });
        User.findOne.mockResolvedValue(null);

        const response = await request(app)
            .post("/clinics/clinic123/staff")
            .send({ auth0Id: "auth0|abc123" });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "No staff account found." });
        expect(User.findOne).toHaveBeenCalledWith({ auth0Id: "auth0|abc123", role: "Staff" });
        expect(Staff.findOne).not.toHaveBeenCalled();
    });

    //  Conflict

    test("should return 409 if staff member is already linked to a clinic", async () => {
        const mockClinic = { _id: "clinic123", name: "Test Clinic" };
        const mockUser = { _id: "user123", auth0Id: "auth0|abc123", role: "Staff" };

        Clinic.findById.mockResolvedValue(mockClinic);
        User.findOne.mockResolvedValue(mockUser);
        Staff.findOne.mockResolvedValue({ _id: "existingLink", User: mockUser._id, Clinic: "otherClinic" });

        const response = await request(app)
            .post("/clinics/clinic123/staff")
            .send({ auth0Id: "auth0|abc123" });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({ message: "Staff member is already linked to a clinic." });
        expect(Staff.findOne).toHaveBeenCalledWith({ User: mockUser._id });
        expect(Staff.create).not.toHaveBeenCalled();
    });

    // Success

    test("should return 201 and staffId when staff is linked successfully", async () => {
        const mockClinic = { _id: "clinic123", name: "Test Clinic" };
        const mockUser = { _id: "user123", auth0Id: "auth0|abc123", role: "Staff" };
        const mockNewLink = { _id: "newLink456", User: mockUser._id, Clinic: mockClinic._id };

        Clinic.findById.mockResolvedValue(mockClinic);
        User.findOne.mockResolvedValue(mockUser);
        Staff.findOne.mockResolvedValue(null);
        Staff.create.mockResolvedValue(mockNewLink);

        const response = await request(app)
            .post("/clinics/clinic123/staff")
            .send({ auth0Id: "auth0|abc123" });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({ message: "Staff linked successfully.", staffId: mockNewLink._id });
        expect(Staff.create).toHaveBeenCalledWith({
            User: mockUser._id,
            Clinic: mockClinic._id,
        });
    });

    test("should use the clinic _id and user _id from DB lookups, not from the request", async () => {
        const mockClinic = { _id: "resolvedClinicId", name: "Test Clinic" };
        const mockUser = { _id: "resolvedUserId", auth0Id: "auth0|abc123", role: "Staff" };
        const mockNewLink = { _id: "newLink789", User: mockUser._id, Clinic: mockClinic._id };

        Clinic.findById.mockResolvedValue(mockClinic);
        User.findOne.mockResolvedValue(mockUser);
        Staff.findOne.mockResolvedValue(null);
        Staff.create.mockResolvedValue(mockNewLink);

        await request(app)
            .post("/clinics/clinic123/staff")
            .send({ auth0Id: "auth0|abc123" });

        expect(Staff.create).toHaveBeenCalledWith({
            User: "resolvedUserId",
            Clinic: "resolvedClinicId",
        });
    });

    //Server Errors 

    test("should return 500 if Clinic.findById throws", async () => {
        Clinic.findById.mockRejectedValue(new Error("DB connection lost"));

        const response = await request(app)
            .post("/clinics/clinic123/staff")
            .send({ auth0Id: "auth0|abc123" });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });

    test("should return 500 if User.findOne throws", async () => {
        Clinic.findById.mockResolvedValue({ _id: "clinic123" });
        User.findOne.mockRejectedValue(new Error("User lookup failed"));

        const response = await request(app)
            .post("/clinics/clinic123/staff")
            .send({ auth0Id: "auth0|abc123" });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });

    test("should return 500 if Staff.findOne throws", async () => {
        Clinic.findById.mockResolvedValue({ _id: "clinic123" });
        User.findOne.mockResolvedValue({ _id: "user123" });
        Staff.findOne.mockRejectedValue(new Error("Staff lookup failed"));

        const response = await request(app)
            .post("/clinics/clinic123/staff")
            .send({ auth0Id: "auth0|abc123" });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });

    test("should return 500 if Staff.create throws", async () => {
        Clinic.findById.mockResolvedValue({ _id: "clinic123" });
        User.findOne.mockResolvedValue({ _id: "user123" });
        Staff.findOne.mockResolvedValue(null);
        Staff.create.mockRejectedValue(new Error("Insert failed"));

        const response = await request(app)
            .post("/clinics/clinic123/staff")
            .send({ auth0Id: "auth0|abc123" });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });
});