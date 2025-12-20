import React, { useEffect, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRefreshQR, useEndSession, useSessionRecords, AttendanceSession } from '@/hooks/useAttendance';
import { useCourseStudents } from '@/hooks/useCourses';
import { RefreshCw, Square, Users, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QRCodeDisplayProps {
  session: AttendanceSession;
  onSessionEnded?: () => void;
}

export function QRCodeDisplay({ session, onSessionEnded }: QRCodeDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [qrData, setQrData] = useState(session.qr_code_data);
  const [expiresAt, setExpiresAt] = useState(new Date(session.qr_expires_at));
  
  const refreshQR = useRefreshQR();
  const endSession = useEndSession();
  const { data: records } = useSessionRecords(session.id);
  const { data: enrollments } = useCourseStudents(session.course_id);

  const totalEnrolled = enrollments?.length || 0;
  const presentCount = records?.length || 0;
  const lateCount = records?.filter(r => r.is_late).length || 0;
  const attendancePercent = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;

  const handleRefreshQR = useCallback(async () => {
    try {
      const result = await refreshQR.mutateAsync(session.id);
      setQrData(result.qr_code_data);
      setExpiresAt(new Date(result.qr_expires_at));
    } catch (error) {
      console.error('Failed to refresh QR:', error);
    }
  }, [refreshQR, session.id]);

  const handleEndSession = async () => {
    await endSession.mutateAsync(session.id);
    onSessionEnded?.();
  };

  // Auto-refresh QR code every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefreshQR();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [handleRefreshQR]);

  // Countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      setTimeLeft(diff);

      if (diff === 0) {
        handleRefreshQR();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, handleRefreshQR]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (timeLeft / 120) * 100;

  return (
    <div className="space-y-6">
      {/* Session Info Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{session.course?.name}</CardTitle>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {session.course?.code}
              </p>
            </div>
            <Badge variant="default" className="bg-success text-success-foreground">
              Active Session
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* QR Code */}
      <Card className="overflow-hidden">
        <CardContent className="p-8 flex flex-col items-center">
          <div className="relative bg-white p-6 rounded-2xl shadow-lg">
            <QRCodeSVG
              value={qrData}
              size={280}
              level="H"
              includeMargin={false}
              className="rounded-lg"
            />
          </div>

          {/* Timer */}
          <div className="mt-6 w-full max-w-xs space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                QR expires in
              </span>
              <span className={cn(
                'font-mono font-bold',
                timeLeft < 30 ? 'text-destructive' : 'text-foreground'
              )}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleRefreshQR}
              disabled={refreshQR.isPending}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', refreshQR.isPending && 'animate-spin')} />
              Refresh QR
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndSession}
              disabled={endSession.isPending}
            >
              <Square className="h-4 w-4 mr-2" />
              End Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalEnrolled}</p>
              <p className="text-xs text-muted-foreground">Enrolled</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{presentCount}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{lateCount}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Users className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{attendancePercent}%</p>
              <p className="text-xs text-muted-foreground">Attendance</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Live Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Live Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {records && records.length > 0 ? (
            <div className="space-y-2">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 animate-fade-in"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      record.is_late ? 'bg-warning' : 'bg-success'
                    )} />
                    <div>
                      <p className="font-medium">{record.student?.full_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {record.student?.student_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={record.is_late ? 'secondary' : 'default'} className={cn(
                      record.is_late ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                    )}>
                      {record.is_late ? 'Late' : 'On Time'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(record.marked_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Waiting for students to scan...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}