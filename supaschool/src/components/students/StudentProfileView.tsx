import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import {
  User,
  Calendar,
  BookOpen,
  Award,
  Clock,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type DbStudent = Tables<"students">;

interface StudentProfileViewProps {
  studentId: string;
  students: DbStudent[];
  classMap: Record<string, string>;
}

const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  studentId,
  students,
  classMap,
}) => {
  const student = students.find((s) => s.id === studentId);
  const [attendanceRecords, setAttendanceRecords] = useState<
    { id: string; attendance_date: string; status: string; notes: string | null }[]
  >([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    let isMounted = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("attendance_records")
          .select("id, attendance_date, status, notes")
          .eq("student_id", studentId)
          .order("attendance_date", { ascending: false })
          .limit(50);
        if (isMounted) setAttendanceRecords(data ?? []);
      } finally {
        if (isMounted) setAttendanceLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [studentId]);

  if (!student) {
    return <div className="text-muted-foreground">Student not found</div>;
  }

  const className = student.class_id ? classMap[student.class_id] ?? "—" : "—";

  return (
    <div className="space-y-6">
      <Card className="dashboard-card">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <img
                src="/placeholder.svg"
                alt={`${student.first_name} ${student.last_name}`}
              />
            </Avatar>
            <div>
              <CardTitle className="text-2xl">
                {student.first_name} {student.last_name}
              </CardTitle>
              <CardDescription>
                Class {className} | {student.admission_number}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="info">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Personal Info</span>
              </TabsTrigger>
              <TabsTrigger value="attendance" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Attendance</span>
              </TabsTrigger>
              <TabsTrigger value="academics" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Academics</span>
              </TabsTrigger>
              <TabsTrigger value="extracurricular" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>Extracurricular</span>
              </TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="info" className="pt-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Student Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground w-32">Full Name:</span>
                        <span>
                          {student.first_name} {student.last_name}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground w-32">Date of Birth:</span>
                        <span>
                          {student.date_of_birth
                            ? new Date(student.date_of_birth).toLocaleDateString()
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground w-32">NEMIS ID:</span>
                        <span>{student.nemis_id ?? "—"}</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground w-32">Admission #:</span>
                        <span>{student.admission_number}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground w-32">Gender:</span>
                        <span>{student.gender ?? "—"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Guardian Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground w-32">Name:</span>
                        <span>{student.guardian_name ?? "—"}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground w-32">Phone:</span>
                        <span>{student.guardian_phone ?? "—"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Attendance Tab */}
            <TabsContent value="attendance" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attendance Record</CardTitle>
                  <CardDescription>Recent attendance history</CardDescription>
                </CardHeader>
                <CardContent>
                  {attendanceLoading ? (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      Loading attendance…
                    </div>
                  ) : attendanceRecords.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      No attendance records yet.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              {new Date(record.attendance_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {record.status === "present" && (
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                  <span>Present</span>
                                </div>
                              )}
                              {record.status === "absent" && (
                                <div className="flex items-center">
                                  <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                  <span>Absent</span>
                                </div>
                              )}
                              {record.status === "late" && (
                                <div className="flex items-center">
                                  <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                                  <span>Late</span>
                                </div>
                              )}
                              {record.status === "excused" && (
                                <div className="flex items-center">
                                  <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                                  <span>Excused</span>
                                </div>
                              )}
                              {!["present", "absent", "late", "excused"].includes(record.status) && (
                                <span>{record.status}</span>
                              )}
                            </TableCell>
                            <TableCell>{record.notes ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Academics Tab */}
            <TabsContent value="academics" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Academic Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No academic records yet.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Extracurricular Tab */}
            <TabsContent value="extracurricular" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Extracurricular Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No extracurricular activities recorded yet.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProfileView;
