const request = require("supertest");
const express = require("express");

const updateQueueRouter = require("./updateQueue");
const Queue = require("../../database/models/Queue");
const Clinic = require("../../database/models/Clinic");
const User = require("../../database/models/User");
const Speciality = require("../../database/models/Speciality");

jest.mock("../../database/models/Queue");
jest.mock("../../database/models/Clinic");
jest.mock("../../database/models/User");
jest.mock("../../database/models/Speciality");

const app = express();
app.use(express.json());
app.use("/api/queues", updateQueueRouter);

describe("PUT /api/queues/:queueId", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return 400 if queue ID is invalid", async () => {
        const response = await request(app)
            .put("/api/queues/invalid-id")
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Invalid queue ID" });
    });

    test("should return 404 if queue entry does not exist", async () => {
        Queue.findById.mockResolvedValue(null);

        const response = await request(app)
            .put("/api/queues/123456789012345678901234")
            .send({});

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Queue entry not found" });
        expect(Queue.findById).toHaveBeenCalledWith("123456789012345678901234");
    });

    test("should return 400 if clinic ID is invalid", async () => {
        Queue.findById.mockResolvedValue({
            _id: "123456789012345678901234",
            save: jest.fn()
        });

        const response = await request(app)
            .put("/api/queues/123456789012345678901234")
            .send({ Clinic: "bad-id" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Invalid clinic ID" });
    });

    test("should return 404 if clinic does not exist", async () => {
        Queue.findById.mockResolvedValue({
            _id: "123456789012345678901234",
            save: jest.fn()
        });

        Clinic.findById.mockResolvedValue(null);

        const response = await request(app)
            .put("/api/queues/123456789012345678901234")
            .send({ Clinic: "111111111111111111111111" });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Clinic not found" });
    });

    test("should return 400 if speciality ID is invalid", async () => {
        Queue.findById.mockResolvedValue({
            _id: "123456789012345678901234",
            save: jest.fn()
        });

        const response = await request(app)
            .put("/api/queues/123456789012345678901234")
            .send({ Speciality: "bad-id" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Invalid speciality ID" });
    });

    test("should return 404 if speciality does not exist", async () => {
        Queue.findById.mockResolvedValue({
            _id: "123456789012345678901234",
            save: jest.fn()
        });

        Speciality.findById.mockResolvedValue(null);

        const response = await request(app)
            .put("/api/queues/123456789012345678901234")
            .send({ Speciality: "222222222222222222222222" });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Speciality not found" });
    });

    test("should return 400 if patient ID is invalid", async () => {
        Queue.findById.mockResolvedValue({
            _id: "123456789012345678901234",
            save: jest.fn()
        });

        const response = await request(app)
            .put("/api/queues/123456789012345678901234")
            .send({ Patient: "bad-id" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Invalid patient ID" });
    });

    test("should return 404 if patient does not exist", async () => {
        Queue.findById.mockResolvedValue({
            _id: "123456789012345678901234",
            save: jest.fn()
        });

        User.findById.mockResolvedValue(null);

        const response = await request(app)
            .put("/api/queues/123456789012345678901234")
            .send({ Patient: "333333333333333333333333" });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Patient not found" });
    });

    test("should update queue entry successfully", async () => {
        const updatedQueueEntry = {
            _id: "123456789012345678901234",
            Clinic: "111111111111111111111111",
            Speciality: "222222222222222222222222",
            Patient: "333333333333333333333333",
        };

        const mockQueueEntry = {
            _id: "123456789012345678901234",
            Clinic: "oldClinic",
            Speciality: "oldSpeciality",
            Patient: "oldPatient",
            save: jest.fn().mockResolvedValue(updatedQueueEntry)
        };

        Queue.findById.mockResolvedValue(mockQueueEntry);
        Clinic.findById.mockResolvedValue({ _id: "111111111111111111111111" });
        Speciality.findById.mockResolvedValue({ _id: "222222222222222222222222" });
        User.findById.mockResolvedValue({ _id: "333333333333333333333333" });

        const response = await request(app)
            .put("/api/queues/123456789012345678901234")
            .send({
                Clinic: "111111111111111111111111",
                Speciality: "222222222222222222222222",
                Patient: "333333333333333333333333",
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: "Queue entry updated successfully.",
            queueEntry: updatedQueueEntry
        });

        expect(mockQueueEntry.Clinic).toBe("111111111111111111111111");
        expect(mockQueueEntry.Speciality).toBe("222222222222222222222222");
        expect(mockQueueEntry.Patient).toBe("333333333333333333333333");
        expect(mockQueueEntry.save).toHaveBeenCalled();
    });

    test("should return 500 if an error occurs", async () => {
        Queue.findById.mockRejectedValue(new Error("Database failure"));

        const response = await request(app)
            .put("/api/queues/123456789012345678901234")
            .send({});

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Internal server error" });
    });
});