import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, Download, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import EnhancedFieldTypeSelector from "@/components/form/EnhancedFieldTypeSelector";
import { useTemplates } from "@/hooks/useTemplates";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { generateEnhancedPDF } from "@/utils/enhancedPdfGenerator";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const TemplateGenerator = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { templates, isGenerating } = useTemplates();
  const { user } = useAuth();
  const { toast } = useToast();
  const [placeholderData, setPlaceholderData] = useState<Record<string, string>>({});
  const [pdfName, setPdfName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const template = templates.find(t => t.id === templateId);

  useEffect(() => {
    if (templates.length > 0) {
      setIsLoading(false);
    }
  }, [templates]);

  useEffect(() => {
    if (template) {
      // Initialize placeholder data
      const initialData: Record<string, string> = {};
      template.placeholders?.forEach((placeholder: string) => {
        initialData[placeholder] = "";
      });
      setPlaceholderData(initialData);
      
      // Set default PDF name
      setPdfName(`${template.name.replace(/\.[^/.]+$/, '')}_${new Date().toISOString().split('T')[0]}`);
    }
  }, [template]);

  const handleInputChange = (placeholder: string, value: string) => {
    setPlaceholderData(prev => ({
      ...prev,
      [placeholder]: value
    }));
  };

  const handleFieldTypeSelect = (placeholder: string, value: string) => {
    handleInputChange(placeholder, value);
  };

  const handleGenerateDocument = async (format: 'pdf' | 'docx' | 'xlsx' = 'pdf') => {
    if (!template || !templateId || !user) return;

    // Use a default document name if none is provided
    const documentName = pdfName.trim() || `${template.name.replace(/\.[^/.]+$/, '')}_${new Date().toISOString().split('T')[0]}`;
    setPdfName(documentName);

    try {
      await generateEnhancedPDF({
        templateId: templateId,
        templateName: template.name,
        placeholderData,
        placeholders: template.placeholders || [],
        format,
        userId: user.id
      });

      toast({
        title: "Success",
        description: `Your ${format.toUpperCase()} document has been generated and saved successfully.`,
      });

      // Navigate to created files after successful generation
      setTimeout(() => {
        navigate('/generated-pdfs');
      }, 2000);
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate document. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Templates
        </Button>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !template ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Template Not Found</h3>
              <p className="text-muted-foreground text-center">
                The template you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/templates')}>
                View All Templates
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader className="space-y-6">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Fill in Template Data
                  </CardTitle>
                  <CardDescription>
                    Fill in the template data for "{template.name}"
                  </CardDescription>
                </div>

                {/* Document Name Input */}
                <div>
                  <Label htmlFor="pdfName">Document Name</Label>
                  <div className="flex gap-4">
                    <Input
                      id="pdfName"
                      value={pdfName}
                      onChange={(e) => setPdfName(e.target.value)}
                      placeholder="Enter document name"
                      className="max-w-md"
                    />
                    <div className="flex gap-2">
                      {template.name.endsWith('.xlsx') ? (
                        <Button
                          onClick={() => handleGenerateDocument('xlsx')}
                          disabled={isGenerating}
                          size="default"
                        >
                          {isGenerating ? (
                            "Generating..."
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download Excel
                            </>
                          )}
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={() => handleGenerateDocument('pdf')}
                            disabled={isGenerating}
                            size="default"
                            variant="default"
                          >
                            {isGenerating ? (
                              "Generating..."
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleGenerateDocument('docx')}
                            disabled={isGenerating}
                            size="default"
                            variant="secondary"
                          >
                            {isGenerating ? (
                              "Generating..."
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Download DOCX
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              {template.placeholders && template.placeholders.length > 0 && (
                <CardContent>
                  <Separator className="mb-6" />
                  <ScrollArea className="h-96">
                    <div className="space-y-4 pr-4">
                      {template.placeholders.map((placeholder: string) => (
                        <div key={placeholder} className="space-y-2">
                          <Label htmlFor={placeholder} className="font-medium">
                            {placeholder}
                          </Label>
                          <EnhancedFieldTypeSelector
                            placeholder={placeholder}
                            value={placeholderData[placeholder] || ""}
                            onValueChange={(value) => handleFieldTypeSelect(placeholder, value)}
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TemplateGenerator;
