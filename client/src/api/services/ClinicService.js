import {ResourceService} from '../ResourceService';

export class ClinicService extends ResourceService {
    constructor(publicClient, privateClient) {
        super(publicClient, privateClient, '/clinics');
    }

    getFilters(queryParams) {
        return this.pub.get(`${this.basePath}/filters/`, queryParams);
    }

    filterAll(queryParams) {
        return this.pub.get(`${this.basePath}/`, queryParams);
    }

    getById(clinicId) {
        return this.pub.get(`${this.basePath}/${clinicId}`, null);
    }

    getAssigned(auth0Id) {
        return this.priv.get(`${this.basePath}/assigned`, { auth0Id });
    }

    linkAdmin(auth0Id, clinicId, practiceNumber) {
        return this.priv.post(`${this.basePath}/`, { 
            auth0Id: auth0Id, 
            clinicID: clinicId, 
            practiceNumber: practiceNumber 
        }, null);
    }

    updateClinic(clinicId, updates) {
        return this.priv.put(`${this.basePath}/${clinicId}`, updates, null);
    }

    removeStaff(clinicId, staffId) {
        return this.priv.delete(`${this.basePath}/${clinicId}/staff/${staffId}`, null, null);
    }

    listStaff(clinicId) {
        return this.priv.get(`${this.basePath}/${clinicId}/staff`, null);
    }

    linkStaff(clinicId, {auth0Id, id, email}) {
        return this.priv.post(`${this.basePath}/${clinicId}/staff`, {id, email, auth0Id}, null);
    }
    
    getAdmins(clinicId) {
        return this.priv.get(`${this.basePath}/${clinicId}/admins`, null);
    }   
}