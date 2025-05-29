import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Trash2, Eye, Plus, Activity, Users, Clock } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTemplates } from "@/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import UploadTemplateDialog from "@/components/UploadTemplateDialog";

const Templates = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const { templates, isLoading, uploadTemplate, deleteTemplate } = useTemplates();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a .docx file",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploadLoading(true);
    try {
      uploadTemplate(selectedFile);
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleGeneratePDF = (templateId: string) => {
    navigate(`/templates/${templateId}/generate`);
  };

  const stats = [
    {
      title: "Total Templates",
      value: templates.length.toString(),
      description: "Active templates",
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      title: "Most Used",
      value: templates.length > 0 ? Math.max(...templates.map(t => t.use_count || 0)).toString() : "0",
      description: "Usage count",
      icon: Activity,
      color: "bg-green-500",
    },
    {
      title: "Recently Added",
      value: templates.filter(t => {
        const uploadDate = new Date(t.upload_date);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return uploadDate > weekAgo;
      }).length.toString(),
      description: "This week",
      icon: Clock,
      color: "bg-purple-500",
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-6 lg:py-8">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-6 lg:py-8">
        <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Templates</h1>
            <p className="text-gray-600 text-sm lg:text-base">Create and manage your document templates for PDF generation.</p>
          </div>
          <UploadTemplateDialog>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg px-6 py-3 text-base">
              <Plus className="h-5 w-5 mr-2" />
              Upload New Template
            </Button>
          </UploadTemplateDialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 ${stat.color} rounded-lg`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upload Section */}
        <Card className="mb-6 lg:mb-8 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Upload className="h-5 w-5 text-blue-600" />
              <span>Upload New Template</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Upload a .docx file to create a new template
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 lg:p-6 space-y-4">
            <div>
              <Label htmlFor="file-upload" className="text-sm font-medium text-gray-700">Select DOCX File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".docx"
                onChange={handleFileSelect}
                className="mt-1 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors"
              />
            </div>
            
            {selectedFile && (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <span className="text-sm font-medium text-gray-800">{selectedFile.name}</span>
                    <Badge variant="outline" className="ml-2 bg-white">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploadLoading}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {uploadLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12 lg:py-16">
              <div className="mb-4">
                <FileText className="h-16 w-16 text-gray-300 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Upload your first DOCX template to get started with creating beautiful PDF documents
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-md group">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate text-gray-800">{template.name}</span>
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Uploaded {new Date(template.upload_date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 lg:p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Activity className="h-4 w-4 mr-2 text-green-500" />
                      <span>Used {template.use_count || 0} times</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      <span>{template.file_size ? (template.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}</span>
                    </div>
                  </div>
                  
                  {template.placeholders && template.placeholders.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Placeholders:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.placeholders.slice(0, 3).map((placeholder: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                            {placeholder}
                          </Badge>
                        ))}
                        {template.placeholders.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.placeholders.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <Button
                      onClick={() => handleGeneratePDF(template.id)}
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Generate
                    </Button>
                    <Button
                      onClick={() => deleteTemplate(template.id)}
                      variant="outline"
                      size="sm"
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
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

export default Templates;
