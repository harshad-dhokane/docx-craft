
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Trash2, Eye, Calendar, HardDrive } from "lucide-react";
import { useGeneratedPDFs } from "@/hooks/useGeneratedPDFs";
import { formatDistanceToNow } from "date-fns";

const GeneratedPDFs = () => {
  const { generatedPDFs, isLoading, downloadPDF, deletePDF } = useGeneratedPDFs();

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your generated PDFs...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Generated PDFs</h1>
          <p className="text-gray-600">View and manage all your generated PDF documents.</p>
        </div>

        {generatedPDFs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No PDFs Generated Yet</h3>
              <p className="text-gray-600 mb-4">
                You haven't generated any PDF documents yet. Start by creating a document from one of your templates.
              </p>
              <Button asChild>
                <a href="/templates">Browse Templates</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedPDFs.map((pdf) => (
              <Card key={pdf.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                        {pdf.name}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        From: {pdf.template_name}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      PDF
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        {formatDistanceToNow(new Date(pdf.generated_date), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <HardDrive className="h-4 w-4 mr-2" />
                      <span>{formatFileSize(pdf.file_size)}</span>
                    </div>
                  </div>
                  
                  {pdf.placeholder_data && Object.keys(pdf.placeholder_data).length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Template Data:</p>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {Object.entries(pdf.placeholder_data).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="text-xs text-gray-600">
                            <span className="font-medium">{key}:</span> {String(value).substring(0, 30)}
                            {String(value).length > 30 && '...'}
                          </div>
                        ))}
                        {Object.keys(pdf.placeholder_data).length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{Object.keys(pdf.placeholder_data).length - 3} more fields
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => downloadPDF(pdf.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => deletePDF(pdf.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GeneratedPDFs;
