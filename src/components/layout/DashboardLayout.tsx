
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-hidden">
        <AppSidebar />
        <SidebarInset className="flex-1 w-full min-w-0">
          <main className="flex-1 w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
            <div className="w-full min-h-screen">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
