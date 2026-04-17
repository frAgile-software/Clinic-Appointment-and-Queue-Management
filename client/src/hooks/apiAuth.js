import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';

export const useApiAuth = () => {
    const { getAccessTokenSilently } = useAuth0();

    const apiFetch = useCallback(async (url, options = {}) => {
        const token = await getAccessTokenSilently({
            authorizationParams: {
                audience: `${process.env.REACT_APP_SERVER_URL}`,
            },
        });

        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return response;
    }, [getAccessTokenSilently]);

    return {apiFetch};
}