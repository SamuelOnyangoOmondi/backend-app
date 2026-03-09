
import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SummaryStats } from "@/components/dashboard/SummaryStats";
import { TodayWidgets } from "@/components/dashboard/TodayWidgets";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AIRecommendations } from "@/components/dashboard/AIRecommendations";
import { SchoolInfo } from "@/components/dashboard/SchoolInfo";
import { Facilities } from "@/components/dashboard/Facilities";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import { Contacts } from "@/components/dashboard/Contacts";
import { Announcements } from "@/components/dashboard/Announcements";
import { AIInsightsPanel } from "@/components/dashboard/AIInsightsPanel";
import { useSchools } from "@/hooks/useSchools";
import { useDashboardSnapshot } from "@/hooks/useDashboard";

export default function Index() {
  const today = new Date().toISOString().split("T")[0];
  const { data: schools } = useSchools();
  const { data: snapshot } = useDashboardSnapshot({ date: today });

  const firstSchool = schools && schools.length > 0 ? schools[0] : null;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 animate-fade-in pb-40">
        <div className="flex flex-col gap-2 bg-gradient-primary p-6 rounded-lg shadow-soft border border-primary/10">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Dashboard
          </h1>
          <p className="text-white/80 max-w-2xl">
            View school statistics, important announcements, and AI-powered insights to help manage your school effectively.
          </p>
        </div>

        <div className="col-span-12">
          <TodayWidgets snapshot={snapshot ?? undefined} />
        </div>

        <div className="col-span-12">
          <SummaryStats snapshot={snapshot ?? undefined} schoolCount={schools?.length ?? null} />
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {firstSchool ? (
              <SchoolInfo
                name={firstSchool.name}
                county={firstSchool.county ?? ""}
                totalStudents={firstSchool.total_enrollment ?? 0}
                teacherCount={firstSchool.total_teachers ?? 0}
                classCount={firstSchool.total_classrooms ?? 0}
                location={firstSchool.location ?? ""}
                phone={[firstSchool.phone ?? ""]}
                email={firstSchool.email ?? ""}
                website={firstSchool.website ?? undefined}
              />
            ) : (
              <div className="p-5 border border-dashed border-gray-300 rounded-xl bg-white text-sm text-gray-500">
                No school data yet. Add a school in Supabase to see details here.
              </div>
            )}
            <Facilities />
            <QuickActions />
          </div>

          <div className="col-span-12 lg:col-span-6 space-y-6">
            <AIInsightsPanel />
            <Announcements />
          </div>

          <div className="col-span-12 lg:col-span-3 space-y-6">
            <AIRecommendations />
            <MiniCalendar />
            <Contacts />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
