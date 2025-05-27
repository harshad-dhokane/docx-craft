
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FileText, Download } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
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

    // Validate that all placeholders are filled
    const emptyPlaceholders = template.placeholders?.filter(
      (placeholder: string) => !placeholderData[placeholder]?.trim()
    ) || [];

    if (emptyPlaceholders.length > 0) {
      toast({
        title: "Missing Data",
        description: `Please fill in all placeholders: ${emptyPlaceholders.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    if (!pdfName.trim()) {
      toast({
        title: "Missing Name",
        description: "Please enter a name for the generated PDF",
        variant: "destructive",
      });
      return;
    }

    try {
      await generatePDF(templateId, placeholderData, pdfName);
      toast({
        title: "PDF Generated",
        description: "Your PDF has been generated successfully!",
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  };

  if (!template) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Template not found</h3>
            <p className="text-gray-600 mb-4">
              The template you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => navigate('/templates')}>
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
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/templates')}
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

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Template Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Template Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500">Name</Label>
                  <p className="font-medium">{template.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Upload Date</Label>
                  <p className="text-sm">{new Date(template.upload_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">File Size</Label>
                  <p className="text-sm">
                    {template.file_size ? (template.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Placeholders</Label>
                  <p className="text-sm">{template.placeholders?.length || 0} fields</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Fill Template Data</CardTitle>
                <CardDescription>
                  Enter values for each placeholder in your template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PDF Name */}
                <div>
                  <Label htmlFor="pdf-name">PDF Name</Label>
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
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Template Fields</Label>
                    {template.placeholders.map((placeholder: string) => (
                      <div key={placeholder}>
                        <Label htmlFor={placeholder} className="capitalize">
                          {placeholder.replace(/[_-]/g, ' ')}
                        </Label>
                        <Textarea
                          id={placeholder}
                          value={placeholderData[placeholder] || ""}
                          onChange={(e) => handleInputChange(placeholder, e.target.value)}
                          placeholder={`Enter value for ${placeholder}`}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No placeholders found in this template</p>
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full"
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TemplateGenerator;
