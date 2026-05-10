import { SpecialityService } from "../SpecialityService";
import { ResourceService } from "../../ResourceService";

describe('Inheritance', () => {
    it('should extend ResourceService', async () => {
        expect(SpecialityService.prototype).toBeInstanceOf(ResourceService);
    });
});