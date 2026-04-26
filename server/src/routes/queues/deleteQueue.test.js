const request = require("supertest");
const express = require("express");

const deleteQueueRouter = require("./deleteQueue");
const Queue = require("../../database/models/Queue");

jest.mock("../../database/models/Queue");

const app = express();
app.use(express.json());
app.use("/api/queues", deleteQueueRouter);

describe("DELETE /api/queues/:queueId", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return 400 if queue ID is invalid", async () => {
        const response = await request(app)
            .delete("/api/queues/invalid-id");

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Invalid queue ID" });
    });

    test("should return 404 if queue entry does not exist", async () => {
        Queue.findByIdAndDelete.mockResolvedValue(null);

        const response = await request(app)
            .delete("/api/queues/123456789012345678901234");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Queue entry not found" });
        expect(Queue.findByIdAndDelete).toHaveBeenCalledWith("123456789012345678901234");
    });

    test("should delete queue entry successfully", async () => {
        const mockDeletedQueueEntry = {
            _id: "123456789012345678901234",
            Clinic: "111111111111111111111111",
            Speciality: "222222222222222222222222",
            Patient: "333333333333333333333333",
            BookingDateTime: "2026-05-01T10:30:00.000Z"
        };

        Queue.findByIdAndDelete.mockResolvedValue(mockDeletedQueueEntry);

        const response = await request(app)
            .delete("/api/queues/123456789012345678901234");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: "Queue entry deleted successfully.",
            queueEntry: mockDeletedQueueEntry
        });

        expect(Queue.findByIdAndDelete).toHaveBeenCalledWith("123456789012345678901234");
    });

    test("should return 500 if an error occurs", async () => {
        Queue.findByIdAndDelete.mockRejectedValue(new Error("Database failure"));

        const response = await request(app)
            .delete("/api/queues/123456789012345678901234");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Internal server error" });
    });
});