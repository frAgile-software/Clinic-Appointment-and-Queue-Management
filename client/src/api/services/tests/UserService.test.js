import { UserService } from "../UserService";
import { ResourceService } from "../../ResourceService";

describe('Inheritance', () => {
    it('should extend ResourceService', async () => {
        expect(UserService.prototype).toBeInstanceOf(ResourceService);
    });
});