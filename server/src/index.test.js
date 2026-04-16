// 1. Mock the database connection to avoid URI errors
jest.mock('./database/dbConnect', () => jest.fn(() => Promise.resolve()));

const request = require('supertest');
const app = require('./index'); // This is your Express app instance

describe('Server Basic Integrity', () => {

    test('GET /api/hello returns 200 and JSON message', async () => {
        // Supertest starts and stops the app on a temporary port automatically
        const res = await request(app).get('/api/hello');
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Hello world!');
    });

    test('The app instance is correctly exported', () => {
        expect(app).toBeDefined();
    });

});