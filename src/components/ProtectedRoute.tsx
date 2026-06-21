import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { type AppRole, getDefaultRouteForRole } from "@/lib/roles";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, userRole, profileStatus } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
        <div className="min-h-screen flex items-center justify-center" dir="rtl">
          <div className="text-center space-y-4 p-8">
            <h2 className="text-xl font-semibold text-foreground">لا توجد صلاحيات</h2>
            <p className="text-muted-foreground">ليس لديك دور محدد في النظام. تواصل مع مدير النظام.</p>
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
