
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Upload, Edit, Clock, TrendingUp, Calendar, Users } from "lucide-react";
import { useActivity } from "@/hooks/useActivity";
import { formatDistanceToNow } from "date-fns";
import { useMemo } from "react";

const Activity = () => {
  const { activities, isLoading } = useActivity();

  const quickStats = useMemo(() => {
    const today = new Date();
    const todayActivities = activities.filter(activity => {
      const activityDate = new Date(activity.created_at);
      return activityDate.toDateString() === today.toDateString();
    }).length;

    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekActivities = activities.filter(activity => {
      const activityDate = new Date(activity.created_at);
      return activityDate >= thisWeek;
    }).length;

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthActivities = activities.filter(activity => {
      const activityDate = new Date(activity.created_at);
      return activityDate >= thisMonth;
    }).length;

    return [
      { label: "Today's Activity", value: todayActivities.toString(), icon: Clock, color: "from-blue-500 to-blue-600" },
      { label: "This Week", value: weekActivities.toString(), icon: Calendar, color: "from-green-500 to-green-600" },
      { label: "This Month", value: monthActivities.toString(), icon: TrendingUp, color: "from-purple-500 to-purple-600" },
      { label: "Total Activities", value: activities.length.toString(), icon: Users, color: "from-orange-500 to-orange-600" },
    ];
  }, [activities]);

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
        return FileText;
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
    const actionCounts = activities.reduce((acc, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = activities.length;
    if (total === 0) return [];

    return Object.entries(actionCounts).map(([action, count]) => ({
      action,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  }, [activities]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading activities...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
                {activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No activities yet. Start using the app to see your activity history!</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto scrollbar-none">
                    {activities.slice(0, 10).map((activity) => {
                      const ActivityIcon = getActivityIcon(activity.action);
                      return (
                        <div key={activity.id} className="group p-4 sm:p-6 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:shadow-lg">
                          <div className="flex items-start space-x-3 sm:space-x-4">
                            <div className={`p-2 sm:p-3 rounded-xl ${getActivityColor(activity.action)} shadow-md group-hover:shadow-lg transition-all duration-300`}>
                              <ActivityIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                  <p className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-200">
                                    {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} {activity.resource_type || 'item'}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                  </p>
                                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {Object.entries(activity.metadata).slice(0, 2).map(([key, value]) => 
                                        `${key}: ${String(value).substring(0, 20)}`
                                      ).join(', ')}
                                    </p>
                                  )}
                                </div>
                                <Badge className={`${getActivityBadge(activity.action).color} border-0 shadow-sm text-xs sm:text-sm`}>
                                  {getActivityBadge(activity.action).label}
                                </Badge>
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
                    <span className="text-sm sm:text-base font-semibold text-blue-800">Total Activities</span>
                    <span className="text-lg sm:text-xl font-bold text-blue-900">{activities.length}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-700">All recorded actions</p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm sm:text-base font-semibold text-green-800">Recent Actions</span>
                    <span className="text-lg sm:text-xl font-bold text-green-900">{quickStats[1].value}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-green-700">Actions this week</p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-6 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm sm:text-base font-semibold text-purple-800">Today's Activity</span>
                    <span className="text-lg sm:text-xl font-bold text-purple-900">{quickStats[0].value}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-700">Actions performed today</p>
                </div>
              </CardContent>
            </Card>

            {activityDistribution.length > 0 && (
              <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl">Activity Distribution</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Breakdown by action type
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {activityDistribution.map((item, index) => {
                    const colors = ['from-blue-500 to-blue-600', 'from-green-500 to-green-600', 'from-purple-500 to-purple-600', 'from-orange-500 to-orange-600'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div key={item.action} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r ${color} rounded-full mr-2 sm:mr-3 shadow-sm`}></div>
                          <span className="text-sm sm:text-base text-gray-700 font-medium capitalize">{item.action}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-20 sm:w-24 h-2 bg-gray-200 rounded-full mr-2 sm:mr-3">
                            <div className={`h-2 bg-gradient-to-r ${color} rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                          </div>
                          <span className="text-sm sm:text-base font-semibold text-gray-900">{item.percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Activity;
