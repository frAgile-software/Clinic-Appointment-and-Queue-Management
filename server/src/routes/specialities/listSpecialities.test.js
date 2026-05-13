const request = require("supertest");
const express = require("express");

const listSpecialities = require("./listSpecialities");
const Speciality = require("../../database/models/Speciality");

jest.mock("../../database/models/Speciality");

const app = express();
app.use(express.json());
app.use("/specialities", listSpecialities);

describe("GET /specialities", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return all specialities successfully", async () => {
        const mockSpecialities = [
            {
                _id: "111111111111111111111111",
                name: "General Checkup"
            },
            {
                _id: "222222222222222222222222",
                name: "Dentistry"
            }
        ];

        Speciality.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockSpecialities)
        });

        const response = await request(app).get("/specialities");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockSpecialities);

        expect(Speciality.find).toHaveBeenCalled();
    });

    test("should return an empty array if no specialities exist", async () => {
        Speciality.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
        });

        const response = await request(app).get("/specialities");

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    test("should return 500 if an error occurs", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        Speciality.find.mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error("Database failure"))
        });

        const response = await request(app).get("/specialities");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });

        consoleSpy.mockRestore();
    });
});