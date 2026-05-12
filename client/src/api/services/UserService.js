import {ResourceService} from '../ResourceService';

export class UserService extends ResourceService {
    constructor(publicClient, privateClient) {
        super(publicClient, privateClient, '/users');
    }

    register({auth0Id, name, surname, title, email, role}) {
        return this.priv.post(`${this.basePath}/register`, {
            auth0Id, name, surname, title, email, role
        }, null);
    }

    update(auth0Id, updates) {
        return this.priv.patch(`${this.basePath}/${auth0Id}`, updates, null);
    }

    get(auth0Id) {
        return this.priv.get(`${this.basePath}/${auth0Id}`, null);
    }

    getByEmail(email, {role}) {
        return this.priv.get(`${this.basePath}/email/${encodeURIComponent(email)}`, {role});
    }
}