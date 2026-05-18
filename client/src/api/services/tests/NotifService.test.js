import { NotifService } from "../NotifService";
import { ResourceService } from "../../ResourceService";

describe('Inheritance', () => {
    it('should extend ResourceService', () => {
        expect(NotifService.prototype).toBeInstanceOf(ResourceService);
    });
});

describe('NotifService', () => {
    let service;
    let mockPrivateClient;
    let mockPublicClient;

    beforeEach(() => {
        mockPrivateClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() };
        mockPublicClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() };

        service = new NotifService(mockPublicClient, mockPrivateClient);
    });

    afterEach(() => jest.clearAllMocks());

    describe('constructor', () => {
        it('should set basePath to /notif', () => {
            expect(service.basePath).toBe('/notif');
        });

        it('should assign public and private clients', () => {
            expect(service.pub).toBe(mockPublicClient);
            expect(service.priv).toBe(mockPrivateClient);
        });
    });

    describe('getNotifs', () => {
        it('should call priv.get with the correct path', () => {
            service.getNotifs('user-1');
            expect(mockPrivateClient.get).toHaveBeenCalledWith('/notif/user-1', null);
        });
    });

    describe('deleteSeen', () => {
        it('should call priv.delete with the correct path', () => {
            service.deleteSeen('user-1');
            expect(mockPrivateClient.delete).toHaveBeenCalledWith('/notif/user-1', null);
        });
    });

    describe('markSeen', () => {
        it('should call priv.patch with the correct path', () => {
            service.markSeen('user-1');
            expect(mockPrivateClient.patch).toHaveBeenCalledWith('/notif/user-1', null);
        });
    });

    describe('createNotif', () => {
        it('should call priv.post with recipient and message', () => {
            service.createNotif('user-2', 'Hello');
            expect(mockPrivateClient.post).toHaveBeenCalledWith('/notif', {
                recipient: 'user-2',
                message: 'Hello',
            });
        });
    });
});