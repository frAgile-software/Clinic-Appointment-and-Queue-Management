import Speciality from '../../../../server/src/database/models/Speciality';
import {ResourceService} from '../ResourceService';

export class ClinicService extends ResourceService {
    constructor(publicClient, privateClient) {
        super(publicClient, privateClient, '/appointments');
    }

    cancel(appointmentId) {
        return this.priv.delete(`${this.basePath}/${appointmentId}`, null, null);
    }

    // TODO: fix naming in server to stay to one convention
    create({clinicId, staffUserId, patientAuth0Id, bookingDateTime, description, specialityName}) {
        return this.priv.post(`${this.basePath}/`, {
            Clinic: clinicId, 
            Staff: staffUserId, 
            patientAuth0Id: patientAuth0Id, 
            BookingDateTime: bookingDateTime, 
            description: description, 
            Speciality: specialityName
        }, null);
    }

    getForAuth0Id({auth0Id}) {
        return this.priv.get(`${this.basePath}/${auth0Id}`, null);
    }

    update(appointmentId, {patientUID, staffUID, clinicId, bookingDateTime, specialityId}) {
        return this.priv.put(`${this.basePath}/${appointmentId}`, {
            Patient: patientUID, 
            Staff: staffUID, 
            Clinic: clinicId, 
            BookingDateTime: bookingDateTime,
            Speciality: specialityId,
        }, null)
    }
}