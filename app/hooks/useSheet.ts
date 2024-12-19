import { useState, useCallback } from 'react';
import { Sheet, SheetData, SheetState } from '../types/sheet';

export const useSheet = () => {
    const [state, setState] = useState<SheetState>({
        sheets: [],
        selectedSheet: null,
        sheetData: null,
        isLoading: false,
        error: null,
        orderBy: 'lastOpened'
    });

    const fetchSheets = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const accessToken = localStorage.getItem('userAccessToken');
            if (!accessToken) {
                throw new Error('No access token found');
            }

            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    accessToken, 
                    orderBy: state.orderBy 
                }),
            });

            if (!response.ok) throw new Error('Failed to fetch sheets');

            const sheets = await response.json();
            setState(prev => ({ 
                ...prev, 
                sheets, 
                isLoading: false 
            }));
        } catch (error) {
            setState(prev => ({ 
                ...prev, 
                error: error instanceof Error ? error.message : 'Failed to fetch sheets',
                isLoading: false 
            }));
        }
    }, [state.orderBy]);

    const selectSheet = useCallback((sheetId: string | null) => {
        setState(prev => ({ ...prev, selectedSheet: sheetId }));
    }, []);

    const setOrderBy = useCallback((orderBy: 'lastOpened' | 'lastModified') => {
        setState(prev => ({ ...prev, orderBy }));
    }, []);

    return {
        ...state,
        fetchSheets,
        selectSheet,
        setOrderBy
    };
}; 