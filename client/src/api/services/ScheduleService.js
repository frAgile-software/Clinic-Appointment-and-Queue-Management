import { ResourceService } from '../ResourceService';

export class ScheduleService extends ResourceService {
    constructor(pub, priv) {
        super(pub, priv, '/schedules');
    }

   getSchedule(userId) {
    return this.priv.get(`${this.basePath}/${encodeURIComponent(userId)}`, null);
}


    
    createDefault(staffId, schedules) {
        return this.priv.post(`${this.basePath}/bulk`, {
            userId: staffId,schedules,
        }, null);
    }

delete(scheduleId, staffId) {
  return this.priv.delete(`${this.basePath}/${scheduleId}?staffId=${encodeURIComponent(staffId)}`, null);
}

create({ staffId, DayOfWeek, StartTime, EndTime }) {
    return this.priv.post(this.basePath, { staffId, DayOfWeek, StartTime, EndTime }, null);
}

getOffDays(staffId) {
    return this.priv.get(`${this.basePath}/off-days/${encodeURIComponent(staffId)}`, null);
}

createOffDays(staffId, dates) {
    return this.priv.post(`${this.basePath}/off-days`, { staffId, dates }, null);
}

deleteOffDay(offDayId) {
    return this.priv.delete(`${this.basePath}/off-days/${offDayId}`, null);
}


}