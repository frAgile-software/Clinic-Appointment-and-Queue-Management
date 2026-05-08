import {ResourceService} from '../ResourceService';

export class QueueService extends ResourceService {
  constructor(pub, priv) {
    super(pub, priv, '/queues'); // e.g. '/clinics'
  }

  getForPatient(patientAuth0Id) {
    return this.priv.get(`${this.basePath}/patient/${patientAuth0Id}`, null);
  }

  addPatient(clinicId, patientId, specialityName) {
    return this.pub.post(`${this.basePath}/`, {clinicId, specialityName, auth0Id});
  }

  remove(queueId) {
    return this.priv.delete(`${this.basePath}/${queueId}`, null, null);
  }

  update(queueId, {clinicId, specialityId, patientId}) {
    return this.priv.put(`${this.basePath}/${queueId}`, {clinicId, specialityId, patientId}, null);
  }

  get(clinicId, { auth0Id, userId, specialityIDs }) {
    return this.priv.get(`${this.basePath}/${clinicId}`, {
      auth0Id, 
      userId, 
      specialityIDs: Array.isArray(specialityIDs) ? specialityIDs.join(',') : specialityIDs
    });
  }
}