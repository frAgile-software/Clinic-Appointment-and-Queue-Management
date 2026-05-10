import { ScheduleService } from "../ScheduleService";
import { ResourceService } from "../../ResourceService";

describe('Inheritance', () => {
    it('should extend ResourceService', async () => {
        expect(ScheduleService.prototype).toBeInstanceOf(ResourceService);
    });
});