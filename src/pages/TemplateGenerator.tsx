
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, Download } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import EnhancedFieldTypeSelector from "@/components/form/EnhancedFieldTypeSelector";
import RealDocumentPreview from "@/components/preview/RealDocumentPreview";
import { useTemplates } from "@/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";
import { generateEnhancedPDF } from "@/utils/enhancedPdfGenerator";

const TemplateGenerator = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { templates, isGenerating } = useTemplates();
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

  const handleGenerateEnhancedPDF = async () => {
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
      // Generate PDF using enhanced generator
      const pdfBlob = generateEnhancedPDF({
        templateName: template.name,
        placeholderData,
        placeholders: template.placeholders || []
      });

      // Download the PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pdfName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF Generated",
        description: "Your PDF has been generated and downloaded successfully.",
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
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
            <h1 className="text-3xl font-bold text-gray-900">Generate Document</h1>
            <p className="text-gray-600 mt-1">
              Fill in the template data for "{template.name}"
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-5">
          {/* Left Side - Form */}
          <div className="space-y-6 lg:col-span-1 xl:col-span-2">
            {/* Template Info */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>Template Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Template Name</Label>
                    <p className="font-medium mt-1 text-sm">{template.name}</p>
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
              <CardHeader className="pb-4">
                <CardTitle>Document Data</CardTitle>
                <CardDescription>
                  Enter values for each field in your template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PDF Name */}
                <div>
                  <Label htmlFor="pdf-name" className="text-sm font-semibold text-gray-700">Document Name</Label>
                  <Input
                    id="pdf-name"
                    value={pdfName}
                    onChange={(e) => setPdfName(e.target.value)}
                    placeholder="Enter name for generated document"
                    className="mt-2"
                  />
                </div>

                {/* Placeholders */}
                {template.placeholders && template.placeholders.length > 0 ? (
                  <div className="space-y-4">
                    <Label className="text-base font-semibold text-gray-900">Template Fields</Label>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {template.placeholders.map((placeholder: string) => (
                        <EnhancedFieldTypeSelector
                          key={placeholder}
                          placeholder={placeholder}
                          value={placeholderData[placeholder] || ""}
                          onChange={(value) => handleInputChange(placeholder, value)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No placeholders found in this template</p>
                  </div>
                )}

                <Button
                  onClick={handleGenerateEnhancedPDF}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Generating Document...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate & Download PDF
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Live Preview */}
          <div className="lg:col-span-1 xl:col-span-3">
            <div className="sticky top-6">
              <RealDocumentPreview
                templateName={template.name}
                placeholderData={placeholderData}
                placeholders={template.placeholders || []}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TemplateGenerator;
