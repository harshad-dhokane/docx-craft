
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
            <FileText className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900">DocCraft</h1>
            <p className="text-xs text-gray-500">PDF Generator</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 lg:px-4 overflow-y-auto" style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <style>
          {`
            .sidebar-content::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>
        <div className="sidebar-content">
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
              Main Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive(item.href)}
                      className="h-10 lg:h-11 rounded-lg transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 data-[active=true]:font-medium"
                    >
                      <a href={item.href} className="flex items-center space-x-2 lg:space-x-3 px-2 lg:px-3">
                        <item.icon className="h-4 w-4 lg:h-5 lg:w-5" />
                        <span className="text-sm">{item.name}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="my-4" />

          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
              Tools & Settings
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {secondaryNavigation.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive(item.href)}
                      className="h-10 lg:h-11 rounded-lg transition-all duration-200 hover:bg-gray-50 hover:text-gray-700 data-[active=true]:bg-gray-100 data-[active=true]:text-gray-700 data-[active=true]:font-medium"
                    >
                      <a href={item.href} className="flex items-center justify-between px-2 lg:px-3">
                        <div className="flex items-center space-x-2 lg:space-x-3">
                          <item.icon className="h-4 w-4 lg:h-5 lg:w-5" />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
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
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-3 lg:p-4 border border-gray-200">
          <div className="flex items-center space-x-2 lg:space-x-3 mb-3 lg:mb-4">
            <Avatar className="h-8 w-8 lg:h-10 lg:w-10 bg-gradient-to-br from-blue-600 to-blue-700">
              <AvatarFallback className="text-white text-xs lg:text-sm font-medium">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.user_metadata?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-900 text-xs lg:text-sm"
            onClick={handleLogout}
          >
            <LogOut className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
