
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, FileText, Download, Eye } from "lucide-react";

const Analytics = () => {
  const stats = [
    {
      title: "Total Templates",
      value: "24",
      description: "Active templates",
      icon: FileText,
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "PDFs Generated",
      value: "1,234",
      description: "This month",
      icon: Download,
      trend: "+23%",
      trendUp: true,
    },
    {
      title: "Views",
      value: "5,678",
      description: "Template views",
      icon: Eye,
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Users",
      value: "89",
      description: "Active users",
      icon: Users,
      trend: "+5%",
      trendUp: true,
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Track your document generation performance and usage statistics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <stat.icon className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">{stat.description}</p>
                  <div className={`flex items-center text-xs ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.trend}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Monthly Generation Trends
              </CardTitle>
              <CardDescription>
                PDF generation activity over the past 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">Chart visualization coming soon</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popular Templates</CardTitle>
              <CardDescription>Most frequently used templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Invoice Template', 'Contract Template', 'Report Template', 'Letter Template'].map((template, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{template}</span>
                    <div className="flex items-center">
                      <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                        <div 
                          className="h-2 bg-blue-500 rounded-full" 
                          style={{ width: `${100 - index * 20}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{100 - index * 20}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
