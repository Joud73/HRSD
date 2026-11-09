import type { ReactNode } from "react";
import { Mail, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { copy } from "@/lib/copy";
import PageHeader from "@/components/shared/PageHeader";

interface AccountProfileProps {
  role: "admin" | "supervisor" | "evaluator";
  home: string;
  /** Role-specific sections below the account card */
  children?: ReactNode;
}

/** Profile page body shared by admin, supervisor and evaluator. */
const AccountProfile = ({ role, home, children }: AccountProfileProps) => {
  const { user } = useAuth();
  const rows = [
    { icon: Mail, label: copy.profile_email, value: user?.email },
    { icon: Shield, label: copy.profile_role, value: copy.shell_user[role] },
  ];

  return (
    <>
      <PageHeader
        title={copy.profile_title}
        description={copy.profile_desc}
        breadcrumbs={[{ label: copy.shell_context[role], to: home }, { label: copy.profile_title }]}
      />
      <section className="max-w-xl rounded-lg border border-border bg-card">
        <h2 className="border-b border-border px-6 py-4 text-h3 text-ink">{copy.profile_account}</h2>
        <dl className="divide-y divide-border">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 px-6 py-4">
              <Icon aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <div className="min-w-0">
                <dt className="text-caption text-muted-foreground">{label}</dt>
                <dd className="truncate text-body text-ink">{value || <span className="text-muted-foreground">-</span>}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>
      {children}
    </>
  );
};

export default AccountProfile;
