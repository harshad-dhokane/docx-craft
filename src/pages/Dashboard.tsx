
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Upload, Plus, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  // Mock data - replace with real data from Supabase
  const [templates] = useState([
    {
      id: 1,
      name: "Invoice Template",
      uploadDate: "2024-01-15",
      placeholders: ["{{customerName}}", "{{amount}}", "{{date}}"],
      useCount: 12,
    },
    {
      id: 2,
      name: "Contract Template",
      uploadDate: "2024-01-10",
      placeholders: ["{{clientName}}", "{{startDate}}", "{{endDate}}"],
      useCount: 5,
    },
  ]);

  const [generatedPDFs] = useState([
    {
      id: 1,
      name: "Invoice_Customer_ABC_2024.pdf",
      templateName: "Invoice Template",
      generatedDate: "2024-01-20",
      size: "2.3 MB",
    },
    {
      id: 2,
      name: "Contract_Client_XYZ_2024.pdf",
      templateName: "Contract Template", 
      generatedDate: "2024-01-18",
      size: "1.8 MB",
    },
  ]);

  const handleUploadTemplate = () => {
    // TODO: Navigate to template upload page
    console.log("Navigate to template upload");
  };

  const handleDownloadPDF = (pdfId: number) => {
    // TODO: Implement PDF download from Supabase storage
    console.log("Download PDF:", pdfId);
  };

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
                +2 from last month
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
                +5 from last week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">17</div>
              <p className="text-xs text-muted-foreground">
                PDFs generated this month
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
                          {template.uploadDate}
                        </span>
                        <span>Used {template.useCount} times</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.placeholders.map((placeholder, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {placeholder}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
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
                        <span>From: {pdf.templateName}</span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {pdf.generatedDate}
                        </span>
                        <span>{pdf.size}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPDF(pdf.id)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
