import { useState } from 'react';
import { useCourses, useCourseStudents } from '@/hooks/useCourses';
import { useCourseAttendanceStats } from '@/hooks/useAttendance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/ui/stat-card';
import { BarChart3, Users, CheckCircle, Clock, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TeacherReports() {
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const { data: courses, isLoading: loadingCourses } = useCourses();
  const { data: stats, isLoading: loadingStats } = useCourseAttendanceStats(selectedCourse || '');
  const { data: students } = useCourseStudents(selectedCourse || '');

  const exportToExcel = () => {
    if (!stats || !students) return;
    
    const course = courses?.find(c => c.id === selectedCourse);
    const data = students.map(enrollment => ({
      'Student Number': enrollment.student?.student_number || 'N/A',
      'Name': enrollment.student?.full_name || 'Unknown',
      'Status': enrollment.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
    XLSX.writeFile(wb, `${course?.code || 'course'}_attendance_report.xlsx`);
  };

  if (loadingCourses) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const lateRate = stats ? Math.round((stats.lateRecords / (stats.totalRecords || 1)) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance Reports</h1>
          <p className="text-muted-foreground">View and export attendance data</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a course..." />
            </SelectTrigger>
            <SelectContent>
              {courses?.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCourse && (
            <Button variant="outline" onClick={exportToExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {!selectedCourse ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a Course</h3>
            <p className="text-muted-foreground text-center">
              Choose a course above to view attendance reports.
            </p>
          </CardContent>
        </Card>
      ) : loadingStats ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="Total Sessions"
              value={stats?.totalSessions || 0}
              icon={<BarChart3 className="h-5 w-5" />}
              description="Sessions conducted"
            />
            <StatCard
              title="Enrolled Students"
              value={students?.length || 0}
              icon={<Users className="h-5 w-5" />}
              description="Active enrollments"
            />
            <StatCard
              title="Avg. Attendance"
              value={`${stats?.averageAttendance || 0}%`}
              icon={<CheckCircle className="h-5 w-5" />}
              description="Average rate"
              className="border-l-4 border-l-success"
            />
            <StatCard
              title="Late Rate"
              value={`${lateRate}%`}
              icon={<Clock className="h-5 w-5" />}
              description="Late arrivals"
              className="border-l-4 border-l-warning"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Enrolled Students
              </CardTitle>
              <CardDescription>
                Students enrolled in this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!students || students.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Students Enrolled</h3>
                  <p className="text-muted-foreground">
                    Share your course code with students to enroll them.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(enrollment => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">
                          {enrollment.student?.student_number || 'N/A'}
                        </TableCell>
                        <TableCell>{enrollment.student?.full_name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                            {enrollment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
