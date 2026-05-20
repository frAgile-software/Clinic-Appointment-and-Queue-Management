const request = require("supertest");
const express = require("express");

const deleteOffDayRouter = require("./deleteOffDay");
const OffDays = require("../../database/models/OffDays");

jest.mock("../../database/models/OffDays");

// mongoose ObjectId validation requires a valid 24-char hex string
jest.mock("mongoose", () => ({
    Types: {
        ObjectId: {
            isValid: jest.fn((id) => /^[a-f\d]{24}$/i.test(id)),
        },
    },
}));

const app = express();
app.use(express.json());
app.use("/api/schedules/off-days", deleteOffDayRouter);

const VALID_ID   = "aaaaaaaaaaaaaaaaaaaaaaaa";
const INVALID_ID = "not-an-id";

describe("DELETE /api/schedules/off-days/:offDayId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    test("should return 400 if the offDayId is not a valid ObjectId", async () => {
        const response = await request(app).delete(`/api/schedules/off-days/${INVALID_ID}`);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Invalid ID." });
        expect(OffDays.findByIdAndDelete).not.toHaveBeenCalled();
    });

    test("should return 404 if the off day document is not found", async () => {
        OffDays.findByIdAndDelete.mockResolvedValue(null);

        const response = await request(app).delete(`/api/schedules/off-days/${VALID_ID}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Off day not found." });
        expect(OffDays.findByIdAndDelete).toHaveBeenCalledWith(VALID_ID);
    });

    test("should return 200 with a success message when the off day is deleted", async () => {
        OffDays.findByIdAndDelete.mockResolvedValue({ _id: VALID_ID });

        const response = await request(app).delete(`/api/schedules/off-days/${VALID_ID}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: "Off day removed." });
        expect(OffDays.findByIdAndDelete).toHaveBeenCalledWith(VALID_ID);
    });

    test("should return 500 if a database error occurs", async () => {
        OffDays.findByIdAndDelete.mockRejectedValue(new Error("Database failure"));

        const response = await request(app).delete(`/api/schedules/off-days/${VALID_ID}`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Server error." });
    });
});