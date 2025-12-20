import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { BarChart3, Users, BookOpen, Calendar, GraduationCap, UserCog, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Navigate } from 'react-router-dom';

export default function AdminReports() {
  const { isAuthorized, loading: roleLoading } = useRoleGuard(['admin']);
  
  if (roleLoading) {
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
  
  if (!isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <AdminReportsContent />;
}

function AdminReportsContent() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [profilesRes, coursesRes, sessionsRes, enrollmentsRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('attendance_sessions').select('id', { count: 'exact', head: true }),
        supabase.from('course_enrollments').select('id', { count: 'exact', head: true }),
        supabase.from('user_roles').select('role'),
      ]);

      const roleCounts = rolesRes.data?.reduce((acc, r) => {
        acc[r.role] = (acc[r.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalUsers: profilesRes.count || 0,
        totalCourses: coursesRes.count || 0,
        totalSessions: sessionsRes.count || 0,
        totalEnrollments: enrollmentsRes.count || 0,
        students: roleCounts.student || 0,
        teachers: roleCounts.teacher || 0,
        admins: roleCounts.admin || 0,
      };
    },
  });

  const roleData = [
    { name: 'Students', value: stats?.students || 0, color: 'hsl(var(--primary))' },
    { name: 'Teachers', value: stats?.teachers || 0, color: 'hsl(var(--secondary))' },
    { name: 'Admins', value: stats?.admins || 0, color: 'hsl(var(--destructive))' },
  ];

  const activityData = [
    { name: 'Users', value: stats?.totalUsers || 0 },
    { name: 'Courses', value: stats?.totalCourses || 0 },
    { name: 'Sessions', value: stats?.totalSessions || 0 },
    { name: 'Enrollments', value: stats?.totalEnrollments || 0 },
  ];

  if (isLoading) {
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
        <h1 className="text-2xl font-bold">System Reports</h1>
        <p className="text-muted-foreground">Overview of system activity and usage</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={<Users className="h-4 w-4" />}
          description="Registered users"
        />
        <StatCard
          title="Total Courses"
          value={stats?.totalCourses || 0}
          icon={<BookOpen className="h-4 w-4" />}
          description="Active courses"
        />
        <StatCard
          title="Total Sessions"
          value={stats?.totalSessions || 0}
          icon={<Calendar className="h-4 w-4" />}
          description="Attendance sessions"
        />
        <StatCard
          title="Enrollments"
          value={stats?.totalEnrollments || 0}
          icon={<CheckCircle className="h-4 w-4" />}
          description="Course enrollments"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Distribution
            </CardTitle>
            <CardDescription>Users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span className="text-sm">{stats?.students} Students</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCog className="h-4 w-4 text-secondary" />
                <span className="text-sm">{stats?.teachers} Teachers</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              System Activity
            </CardTitle>
            <CardDescription>Overview of system data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
