jest.mock('./database/dbConnect', () => jest.fn(() => Promise.resolve()));

const request = require('supertest');
const app = require('./index');

describe('Server Basic Integrity', () => {

    // THIS IS THE CRITICAL ADDITION
    afterAll((done) => {
        if (app.listener) {
            app.listener.close(done); // Close the port handle
        } else {
            done();
        }
    });

    test('Health Check: GET /api/hello returns 200', async () => {
        const res = await request(app).get('/api/hello');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Hello world!');
    });

    test('App instance is properly initialized', () => {
        expect(app).toBeDefined();
    });
});