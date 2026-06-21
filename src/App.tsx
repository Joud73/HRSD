import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/login-local" element={<LoginLocal />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/nafath-auth" element={<NafathAuth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/individual-auth" element={<IndividualAuth />} />
            {/* Individual routes */}
            <Route path="/individuals-journey" element={<ProtectedRoute allowedRoles={["individual"]}><IndividualsJourney /></ProtectedRoute>} />
            <Route path="/individual-course/:courseId" element={<ProtectedRoute allowedRoles={["individual"]}><IndividualCourseDetail /></ProtectedRoute>} />

            {/* Organization routes */}
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["organization"]}><Dashboard /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={["organization"]}><Settings /></ProtectedRoute>} />
            <Route path="/technical-indicators/:courseSlug" element={<ProtectedRoute allowedRoles={["organization"]}><TechnicalEvaluationIndicators /></ProtectedRoute>} />
            <Route path="/training-stage" element={<ProtectedRoute allowedRoles={["organization"]}><TrainingStage /></ProtectedRoute>} />
            <Route path="/course/:courseId" element={<ProtectedRoute allowedRoles={["organization"]}><CourseDetail /></ProtectedRoute>} />
            <Route path="/under-review" element={<ProtectedRoute allowedRoles={["organization"]}><UnderReview /></ProtectedRoute>} />
            <Route path="/certificate/:organizationId" element={<ProtectedRoute allowedRoles={["organization"]}><Certificate /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/performance/evaluation-setup" element={<ProtectedRoute allowedRoles={["admin"]}><AdminEvaluationSetup /></ProtectedRoute>} />
            <Route path="/admin/performance/evaluation-setup/entities" element={<ProtectedRoute allowedRoles={["admin"]}><AdminEntities /></ProtectedRoute>} />
            <Route path="/admin/performance/evaluation-setup/rubric" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRubric /></ProtectedRoute>} />
            <Route path="/admin/performance/evaluation-years" element={<ProtectedRoute allowedRoles={["admin"]}><AdminEvaluationYears /></ProtectedRoute>} />
            <Route path="/admin/performance/evaluation-years/:yearId" element={<ProtectedRoute allowedRoles={["admin"]}><AdminEvaluationYearDetail /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRoles /></ProtectedRoute>} />
            <Route path="/admin/associations" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAssociations /></ProtectedRoute>} />
            <Route path="/admin/associations/:id" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAssociationDetail /></ProtectedRoute>} />
            <Route path="/admin/reviewers" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReviewers /></ProtectedRoute>} />
            <Route path="/admin/reviewers/:id" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReviewerDetail /></ProtectedRoute>} />
            <Route path="/admin/organization-requests" element={<ProtectedRoute allowedRoles={["admin"]}><AdminOrganizationRequests /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={["admin"]}><AdminProfile /></ProtectedRoute>} />

            {/* Evaluator routes */}
            <Route path="/evaluator" element={<ProtectedRoute allowedRoles={["evaluator"]}><EvaluatorDashboard /></ProtectedRoute>} />
            <Route path="/evaluator/assignments" element={<ProtectedRoute allowedRoles={["evaluator"]}><EvaluatorAssignments /></ProtectedRoute>} />
            <Route path="/evaluator/assignment/:assignmentId" element={<ProtectedRoute allowedRoles={["evaluator"]}><EvaluationDetails /></ProtectedRoute>} />
            <Route path="/evaluator/profile" element={<ProtectedRoute allowedRoles={["evaluator"]}><EvaluatorProfile /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
