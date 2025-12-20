import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Course {
  id: string;
  teacher_id: string;
  department_id: string | null;
  name: string;
  code: string;
  section: string | null;
  academic_year: string;
  academic_term: 'fall' | 'spring' | 'summer';
  created_at: string;
  updated_at: string;
  teacher?: {
    full_name: string;
  };
  department?: {
    name: string;
    code: string;
  };
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  student_id: string;
  enrolled_at: string;
  status: 'active' | 'dropped';
  course?: Course;
  student?: {
    id: string;
    full_name: string;
    student_number: string | null;
    profile_picture_url: string | null;
  };
}

export function useCourses() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['courses', role],
    queryFn: async () => {
      let query = supabase
        .from('courses')
        .select(`
          *,
          teacher:profiles!courses_teacher_id_fkey(full_name),
          department:departments(name, code)
        `)
        .order('created_at', { ascending: false });

      if (role === 'teacher') {
        query = query.eq('teacher_id', user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Course[];
    },
    enabled: !!user,
  });
}

export function useStudentCourses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-courses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses(
            *,
            teacher:profiles!courses_teacher_id_fkey(full_name),
            department:departments(name, code)
          )
        `)
        .eq('student_id', user?.id)
        .eq('status', 'active')
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data as CourseEnrollment[];
    },
    enabled: !!user,
  });
}

export function useCourseByCode(code: string) {
  return useQuery({
    queryKey: ['course-by-code', code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          teacher:profiles!courses_teacher_id_fkey(full_name),
          department:departments(name, code)
        `)
        .eq('code', code.toUpperCase())
        .maybeSingle();

      if (error) throw error;
      return data as Course | null;
    },
    enabled: code.length >= 3,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (course: {
      name: string;
      code: string;
      section?: string;
      academic_year: string;
      academic_term: 'fall' | 'spring' | 'summer';
      department_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...course,
          code: course.code.toUpperCase(),
          teacher_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useEnrollInCourse() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .insert({
          course_id: courseId,
          student_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-courses'] });
    },
  });
}

export function useDropCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from('course_enrollments')
        .update({ status: 'dropped' })
        .eq('id', enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-courses'] });
    },
  });
}

export function useCourseStudents(courseId: string) {
  return useQuery({
    queryKey: ['course-students', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          student:profiles!course_enrollments_student_id_fkey(
            id,
            full_name,
            student_number,
            profile_picture_url
          )
        `)
        .eq('course_id', courseId)
        .eq('status', 'active')
        .order('enrolled_at');

      if (error) throw error;
      return data as CourseEnrollment[];
    },
    enabled: !!courseId,
  });
}