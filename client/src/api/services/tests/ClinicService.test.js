import { ClinicService } from "../ClinicService";
import { ResourceService } from "../../ResourceService";

describe('Inheritance', () => {
    it('should extend ResourceService', async () => {
        expect(ClinicService.prototype).toBeInstanceOf(ResourceService);
    });
});