const request = require("supertest");
const express = require("express");

const getQueueStatsRouter = require("./getQueueStats");
const Queue = require("../../database/models/Queue");
const Clinic = require("../../database/models/Clinic");

jest.mock("../../database/models/Queue");
jest.mock("../../database/models/Clinic");

const app = express();
app.use(express.json());
app.use("/queues/estimate", getQueueStatsRouter);

describe("GET /queues/estimate/:clinicID", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return 404 if clinic does not exist", async () => {
        Clinic.findById.mockResolvedValue(null);

        const response = await request(app)
            .get("/queues/estimate/mock-clinic-id");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Clinic not found." });
        expect(Clinic.findById).toHaveBeenCalledWith("mock-clinic-id");
    });

    it("should return 400 if referenceDateTime is invalid", async () => {
        const mockClinic = { _id: "mock-clinic-id" };
        Clinic.findById.mockResolvedValue(mockClinic);

        const response = await request(app)
            .get("/queues/estimate/mock-clinic-id?referenceDateTime=invalid-date");

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Invalid referenceDateTime value." });
    });

    it("should return averageWaitTime successfully with data", async () => {
        const mockClinic = { _id: "mock-clinic-id" };
        Clinic.findById.mockResolvedValue(mockClinic);
        Queue.aggregate.mockResolvedValue([{ _id: null, averageWaitTime: 15.5 }]);

        const response = await request(app)
            .get("/queues/estimate/mock-clinic-id?referenceDateTime=2026-05-13T12:00:00.000Z");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ averageWaitTime: 15.5 });
        expect(Clinic.findById).toHaveBeenCalledWith("mock-clinic-id");
        expect(Queue.aggregate).toHaveBeenCalledTimes(1);
    });

    it("should return averageWaitTime as 0 if no data", async () => {
        const mockClinic = { _id: "mock-clinic-id" };
        Clinic.findById.mockResolvedValue(mockClinic);
        Queue.aggregate.mockResolvedValue([]);

        const response = await request(app)
            .get("/queues/estimate/mock-clinic-id?referenceDateTime=2026-05-13T12:00:00.000Z");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ averageWaitTime: 0 });
    });

    it("should handle specialityIDs filter", async () => {
        const mockClinic = { _id: "mock-clinic-id" };
        Clinic.findById.mockResolvedValue(mockClinic);
        Queue.aggregate.mockResolvedValue([{ _id: null, averageWaitTime: 10.0 }]);

        const response = await request(app)
            .get("/queues/estimate/mock-clinic-id?referenceDateTime=2026-05-13T12:00:00.000Z&specialityIDs=mock-spec-id1,mock-spec-id2");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ averageWaitTime: 10.0 });
        expect(Queue.aggregate).toHaveBeenCalledTimes(1);
    });

    it("should handle date range filters (_fromdate and _todate)", async () => {
        const mockClinic = { _id: "mock-clinic-id" };
        Clinic.findById.mockResolvedValue(mockClinic);
        Queue.aggregate.mockResolvedValue([{ _id: null, averageWaitTime: 20.0 }]);

        const response = await request(app)
            .get("/queues/estimate/mock-clinic-id?_fromdate=2026-05-01&_todate=2026-05-15&referenceDateTime=2026-05-13T12:00:00.000Z");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ averageWaitTime: 20.0 });
        expect(Queue.aggregate).toHaveBeenCalledTimes(1);
    });

    it("should return 500 on server error", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });
        Clinic.findById.mockRejectedValue(new Error("Database error"));

        const response = await request(app)
            .get("/queues/estimate/mock-clinic-id");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
        consoleSpy.mockRestore();
    });
});