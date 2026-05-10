import { AppointmentService } from "../AppointmentService";
import { ResourceService } from "../../ResourceService";

describe('Inheritance', () => {
    it('should extend ResourceService', async () => {
        expect(AppointmentService.prototype).toBeInstanceOf(ResourceService);
    });
});