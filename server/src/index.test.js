/**
 * TEST SUITE: Server Integrity
 * Description: Verifies core API availability and server initialization.
 * Mocking: Database connection is mocked to bypass MONGODB_URI requirements during CI.
 */

// 1. Mock database connection BEFORE requiring the server
jest.mock('./database/dbConnect', () => jest.fn(() => Promise.resolve()));

const request = require('supertest');
const app = require('./index'); // This imports the Express app instance

describe('Index Integrity Tests', () => {
    
    /**
     * Clean up: Ensure the server closes after tests finish.
     * This prevents Jest from hanging due to open handles.
     */
    afterAll((done) => {
        if (app && app.close) {
            app.close(done);
        } else {
            done();
        }
    });

    test('GET /api/hello should return 200 and greeting', async () => {
        const res = await request(app).get('/api/hello');
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Hello world!');
    });

    test('Server instance should be defined and exported', () => {
        expect(app).toBeDefined();
    });
});