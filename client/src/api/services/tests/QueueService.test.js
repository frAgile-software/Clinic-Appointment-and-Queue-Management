import { QueueService } from "../QueueService";
import { ResourceService } from "../../ResourceService";

describe('Inheritance', () => {
    it('should extend ResourceService', async () => {
        expect(QueueService.prototype).toBeInstanceOf(ResourceService);
    });
});