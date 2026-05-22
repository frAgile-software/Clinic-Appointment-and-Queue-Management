import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from '../api/useApi';

const UserRoleContext = createContext(null);

export function UserRoleProvider({children}) {
    const {user, isAuthenticated, isLoading} = useAuth0();
    const api = useApi();
    const [role, setRole] = useState(null);
    const [roleLoading, setRoleLoading] = useState(true);

    const fetchRole = useCallback(async () => {
        if (!isAuthenticated || !user?.sub) return;
        setRoleLoading(true);
        try {
            const data = await api.users.get(user.sub);
            setRole(data.role);
        } catch (error) {
            console.log("Failed to fetch user role:", error);
        } finally {
            setRoleLoading(false);
        }
    }, [isAuthenticated, user, api]);

    useEffect(() => {
        if (isLoading) return;
        
        if (!isAuthenticated || !user?.sub) {
            setRoleLoading(false);
            return;
        }

        fetchRole();
    }, [isLoading, isAuthenticated, user, fetchRole]);

    return (
        <UserRoleContext.Provider value={{role, roleLoading, refreshRole: fetchRole}}>
            {children}
        </UserRoleContext.Provider>
    );
}

export const useUserRole = () => useContext(UserRoleContext);