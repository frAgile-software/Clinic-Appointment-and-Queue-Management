const request = require("supertest");
const express = require("express");
const getConsultsRouter = require("./getConsults");
const Consult = require("../../database/models/Consult");
const User = require("../../database/models/User");

jest.mock("../../database/models/Consult");
jest.mock("../../database/models/User");

const app = express();
app.use(express.json());
app.use("/api/consults", getConsultsRouter);

describe("GET /api/consults/:auth0Id", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    test("should return 404 if the user is not found", async () => {
        User.findOne.mockResolvedValueOnce(null);

        const response = await request(app).get("/api/consults/auth0|missing123");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "User not found." });
        expect(User.findOne).toHaveBeenCalledWith({ auth0Id: "auth0|missing123" });
    });

    test("should return 200 and the consult logs when user is found", async () => {
        const mockUser = { _id: "userObjId123", role: "Patient" };
        const mockConsults = [
            {
                _id: "consult1",
                Status: "Completed",
                createdAt: "2026-05-10T09:00:00.000Z",
                Speciality: { SpecialityName: "Dentistry" },
                Staff: { name: "John", surname: "Doe" }
            }
        ];

        User.findOne.mockResolvedValueOnce(mockUser);

        const sortChain = jest.fn().mockResolvedValueOnce(mockConsults);
        const populateStaffChain = jest.fn().mockReturnValueOnce({ sort: sortChain });
        const populateSpecChain = jest.fn().mockReturnValueOnce({ populate: populateStaffChain });
        
        Consult.find.mockReturnValueOnce({ populate: populateSpecChain });

        const response = await request(app).get("/api/consults/auth0|valid123");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockConsults);
        
        expect(User.findOne).toHaveBeenCalledWith({ auth0Id: "auth0|valid123" });
        expect(Consult.find).toHaveBeenCalledWith({ Patient: mockUser._id });
        expect(populateSpecChain).toHaveBeenCalledWith("Speciality", "SpecialityName");
        expect(populateStaffChain).toHaveBeenCalledWith("Staff", "name surname");
        expect(sortChain).toHaveBeenCalledWith({ createdAt: -1 });
    });

    test("should return 500 if a server error occurs", async () => {
        User.findOne.mockRejectedValueOnce(new Error("Database connection dropped"));

        const response = await request(app).get("/api/consults/auth0|error123");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });
});