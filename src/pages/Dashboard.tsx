import { useAuth } from '@/contexts/AuthContext';
import { useStudentCourses } from '@/hooks/useCourses';
import { useStudentAttendance } from '@/hooks/useAttendance';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QRScanner } from '@/components/qr/QRScanner';
import { BookOpen, CheckCircle2, Clock, QrCode, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { profile, role } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const { data: enrollments } = useStudentCourses();
  const { data: attendanceRecords } = useStudentAttendance();

  const totalCourses = enrollments?.length || 0;
  const totalAttendance = attendanceRecords?.length || 0;
  const lateCount = attendanceRecords?.filter(r => r.is_late).length || 0;
  const onTimeRate = totalAttendance > 0 ? Math.round(((totalAttendance - lateCount) / totalAttendance) * 100) : 100;

  if (role === 'student') {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Welcome back, {profile?.full_name?.split(' ')[0]}!</h1>
          <p className="page-description">Track your attendance and stay on top of your classes</p>
        </div>

        {/* Quick Action */}
        <Card className="gradient-primary text-primary-foreground overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Mark Your Attendance</h2>
              <p className="opacity-90">Scan the QR code displayed by your teacher</p>
            </div>
            <Button size="lg" variant="secondary" onClick={() => setShowScanner(true)} className="gap-2">
              <QrCode className="h-5 w-5" />
              Scan QR
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Enrolled Courses" value={totalCourses} icon={<BookOpen className="h-5 w-5" />} variant="primary" />
          <StatCard title="Total Attendance" value={totalAttendance} icon={<CheckCircle2 className="h-5 w-5" />} variant="success" />
          <StatCard title="Late Arrivals" value={lateCount} icon={<Clock className="h-5 w-5" />} variant="warning" />
          <StatCard title="On-Time Rate" value={`${onTimeRate}%`} icon={<TrendingUp className="h-5 w-5" />} />
        </div>

        {/* Recent Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Courses</CardTitle>
            <Link to="/courses"><Button variant="ghost" size="sm">View All</Button></Link>
          </CardHeader>
          <CardContent>
            {enrollments && enrollments.length > 0 ? (
              <div className="space-y-3">
                {enrollments.slice(0, 3).map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{e.course?.name}</p>
                      <p className="text-sm text-muted-foreground">{e.course?.code} • {e.course?.teacher?.full_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No courses enrolled yet</p>
                <Link to="/enroll"><Button variant="link">Enroll in a course</Button></Link>
              </div>
            )}
          </CardContent>
        </Card>

        {showScanner && <QRScanner onClose={() => setShowScanner(false)} onSuccess={() => setShowScanner(false)} />}
      </div>
    );
  }

  // Teacher/Admin dashboard placeholder
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Welcome, {profile?.full_name}!</h1>
        <p className="page-description capitalize">{role} Dashboard</p>
      </div>
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        {role === 'teacher' ? 'Go to Courses to start an attendance session.' : 'Manage users and departments from the sidebar.'}
      </CardContent></Card>
    </div>
  );
}