import React from 'react';
import { Button } from "@/components/ui/button";
import { XIcon } from '@/components/Icons';

interface SheetViewerProps {
  selectedSheet: string;
  isExpanded: boolean;
  handleCloseSheet: () => void;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  handleIframeLoad: () => void;
}

const SheetViewer: React.FC<SheetViewerProps> = ({
  selectedSheet,
  isExpanded,
  handleCloseSheet,
  iframeRef,
  handleIframeLoad
}) => {
  return (
    <div
      className={`absolute inset-0 bg-white flex flex-col transition-all duration-300 ${
        isExpanded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-bold">Sheet {selectedSheet}</h2>
        <Button variant="outline" size="icon" onClick={handleCloseSheet}>
          <XIcon className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 p-4">
        <iframe
          ref={iframeRef}
          src={`https://docs.google.com/spreadsheets/d/${selectedSheet}/edit?embedded=true`}
          width="100%"
          height="100%"
          frameBorder="0"
          onLoad={handleIframeLoad}
        ></iframe>
      </div>
    </div>
  );
};

export default SheetViewer;