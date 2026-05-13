import { ResourceService } from '../ResourceService';

export class PatientLogService extends ResourceService {
    constructor(publicClient, privateClient) {
        super(publicClient, privateClient, '/patientLogs');
    }

    getForAuth0Id(auth0Id) {
        return this.priv.get(`${this.basePath}/${encodeURIComponent(auth0Id)}`);
    }
}