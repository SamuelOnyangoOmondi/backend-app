import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchIcon } from "lucide-react";
import { SchoolFilter } from "@/components/shared/SchoolFilter";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import type { Tables } from "@/integrations/supabase/types";
import StudentProfileView from "./StudentProfileView";

type DbStudent = Tables<"students">;

const StudentProfiles = () => {
  const [schoolId, setSchoolId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const { data: students = [], isLoading } = useStudents({
    schoolId,
    search: searchTerm || undefined,
    isActive: true,
  });
  const { data: classes = [] } = useClasses(schoolId || undefined);

  const classMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of classes) m[c.id] = c.name;
    return m;
  }, [classes]);

  const filteredStudents = students;

  return (
    <div className="space-y-6">
      {selectedStudent ? (
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => setSelectedStudent(null)}
            className="mb-4"
          >
            ← Back to Student List
          </Button>
          <StudentProfileView
            studentId={selectedStudent}
            students={students}
            classMap={classMap}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h2 className="text-xl font-semibold">Student Profiles</h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <SchoolFilter
                value={schoolId}
                onValueChange={setSchoolId}
                placeholder="Select school"
                className="w-full sm:w-48"
              />
              <div className="relative w-full sm:w-72">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={!schoolId}
                />
              </div>
            </div>
          </div>

          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Student Directory</CardTitle>
            </CardHeader>
            <CardContent>
              {!schoolId ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Select a school to view students.
                </div>
              ) : isLoading ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Loading students...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Admission #</TableHead>
                      <TableHead>NEMIS ID</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                    <TableBody>
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">
                              {student.first_name} {student.last_name}
                            </TableCell>
                            <TableCell>{student.admission_number}</TableCell>
                            <TableCell>{student.nemis_id ?? "-"}</TableCell>
                            <TableCell>
                              {student.class_id ? classMap[student.class_id] ?? "-" : "-"}
                            </TableCell>
                            <TableCell>
                              {student.gender
                                ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1)
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedStudent(student.id)}
                              >
                                View Profile
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {searchTerm
                              ? `No students found matching "${searchTerm}"`
                              : "No students in this school. Add students in Manage Students."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default StudentProfiles;
