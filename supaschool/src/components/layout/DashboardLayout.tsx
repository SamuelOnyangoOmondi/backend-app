
import React, { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Header } from "./Header";
import { SectionLabels } from "./SectionLabels";
import { SidebarContainer } from "./SidebarContainer";
import { MainContent } from "./MainContent";
import { useSchools } from "@/hooks/useSchools";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const { theme } = useTheme();
  const { data: schools } = useSchools();

  const firstSchool = schools && schools.length > 0 ? schools[0] : null;

  const schoolData = {
    name: firstSchool?.name ?? "Supa School",
    logo_url: firstSchool?.logo_url ?? "/lovable-uploads/a1e16204-bee3-4c31-b4c6-b4499f745422.png",
    secondary_image_url: firstSchool?.secondary_image_url ?? null,
    primary_color: "#8600cc",
    secondary_color: "#10B981",
    accent_color: "#F59E0B",
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", schoolData.primary_color);
    root.style.setProperty("--secondary", schoolData.secondary_color);
    root.style.setProperty("--accent-yellow", schoolData.accent_color);
    root.style.setProperty("--primary-yellow", schoolData.accent_color);

    return () => {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--secondary");
      root.style.removeProperty("--accent-yellow");
      root.style.removeProperty("--primary-yellow");
    };
  }, [schoolData.primary_color, schoolData.secondary_color, schoolData.accent_color]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <Header schoolData={schoolData} />
      
      <SectionLabels 
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        chatCollapsed={chatCollapsed}
        setChatCollapsed={setChatCollapsed}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <SidebarContainer 
          sidebarCollapsed={sidebarCollapsed}
          chatCollapsed={chatCollapsed}
          setChatCollapsed={setChatCollapsed}
        />
        
        <MainContent>
          {children}
        </MainContent>
      </div>
    </div>
  );
}
