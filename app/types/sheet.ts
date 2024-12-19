export interface Sheet {
    id: string;
    name: string;
    thumbnailLink?: string;
}

export interface SheetData {
    rows: Array<Array<string | number | null>>;
    headers: string[];
}

export interface SheetState {
    sheets: Sheet[];
    selectedSheet: string | null;
    sheetData: SheetData | null;
    isLoading: boolean;
    error: string | null;
    orderBy: 'lastOpened' | 'lastModified';
} 