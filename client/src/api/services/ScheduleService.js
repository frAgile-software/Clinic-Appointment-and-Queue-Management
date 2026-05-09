import { ResourceService } from '../ResourceService';

export class ScheduleService extends ResourceService {
    constructor(pub, priv) {
        super(pub, priv, '/schedules');
    }

    getSchedule(userId) {
        return this.priv.get(`${this.basePath}/${userId}`, null);
    }

    update(scheduleId, {Staff, DayOfWeek, StartTime, EndTime}) {
        return this.priv.put(`${this.basePath}/${scheduleId}`, {
            Staff, DayOfWeek, StartTime, EndTime
        }, null);
    }
}