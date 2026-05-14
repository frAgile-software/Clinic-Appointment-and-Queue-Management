import { ResourceService } from "../ResourceService";
export class NotifService extends ResourceService {
    constructor(pub, priv) {
    super(pub, priv, '/notifs'); // e.g. '/clinics'
    }
    
    getNotifs(userId){
    return this.priv.get(`${this.basePath}/${userId}`, null);
    }

    deleteSeen(userId){
    return this.priv.delete(`${this.basePath}/${userId}`, null);
    }
}