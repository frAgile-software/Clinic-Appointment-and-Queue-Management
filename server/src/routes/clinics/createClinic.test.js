const request = require("supertest");
const express = require("express");
const createClinicRouter = require("./createClinic");
const User = require("../../database/models/User");
const Clinic = require("../../database/models/Clinic");
const Staff = require("../../database/models/Staff");

jest.mock("../../database/models/User");
jest.mock("../../database/models/Clinic");
jest.mock("../../database/models/Staff");

const app = express();
app.use(express.json());
app.use("/clinics", createClinicRouter);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

describe("POST /clinics", () => {
  it("returns 404 when clinic is not found", async () => {
    Clinic.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post("/clinics")
      .send({ clinicID: "clinic-123", practiceNumber: "42", auth0Id: "auth0|user" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Clinic not found." });
    expect(Clinic.findOne).toHaveBeenCalledWith({
      $or: [{ id: "clinic-123" }, { practiceNumber: "42" }]
    });
  });

  it("returns 403 when sender is not admin", async () => {
    Clinic.findOne.mockResolvedValue({ _id: "clinicObjectId" });
    User.findOne.mockResolvedValue({ auth0Id: "auth0|user", role: "Patient" });

    const response = await request(app)
      .post("/clinics")
      .send({ clinicID: "clinic-123", practiceNumber: "42", auth0Id: "auth0|user" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "Unauthorized." });
    expect(User.findOne).toHaveBeenCalledWith({ auth0Id: "auth0|user" });
  });

  it("creates a staff link and returns 201", async () => {
    const clinic = { _id: "clinicObjectId" };
    const user = { _id: "userObjectId", role: "Admin" };
    const savedStaff = { Clinic: { id: "clinicObjectId" } };
    const saveMock = jest.fn().mockResolvedValue(savedStaff);

    Clinic.findOne.mockResolvedValue(clinic);
    User.findOne.mockResolvedValue(user);
    Staff.mockImplementation(function (doc) {
      this.Clinic = doc.Clinic;
      this.User = doc.User;
      this.save = saveMock;
    });

    const response = await request(app)
      .post("/clinics")
      .send({ clinicID: "clinic-123", practiceNumber: "42", auth0Id: "auth0|admin" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: "Clinic linked successfully.",
      clinicID: "clinicObjectId"
    });
    expect(Staff).toHaveBeenCalledWith({
      Clinic: clinic._id,
      User: user._id
    });
    expect(saveMock).toHaveBeenCalled();
  });

  it("returns 500 when an exception occurs", async () => {
    Clinic.findOne.mockRejectedValue(new Error("database error"));

    const response = await request(app)
      .post("/clinics")
      .send({ clinicID: "clinic-123", practiceNumber: "42", auth0Id: "auth0|admin" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Server error." });
  });
});