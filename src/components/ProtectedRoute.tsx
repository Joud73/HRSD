import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { type AppRole, getDefaultRouteForRole } from "@/lib/roles";
import { copy } from "@/lib/copy";
import Container from "@/components/layout/Container";
import { SkeletonPage } from "@/components/shared/Skeletons";
import EmptyState from "@/components/shared/EmptyState";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, userRole, profileStatus } = useAuth();

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-section-alt">
        <div className="h-16 border-b border-border bg-background" />
        <Container className="py-10">
          <SkeletonPage />
        </Container>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Organization pending admin approval — redirect to pending page
  if (userRole === "organization" && profileStatus === "pending_verification") {
    return <Navigate to="/pending-approval" replace />;
  }

  // Role check
  if (allowedRoles && allowedRoles.length > 0) {
    if (!userRole) {
      // Authenticated but no valid role — show fallback
      return (
        <div className="flex min-h-screen items-center justify-center bg-section-alt" dir="rtl">
          <div className="w-full max-w-md rounded-lg border border-border bg-card">
            <h1 className="px-6 pt-8 text-center text-h3 text-primary">{copy.no_role_title}</h1>
            <EmptyState message={copy.no_role_desc} action={{ label: copy.not_found_action, to: "/" }} />
          </div>
        </div>
      );
    }

    if (!allowedRoles.includes(userRole)) {
      // Redirect to user's own area
      return <Navigate to={getDefaultRouteForRole(userRole)} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
