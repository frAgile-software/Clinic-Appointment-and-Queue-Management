import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from '../api/useApi';

const UserRoleContext = createContext(null);

// Context providing a user's role (wraps the rendered app for role verification)
export function UserRoleProvider({children}) {
    const {user, isAuthenticated, isLoading} = useAuth0();
    const api = useApi();
    const [role, setRole] = useState(null);
    const [roleLoading, setRoleLoading] = useState(true);

    useEffect(() => {
        if (isLoading) return;
        
        if ( !isAuthenticated || !user?.sub) {
            setRoleLoading(false);
            return;
        };

        const fetchRole = async () => {
            try {
                const data = await api.users.get(user.sub);
                setRole(data.role);
            } catch (error) {
                console.log("Failed to fetch user role:", error);
            } finally {
                setRoleLoading(false);
            }
        };

        fetchRole();
    }, [user, isAuthenticated, isLoading, api]);

    return (
        <UserRoleContext.Provider value={{role, roleLoading}}>
            {children}
        </UserRoleContext.Provider>
    );
}

export const useUserRole = () => useContext(UserRoleContext);