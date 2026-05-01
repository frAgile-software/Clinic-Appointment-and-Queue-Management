jest.mock('../../database/dbConnect', () => jest.fn(() => Promise.resolve()));

jest.mock('express-oauth2-jwt-bearer', () => ({
    auth: jest.fn(() => (req, res, next) => {
        req.auth = {
            payload: {
                sub: 'auth0|mockUserId123',
                aud: process.env.SERVER_URL,
                iss: 'https://clinicsandqs-users.eu.auth0.com/',
                scope: 'openid profile email',
            }
        };
        next();
    })
}));

jest.mock("../../database/models/User");
jest.mock("../../database/models/Queue");

const app = require('../../index');
const request = require("supertest");
const User = require("../../database/models/User");
const Queue = require("../../database/models/Queue");

describe("GET /api/queues/patient/:auth0ID", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return 404 if patient is not found", async () => {
        User.findOne.mockResolvedValue(null);

        const response = await request(app)
            .get("/api/queues/patient/auth0|1234567890");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Patient not found." });
    });

    test("should return 200 with inQueue false if patient is not in a queue", async () => {
        User.findOne.mockResolvedValue({ _id: "mock-patient-id" });
        Queue.findOne.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            })
        });

        const response = await request(app)
            .get("/api/queues/patient/auth0|1234567890");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ inQueue: false });
    });

    test("should return 200 with queue and position if patient is in a queue", async () => {
        const mockPatient = { _id: "mock-patient-id" };
        const mockQueue = {
            Clinic: { _id: "mock-clinic-id" },
            Speciality: { _id: "mock-spec-id" },
            Patient: "mock-patient-id",
        };
        const mockQueueList = [
            { Patient: { toString: () => "other-patient-id" } },
            { Patient: { toString: () => "mock-patient-id" } },
        ];

        User.findOne.mockResolvedValue(mockPatient);
        Queue.findOne.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockQueue)
            })
        });
        Queue.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockQueueList)
        });

        const response = await request(app)
            .get("/api/queues/patient/auth0|1234567890");

        expect(response.status).toBe(200);
        expect(response.body.inQueue).toBe(true);
        expect(response.body.queue.position).toBe(2);
    });

    test('should return 500 on server error', async () => {
        User.findOne.mockRejectedValueOnce(new Error("Server error."));

        const response = await request(app)
            .get("/api/queues/patient/auth0|1234567890");

        expect(response.status).toEqual(500);
    });
});