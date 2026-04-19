jest.mock('../../database/dbConnect', () => jest.fn(() => Promise.resolve()));

const request = require('supertest');
const app = require('../../index');
const Clinic = require('../../database/models/Clinic');

describe('GET /clinics', () => {

    const mockClinics = [
        {
            "_id": {
                "$oid": "69e395a75404dbfc4a43b47d"
                },
            "province": "NORTH WEST",
            "physicalTown": "BRITS",
            "physicalSuburb": "BRITS",
            "physicalAddress": "62A KERK STREET 0250",
            "practiceName": "BRITS SUBAKUUT HOSPITAAL",
            "practiceType": "49",
            "practiceTypeDescription": "SUB ACUTE FACILITIES",
            "practiceNumber": "1027131",
            "contactNumber": "0122527043",
            "__v": 0
        },
        {
            "_id": {
                "$oid": "69e395a75404dbfc4a43b47e"
                },
            "province": "GAUTENG",
            "physicalTown": "JOHANNESBURG",
            "physicalSuburb": "NORTHCLIFF",
            "physicalAddress": "WHO CARES",
            "practiceName": "MEDICLINIC",
            "practiceType": "58",
            "practiceTypeDescription": "CLINIC",
            "practiceNumber": "5808723",
            "contactNumber": "0214101211",
            "__v": 0
        }
    ];

    afterAll((done) => {
        if (app.listener) {
            app.listener.close(done);
        } else {
            done();
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Basic filtering', () => {

       test('Returns all clinics when no filters', async () => {
            jest.spyOn(Clinic, 'aggregate')
                .mockResolvedValueOnce(mockClinics)
                .mockResolvedValueOnce([{total: 2}]);

            const res = await request(app).get('/clinics');

            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.pagination.total).toBe(2);
        });

        test('filters by name', async () => {
            jest.spyOn(Clinic, 'aggregate')
                .mockResolvedValueOnce([mockClinics[1]])
                .mockResolvedValueOnce([{ total: 1 }]);

            const res = await request(app).get('/clinics?name=medi');

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].practiceName).toBe("MEDICLINIC");
        });

        test("filters by province", async () => {
            jest.spyOn(Clinic, 'aggregate')
                .mockResolvedValueOnce([mockClinics[1]])
                .mockResolvedValueOnce([{ total: 1 }]);

            const res = await request(app).get('/clinics?province=gauteng');

            expect(res.status).toBe(200);
            expect(res.body.data[0].province).toBe("GAUTENG");
        });

        test("filters by town", async () => {
            jest.spyOn(Clinic, 'aggregate')
                .mockResolvedValueOnce([mockClinics[1]])
                .mockResolvedValueOnce([{ total: 1 }]);

            const res = await request(app).get('/clinics?town=johannes');

            expect(res.status).toBe(200);
            expect(res.body.data[0].physicalTown).toBe("JOHANNESBURG");
        });

        test("filters by suburb", async () => {
            jest.spyOn(Clinic, 'aggregate')
                .mockResolvedValueOnce([mockClinics[0]])
                .mockResolvedValueOnce([{ total: 1 }]);

            const res = await request(app).get('/clinics?suburb=brit');

            expect(res.status).toBe(200);
            expect(res.body.data[0].physicalSuburb).toBe("BRITS");
        });

        it("filters by type", async () => {
            jest.spyOn(Clinic, 'aggregate')
                .mockResolvedValueOnce([mockClinics[0]])
                .mockResolvedValueOnce([{ total: 1 }]);

            const res = await request(app).get('/clinics?type=49');

            expect(res.status).toBe(200);
            expect(res.body.data[0].practiceType).toBe("49");
        });

        test("handles multiple filters combined", async () => {
            jest.spyOn(Clinic, 'aggregate')
                .mockResolvedValueOnce([mockClinics[1]])
                .mockResolvedValueOnce([{ total: 1 }]);

            const res = await request(app).get('/clinics?name=medi&province=gauteng');

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });
    });

    describe("Pagination", () => {

        test("returns correct number of results per page", async () => {
            jest.spyOn(Clinic, 'aggregate')
                .mockResolvedValueOnce([mockClinics[0]])
                .mockResolvedValueOnce([{ total: 2 }]);

            const res = await request(app).get('/clinics?_page=1&_page_len=1');

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        test("returns correct pagination metadata", async () => {
            jest.spyOn(Clinic, 'aggregate')
                .mockResolvedValueOnce([mockClinics[0]])
                .mockResolvedValueOnce([{ total: 2 }]);

            const res = await request(app).get('/clinics?_page=1&_page_len=1');

            expect(res.body.pagination).toEqual({
                total: 2,
                page: 1,
                pageLen: 1,
                totalPages: 2,
            });
        });

        test("returns second page of results", async () => {
            jest.spyOn(Clinic, 'aggregate')
                .mockResolvedValueOnce([mockClinics[1]])
                .mockResolvedValueOnce([{ total: 2 }]);

            const res = await request(app).get('/clinics?_page=2&_page_len=1');

            expect(res.status).toBe(200);
            expect(res.body.data[0].practiceName).toBe("MEDICLINIC");
        });

        test("returns empty data array for page beyond total", async () => {
            jest.spyOn(Clinic, 'aggregate')
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([{ total: 2 }]);

            const res = await request(app).get('/clinics?_page=99&_page_len=10');

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(0);
        });

    });

    describe("Sorting", () => {

        test("defaults to practiceName ascending when no sort given", async () => {
            jest.spyOn(Clinic, 'aggregate')
                .mockResolvedValueOnce(mockClinics)
                .mockResolvedValueOnce([{ total: 2 }]);

            const res = await request(app).get('/clinics');

            expect(res.status).toBe(200);
        });

        test("sorts descending when _order=desc", async () => {
            const reversed = [...mockClinics].reverse();

            jest.spyOn(Clinic, 'aggregate')
                .mockResolvedValueOnce(reversed)
                .mockResolvedValueOnce([{ total: 2 }]);

            const res = await request(app).get('/clinics?_orderby=practiceName&_order=desc');

            expect(res.status).toBe(200);
            expect(res.body.data[0].practiceName).toBe("MEDICLINIC");
        });

        test("falls back to practiceName for invalid _orderby", async () => {
            jest.spyOn(Clinic, 'aggregate')
                .mockResolvedValueOnce(mockClinics)
                .mockResolvedValueOnce([{ total: 2 }]);

            const res = await request(app).get('/clinics?_orderby=invalidField');

            expect(res.status).toBe(200);
        });

    });

    describe("Edge cases", () => {

        test("returns empty data and total 0 when no clinics match", async () => {
            jest.spyOn(Clinic, 'aggregate')
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            const res = await request(app).get('/clinics?name=doesnotexist');

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(0);
            expect(res.body.pagination.total).toBe(0);
        });

        test("returns 500 on database error", async () => {
            jest.spyOn(Clinic, 'aggregate').mockRejectedValue(new Error("DB error"));

            const res = await request(app).get('/clinics');

            expect(res.status).toBe(500);
            expect(res.body.message).toBe("Server error.");
        });
    });
});