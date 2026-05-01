const request = require("supertest");
const express = require("express");

const addPatientQueueRouter = require("./addPatientQueue");
const Clinic = require("../../database/models/Clinic");
const User = require("../../database/models/User");
const Speciality = require("../../database/models/Speciality");
const Queue = require("../../database/models/Queue");
const StaffSpeciality = require("../../database/models/StaffSpeciality");
const Staff = require("../../database/models/Staff");

jest.mock("../../database/models/Queue");
jest.mock("../../database/models/Clinic");
jest.mock("../../database/models/User");
jest.mock("../../database/models/Speciality");
jest.mock("../../database/models/StaffSpeciality");
jest.mock("../../database/models/Staff");

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
                        specialityName: "mock speciality",
                        auth0ID: "auth0|1234567890",
                    });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Clinic not found" });
    });  
    test("should return 400 if user profile does not exist", async () => { //passing test
        User.findOne.mockResolvedValue(null);
        const response = await request(app)
                .post("/api/queues")
                .send({clinicID: "123456789012345678901234",
                    specialityName: "mock speciality",
                    auth0ID: "auth0|1234567890",
                });
               
                expect(response.status).toBe(400);
                expect(response.body).toEqual({ message: "User profile not found." });
            });

    test("should return 409 if user is already in a queue for the clinic", async () => {  //passing test
        User.findOne.mockResolvedValue({ _id: "mock-user-id" });
        Clinic.findOne.mockResolvedValue({ _id: "mock-clinic-id" });
        Speciality.findOne.mockResolvedValueOnce({ _id: "mock-spec-id" });
        Staff.find.mockReturnValueOnce({
            select: jest.fn().mockResolvedValueOnce([{ _id: "mock-staff-id" }])
        });
        StaffSpeciality.findOne.mockResolvedValueOnce({ _id: "mock-staff-speciality"});

        Queue.findOne.mockResolvedValue({ _id: "mock-queue-id" }); // User is already in a queue for the clinic

        const response = await request(app)
                .post("/api/queues")
                .send({
                    clinicID: "123456789012345678901234",
                    specialityName: "mock speciality",
                    auth0ID: "auth0|1234567890",
                });
        expect(response.status).toBe(409);
        expect(response.body).toEqual({ message: "User is already in a queue for this clinic." });
    });


    test("should return 404 if no staff member with the specified speciality is found in the clinic", async () => { 
        User.findOne.mockResolvedValueOnce({ _id: "mock-user-id" });
        Clinic.findOne.mockResolvedValue({ _id: "mock-clinic-id" });
        Speciality.findOne.mockResolvedValueOnce({ _id: "mock-spec-id" });
        Staff.find.mockReturnValueOnce({
            select: jest.fn().mockResolvedValueOnce([{ _id: "mock-staff-id" }])
        });
        StaffSpeciality.findOne.mockResolvedValueOnce(null);

        const response = await request(app)
                .post("/api/queues")
                .send({clinicID: "123456789012345678901234",
                    specialityName: "mock speciality",
                    auth0ID: "auth0|1234567890",
                });
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "No staff member with specified speciality found in the clinic." });
    });

    test("should return 404 if no speciality is found with name", async () => { 
        User.findOne.mockResolvedValueOnce({ _id: "mock-user-id" });
        Clinic.findOne.mockResolvedValue({ _id: "mock-clinic-id" });
        Speciality.findOne.mockResolvedValueOnce(null);

        const response = await request(app)
                .post("/api/queues")
                .send({clinicID: "123456789012345678901234",
                    specialityName: "mock speciality",
                    auth0ID: "auth0|1234567890",
                });
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Speciality not found." });
    });


    test("should return 200 and success message if user is successfully added to the queue", async () => { 
        User.findOne.mockResolvedValueOnce({ _id: "mock-user-id" });
        Clinic.findOne.mockResolvedValue({ _id: "mock-clinic-id" });
        User.findOne.mockResolvedValueOnce({ role: "staff", clinic: "mock-clinic-id", speciality: "222222222222222222222222" });
        Speciality.findOne.mockResolvedValueOnce({ _id: "mock-spec-id" });
        Staff.find.mockReturnValueOnce({
            select: jest.fn().mockResolvedValueOnce([{ _id: "mock-staff-id" }])
        });
        StaffSpeciality.findOne.mockResolvedValueOnce({ _id: "mock-staff-speciality"});

        Queue.findOne.mockResolvedValue(null);
        Queue.prototype.save = jest.fn().mockResolvedValue();
        const response = await request(app)
                .post("/api/queues")
                .send({clinicID: "123456789012345678901234",
                    specialityName: "mock speciality",
                    auth0ID: "auth0|1234567890",
                });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: "Successfully joined queue" });
    }); 
});