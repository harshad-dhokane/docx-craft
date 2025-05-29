
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Trash2, Calendar, HardDrive, Activity, TrendingUp } from "lucide-react";
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

  const totalSize = generatedPDFs.reduce((acc, pdf) => acc + (pdf.file_size || 0), 0);
  const recentPDFs = generatedPDFs.filter(pdf => {
    const genDate = new Date(pdf.generated_date);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return genDate > weekAgo;
  }).length;

  const stats = [
    {
      title: "Total PDFs",
      value: generatedPDFs.length.toString(),
      description: "Generated documents",
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      title: "Storage Used",
      value: formatFileSize(totalSize),
      description: "Total file size",
      icon: HardDrive,
      color: "bg-green-500",
    },
    {
      title: "This Week",
      value: recentPDFs.toString(),
      description: "Recently generated",
      icon: TrendingUp,
      color: "bg-purple-500",
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-6 lg:py-8">
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
      <div className="py-6 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="page-title">Generated PDFs</h1>
          <p className="page-subtitle mt-2">View and manage all your generated PDF documents.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="card-description">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 ${stat.color} rounded-lg`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="card-title">{stat.value}</div>
                <p className="small-text mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {generatedPDFs.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12 lg:py-16">
              <div className="mb-4">
                <FileText className="h-16 w-16 text-gray-300 mx-auto" />
              </div>
              <h3 className="section-title text-gray-900 mb-2">No PDFs Generated Yet</h3>
              <p className="card-description mb-6 max-w-md mx-auto">
                You haven't generated any PDF documents yet. Start by creating a document from one of your templates.
              </p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <a href="/templates">Browse Templates</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {generatedPDFs.map((pdf) => (
              <Card key={pdf.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-md group">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="card-title truncate">
                        {pdf.name}
                      </CardTitle>
                      <p className="card-description mt-1">
                        From: {pdf.template_name}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                      PDF
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 lg:p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="body-text">
                        {formatDistanceToNow(new Date(pdf.generated_date), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <HardDrive className="h-4 w-4 mr-2 text-green-500" />
                      <span className="body-text">{formatFileSize(pdf.file_size)}</span>
                    </div>
                  </div>
                  
                  {pdf.placeholder_data && Object.keys(pdf.placeholder_data).length > 0 && (
                    <div className="border-t pt-3">
                      <p className="small-text font-medium text-gray-700 mb-2">Template Data:</p>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {Object.entries(pdf.placeholder_data).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="small-text text-gray-600 bg-gray-50 rounded p-1">
                            <span className="font-medium">{key}:</span> {String(value).substring(0, 25)}
                            {String(value).length > 25 && '...'}
                          </div>
                        ))}
                        {Object.keys(pdf.placeholder_data).length > 3 && (
                          <p className="small-text text-gray-500 italic">
                            +{Object.keys(pdf.placeholder_data).length - 3} more fields
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => downloadPDF(pdf.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
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
