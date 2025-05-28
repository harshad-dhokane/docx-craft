
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Upload, Edit, Clock } from "lucide-react";

const Activity = () => {
  const activities = [
    {
      id: 1,
      type: "download",
      description: "Downloaded Invoice Template PDF",
      timestamp: "2 minutes ago",
      icon: Download,
      color: "text-green-600 bg-green-50",
    },
    {
      id: 2,
      type: "generate",
      description: "Generated Contract Document",
      timestamp: "1 hour ago",
      icon: FileText,
      color: "text-blue-600 bg-blue-50",
    },
    {
      id: 3,
      type: "upload",
      description: "Uploaded new template: Report Template",
      timestamp: "3 hours ago",
      icon: Upload,
      color: "text-purple-600 bg-purple-50",
    },
    {
      id: 4,
      type: "edit",
      description: "Modified Letter Template",
      timestamp: "5 hours ago",
      icon: Edit,
      color: "text-orange-600 bg-orange-50",
    },
    {
      id: 5,
      type: "generate",
      description: "Generated Monthly Report",
      timestamp: "1 day ago",
      icon: FileText,
      color: "text-blue-600 bg-blue-50",
    },
    {
      id: 6,
      type: "download",
      description: "Downloaded Certificate Template",
      timestamp: "2 days ago",
      icon: Download,
      color: "text-green-600 bg-green-50",
    },
  ];

  const getActivityBadge = (type: string) => {
    const badges = {
      download: { label: "Download", variant: "default" as const },
      generate: { label: "Generate", variant: "secondary" as const },
      upload: { label: "Upload", variant: "outline" as const },
      edit: { label: "Edit", variant: "destructive" as const },
    };
    return badges[type as keyof typeof badges] || { label: type, variant: "default" as const };
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity</h1>
          <p className="text-gray-600">Track your recent document generation and template activities.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest actions and document generations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`p-2 rounded-lg ${activity.color}`}>
                        <activity.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.description}
                          </p>
                          <Badge variant={getActivityBadge(activity.type).variant}>
                            {getActivityBadge(activity.type).label}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Today's Activity</span>
                  <span className="text-lg font-semibold text-gray-900">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">This Week</span>
                  <span className="text-lg font-semibold text-gray-900">48</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">This Month</span>
                  <span className="text-lg font-semibold text-gray-900">156</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Generate</span>
                  </div>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Download</span>
                  </div>
                  <span className="text-sm font-medium">30%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Upload</span>
                  </div>
                  <span className="text-sm font-medium">15%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Edit</span>
                  </div>
                  <span className="text-sm font-medium">10%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Activity;
