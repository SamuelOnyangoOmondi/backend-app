
import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { School } from "@/types/database";
import { toast } from "sonner";
import { EditSchoolProfileModal } from "@/components/dashboard/EditSchoolProfileModal";
import { SchoolTabs } from "@/components/schools/SchoolTabs";
import { supabase } from "@/integrations/supabase/client";

export default function Schools() {
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [school, setSchool] = useState<Partial<School> | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("schools")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(1);
        if (!isMounted) return;
        if (error) {
          console.error(error);
        } else if (data && data.length > 0) {
          setSchool(data[0] as School);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveProfile = async (values: any) => {
    if (!school) return;
    const updates = { ...values, updated_at: new Date().toISOString() };
    const { error } = await supabase
      .from("schools")
      .update(updates)
      .eq("id", school.id);
    if (error) {
      toast.error("Failed to update school profile");
      return;
    }
    setSchool({ ...school, ...updates });
    toast.success("School profile updated successfully");
    setEditMode(false);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 animate-fade-in">
        <div className="flex flex-col gap-2 bg-gradient-purple p-6 rounded-xl shadow-md border border-primary/30">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            My School
          </h1>
          <p className="text-white/80 max-w-2xl">
            Manage your school's profile, facilities, and settings. Keep your school information up to date.
          </p>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-md border border-primary/25 hover:shadow-lg"
          >
            Edit School Profile
          </button>
        </div>
        
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading school data…</div>
        ) : !school ? (
          <div className="p-5 border border-dashed border-gray-300 rounded-xl bg-white text-sm text-gray-500">
            No school data found. Add a row in the <code>schools</code> table in Supabase to manage it here.
          </div>
        ) : (
          <SchoolTabs 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            school={school}
            editMode={editMode}
            setEditMode={setEditMode}
            handleSaveProfile={handleSaveProfile}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
          />
        )}
      </div>
      
      {/* Edit Profile Modal */}
      {school && (
        <EditSchoolProfileModal 
      school={school}
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
        onSave={handleSaveProfile}
      />
      )}
    </DashboardLayout>
  );
}
