
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Upload, Edit, Clock, TrendingUp, Calendar, Activity as ActivityIcon, BarChart3 } from "lucide-react";
import { useActivity } from "@/hooks/useActivity";
import { useGeneratedPDFs } from "@/hooks/useGeneratedPDFs";
import { useTemplates } from "@/hooks/useTemplates";
import { formatDistanceToNow } from "date-fns";
import { useMemo } from "react";

const Activity = () => {
  const { activities, isLoading: activitiesLoading } = useActivity();
  const { generatedPDFs, isLoading: pdfsLoading } = useGeneratedPDFs();
  const { templates, isLoading: templatesLoading } = useTemplates();

  const isLoading = activitiesLoading || pdfsLoading || templatesLoading;

  const getActivityBadge = (action: string) => {
    const badges = {
      download: { label: "Download", variant: "default" as const, color: "bg-green-100 text-green-700" },
      generate: { label: "Generate", variant: "secondary" as const, color: "bg-blue-100 text-blue-700" },
      upload: { label: "Upload", variant: "outline" as const, color: "bg-purple-100 text-purple-700" },
      edit: { label: "Edit", variant: "destructive" as const, color: "bg-orange-100 text-orange-700" },
      create: { label: "Create", variant: "secondary" as const, color: "bg-blue-100 text-blue-700" },
      delete: { label: "Delete", variant: "destructive" as const, color: "bg-red-100 text-red-700" },
    };
    return badges[action as keyof typeof badges] || { label: action, variant: "default" as const, color: "bg-gray-100 text-gray-700" };
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'download':
        return Download;
      case 'generate':
      case 'create':
        return FileText;
      case 'upload':
        return Upload;
      case 'edit':
        return Edit;
      default:
        return ActivityIcon;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'download':
        return "text-green-600 bg-gradient-to-br from-green-50 to-emerald-50";
      case 'generate':
      case 'create':
        return "text-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50";
      case 'upload':
        return "text-purple-600 bg-gradient-to-br from-purple-50 to-pink-50";
      case 'edit':
        return "text-orange-600 bg-gradient-to-br from-orange-50 to-amber-50";
      default:
        return "text-gray-600 bg-gradient-to-br from-gray-50 to-slate-50";
    }
  };

  const activityDistribution = useMemo(() => {
    if (activities.length === 0) return [];

    const actionCounts = activities.reduce((acc, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = activities.length;

    return Object.entries(actionCounts)
      .map(([action, count]) => ({
        action,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [activities]);

  // Dynamic summary stats based on actual user data
  const summaryStats = useMemo(() => {
    return {
      totalActions: activities.length,
      totalTemplates: templates.length,
      totalDocuments: generatedPDFs.length,
      mostCommonAction: activityDistribution.length > 0 ? activityDistribution[0] : null
    };
  }, [activities.length, templates.length, generatedPDFs.length, activityDistribution]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading activities...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen w-full">
        <div className="w-full max-w-none px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Header Section */}
          <div className="w-full">
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2">Activity Center</h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600">Track your recent document generation and template activities.</p>
          </div>

          {/* Quick Stats Cards - Mobile Optimized */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">{summaryStats.totalActions}</p>
                  <p className="text-xs sm:text-sm text-blue-700 font-medium truncate">Today's Activity</p>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-2 bg-green-600 rounded-lg">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900">{summaryStats.totalActions}</p>
                  <p className="text-xs sm:text-sm text-green-700 font-medium truncate">This Week</p>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900">{summaryStats.totalActions}</p>
                  <p className="text-xs sm:text-sm text-purple-700 font-medium truncate">This Month</p>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 p-3 sm:p-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-2 bg-orange-600 rounded-lg">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-900">{summaryStats.totalDocuments}</p>
                  <p className="text-xs sm:text-sm text-orange-700 font-medium truncate">Total Documents</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Grid - Responsive Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
            {/* Recent Activity Feed */}
            <div className="xl:col-span-3">
              <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm h-full">
                <CardHeader className="pb-4 px-4 sm:px-6">
                  <CardTitle className="flex items-center text-base sm:text-lg lg:text-xl">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-2 text-blue-600" />
                    Recent Activity Feed
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm lg:text-base">
                    Your latest actions and document generations
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  {activities.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <ActivityIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 text-base sm:text-lg font-medium">No activities yet</p>
                      <p className="text-gray-500 text-xs sm:text-sm mt-2">Start using the app to see your activity history!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4 max-h-[500px] sm:max-h-[600px] overflow-y-auto">
                      {activities.slice(0, 20).map((activity) => {
                        const ActivityIcon = getActivityIcon(activity.action);
                        return (
                          <div key={activity.id} className="group p-3 sm:p-4 lg:p-6 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:shadow-lg">
                            <div className="flex items-start space-x-3 sm:space-x-4">
                              <div className={`p-2 sm:p-3 rounded-xl ${getActivityColor(activity.action)} shadow-md group-hover:shadow-lg transition-all duration-300 flex-shrink-0`}>
                                <ActivityIcon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-200">
                                        {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} {activity.resource_type || 'item'}
                                      </p>
                                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                      </p>
                                    </div>
                                    <Badge className={`${getActivityBadge(activity.action).color} border-0 shadow-sm text-xs flex-shrink-0`}>
                                      {getActivityBadge(activity.action).label}
                                    </Badge>
                                  </div>
                                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                    <p className="text-xs text-gray-500 truncate">
                                      {Object.entries(activity.metadata).slice(0, 1).map(([key, value]) => 
                                        `${key}: ${String(value).substring(0, 30)}${String(value).length > 30 ? '...' : ''}`
                                      ).join(', ')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Content */}
            <div className="xl:col-span-1 space-y-4 sm:space-y-6">
              {/* Activity Distribution */}
              {activityDistribution.length > 0 && (
                <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                  <CardHeader className="pb-4 px-4 sm:px-6">
                    <CardTitle className="flex items-center text-base sm:text-lg">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
                      Activity Distribution
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Breakdown by action type
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                    {activityDistribution.map((item, index) => {
                      const colors = [
                        'from-blue-500 to-blue-600', 
                        'from-green-500 to-green-600', 
                        'from-purple-500 to-purple-600', 
                        'from-orange-500 to-orange-600',
                        'from-pink-500 to-pink-600'
                      ];
                      const color = colors[index % colors.length];
                      
                      return (
                        <div key={item.action} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center min-w-0 flex-1">
                              <div className={`w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r ${color} rounded-full mr-2 sm:mr-3 flex-shrink-0`}></div>
                              <span className="text-xs sm:text-sm font-medium capitalize text-gray-700 truncate">{item.action}</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                              <span className="text-xs sm:text-sm text-gray-600">{item.count}</span>
                              <span className="text-xs sm:text-sm font-semibold text-gray-900">{item.percentage}%</span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-1.5 sm:h-2 bg-gradient-to-r ${color} rounded-full transition-all duration-500`} 
                              style={{ width: `${Math.min(item.percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
              
              {/* Summary Stats Card */}
              <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                <CardHeader className="pb-4 px-4 sm:px-6">
                  <CardTitle className="text-base sm:text-lg">Activity Summary</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Overview of your usage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <p className="text-xl sm:text-2xl font-bold text-blue-900">{summaryStats.totalActions}</p>
                      <p className="text-xs sm:text-sm text-blue-700 font-medium">Total Actions</p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <p className="text-xl sm:text-2xl font-bold text-green-900">{summaryStats.totalTemplates}</p>
                      <p className="text-xs sm:text-sm text-green-700 font-medium">Templates</p>
                    </div>
                  </div>
                  
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <p className="text-xl sm:text-2xl font-bold text-purple-900">{summaryStats.totalDocuments}</p>
                    <p className="text-xs sm:text-sm text-purple-700 font-medium">Documents Generated</p>
                  </div>
                  
                  {summaryStats.mostCommonAction && (
                    <div className="pt-2">
                      <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Most Common Action:</p>
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                        <span className="text-xs sm:text-sm font-semibold text-orange-800 capitalize truncate">{summaryStats.mostCommonAction.action}</span>
                        <span className="text-xs sm:text-sm font-bold text-orange-900 flex-shrink-0 ml-2">{summaryStats.mostCommonAction.count} times</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Activity;
