import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import MyMonthlyAttendance from "./pages/MyMonthlyAttendance";
import TeamAttendance from "./pages/TeamAttendance";
import TeamMemberAttendance from "./pages/TeamMemberAttendance";
import UsersPage from "./pages/Users";
import WFHApply from "./pages/WFHApply";
import LeaveApply from "./pages/LeaveApply";
import Payroll from "./pages/Payroll";
import Profile from "./pages/Profile";
import AttendanceRegularization from "./pages/AttendanceRegularization";
import RegularizationApprovals from "./pages/RegularizationApprovals";
import RequestHistory from "./pages/RequestHistory";
import Announcements from "./pages/Announcements";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            {/* Protected routes with dashboard layout */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/attendance/my-monthly" element={<MyMonthlyAttendance />} />
              <Route path="/attendance/team" element={<TeamAttendance />} />
              <Route path="/attendance/team/:employeeId" element={<TeamMemberAttendance />} />
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['DIRECTOR', 'HR']}>
                  <UsersPage />
                </ProtectedRoute>
              } />
              <Route path="/wfh/apply" element={<WFHApply />} />
              <Route path="/leave/apply" element={<LeaveApply />} />
              <Route path="/attendance/regularization" element={<AttendanceRegularization />} />
              <Route path="/attendance/regularization/approvals" element={<RegularizationApprovals />} />
              <Route path="/requests/history" element={<RequestHistory />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/payroll" element={
                <ProtectedRoute allowedRoles={['DIRECTOR']}>
                  <Payroll />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
