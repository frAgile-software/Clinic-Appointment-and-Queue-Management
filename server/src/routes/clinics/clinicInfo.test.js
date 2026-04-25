const request = require("supertest");
const express = require("express");
const clinicInfo = require("./clinicInfo");
const Clinic = require("../../database/models/Clinic");

jest.mock("../../database/models/Clinic");

const app = express();
app.use(express.json());
app.use("/api/clinics", clinicInfo);

describe("GET /api/clinics/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  it("returns clinic data when clinic exists", async () => {
    const mockClinic = {
      _id: "clinicObjectId",
      practiceName: "Test Clinic",
      practiceNumber: "42"
    };

    Clinic.findById.mockResolvedValue(mockClinic);

    const response = await request(app).get("/api/clinics/clinicObjectId");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockClinic);
    expect(Clinic.findById).toHaveBeenCalledWith("clinicObjectId");
  });

  it("returns 404 when clinic is not found", async () => {
    Clinic.findById.mockResolvedValue(null);

    const response = await request(app).get("/api/clinics/nonexistentId");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Clinic not found" });
    expect(Clinic.findById).toHaveBeenCalledWith("nonexistentId");
  });

  // I dont think that specifically catching 'cast errors' are needed but oh well heres a test for it
  it("returns 400 when id has invalid ObjectId format", async () => {
    const castError = new Error("Cast to ObjectId failed");
    castError.name = "CastError";
    Clinic.findById.mockRejectedValue(castError);

    const response = await request(app).get("/api/clinics/invalid-id");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid clinic ID format" });
  });

  it("returns 500 when a server error occurs", async () => {
    Clinic.findById.mockRejectedValue(new Error("database error"));

    const response = await request(app).get("/api/clinics/clinicObjectId");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Server error" });
  });
});
