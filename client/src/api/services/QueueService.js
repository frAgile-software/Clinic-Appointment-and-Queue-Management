class QueueService extends ResourceService {
  constructor(pub, priv) {
    super(pub, priv, '/queues'); // e.g. '/clinics'
  }

  getForPatient() {
    
  }

  addPatient(clinicId, patientId, specialityName) {

  }

  remove() {
    
  }

  update() {

  }

  get(clinicId, { auth0Id, userId, specialityIDs }) {

  }
}