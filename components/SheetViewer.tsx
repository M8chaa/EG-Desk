import { Button } from "@/components/ui/button";
import { XIcon } from "@/components/Icons";

interface SheetViewerProps {
  sheetId: string;
  isExpanded: boolean;
  onClose: () => void;
}

export default function SheetViewer({ sheetId, isExpanded, onClose }: SheetViewerProps) {
  return (
    <div
      className={`absolute inset-0 bg-white flex flex-col transition-all duration-300 ${
        isExpanded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-bold">Sheet {sheetId}</h2>
        <Button variant="outline" size="icon" onClick={onClose}>
          <XIcon className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 p-4">
        <iframe
          src={`https://docs.google.com/spreadsheets/d/${sheetId}/edit?embedded=true`}
          width="100%"
          height="100%"
          frameBorder="0"
        ></iframe>
      </div>
    </div>
  );
}