import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { tamohiCopy as t } from "@/lib/copy";
import EmptyState from "@/components/shared/EmptyState";
import { TamohiFrame } from "@/components/tamohi/TamohiShell";

/** /tamohi/my-path: the organization's development path (Step 3). Other roles go back to the catalog. */
const TamohiMyPath = () => {
  const { userRole } = useAuth();
  if (userRole !== "organization") return <Navigate to="/tamohi" replace />;
  return (
    <TamohiFrame className="py-10">
      <div className="rounded-lg border border-border bg-card">
        <EmptyState message={t.path_empty} action={{ label: t.path_empty_action, to: "/dashboard" }} />
      </div>
    </TamohiFrame>
  );
};

export default TamohiMyPath;
