let server;

beforeAll(() => {
    server = require("./index");
});

afterAll((done) => {
    server.close(done);
});

test('Test test', () => {
    const yep = true;
    expect(yep).toBe(true);
});

test('Index exists', () => {
    expect(server).toBeDefined();
});