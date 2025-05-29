
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Upload, Edit, Clock, TrendingUp, Calendar, Users } from "lucide-react";

const Activity = () => {
  const activities = [
    {
      id: 1,
      type: "download",
      description: "Downloaded Invoice Template PDF",
      timestamp: "2 minutes ago",
      icon: Download,
      color: "text-green-600 bg-gradient-to-br from-green-50 to-emerald-50",
      user: "John Doe",
    },
    {
      id: 2,
      type: "generate",
      description: "Generated Contract Document",
      timestamp: "1 hour ago",
      icon: FileText,
      color: "text-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50",
      user: "Sarah Smith",
    },
    {
      id: 3,
      type: "upload",
      description: "Uploaded new template: Report Template",
      timestamp: "3 hours ago",
      icon: Upload,
      color: "text-purple-600 bg-gradient-to-br from-purple-50 to-pink-50",
      user: "Mike Johnson",
    },
    {
      id: 4,
      type: "edit",
      description: "Modified Letter Template",
      timestamp: "5 hours ago",
      icon: Edit,
      color: "text-orange-600 bg-gradient-to-br from-orange-50 to-amber-50",
      user: "Emily Davis",
    },
    {
      id: 5,
      type: "generate",
      description: "Generated Monthly Report",
      timestamp: "1 day ago",
      icon: FileText,
      color: "text-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50",
      user: "Alex Wilson",
    },
    {
      id: 6,
      type: "download",
      description: "Downloaded Certificate Template",
      timestamp: "2 days ago",
      icon: Download,
      color: "text-green-600 bg-gradient-to-br from-green-50 to-emerald-50",
      user: "Lisa Brown",
    },
    {
      id: 7,
      type: "generate",
      description: "Generated Invoice for Client ABC",
      timestamp: "3 days ago",
      icon: FileText,
      color: "text-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50",
      user: "David Lee",
    },
    {
      id: 8,
      type: "edit",
      description: "Updated Contract Template Layout",
      timestamp: "4 days ago",
      icon: Edit,
      color: "text-orange-600 bg-gradient-to-br from-orange-50 to-amber-50",
      user: "Rachel Green",
    },
  ];

  const getActivityBadge = (type: string) => {
    const badges = {
      download: { label: "Download", variant: "default" as const, color: "bg-green-100 text-green-700" },
      generate: { label: "Generate", variant: "secondary" as const, color: "bg-blue-100 text-blue-700" },
      upload: { label: "Upload", variant: "outline" as const, color: "bg-purple-100 text-purple-700" },
      edit: { label: "Edit", variant: "destructive" as const, color: "bg-orange-100 text-orange-700" },
    };
    return badges[type as keyof typeof badges] || { label: type, variant: "default" as const, color: "bg-gray-100 text-gray-700" };
  };

  const quickStats = [
    { label: "Today's Activity", value: "12", icon: Clock, color: "from-blue-500 to-blue-600" },
    { label: "This Week", value: "48", icon: Calendar, color: "from-green-500 to-green-600" },
    { label: "This Month", value: "156", icon: TrendingUp, color: "from-purple-500 to-purple-600" },
    { label: "Active Users", value: "23", icon: Users, color: "from-orange-500 to-orange-600" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Activity Center</h1>
          <p className="text-base sm:text-lg text-gray-600">Track your recent document generation and template activities.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 sm:p-4 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg`}>
                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
                  Recent Activity Feed
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Your latest actions and document generations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto scrollbar-none">
                  {activities.map((activity) => (
                    <div key={activity.id} className="group p-4 sm:p-6 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:shadow-lg">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className={`p-2 sm:p-3 rounded-xl ${activity.color} shadow-md group-hover:shadow-lg transition-all duration-300`}>
                          <activity.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-200">
                                {activity.description}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                by {activity.user} • {activity.timestamp}
                              </p>
                            </div>
                            <Badge className={`${getActivityBadge(activity.type).color} border-0 shadow-sm text-xs sm:text-sm`}>
                              {getActivityBadge(activity.type).label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Activity Overview</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Performance metrics at a glance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm sm:text-base font-semibold text-blue-800">Peak Hours</span>
                    <span className="text-lg sm:text-xl font-bold text-blue-900">2-4 PM</span>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-700">Highest activity during afternoon hours</p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm sm:text-base font-semibold text-green-800">Avg. Response</span>
                    <span className="text-lg sm:text-xl font-bold text-green-900">1.2s</span>
                  </div>
                  <p className="text-xs sm:text-sm text-green-700">Lightning fast document processing</p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-6 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm sm:text-base font-semibold text-purple-800">Success Rate</span>
                    <span className="text-lg sm:text-xl font-bold text-purple-900">99.2%</span>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-700">Exceptional reliability and uptime</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Activity Distribution</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Breakdown by action type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-2 sm:mr-3 shadow-sm"></div>
                    <span className="text-sm sm:text-base text-gray-700 font-medium">Generate</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-20 sm:w-24 h-2 bg-gray-200 rounded-full mr-2 sm:mr-3">
                      <div className="w-4/5 h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-gray-900">45%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full mr-2 sm:mr-3 shadow-sm"></div>
                    <span className="text-sm sm:text-base text-gray-700 font-medium">Download</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-20 sm:w-24 h-2 bg-gray-200 rounded-full mr-2 sm:mr-3">
                      <div className="w-3/5 h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-gray-900">30%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mr-2 sm:mr-3 shadow-sm"></div>
                    <span className="text-sm sm:text-base text-gray-700 font-medium">Upload</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-20 sm:w-24 h-2 bg-gray-200 rounded-full mr-2 sm:mr-3">
                      <div className="w-2/6 h-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-gray-900">15%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mr-2 sm:mr-3 shadow-sm"></div>
                    <span className="text-sm sm:text-base text-gray-700 font-medium">Edit</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-20 sm:w-24 h-2 bg-gray-200 rounded-full mr-2 sm:mr-3">
                      <div className="w-1/5 h-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-gray-900">10%</span>
                  </div>
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
