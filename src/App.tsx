import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicLayout from "@/components/layout/PublicLayout";
import AppShell from "@/components/layout/AppShell";
import Index from "./pages/Index";
import Login from "./pages/Login";
import LoginLocal from "./pages/LoginLocal";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import NafathAuth from "./pages/NafathAuth";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import TechnicalEvaluationIndicators from "./pages/TechnicalEvaluationIndicators";
import TrainingStage from "./pages/TrainingStage";
import CourseDetail from "./pages/CourseDetail";
import IndividualCourseDetail from "./pages/IndividualCourseDetail";
import ContactUs from "./pages/ContactUs";
import IndividualsJourney from "./pages/IndividualsJourney";
import UnderReview from "./pages/UnderReview";
import Certificate from "./pages/Certificate";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEvaluationSetup from "./pages/AdminEvaluationSetup";
import AdminEntities from "./pages/AdminEntities";
import AdminRubric from "./pages/AdminRubric";
import AdminEvaluationYears from "./pages/AdminEvaluationYears";
import AdminEvaluationYearDetail from "./pages/AdminEvaluationYearDetail";
import AdminAssociations from "./pages/AdminAssociations";
import AdminAssociationDetail from "./pages/AdminAssociationDetail";
import AdminReviewers from "./pages/AdminReviewers";
import AdminReviewerDetail from "./pages/AdminReviewerDetail";
import AdminReports from "./pages/AdminReports";
import AdminUsers from "./pages/AdminUsers";
import AdminRoles from "./pages/AdminRoles";
import AdminOrganizationRequests from "./pages/AdminOrganizationRequests";
import EvaluatorDashboard from "./pages/EvaluatorDashboard";
import EvaluatorAssignments from "./pages/EvaluatorAssignments";
import EvaluationDetails from "./pages/EvaluationDetails";
import PendingApproval from "./pages/PendingApproval";
import AdminProfile from "./pages/AdminProfile";
import EvaluatorProfile from "./pages/EvaluatorProfile";
import IndividualAuth from "./pages/IndividualAuth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const guard = (roles: Parameters<typeof ProtectedRoute>[0]["allowedRoles"], element: React.ReactNode) => (
  <ProtectedRoute allowedRoles={roles}>{element}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public, authentication and individual pages */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/login-local" element={<LoginLocal />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/nafath-auth" element={<NafathAuth />} />
                <Route path="/register" element={<Register />} />
                <Route path="/contact-us" element={<ContactUs />} />
                <Route path="/pending-approval" element={<PendingApproval />} />
                <Route path="/individual-auth" element={<IndividualAuth />} />
                <Route path="/individuals-journey" element={guard(["individual"], <IndividualsJourney />)} />
                <Route path="/individual-course/:courseId" element={guard(["individual"], <IndividualCourseDetail />)} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Organization */}
              <Route element={guard(["organization"], <AppShell role="organization" />)}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/technical-indicators/:courseSlug" element={<TechnicalEvaluationIndicators />} />
                <Route path="/training-stage" element={<TrainingStage />} />
                <Route path="/course/:courseId" element={<CourseDetail />} />
                <Route path="/under-review" element={<UnderReview />} />
                <Route path="/certificate/:organizationId" element={<Certificate />} />
              </Route>

              {/* Admin */}
              <Route element={guard(["admin"], <AppShell role="admin" />)}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/performance/evaluation-setup" element={<AdminEvaluationSetup />} />
                <Route path="/admin/performance/evaluation-setup/entities" element={<AdminEntities />} />
                <Route path="/admin/performance/evaluation-setup/rubric" element={<AdminRubric />} />
                <Route path="/admin/performance/evaluation-years" element={<AdminEvaluationYears />} />
                <Route path="/admin/performance/evaluation-years/:yearId" element={<AdminEvaluationYearDetail />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/roles" element={<AdminRoles />} />
                <Route path="/admin/associations" element={<AdminAssociations />} />
                <Route path="/admin/associations/:id" element={<AdminAssociationDetail />} />
                <Route path="/admin/reviewers" element={<AdminReviewers />} />
                <Route path="/admin/reviewers/:id" element={<AdminReviewerDetail />} />
                <Route path="/admin/organization-requests" element={<AdminOrganizationRequests />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/profile" element={<AdminProfile />} />
              </Route>

              {/* Evaluator */}
              <Route element={guard(["evaluator"], <AppShell role="evaluator" />)}>
                <Route path="/evaluator" element={<EvaluatorDashboard />} />
                <Route path="/evaluator/assignments" element={<EvaluatorAssignments />} />
                <Route path="/evaluator/assignment/:assignmentId" element={<EvaluationDetails />} />
                <Route path="/evaluator/profile" element={<EvaluatorProfile />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </MotionConfig>
  </QueryClientProvider>
);

export default App;
