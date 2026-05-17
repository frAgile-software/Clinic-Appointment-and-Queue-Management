import { ResourceService } from '../ResourceService';

export class ConsultService extends ResourceService {
    constructor(publicClient, privateClient) {
        super(publicClient, privateClient, '/consults');
    }

    getForAuth0Id(auth0Id) {
        return this.priv.get(`${this.basePath}/${encodeURIComponent(auth0Id)}`);
    }
}