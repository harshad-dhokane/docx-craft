
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Upload, Plus, Calendar, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTemplates } from "@/hooks/useTemplates";
import { useGeneratedPDFs } from "@/hooks/useGeneratedPDFs";

const Dashboard = () => {
  const { templates, isLoading: templatesLoading } = useTemplates();
  const { generatedPDFs, isLoading: pdfsLoading, downloadPDF, deletePDF } = useGeneratedPDFs();

  const handleUploadTemplate = () => {
    window.location.href = "/templates";
  };

  const handleUseTemplate = (templateId: string) => {
    window.location.href = `/templates/${templateId}/generate`;
  };

  const handleDownloadPDF = (pdfId: string) => {
    downloadPDF(pdfId);
  };

  if (templatesLoading || pdfsLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Manage your templates and generated PDFs</p>
          </div>
          <Button
            onClick={handleUploadTemplate}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Template
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}</div>
              <p className="text-xs text-muted-foreground">
                Ready to use
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Generated PDFs</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generatedPDFs.length}</div>
              <p className="text-xs text-muted-foreground">
                Available for download
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {templates.reduce((sum, t) => sum + t.use_count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Templates used
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Templates Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Templates</CardTitle>
            <CardDescription>
              Manage and use your uploaded document templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No templates uploaded yet</p>
                <Button onClick={handleUploadTemplate}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Template
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-md">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(template.upload_date).toLocaleDateString()}
                          </span>
                          <span>Used {template.use_count} times</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.placeholders.slice(0, 3).map((placeholder, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {placeholder}
                            </Badge>
                          ))}
                          {template.placeholders.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.placeholders.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUseTemplate(template.id)}
                    >
                      Use Template
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated PDFs Section */}
        <Card>
          <CardHeader>
            <CardTitle>Generated PDFs</CardTitle>
            <CardDescription>
              Download and manage your generated PDF documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedPDFs.length === 0 ? (
              <div className="text-center py-8">
                <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No PDFs generated yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedPDFs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-red-100 rounded-md">
                        <FileText className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{pdf.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>From: {pdf.template_name}</span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(pdf.generated_date).toLocaleDateString()}
                          </span>
                          {pdf.file_size && (
                            <span>{Math.round(pdf.file_size / 1024)} KB</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(pdf.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePDF(pdf.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
