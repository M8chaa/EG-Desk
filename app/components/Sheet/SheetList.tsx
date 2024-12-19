import { Button } from "@/components/ui/button";
import { useState } from 'react';

interface SheetListProps {
  sheetsFiles: { id: string; name: string; thumbnailLink: string }[];
  orderBy: string;
  setOrderBy: (value: string) => void;
  onSheetClick: (sheetId: string) => void;
  selectedSheet: string | null;
  isLoading: boolean;
  error: string | null;
  onCreateSheet?: () => void;
}

export default function SheetList({ 
  sheetsFiles, 
  orderBy, 
  setOrderBy, 
  onSheetClick, 
  selectedSheet,
  isLoading,
  error,
  onCreateSheet
}: SheetListProps) {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateClick = async () => {
    if (onCreateSheet) {
      setIsCreating(true);
      try {
        await onCreateSheet();
      } finally {
        setIsCreating(false);
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <label htmlFor="orderBy" className="mr-2">Order by:</label>
          <select
            id="orderBy"
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value)}
            className="border rounded p-2"
          >
            <option value="lastOpened">Last Opened</option>
            <option value="lastModified">Last Modified</option>
          </select>
        </div>
        <Button
          onClick={handleCreateClick}
          disabled={isCreating}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          {isCreating ? 'Creating...' : 'Create New Sheet'}
        </Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 auto-rows-max">
          {sheetsFiles.map((file) => (
            <div
              key={file.id}
              className={`google-sheet-card cursor-pointer ${selectedSheet === file.id ? 'border-2 border-blue-500' : ''}`}
              onClick={() => onSheetClick(file.id)}
            >
              <div className="icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 16 16"
                  fill="green"
                  stroke="white"
                  strokeWidth="0.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-500"
                >
                  <path d="M14.222 0H1.778C.8 0 .008.8.008 1.778L0 4.444v9.778C0 15.2.8 16 1.778 16h12.444C15.2 16 16 15.2 16 14.222V1.778C16 .8 15.2 0 14.222 0zm0 7.111h-7.11v7.111H5.332v-7.11H1.778V5.332h3.555V1.778h1.778v3.555h7.111v1.778z" />
                </svg>
                <span className="text-sm font-medium">{file.name}</span>
              </div>
              <div className="thumbnail">
                {file.thumbnailLink ? (
                  <img src={file.thumbnailLink} alt={file.name} />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-500"
                  >
                    <path d="M14.222 0H1.778C.8 0 .008.8.008 1.778L0 4.444v9.778C0 15.2.8 16 1.778 16h12.444C15.2 16 16 15.2 16 14.222V1.778C16 .8 15.2 0 14.222 0zm0 7.111h-7.11v7.111H5.332v-7.11H1.778V5.332h3.555V1.778h1.778v3.555h7.111v1.778z" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 