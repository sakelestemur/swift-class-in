import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import AuthPage from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import NotFound from "./pages/NotFound";

// Student pages
import StudentCourses from "@/pages/student/Courses";
import EnrollPage from "@/pages/student/Enroll";
import AttendanceHistory from "@/pages/student/Attendance";
import ScanQRPage from "@/pages/student/ScanQR";

// Teacher pages
import TeacherCourses from "@/pages/teacher/Courses";
import TeacherSession from "@/pages/teacher/Session";
import TeacherReports from "@/pages/teacher/Reports";

// Admin pages
import AdminUsers from "@/pages/admin/Users";
import AdminDepartments from "@/pages/admin/Departments";
import AdminReports from "@/pages/admin/Reports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<AuthPage />} />
            
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Student Routes */}
              <Route path="/courses" element={<StudentCourses />} />
              <Route path="/enroll" element={<EnrollPage />} />
              <Route path="/attendance" element={<AttendanceHistory />} />
              <Route path="/scan" element={<ScanQRPage />} />
              
              {/* Teacher Routes */}
              <Route path="/teacher/courses" element={<TeacherCourses />} />
              <Route path="/teacher/session" element={<TeacherSession />} />
              <Route path="/teacher/reports" element={<TeacherReports />} />
              
              {/* Admin Routes */}
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/departments" element={<AdminDepartments />} />
              <Route path="/admin/reports" element={<AdminReports />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;