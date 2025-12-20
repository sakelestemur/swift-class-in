import { useStudentCourses } from '@/hooks/useCourses';
import { useStudentAttendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { StatCard } from '@/components/ui/stat-card';

export default function AttendanceHistory() {
  const { data: courses, isLoading: loadingCourses } = useStudentCourses();
  const { data: attendance, isLoading: loadingAttendance } = useStudentAttendance();

  const stats = {
    total: attendance?.length || 0,
    present: attendance?.filter(a => !a.is_late).length || 0,
    late: attendance?.filter(a => a.is_late).length || 0,
    percentage: attendance?.length ? 100 : 0,
  };

  if (loadingCourses || loadingAttendance) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance History</h1>
        <p className="text-muted-foreground">View your attendance records</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Sessions"
          value={stats.total}
          icon={<Calendar className="h-5 w-5" />}
          description="Sessions attended"
        />
        <StatCard
          title="On Time"
          value={stats.present}
          icon={<CheckCircle className="h-5 w-5" />}
          description="Present on time"
          className="border-l-4 border-l-success"
        />
        <StatCard
          title="Late"
          value={stats.late}
          icon={<Clock className="h-5 w-5" />}
          description="Arrived late"
          className="border-l-4 border-l-warning"
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats.percentage}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          description="Overall attendance"
          className="border-l-4 border-l-primary"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance Records
          </CardTitle>
          <CardDescription>
            Detailed view of all your attendance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!attendance || attendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Attendance Records</h3>
              <p className="text-muted-foreground text-center">
                You haven't marked any attendance yet. Scan a QR code to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Time Marked</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {format(new Date(record.marked_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {record.session?.course?.code}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {record.session?.course?.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(record.marked_at), 'hh:mm a')}
                    </TableCell>
                    <TableCell>
                      {record.is_late ? (
                        <Badge variant="outline" className="text-warning border-warning">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Late
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-success border-success">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          On Time
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
