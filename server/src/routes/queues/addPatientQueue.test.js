const request = require("supertest");
const express = require("express");

const addPatientQueueRouter = require("./addPatientQueue");
const Clinic = require("../../database/models/Clinic");
const User = require("../../database/models/User");
const Speciality = require("../../database/models/Speciality");

jest.mock("../../database/models/Queue");
jest.mock("../../database/models/Clinic");
jest.mock("../../database/models/User");
jest.mock("../../database/models/Speciality");

const app = express();
app.use(express.json());
app.use("/api/queues", addPatientQueueRouter);

describe("POST /api/queues", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return 404 if clinic is not found", async () => { //passing test
        User.findOne.mockResolvedValue({ _id: "mock-user-id" });
        Clinic.findById.mockResolvedValue(null);
        const response = await request(app)
                    .post("/api/queues")
                    .send({clinicID: "123456789012345678901234",
                        specialityID: "222222222222222222222222",
                        auth0ID: "auth0|1234567890",
                        bookingDateTime: "2026-05-01T10:30:00.000Z"
                    });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Clinic not found" });
    });  
    test("should return 400 if user profile does not exist", async () => { //passing test
        User.findOne.mockResolvedValue(null);
        const response = await request(app)
                .post("/api/queues")
                .send({clinicID: "123456789012345678901234",
                    specialityID: "222222222222222222222222",
                    auth0ID: "auth0|1234567890",
                    bookingDateTime: "2026-05-01T10:30:00.000Z"
                });
               
                expect(response.status).toBe(400);
                expect(response.body).toEqual({ message: "User profile not found." });
            });

    test("should return 404 if no staff member with the specified speciality is found in the clinic", async () => { //passing test
        User.findOne.mockResolvedValue({ _id: "mock-user-id" });
        Clinic.findById.mockResolvedValue({ _id: "mock-clinic-id" });
        User.findOne.mockResolvedValue(null); // No staff member with the specified speciality

        const response = await request(app)
                .post("/api/queues")
                .send({clinicID: "123456789012345678901234",
                    specialityID: "222222222222222222222222",
                    auth0ID: "auth0|1234567890",
                    bookingDateTime: "2026-05-01T10:30:00.000Z"
                });
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "No staff member with specified speciality found in the clinic." });
        });

            
    });