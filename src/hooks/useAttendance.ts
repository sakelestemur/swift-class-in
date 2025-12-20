import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import CryptoJS from 'crypto-js';

export interface AttendanceSession {
  id: string;
  course_id: string;
  teacher_id: string;
  session_date: string;
  start_time: string;
  end_time: string | null;
  qr_code_data: string;
  qr_expires_at: string;
  late_threshold_minutes: number;
  status: 'active' | 'ended';
  created_at: string;
  course?: {
    name: string;
    code: string;
  };
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  marked_at: string;
  is_late: boolean;
  is_manual: boolean;
  created_at: string;
  student?: {
    id: string;
    full_name: string;
    student_number: string | null;
    profile_picture_url: string | null;
  };
  session?: AttendanceSession;
}

// Generate secure QR code data
export function generateQRCodeData(sessionId: string): { qrData: string; expiresAt: Date } {
  const timestamp = Date.now();
  const nonce = CryptoJS.lib.WordArray.random(16).toString();
  const expiresAt = new Date(timestamp + 2 * 60 * 1000); // 2 minutes
  
  const payload = `${sessionId}:${timestamp}:${nonce}`;
  const hash = CryptoJS.SHA256(payload).toString();
  
  const qrData = JSON.stringify({
    sessionId,
    timestamp,
    nonce,
    hash,
    expiresAt: expiresAt.toISOString(),
  });
  
  return { qrData, expiresAt };
}

// Verify QR code data
export function verifyQRCodeData(qrData: string): { valid: boolean; sessionId: string | null; error?: string } {
  try {
    const data = JSON.parse(qrData);
    const { sessionId, timestamp, nonce, hash, expiresAt } = data;
    
    // Check expiration
    if (new Date(expiresAt) < new Date()) {
      return { valid: false, sessionId: null, error: 'QR code has expired' };
    }
    
    // Verify hash
    const payload = `${sessionId}:${timestamp}:${nonce}`;
    const expectedHash = CryptoJS.SHA256(payload).toString();
    
    if (hash !== expectedHash) {
      return { valid: false, sessionId: null, error: 'Invalid QR code' };
    }
    
    return { valid: true, sessionId };
  } catch {
    return { valid: false, sessionId: null, error: 'Invalid QR code format' };
  }
}

export function useActiveSession(courseId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['active-session', courseId],
    queryFn: async () => {
      let query = supabase
        .from('attendance_sessions')
        .select(`
          *,
          course:courses(name, code)
        `)
        .eq('status', 'active')
        .eq('teacher_id', user?.id);

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as AttendanceSession | null;
    },
    enabled: !!user,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

export function useSessionRecords(sessionId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['session-records', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          student:profiles!attendance_records_student_id_fkey(
            id,
            full_name,
            student_number,
            profile_picture_url
          )
        `)
        .eq('session_id', sessionId)
        .order('marked_at', { ascending: false });

      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!sessionId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`session-records-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['session-records', sessionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);

  return query;
}

export function useStartSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      courseId: string;
      lateThresholdMinutes?: number;
    }) => {
      const { qrData, expiresAt } = generateQRCodeData(crypto.randomUUID());

      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert({
          course_id: params.courseId,
          teacher_id: user?.id,
          qr_code_data: qrData,
          qr_expires_at: expiresAt.toISOString(),
          late_threshold_minutes: params.lateThresholdMinutes || 10,
        })
        .select(`
          *,
          course:courses(name, code)
        `)
        .single();

      if (error) throw error;
      return data as AttendanceSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-session'] });
    },
  });
}

export function useRefreshQR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { qrData, expiresAt } = generateQRCodeData(sessionId);

      const { data, error } = await supabase
        .from('attendance_sessions')
        .update({
          qr_code_data: qrData,
          qr_expires_at: expiresAt.toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['active-session'] });
    },
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('attendance_sessions')
        .update({
          status: 'ended',
          end_time: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-session'] });
    },
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (qrData: string) => {
      const verification = verifyQRCodeData(qrData);
      
      if (!verification.valid) {
        throw new Error(verification.error);
      }

      // Get session info
      const { data: sessionData } = JSON.parse(qrData);
      const sessionId = verification.sessionId;

      // Fetch session to check if it's active and get start time
      const { data: session, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('status', 'active')
        .maybeSingle();

      if (sessionError) throw sessionError;
      if (!session) throw new Error('Session not found or has ended');

      // Check if student is enrolled
      const { data: enrollment, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', session.course_id)
        .eq('student_id', user?.id)
        .eq('status', 'active')
        .maybeSingle();

      if (enrollError) throw enrollError;
      if (!enrollment) throw new Error('You are not enrolled in this course');

      // Check if already marked
      const { data: existing } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('session_id', sessionId)
        .eq('student_id', user?.id)
        .maybeSingle();

      if (existing) throw new Error('Attendance already marked');

      // Calculate if late
      const sessionStart = new Date(session.start_time);
      const now = new Date();
      const diffMinutes = (now.getTime() - sessionStart.getTime()) / (1000 * 60);
      const isLate = diffMinutes > session.late_threshold_minutes;

      // Mark attendance
      const { data, error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: sessionId,
          student_id: user?.id,
          is_late: isLate,
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, isLate };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-attendance'] });
    },
  });
}

export function useStudentAttendance() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-attendance', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          session:attendance_sessions(
            *,
            course:courses(name, code)
          )
        `)
        .eq('student_id', user?.id)
        .order('marked_at', { ascending: false });

      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!user,
  });
}

export function useCourseAttendanceStats(courseId: string) {
  return useQuery({
    queryKey: ['course-attendance-stats', courseId],
    queryFn: async () => {
      // Get all sessions for this course
      const { data: sessions, error: sessionsError } = await supabase
        .from('attendance_sessions')
        .select('id')
        .eq('course_id', courseId);

      if (sessionsError) throw sessionsError;

      // Get all enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('student_id')
        .eq('course_id', courseId)
        .eq('status', 'active');

      if (enrollError) throw enrollError;

      // Get all attendance records for these sessions
      const sessionIds = sessions?.map(s => s.id) || [];
      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select('*')
        .in('session_id', sessionIds);

      if (recordsError) throw recordsError;

      const totalSessions = sessions?.length || 0;
      const totalStudents = enrollments?.length || 0;
      const totalRecords = records?.length || 0;
      const lateRecords = records?.filter(r => r.is_late).length || 0;

      return {
        totalSessions,
        totalStudents,
        totalRecords,
        lateRecords,
        averageAttendance: totalSessions > 0 && totalStudents > 0
          ? Math.round((totalRecords / (totalSessions * totalStudents)) * 100)
          : 0,
      };
    },
    enabled: !!courseId,
  });
}