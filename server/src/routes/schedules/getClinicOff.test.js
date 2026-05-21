const request = require("supertest");
const express = require("express");

const getClinicOffRouter = require("./getClinicOff");
const Clinic = require("../../database/models/Clinic");
const OffDays = require("../../database/models/OffDays");

jest.mock("../../database/models/Clinic");
jest.mock("../../database/models/OffDays");

const app = express();
app.use(express.json());
app.use("/api/schedules/off-days/bulk", getClinicOffRouter);

const CLINIC_ID = "clinic123";
const STAFF_IDS = ["staff1", "staff2"];

const mockOffDays = [
    { _id: "offday1", staff_id: "staff1", date: "2026-06-01T12:00:00.000Z" },
    { _id: "offday2", staff_id: "staff2", date: "2026-06-05T12:00:00.000Z" },
];

describe("GET /api/schedules/off-days/bulk/:clinicId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => { });
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    it("should return 404 if clinic is not found", async () => {
        Clinic.exists.mockResolvedValue(null);

        const response = await request(app)
            .get(`/api/schedules/off-days/bulk/${CLINIC_ID}`)
            .query({ staffIDs: STAFF_IDS.join(",") });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Clinic not found." });
        expect(Clinic.exists).toHaveBeenCalledWith({ _id: CLINIC_ID });
    });

    it("should return 200 with off days for given staffIDs", async () => {
        Clinic.exists.mockResolvedValue({ _id: CLINIC_ID });
        OffDays.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockOffDays),
        });

        const response = await request(app)
            .get(`/api/schedules/off-days/bulk/${CLINIC_ID}`)
            .query({ staffIDs: STAFF_IDS.join(",") });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ clinicOffDays: mockOffDays });
        expect(OffDays.find).toHaveBeenCalledWith(
            expect.objectContaining({ staff_id: { $in: STAFF_IDS } })
        );
    });

    it("should return 200 with an empty array if no off days exist", async () => {
        Clinic.exists.mockResolvedValue({ _id: CLINIC_ID });
        OffDays.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([]),
        });

        const response = await request(app)
            .get(`/api/schedules/off-days/bulk/${CLINIC_ID}`)
            .query({ staffIDs: STAFF_IDS.join(",") });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ clinicOffDays: [] });
    });

    it("should default to staffIDs as empty array when not provided", async () => {
        Clinic.exists.mockResolvedValue({ _id: CLINIC_ID });
        OffDays.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([]),
        });

        const response = await request(app)
            .get(`/api/schedules/off-days/bulk/${CLINIC_ID}`);

        expect(response.status).toBe(200);
        expect(OffDays.find).toHaveBeenCalledWith(
            expect.objectContaining({ staff_id: { $in: [] } })
        );
    });

    it("should apply date range filter when both _fromdate and _todate are provided", async () => {
        Clinic.exists.mockResolvedValue({ _id: CLINIC_ID });
        OffDays.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockOffDays),
        });

        const fromDate = "2026-06-01";
        const toDate = "2026-06-31";

        const response = await request(app)
            .get(`/api/schedules/off-days/bulk/${CLINIC_ID}`)
            .query({ staffIDs: STAFF_IDS.join(","), _fromdate: fromDate, _todate: toDate });

        expect(response.status).toBe(200);
        expect(OffDays.find).toHaveBeenCalledWith(
            expect.objectContaining({
                date: {
                    $gte: new Date(fromDate),
                    $lt: new Date(toDate),
                },
            })
        );
    });

    it("should apply only $gte filter when only _fromdate is provided", async () => {
        Clinic.exists.mockResolvedValue({ _id: CLINIC_ID });
        OffDays.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockOffDays),
        });

        const fromDate = "2026-06-01";

        const response = await request(app)
            .get(`/api/schedules/off-days/bulk/${CLINIC_ID}`)
            .query({ staffIDs: STAFF_IDS.join(","), _fromdate: fromDate });

        expect(response.status).toBe(200);
        expect(OffDays.find).toHaveBeenCalledWith(
            expect.objectContaining({
                date: { $gte: new Date(fromDate) },
            })
        );
    });

    it("should apply only $lt filter when only _todate is provided", async () => {
        Clinic.exists.mockResolvedValue({ _id: CLINIC_ID });
        OffDays.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockOffDays),
        });

        const toDate = "2026-06-31";

        const response = await request(app)
            .get(`/api/schedules/off-days/bulk/${CLINIC_ID}`)
            .query({ staffIDs: STAFF_IDS.join(","), _todate: toDate });

        expect(response.status).toBe(200);
        expect(OffDays.find).toHaveBeenCalledWith(
            expect.objectContaining({
                date: { $lt: new Date(toDate) },
            })
        );
    });

    it("should default date filter to $gte: now when no dates are provided", async () => {
        Clinic.exists.mockResolvedValue({ _id: CLINIC_ID });

        const mockSort = jest.fn().mockResolvedValue([]);
        OffDays.find.mockReturnValue({ sort: mockSort });

        const before = new Date();
        const response = await request(app)
            .get(`/api/schedules/off-days/bulk/${CLINIC_ID}`)
            .query({ staffIDs: STAFF_IDS.join(",") });
        const after = new Date();

        expect(response.status).toBe(200);

        const findArg = OffDays.find.mock.calls[0][0];
        expect(findArg.date.$gte).toBeInstanceOf(Date);
        expect(findArg.date.$gte.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(findArg.date.$gte.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("should return results sorted by date ascending", async () => {
        Clinic.exists.mockResolvedValue({ _id: CLINIC_ID });
        const mockSort = jest.fn().mockResolvedValue(mockOffDays);
        OffDays.find.mockReturnValue({ sort: mockSort });

        const response = await request(app)
            .get(`/api/schedules/off-days/bulk/${CLINIC_ID}`)
            .query({ staffIDs: STAFF_IDS.join(",") });

        expect(response.status).toBe(200);
        expect(mockSort).toHaveBeenCalledWith({ date: 1 });
    });

    it("should return 500 if a database error occurs", async () => {
        Clinic.exists.mockRejectedValue(new Error("Database failure"));

        const response = await request(app)
            .get(`/api/schedules/off-days/bulk/${CLINIC_ID}`)
            .query({ staffIDs: STAFF_IDS.join(",") });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });

    it("should return 500 if OffDays.find throws", async () => {
        Clinic.exists.mockResolvedValue({ _id: CLINIC_ID });
        OffDays.find.mockImplementation(() => {
            throw new Error("Query failed");
        });

        const response = await request(app)
            .get(`/api/schedules/off-days/bulk/${CLINIC_ID}`)
            .query({ staffIDs: STAFF_IDS.join(",") });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });
});