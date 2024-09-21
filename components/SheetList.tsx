import React from 'react';
import { Button } from "@/components/ui/button";

interface SheetFile {
  id: string;
  name: string;
  thumbnailLink: string;
  mimeType: string;
}

interface SheetListProps {
  orderBy: string;
  setOrderBy: (value: string) => void;
  sheetsFiles: SheetFile[];
  selectedSheet: string | null;
  handleSheetClick: (id: string) => void;
}

const SheetList: React.FC<SheetListProps> = ({
  orderBy,
  setOrderBy,
  sheetsFiles,
  selectedSheet,
  handleSheetClick
}) => {
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.spreadsheet') {
      return (
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
      );
    } else {
      // Excel icon (you can replace this with an appropriate Excel icon)
      return (
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
          <path d="M14.222 0H1.778C.8 0 .008.8.008 1.778L0 4.444v9.778C0 15.2.8 16 1.778 16h12.444C15.2 16 16 15.2 16 14.222V1.778C16 .8 15.2 0 14.222 0zm-3.555 12.444h-8.89V3.556h8.89v8.888z" />
        </svg>
      );
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4">
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 auto-rows-max">
        {sheetsFiles.map((file) => (
          <div
            key={file.id}
            className={`google-sheet-card cursor-pointer ${selectedSheet === file.id ? 'border-2 border-blue-500' : ''}`}
            onClick={() => handleSheetClick(file.id)}
          >
            <div className="icon">
              {getFileIcon(file.mimeType)}
              <span className="text-sm font-medium">{file.name}</span>
            </div>
            <div className="thumbnail">
              {file.thumbnailLink ? (
                <img src={file.thumbnailLink} alt={file.name} />
              ) : (
                getFileIcon(file.mimeType)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SheetList;