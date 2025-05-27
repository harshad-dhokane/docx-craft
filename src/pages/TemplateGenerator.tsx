
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, Download } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FieldTypeSelector from "@/components/form/FieldTypeSelector";
import DocumentPreview from "@/components/preview/DocumentPreview";
import { useTemplates } from "@/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";

const TemplateGenerator = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { templates, generatePDF, isGenerating } = useTemplates();
  const { toast } = useToast();
  const [placeholderData, setPlaceholderData] = useState<Record<string, string>>({});
  const [pdfName, setPdfName] = useState("");

  const template = templates.find(t => t.id === templateId);

  useEffect(() => {
    if (template) {
      // Initialize placeholder data
      const initialData: Record<string, string> = {};
      template.placeholders?.forEach((placeholder: string) => {
        initialData[placeholder] = "";
      });
      setPlaceholderData(initialData);
      
      // Set default PDF name
      setPdfName(`${template.name.replace('.docx', '')}_${new Date().toISOString().split('T')[0]}`);
    }
  }, [template]);

  const handleInputChange = (placeholder: string, value: string) => {
    setPlaceholderData(prev => ({
      ...prev,
      [placeholder]: value
    }));
  };

  const handleGenerate = async () => {
    if (!template || !templateId) return;

    if (!pdfName.trim()) {
      toast({
        title: "Missing Name",
        description: "Please enter a name for the generated PDF",
        variant: "destructive",
      });
      return;
    }

    try {
      await generatePDF({ templateId, placeholderData, pdfName });
      navigate('/dashboard');
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  };

  if (!template) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Template not found</h3>
            <p className="text-gray-600 mb-6">
              The template you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => navigate('/templates')} className="bg-gradient-to-r from-blue-600 to-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Templates
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/templates')}
            className="hover:bg-white/80"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Generate PDF</h1>
            <p className="text-gray-600 mt-1">
              Fill in the template data for "{template.name}"
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Side - Form */}
          <div className="space-y-6">
            {/* Template Info */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>Template Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Name</Label>
                    <p className="font-medium mt-1">{template.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Upload Date</Label>
                    <p className="text-sm mt-1">{new Date(template.upload_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">File Size</Label>
                    <p className="text-sm mt-1">
                      {template.file_size ? (template.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Fields</Label>
                    <p className="text-sm mt-1">{template.placeholders?.length || 0} placeholders</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Fill Template Data</CardTitle>
                <CardDescription>
                  Enter values for each placeholder in your template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PDF Name */}
                <div>
                  <Label htmlFor="pdf-name" className="text-sm font-medium text-gray-700">PDF Name</Label>
                  <Input
                    id="pdf-name"
                    value={pdfName}
                    onChange={(e) => setPdfName(e.target.value)}
                    placeholder="Enter name for generated PDF"
                    className="mt-1"
                  />
                </div>

                {/* Placeholders */}
                {template.placeholders && template.placeholders.length > 0 ? (
                  <div className="space-y-6">
                    <Label className="text-base font-medium text-gray-900">Template Fields</Label>
                    {template.placeholders.map((placeholder: string) => (
                      <FieldTypeSelector
                        key={placeholder}
                        placeholder={placeholder}
                        value={placeholderData[placeholder] || ""}
                        onChange={(value) => handleInputChange(placeholder, value)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No placeholders found in this template</p>
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate PDF
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Live Preview */}
          <div className="lg:sticky lg:top-6">
            <DocumentPreview
              templateName={template.name}
              placeholderData={placeholderData}
              placeholders={template.placeholders || []}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TemplateGenerator;
