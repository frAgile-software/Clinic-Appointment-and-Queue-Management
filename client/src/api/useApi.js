import { useAuth0 } from '@auth0/auth0-react';
import { useMemo } from 'react';

import { ApiClient } from './ApiClient';
import { ClinicService } from './services/ClinicService';
import { UserService } from './services/UserService';
import { QueueService } from './services/QueueService';
import { SpecialityService } from './services/SpecialityService';
import { AppointmentService } from './services/AppointmentService'

export const useApi = () => {
  const { getAccessTokenSilently } = useAuth0();

  return useMemo(() => {
    const getToken = () => getAccessTokenSilently({
      authorizationParams: {
        audience: process.env.REACT_APP_SERVER_URL,
      },
    });

    const pub = new ApiClient(process.env.REACT_APP_SERVER_URL);
    const priv = new ApiClient(`${process.env.REACT_APP_SERVER_URL}/api`, getToken);

    return {
      clinics: new ClinicService(pub, priv),
      users: new UserService(pub, priv),
      // schedules: new ScheduleService(pub, priv),
      appointments: new AppointmentService(pub, priv),
      queues: new QueueService(pub, priv),
      specialities: new SpecialityService(pub, priv),
    };
    
  }, [getAccessTokenSilently]);
};