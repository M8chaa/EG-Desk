import { useState, useEffect, useCallback } from 'react';
import { auth, provider } from '@/lib/firebaseConfig';
import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    error: string | null;
}

export const useAuth = () => {
    const [state, setState] = useState<AuthState>({
        user: null,
        accessToken: null,
        isLoading: true,
        error: null
    });

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const token = await user.getIdToken();
                setState({
                    user,
                    accessToken: token,
                    isLoading: false,
                    error: null
                });
            } else {
                setState({
                    user: null,
                    accessToken: null,
                    isLoading: false,
                    error: null
                });
            }
        });

        return () => unsubscribe();
    }, []);

    const login = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const accessToken = credential?.accessToken;

            if (accessToken) {
                localStorage.setItem('userAccessToken', accessToken);
            }
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to login',
                isLoading: false
            }));
        }
    }, []);

    const logout = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            await auth.signOut();
            localStorage.removeItem('userAccessToken');
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to logout',
                isLoading: false
            }));
        }
    }, []);

    return {
        ...state,
        login,
        logout
    };
}; 