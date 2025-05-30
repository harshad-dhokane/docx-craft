
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Trash2, Calendar, HardDrive, Activity, TrendingUp, Filter } from "lucide-react";
import { useGeneratedPDFs } from "@/hooks/useGeneratedPDFs";
import { formatDistanceToNow } from "date-fns";
import { useState, useMemo } from "react";

const CreatedFiles = () => {
  const { generatedPDFs, isLoading, downloadPDF, deletePDF } = useGeneratedPDFs();
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");

  const filteredFiles = useMemo(() => {
    if (fileTypeFilter === "all") return generatedPDFs;
    
    return generatedPDFs.filter(pdf => {
      const fileName = pdf.name.toLowerCase();
      switch (fileTypeFilter) {
        case "pdf":
          return fileName.includes("pdf") || pdf.file_path.toLowerCase().includes("pdf");
        case "docx":
          return fileName.includes("docx") || fileName.includes("word") || pdf.file_path.toLowerCase().includes("docx");
        case "excel":
          return fileName.includes("xlsx") || fileName.includes("excel") || pdf.file_path.toLowerCase().includes("xlsx");
        default:
          return true;
      }
    });
  }, [generatedPDFs, fileTypeFilter]);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileType = (fileName: string, filePath: string) => {
    const name = fileName.toLowerCase();
    const path = filePath.toLowerCase();
    
    if (name.includes("xlsx") || name.includes("excel") || path.includes("xlsx")) {
      return { type: "Excel", color: "bg-green-100 text-green-700", icon: "📊" };
    } else if (name.includes("docx") || name.includes("word") || path.includes("docx")) {
      return { type: "Word", color: "bg-blue-100 text-blue-700", icon: "📄" };
    } else {
      return { type: "PDF", color: "bg-red-100 text-red-700", icon: "📕" };
    }
  };

  const totalSize = filteredFiles.reduce((acc, pdf) => acc + (pdf.file_size || 0), 0);
  const recentFiles = filteredFiles.filter(pdf => {
    const genDate = new Date(pdf.generated_date);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return genDate > weekAgo;
  }).length;

  const stats = [
    {
      title: "Total Files",
      value: filteredFiles.length.toString(),
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
      value: recentFiles.toString(),
      description: "Recently generated",
      icon: TrendingUp,
      color: "bg-purple-500",
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your created files...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 lg:mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Created Files</h1>
        <p className="text-gray-600 text-sm lg:text-base">View and manage all your generated documents and files.</p>
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

      {/* Filter Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter by type:</span>
          </div>
          <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select file type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Files</SelectItem>
              <SelectItem value="pdf">PDF Files</SelectItem>
              <SelectItem value="docx">Word Documents</SelectItem>
              <SelectItem value="excel">Excel Files</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-gray-600">
          Showing {filteredFiles.length} of {generatedPDFs.length} files
        </p>
      </div>

      {filteredFiles.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="text-center py-12 lg:py-16">
            <div className="mb-4">
              <FileText className="h-16 w-16 text-gray-300 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {fileTypeFilter === "all" ? "No Files Generated Yet" : `No ${fileTypeFilter.toUpperCase()} Files Found`}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {fileTypeFilter === "all" 
                ? "You haven't generated any documents yet. Start by creating a document from one of your templates."
                : `You haven't generated any ${fileTypeFilter.toUpperCase()} files yet.`
              }
            </p>
            {fileTypeFilter !== "all" && (
              <Button 
                variant="outline" 
                onClick={() => setFileTypeFilter("all")}
                className="mr-4"
              >
                Show All Files
              </Button>
            )}
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="/templates">Browse Templates</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredFiles.map((pdf) => {
            const fileType = getFileType(pdf.name, pdf.file_path);
            return (
              <Card key={pdf.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-md group">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                        {pdf.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        From: {pdf.template_name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <span className="text-lg">{fileType.icon}</span>
                      <Badge className={`${fileType.color} border-0`}>
                        {fileType.type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 lg:p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(pdf.generated_date), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <HardDrive className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm text-gray-600">{formatFileSize(pdf.file_size)}</span>
                    </div>
                  </div>
                  
                  {pdf.placeholder_data && Object.keys(pdf.placeholder_data).length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-700 font-medium mb-2">Template Data:</p>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {Object.entries(pdf.placeholder_data).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="text-xs text-gray-600 bg-gray-50 rounded p-1">
                            <span className="font-medium">{key}:</span> {String(value).substring(0, 25)}
                            {String(value).length > 25 && '...'}
                          </div>
                        ))}
                        {Object.keys(pdf.placeholder_data).length > 3 && (
                          <p className="text-xs text-gray-500 italic">
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
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CreatedFiles;
