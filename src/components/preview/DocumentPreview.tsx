
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Eye } from "lucide-react";

interface DocumentPreviewProps {
  templateName: string;
  placeholderData: Record<string, string>;
  placeholders: string[];
}

const DocumentPreview = ({ templateName, placeholderData, placeholders }: DocumentPreviewProps) => {
  return (
    <Card className="h-full border-0 shadow-lg bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Eye className="h-5 w-5 text-blue-600" />
          <span>Live Preview</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-800">{templateName}</span>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <div className="bg-white p-4 rounded-md shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 text-center border-b pb-2">
                Document Preview
              </h3>
              
              {placeholders.map((placeholder) => (
                <div key={placeholder} className="mb-4 p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 capitalize">
                      {placeholder.replace(/[_-]/g, ' ')}:
                    </span>
                    <span className="text-xs text-gray-400">
                      {`{{${placeholder}}}`}
                    </span>
                  </div>
                  <div className="min-h-[2rem] p-2 bg-white border rounded text-sm">
                    {placeholderData[placeholder] ? (
                      <span className="text-gray-900">
                        {placeholderData[placeholder]}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">
                        No data entered yet...
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {placeholders.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p>No placeholders found in this template</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          Preview updates as you type
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentPreview;
