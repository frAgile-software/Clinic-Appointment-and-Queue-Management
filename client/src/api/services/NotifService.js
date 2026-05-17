import { ResourceService } from "../ResourceService";
export class NotifService extends ResourceService {
    constructor(pub, priv) {
        super(pub, priv, '/notif');
    }
    
    getNotifs(userId){
        return this.priv.get(`${this.basePath}/${userId}`, null);
    }

    deleteSeen(userId){
        return this.priv.delete(`${this.basePath}/${userId}`, null);
    }

    markSeen(userId){
        return this.priv.patch(`${this.basePath}/${userId}`, null);
    }

    createNotif(recipient, message, {time}={}){
        return this.priv.post(this.basePath, {
            recipient: recipient,
            message: message,
            ...(time ? { time } : {})
        });
    }
}
