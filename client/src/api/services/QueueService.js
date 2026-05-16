import { ResourceService } from "../ResourceService";

export class QueueService extends ResourceService {
  constructor(pub, priv) {
    super(pub, priv, '/queues'); // e.g. '/clinics'
  }

  getForPatient(patientAuth0Id) {
    return this.priv.get(`${this.basePath}/patient/${patientAuth0Id}`, null);
  }

  addPatient(clinicId, {patientId, auth0Id} = {}, specialityName) {
    return this.pub.post(`${this.basePath}/`, {clinicId: clinicId, specialityName: specialityName,  ...(patientId ? { patientId } : { auth0Id })});
  }

  remove(queueId) {
    return this.priv.delete(`${this.basePath}/${queueId}`, null, null);
  }

  update(queueId, { clinicId, specialityId, patientId, status, remarks, timeSeen }) {
    return this.priv.put(`${this.basePath}/${queueId}`, { Clinic: clinicId, Speciality: specialityId, Patient: patientId, Status: status, Remarks: remarks, TimeSeen: timeSeen }, null);
  }

  get(clinicId, { auth0Id, userId, specialityIDs, statuses }) {
    return this.priv.get(`${this.basePath}/${clinicId}`, {
      auth0Id,
      userId,
      specialityIDs: Array.isArray(specialityIDs) ? specialityIDs.join(',') : specialityIDs,
      statuses: Array.isArray(statuses) ? statuses.join(',') : statuses
    });
  }

  getAverageWaitTime(clinicId, { specialityIDs, _fromdate, _todate, _groupby }) {
    const params = {_fromdate, _todate, _groupby};
    if (specialityIDs) params.specialityIDs = Array.isArray(specialityIDs) ? specialityIDs.join(',') : specialityIDs;
    return this.pub.get(`${this.basePath}/estimate/${clinicId}`, params);
  }
}