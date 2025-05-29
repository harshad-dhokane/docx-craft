
import { FileText, Home, Settings, User, LogOut, Activity, BarChart3, Download } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

const navigation = [
  { name: "Dashboard", icon: Home, href: "/dashboard" },
  { name: "Templates", icon: FileText, href: "/templates" },
  { name: "Generated PDFs", icon: Download, href: "/generated-pdfs" },
];

const secondaryNavigation = [
  { name: "Analytics", icon: BarChart3, href: "/analytics", badge: "Pro" },
  { name: "Activity", icon: Activity, href: "/activity" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (href: string) => location.pathname === href;

  const getUserInitials = () => {
    const name = user?.user_metadata?.name || user?.email || "";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-4 lg:p-6">
        <div className="flex items-center space-x-2 lg:space-x-3">
          <div className="p-1.5 lg:p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
            <FileText className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">DocCraft</h1>
            <p className="text-sm lg:text-base text-gray-500">PDF Generator</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 lg:px-4 overflow-y-auto scrollbar-none">
        <div>
          <SidebarGroup>
            <SidebarGroupLabel className="text-sm lg:text-base font-semibold text-gray-400 uppercase tracking-wider px-2">
              Main Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive(item.href)}
                      className={`h-12 lg:h-14 rounded-xl transition-all duration-300 text-base lg:text-lg font-medium ${
                        isActive(item.href) 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105' 
                          : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:shadow-md hover:transform hover:scale-102'
                      }`}
                    >
                      <a href={item.href} className="flex items-center space-x-3 lg:space-x-4 px-3 lg:px-4">
                        <item.icon className="h-5 w-5 lg:h-6 lg:w-6" />
                        <span>{item.name}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="my-6" />

          <SidebarGroup>
            <SidebarGroupLabel className="text-sm lg:text-base font-semibold text-gray-400 uppercase tracking-wider px-2">
              Tools & Settings
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {secondaryNavigation.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive(item.href)}
                      className={`h-12 lg:h-14 rounded-xl transition-all duration-300 text-base lg:text-lg font-medium ${
                        isActive(item.href) 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105' 
                          : 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 hover:shadow-md hover:transform hover:scale-102'
                      }`}
                    >
                      <a href={item.href} className="flex items-center justify-between px-3 lg:px-4">
                        <div className="flex items-center space-x-3 lg:space-x-4">
                          <item.icon className="h-5 w-5 lg:h-6 lg:w-6" />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700">
                            {item.badge}
                          </Badge>
                        )}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>

      <SidebarSeparator />
      
      <SidebarFooter className="p-3 lg:p-4">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 lg:p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center space-x-3 lg:space-x-4 mb-4 lg:mb-6">
            <Avatar className="h-10 w-10 lg:h-12 lg:w-12 bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
              <AvatarFallback className="text-white text-sm lg:text-base font-medium">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-base lg:text-lg font-medium text-gray-900 truncate">
                {user?.user_metadata?.name || "User"}
              </p>
              <p className="text-sm lg:text-base text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-900 text-sm lg:text-base h-10 lg:h-12 shadow-md hover:shadow-lg transition-all duration-200"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
