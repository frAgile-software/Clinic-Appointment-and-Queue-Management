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

    // uses listAssignedClinics in server
    // TODO: should use '/api/clinics/assigned/:staffId'
    getAssignedClinics(auth0Id) {
        return this.priv.get(`${this.basePath}/assigned/`, {auth0Id});
    }

    // TODO: currently createClinic on server. Should be renamed to linkAdmin or something
    // TODO: auth0Id should be in the url route name `/:auth0Id`, not in body
    linkAdmin(auth0Id, clinicId, practiceNumber) {
        return this.priv.post(`${this.basePath}/`, { 
            auth0Id: auth0Id, 
            clinicID: clinicId, 
            practiceNumber: practiceNumber 
        }, null);
    }

    // TODO: should be patch, not put (since can update individual fields)
    updateClinic(clinicId, updates) {
        return this.priv.put(`${this.basePath}/${clinicId}`, updates, null);
    }

    removeStaff(clinicId, staffId) {
        return this.priv.delete(`${this.basePath}/${clinicId}/staff/${staffId}`, null, null);
    }

    listStaff(clinicId) {
        return this.priv.get(`${this.basePath}/${clinicId}/staff`, null);
    }

    /* TODO: auth0Id shouldn't be passed in request body, 
        and can be obtained through auth token 
        `const auth0Id = req.auth.payload.sub;` 
    */
    linkStaff(clinicId, {auth0Id, id, email}) { // usage: api.clinics.linkStaff(clinicId, {auth0Id: 'uhh', id: '123' });
        return this.priv.post(`${this.basePath}/${clinicId}/staff`, {id, email, auth0Id}, null);
    }
}