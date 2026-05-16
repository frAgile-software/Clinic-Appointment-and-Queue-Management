const request = require("supertest");
const express = require("express");

const createSpecialityRouter = require("./createSpeciality");
const Speciality = require("../../database/models/Speciality");

jest.mock("../../database/models/Speciality");

const app = express();
app.use(express.json());
app.use("/api/specialities", createSpecialityRouter);

describe("POST /api/specialities", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return 400 if SpecialityName is missing", async () => {
        const response = await request(app)
            .post("/api/specialities")
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: "Speciality name is required."
        });
    });

    test("should return 400 if SpecialityName is empty", async () => {
        const response = await request(app)
            .post("/api/specialities")
            .send({
                SpecialityName: "   "
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: "Speciality name is required."
        });
    });

    test("should return 409 if speciality already exists", async () => {
        Speciality.findOne.mockResolvedValue({
            _id: "111111111111111111111111",
            SpecialityName: "Dentistry"
        });

        const response = await request(app)
            .post("/api/specialities")
            .send({
                SpecialityName: "Dentistry"
            });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            message: "Speciality already exists."
        });

        expect(Speciality.findOne).toHaveBeenCalledWith({
            SpecialityName: {
                $regex: "^Dentistry$",
                $options: "i"
            }
        });
    });

    test("should create speciality successfully", async () => {
        const mockCreatedSpeciality = {
            _id: "222222222222222222222222",
            SpecialityName: "General Checkup"
        };

        Speciality.findOne.mockResolvedValue(null);
        Speciality.create.mockResolvedValue(mockCreatedSpeciality);

        const response = await request(app)
            .post("/api/specialities")
            .send({
                SpecialityName: "General Checkup"
            });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            message: "Speciality created successfully.",
            speciality: mockCreatedSpeciality
        });

        expect(Speciality.create).toHaveBeenCalledWith({
            SpecialityName: "General Checkup"
        });
    });

    test("should trim spaces before creating speciality", async () => {
        const mockCreatedSpeciality = {
            _id: "333333333333333333333333",
            SpecialityName: "Pediatrics"
        };

        Speciality.findOne.mockResolvedValue(null);
        Speciality.create.mockResolvedValue(mockCreatedSpeciality);

        const response = await request(app)
            .post("/api/specialities")
            .send({
                SpecialityName: "   Pediatrics   "
            });

        expect(response.status).toBe(201);

        expect(Speciality.findOne).toHaveBeenCalledWith({
            SpecialityName: {
                $regex: "^Pediatrics$",
                $options: "i"
            }
        });

        expect(Speciality.create).toHaveBeenCalledWith({
            SpecialityName: "Pediatrics"
        });
    });

    test("should return 500 if an error occurs", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        Speciality.findOne.mockRejectedValue(new Error("Database failure"));

        const response = await request(app)
            .post("/api/specialities")
            .send({
                SpecialityName: "Dentistry"
            });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            message: "Server error."
        });

        consoleSpy.mockRestore();
    });
});