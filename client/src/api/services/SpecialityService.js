import {ResourceService} from '../ResourceService';

export class SpecialityService extends ResourceService {
    constructor(publicClient, privateClient) {
        super(publicClient, privateClient, '/specialities');
    }

    create({ SpecialityName }) {
        return this.priv.post(`${this.basePath}`, { SpecialityName }, null);
    }
  
    getAll() {
        return this.pub.get(`${this.basePath}/`);
    }

    addToStaff({staffId, specialityId}) {
        return this.priv.post(`${this.basePath}/staff/${staffId}/${specialityId}`, null, null);
    }

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