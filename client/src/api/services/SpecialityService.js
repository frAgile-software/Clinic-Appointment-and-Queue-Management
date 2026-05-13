import {ResourceService} from '../ResourceService';

export class SpecialityService extends ResourceService {
    constructor(publicClient, privateClient) {
        super(publicClient, privateClient, '/specialities');
    }

    
    getAll() {
        return this.pub.get(this.basePath);
    }

    // TODO: should accept a list of specialityIds (maybe in body)
    addToStaff({staffId, specialityId}) {
        return this.priv.post(`${this.basePath}/staff/${staffId}/${specialityId}`, null, null);
    }

    // TODO: maybe should accept a list of specialityIds (maybe in body)
    removeFromStaff({staffId, specialityId}) {
        return this.priv.delete(`${this.basePath}/staff/${staffId}/${specialityId}`, null, null);
    }

    getForStaff(staffId) {
        return this.pub.get(`${this.basePath}/staff/${staffId}`, null);
    }

    getForClinic(clinicId) {
        return this.priv.get(`${this.basePath}/clinic/${clinicId}`, null);
    }
}