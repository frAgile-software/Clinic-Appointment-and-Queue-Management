import {ResourceService} from '../ResourceService';

export class AppointmentService extends ResourceService {
    constructor(publicClient, privateClient) {
        super(publicClient, privateClient, '/appointments');
    }

    cancel(appointmentId) {
        return this.priv.patch(`${this.basePath}/${appointmentId}`, null, null);
    }

    // TODO: fix naming in server to stay to one convention
    create({clinicId, staffUserId, patientAuth0Id, bookingDateTime, description, specialityName, rescheduleAppointmentId}) {
        return this.priv.post(`${this.basePath}/`, {
            Clinic: clinicId, 
            Staff: staffUserId, 
            patientAuth0Id: patientAuth0Id, 
            BookingDateTime: bookingDateTime, 
            description: description, 
            Speciality: specialityName,
            rescheduleAppointmentId: rescheduleAppointmentId
        }, null);
    }

    getForAuth0Id(auth0Id, {statuses} = {}) {
        return this.priv.get(`${this.basePath}/${auth0Id}`, {
            statuses: Array.isArray(statuses) ? statuses.join(',') : statuses
        });
    }

    // TODO: include description for updating
    update(appointmentId, {patientUID, staffUID, clinicId, bookingDateTime, specialityId, status, remarks}) {
        return this.priv.put(`${this.basePath}/${appointmentId}`, {
            Patient: patientUID, 
            Staff: staffUID, 
            Clinic: clinicId, 
            BookingDateTime: bookingDateTime,
            Speciality: specialityId,
            Status: status,
            Remarks: remarks,
        }, null)
    }

    summary(clinicId, { date_search_field, _fromdate, _todate, _order, specialityIDs, statuses }) {
        const params = { date_search_field, _fromdate, _todate, _order, specialityIDs, statuses };
        if (specialityIDs) params.specialityIDs = Array.isArray(specialityIDs) ? specialityIDs.join(',') : specialityIDs;
        if (statuses) params.statuses = Array.isArray(statuses) ? statuses.join(',') : statuses;
        return this.priv.get(`${this.basePath}/statistics/${clinicId}`, params);
    }
}