
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
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600 text-lg">Manage your templates and generated PDFs</p>
          </div>
          <Button
            onClick={handleUploadTemplate}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Upload Template
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Templates</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{templates.length}</div>
              <p className="text-sm text-gray-500 mt-1">Ready to use</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Generated PDFs</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <Download className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{generatedPDFs.length}</div>
              <p className="text-sm text-gray-500 mt-1">Available for download</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Usage</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Upload className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {templates.reduce((sum, t) => sum + t.use_count, 0)}
              </div>
              <p className="text-sm text-gray-500 mt-1">Templates used</p>
            </CardContent>
          </Card>
        </div>

        {/* Templates Section */}
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-900">Your Templates</CardTitle>
                <CardDescription className="text-gray-600">
                  Manage and use your uploaded document templates
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates uploaded yet</h3>
                <p className="text-gray-500 mb-6">Get started by uploading your first document template</p>
                <Button onClick={handleUploadTemplate} className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Template
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{template.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(template.upload_date).toLocaleDateString()}
                          </span>
                          <span>Used {template.use_count} times</span>
                          <span>{template.placeholders.length} fields</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {template.placeholders.slice(0, 4).map((placeholder, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {placeholder}
                            </Badge>
                          ))}
                          {template.placeholders.length > 4 && (
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                              +{template.placeholders.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => handleUseTemplate(template.id)}
                      className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
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
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-900">Generated PDFs</CardTitle>
                <CardDescription className="text-gray-600">
                  Download and manage your generated PDF documents
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {generatedPDFs.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Download className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No PDFs generated yet</h3>
                <p className="text-gray-500">Use a template to generate your first PDF</p>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedPDFs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-red-100 rounded-xl">
                        <FileText className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{pdf.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
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
                        className="hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePDF(pdf.id)}
                        className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
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
