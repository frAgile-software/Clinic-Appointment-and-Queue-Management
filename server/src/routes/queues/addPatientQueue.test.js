const request = require("supertest");
const express = require("express");

const addPatientQueueRouter = require("./addPatientQueue");
const Queue = require("../../database/models/Queue");
Queue.prototype.save = jest.fn();
jest.mock("../../database/models/Queue");

const app = express();
app.use(express.json());
app.use("/api/queues/addPatientQueueRouter");

describe("POST /api/queues", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });


    test("should return 404 if clinic does not exist", async () => {
        Queue.findOne.mockResolvedValue(null);

        const response = await request(app)
            .post("/api/queues")
            .send({
                clinicID: "123456789012345678901234",
                specialityID: "222222222222222222222222",
                auth0ID: "auth0|1234567890",
                bookingDateTime: "2026-05-01T10:30:00.000Z"
            });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Clinic not found" });
        expect(Queue.findOne).toHaveBeenCalledWith({ $or: [{ id: "123456789012345678901234" }] });
    });

    test("should add queue entry successfully", async () => {
        const mockAddedQueueEntry = {
            _id: "123456789012345678901234",
            Clinic: "111111111111111111111111",
            Speciality: "222222222222222222222222",
            Patient: "333333333333333333333333",
            BookingDateTime: "2026-05-01T10:30:00.000Z"
        };

        Queue.prototype.save.mockResolvedValue(mockAddedQueueEntry);

        const response = await request(app)
            .post("/api/queues/123456789012345678901234");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: "Successfully joined queue",
            queueEntry: mockAddedQueueEntry
        });

        expect(Queue.prototype.save).toHaveBeenCalledWith({
            Clinic: "111111111111111111111111",
            Speciality: "222222222222222222222222",
            Patient: "333333333333333333333333",
            BookingDateTime: "2026-05-01T10:30:00.000Z"
        });
    });

    test("should return 500 if an error occurs", async () => {
        Queue.prototype.save.mockRejectedValue(new Error("Database failure"));

        const response = await request(app)
            .post("/api/queues/123456789012345678901234");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Server error" });
    });
});