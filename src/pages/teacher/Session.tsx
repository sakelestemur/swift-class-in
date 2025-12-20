import { useState } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { useCourses } from '@/hooks/useCourses';
import { useActiveSession, useStartSession } from '@/hooks/useAttendance';
import { QRCodeDisplay } from '@/components/qr/QRCodeDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Play, Loader2 } from 'lucide-react';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function TeacherSession() {
  const { isAuthorized, loading: roleLoading } = useRoleGuard(['teacher', 'admin']);
  
  if (roleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }
  
  if (!isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <TeacherSessionContent />;
}

function TeacherSessionContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedCourse = searchParams.get('course');
  const [selectedCourse, setSelectedCourse] = useState<string>(preselectedCourse || '');
  const { data: courses, isLoading: loadingCourses } = useCourses();
  const { data: activeSession, isLoading: loadingSession } = useActiveSession(selectedCourse || undefined);
  const startMutation = useStartSession();
  const { toast } = useToast();

  const handleStartSession = async () => {
    if (!selectedCourse) return;
    
    try {
      await startMutation.mutateAsync({ courseId: selectedCourse });
      toast({ title: 'Session Started', description: 'QR code is now active for students.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (loadingCourses) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // If there's an active session, show the QR display
  if (activeSession) {
    return (
      <QRCodeDisplay
        session={activeSession}
        onSessionEnded={() => navigate('/teacher/courses')}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Start Attendance Session</h1>
        <p className="text-muted-foreground">Select a course to begin QR attendance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            New Session
          </CardTitle>
          <CardDescription>
            Choose a course and start the attendance session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {courses?.length === 0 ? (
            <div className="text-center py-8">
              <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Courses Available</h3>
              <p className="text-muted-foreground">
                Create a course first to start attendance sessions.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="course">Select Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a course..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
                        {course.section && ` (Section ${course.section})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleStartSession}
                disabled={!selectedCourse || startMutation.isPending}
                className="w-full"
                size="lg"
              >
                {startMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Start Session
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
