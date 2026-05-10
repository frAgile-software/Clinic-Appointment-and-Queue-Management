import { UserService } from "../UserService";
import { ResourceService } from "../../ResourceService";

describe('Inheritance', () => {
    it('should extend ResourceService', async () => {
        expect(UserService.prototype).toBeInstanceOf(ResourceService);
    });
});

describe('UserService', () => {
    let service;
    let mockPrivateClient;
    let mockPublicClient;

    beforeEach(() => {
        mockPrivateClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn()};
        mockPublicClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn()};

        service = new UserService(mockPublicClient, mockPrivateClient);
    });

    afterEach(() => jest.clearAllMocks());

    describe('constructor', () => {

        it('should set basePath to /users', async () => {
            expect(service.basePath).toBe('/users');
        });

        it('should assign public and private clients', async () => {
            expect(service.pub).toBe(mockPublicClient);
            expect(service.priv).toBe(mockPrivateClient);
        });
    });

    describe('register', () => {
        const payload = {
            auth0Id: 'auth0|user-123',
            name: 'John',
            surname: 'Doe',
            title: 'Dr',
            email: 'john.doe@example.com',
            role: 'staff',
        };

        it('should call POST on the correct path with the correct body', () => {
            service.register(payload);
            expect(mockPrivateClient.post).toHaveBeenCalledWith(
                '/users/register',
                { auth0Id: payload.auth0Id, name: payload.name, surname: payload.surname,
                  title: payload.title, email: payload.email, role: payload.role },
                null
            );
        });

        it('should pass undefined for any omitted optional fields', () => {
            service.register({ auth0Id: 'auth0|user-123', name: 'John', surname: 'Doe' });
            const body = mockPrivateClient.post.mock.calls[0][1];
            expect(body.auth0Id).toBe('auth0|user-123');
            expect(body.title).toBeUndefined();
            expect(body.email).toBeUndefined();
            expect(body.role).toBeUndefined();
        });
    });

    describe('update', () => {
        it('should call PATCH on the correct path with updates', () => {
            const auth0Id = 'auth0|user-123';
            const updates = { name: 'Jane', title: 'Prof' };
            service.update(auth0Id, updates);
            expect(mockPrivateClient.patch).toHaveBeenCalledWith(
                '/users/auth0|user-123',
                updates,
                null
            );
        });

        it('should forward the updates object without remapping', () => {
            const updates = { name: 'Jane', title: 'Prof' };
            service.update('auth0|user-123', updates);
            const body = mockPrivateClient.patch.mock.calls[0][1];
            expect(body).toBe(updates); // same reference, not a copy
        });
    });

    describe('get', () => {
        it('should call GET on the correct path', () => {
            const auth0Id = 'auth0|user-123';
            service.get(auth0Id);
            expect(mockPrivateClient.get).toHaveBeenCalledWith(
                '/users/auth0|user-123',
                null
            );
        });
    });
});