import { useState, useEffect, useRef, type ReactNode } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Check, ChevronLeft, ChevronRight, Download, FileText, Save, Send, Undo2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { copy, evaluatorCopy as t } from "@/lib/copy";
import { formatDate, formatNumber } from "@/lib/format";
import { toStatusKey, type StatusKey } from "@/lib/status";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonPage } from "@/components/shared/Skeletons";

/* ── Types ── */
interface CriterionScore {
  criterion_id: string;
  score: string;
  notes: string;
  status: string;
}

type Criterion = Tables<"evaluation_criteria">;

/** Assignment codes that src/lib/status.ts does not know yet */
const statusOf = (raw: string | null | undefined) => toStatusKey(raw);

/** Assignment status codes written by the two review actions */
const APPROVED = "approved";
const RETURNED = "needs_revision";

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-center gap-3">
    <dt className="text-small text-muted-foreground">{label}</dt>
    <dd className="text-small font-hrsd-medium text-ink">{children}</dd>
  </div>
);

/* ── Component ── */
const EvaluationDetails = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reduced = useReducedMotion();
  const detailRef = useRef<HTMLDivElement>(null);

  const [scores, setScores] = useState<Record<string, CriterionScore>>({});
  const [message, setMessage] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | "approve" | "return">(null);

  /* ── Fetch assignment ── */
  const { data: assignment, isLoading: loadingAssignment } = useQuery({
    queryKey: ["assignment", assignmentId],
    enabled: !!assignmentId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluator_assignments")
        .select("*")
        .eq("id", assignmentId!)
        .eq("evaluator_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  /* ── Fetch organization details ── */
  const { data: organization } = useQuery({
    queryKey: ["organization-details", assignment?.organization_id],
    enabled: !!assignment?.organization_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", assignment!.organization_id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  /* ── Fetch criteria ── */
  const { data: criteria } = useQuery({
    queryKey: ["evaluation-criteria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_criteria")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  /* ── Fetch existing evaluations ── */
  const { data: existingEvals } = useQuery({
    queryKey: ["criterion-evaluations", assignmentId],
    enabled: !!assignmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("criterion_evaluations")
        .select("*")
        .eq("assignment_id", assignmentId!);
      if (error) throw error;
      return data || [];
    },
  });

  /* ── Fetch messages ── */
  const { data: messages } = useQuery({
    queryKey: ["evaluation-messages", assignmentId],
    enabled: !!assignmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_messages")
        .select("*")
        .eq("assignment_id", assignmentId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  /* ── Fetch evidences ── */
  const { data: evidences } = useQuery({
    queryKey: ["evaluation-evidences", assignmentId],
    enabled: !!assignmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_evidences")
        .select("*")
        .eq("assignment_id", assignmentId!);
      if (error) throw error;
      return data || [];
    },
  });

  /* ── Seed scores from existing evals ── */
  useEffect(() => {
    if (existingEvals && existingEvals.length > 0) {
      const map: Record<string, CriterionScore> = {};
      existingEvals.forEach((e) => {
        map[e.criterion_id] = {
          criterion_id: e.criterion_id,
          score: e.score?.toString() || "",
          notes: e.notes || "",
          status: e.status,
        };
      });
      setScores(map);
    }
  }, [existingEvals]);

  useEffect(() => {
    if (assignment) setAssignmentStatus(assignment.status);
  }, [assignment]);

  /* ── Save mutation: scores, plus the assignment status when an action sets one ── */
  const saveDraft = useMutation({
    mutationFn: async (nextStatus: string | undefined) => {
      const targetStatus = nextStatus ?? assignmentStatus;
      const upserts = Object.values(scores).map((s) => ({
        assignment_id: assignmentId!,
        criterion_id: s.criterion_id,
        score: s.score ? Number(s.score) : null,
        notes: s.notes || null,
        status: s.status || "pending",
      }));

      if (upserts.length > 0) {
        const { error } = await supabase
          .from("criterion_evaluations")
          .upsert(upserts, { onConflict: "assignment_id,criterion_id" });
        if (error) throw error;
      }

      // Update assignment status
      if (targetStatus && targetStatus !== assignment?.status) {
        const { error } = await supabase
          .from("evaluator_assignments")
          .update({ status: targetStatus })
          .eq("id", assignmentId!);
        if (error) throw error;
      }
    },
    onSuccess: (_data, nextStatus) => {
      if (nextStatus) setAssignmentStatus(nextStatus);
      const title =
        nextStatus === APPROVED ? t.toast_approved_title : nextStatus === RETURNED ? t.toast_returned_title : t.toast_saved_title;
      toast({ title, description: t.toast_saved_desc });
      queryClient.invalidateQueries({ queryKey: ["criterion-evaluations", assignmentId] });
      queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId] });
      queryClient.invalidateQueries({ queryKey: ["evaluator-assignments"] });
    },
    onError: () => {
      toast({ title: t.toast_save_error_title, description: t.toast_save_error_desc, variant: "destructive" });
    },
  });

  /* ── Send message mutation ── */
  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!message.trim()) return;
      const { error } = await supabase
        .from("evaluation_messages")
        .insert({
          assignment_id: assignmentId!,
          sender_id: user!.id,
          message: message.trim(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      toast({ title: t.toast_sent_title, description: t.toast_sent_desc });
      queryClient.invalidateQueries({ queryKey: ["evaluation-messages", assignmentId] });
    },
    onError: () => {
      toast({ title: t.toast_send_error_title, description: t.toast_send_error_desc, variant: "destructive" });
    },
  });

  /* ── Score updater ── */
  const updateScore = (criterionId: string, field: keyof CriterionScore, value: string) => {
    setScores((prev) => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        criterion_id: criterionId,
        score: prev[criterionId]?.score || "",
        notes: prev[criterionId]?.notes || "",
        status: prev[criterionId]?.status || "pending",
        [field]: value,
      },
    }));
  };

  /* ── Guards ── */
  if (loadingAssignment) {
    return <SkeletonPage />;
  }

  if (!assignment) {
    return <Navigate to="/evaluator/assignments" replace />;
  }

  /* ── Group criteria by track ── */
  const tracks = (criteria || []).reduce<Record<string, Criterion[]>>((acc, c) => {
    if (!acc[c.track_name]) acc[c.track_name] = [];
    acc[c.track_name].push(c);
    return acc;
  }, {});
  const flat = Object.values(tracks).flat();
  const selectedIndex = Math.max(0, flat.findIndex((c) => c.id === selectedId));
  const selected = flat[selectedIndex];

  const getEvidencesForCriterion = (criterionId: string) =>
    (evidences || []).filter((e) => e.criterion_id === criterionId);

  /** Per-criterion status from the evaluator's own record */
  const criterionStatus = (id: string): StatusKey => {
    const s = scores[id];
    if (!s) return "not_started";
    const key = toStatusKey(s.status);
    return key === "not_started" && (s.score || s.notes) ? "in_progress" : key;
  };
  const reviewedCount = flat.filter((c) => !!scores[c.id]?.score).length;

  const select = (id: string) => {
    setSelectedId(id);
    // On stacked (mobile) layout, bring the detail pane into view
    if (window.matchMedia("(max-width: 1023px)").matches) {
      detailRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
  };

  const status = statusOf(assignmentStatus || assignment.status);
  const busy = saveDraft.isPending;
  const orgName = organization?.name || t.unknown_association;

  const selectedEvidence = selected ? getEvidencesForCriterion(selected.id) : [];
  const selectedScore = selected ? scores[selected.id] : undefined;

  const runConfirmed = () => {
    if (confirm === "approve") saveDraft.mutate(APPROVED);
    if (confirm === "return") saveDraft.mutate(RETURNED);
    setConfirm(null);
  };

  return (
    <>
      <PageHeader
        title={orgName}
        description={t.details_desc}
        breadcrumbs={[
          { label: copy.shell_context.evaluator, to: "/evaluator" },
          { label: t.assignments_title, to: "/evaluator/assignments" },
          { label: t.details_crumb },
        ]}
        meta={
          <dl className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border border-border bg-card px-5 py-4">
            <Fact label={t.fact_status}>
              <StatusBadge status={status} />
            </Fact>
            <Fact label={t.fact_registration}>
              <span className="tabular">{organization?.registration_number || "—"}</span>
            </Fact>
            <Fact label={t.fact_year}>
              <span className="tabular">{assignment.year ?? "—"}</span>
            </Fact>
            <Fact label={t.fact_progress}>
              <span className="tabular">
                {flat.length > 0 ? `${formatNumber(reviewedCount)} / ${formatNumber(flat.length)}` : "—"}
              </span>
            </Fact>
          </dl>
        }
      />

      {flat.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState message={t.criteria_empty} action={{ label: t.assignments_title, to: "/evaluator/assignments" }} />
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          {/* Start pane: criteria list */}
          <nav
            aria-label={t.criteria_nav_label}
            className="rounded-lg border border-border bg-card lg:sticky lg:top-24 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto scrollbar-thin"
          >
            {Object.entries(tracks).map(([trackName, trackCriteria]) => (
              <div key={trackName} className="border-b border-border last:border-b-0">
                <p className="px-4 pb-2 pt-4 text-caption font-hrsd-medium text-muted-foreground">
                  {t.track_prefix} {trackName}
                </p>
                <ul className="flex flex-col pb-2">
                  {trackCriteria.map((c) => {
                    const active = c.id === selected?.id;
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => select(c.id)}
                          aria-current={active ? "true" : undefined}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 border-s-2 px-4 py-3 text-start text-small transition-colors duration-micro focus-visible:-outline-offset-2",
                            active
                              ? "border-primary bg-primary/5 font-hrsd-medium text-primary"
                              : "border-transparent text-ink hover:bg-section-alt"
                          )}
                        >
                          <span className="min-w-0">{c.criterion_name}</span>
                          <StatusBadge status={criterionStatus(c.id)} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* End pane: criterion detail */}
          <div ref={detailRef} className="flex scroll-mt-24 flex-col gap-6">
            {selected && (
              <motion.section
                key={selected.id}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={transition.micro}
                aria-labelledby="criterion-title"
                className="rounded-lg border border-border bg-card"
              >
                <div className="flex flex-col gap-2 border-b border-border p-5">
                  <p className="text-caption text-muted-foreground">
                    {t.track_prefix} {selected.track_name}
                  </p>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 id="criterion-title" className="text-h3 text-ink">
                      {selected.criterion_name}
                    </h2>
                    <StatusBadge status={criterionStatus(selected.id)} />
                  </div>
                  {selected.description && <p className="text-small text-muted-foreground">{selected.description}</p>}
                </div>

                {/* Evidence */}
                <div className="border-b border-border p-5">
                  <h3 className="flex items-center gap-2 text-body font-hrsd-medium text-ink">
                    {t.evidence_title}
                    <span className="tabular text-small text-muted-foreground">{formatNumber(selectedEvidence.length)}</span>
                  </h3>
                  {selectedEvidence.length === 0 ? (
                    <p className="mt-3 text-small text-muted-foreground">{t.evidence_empty}</p>
                  ) : (
                    <ul className="mt-3 flex flex-col divide-y divide-border rounded-md border border-border">
                      {selectedEvidence.map((ev) => (
                        <li key={ev.id}>
                          <a
                            href={ev.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 px-4 py-3 transition-colors duration-micro hover:bg-section-alt focus-visible:-outline-offset-2"
                          >
                            <FileText aria-hidden className="h-4 w-4 shrink-0 text-primary" />
                            <span className="min-w-0 flex-1 truncate text-small text-ink">{ev.file_name}</span>
                            <span className="hidden text-caption text-muted-foreground sm:inline">{formatDate(ev.uploaded_at)}</span>
                            <Download aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Score + Notes */}
                <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,160px)_minmax(0,1fr)]">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="criterion-score" className="text-small font-hrsd-medium text-ink">
                      {t.score_label}
                    </Label>
                    <Input
                      id="criterion-score"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={100}
                      aria-describedby="criterion-score-hint"
                      className="tabular"
                      value={selectedScore?.score || ""}
                      onChange={(e) => updateScore(selected.id, "score", e.target.value)}
                    />
                    <p id="criterion-score-hint" className="text-caption text-muted-foreground">
                      {t.score_hint}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="criterion-notes" className="text-small font-hrsd-medium text-ink">
                      {t.notes_label}
                    </Label>
                    <Textarea
                      id="criterion-notes"
                      rows={3}
                      placeholder={t.notes_placeholder}
                      value={selectedScore?.notes || ""}
                      onChange={(e) => updateScore(selected.id, "notes", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={selectedIndex === 0}
                    onClick={() => select(flat[selectedIndex - 1].id)}
                  >
                    <ChevronRight aria-hidden />
                    {t.prev_criterion}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={selectedIndex >= flat.length - 1}
                    onClick={() => select(flat[selectedIndex + 1].id)}
                  >
                    {t.next_criterion}
                    <ChevronLeft aria-hidden />
                  </Button>
                </div>
              </motion.section>
            )}

            {/* Messages to the association */}
            <section aria-labelledby="messages-title" className="rounded-lg border border-border bg-card p-5">
              <h2 id="messages-title" className="text-h3 text-ink">
                {t.messages_title}
              </h2>
              {(messages || []).length === 0 ? (
                <p className="mt-3 text-small text-muted-foreground">{t.messages_empty}</p>
              ) : (
                <ul className="mt-4 flex flex-col gap-3">
                  {(messages || []).map((m) => (
                    <li key={m.id} className="rounded-md bg-section-alt px-4 py-3">
                      <p className="text-caption text-muted-foreground">{formatDate(m.created_at)}</p>
                      <p className="mt-1 text-small text-ink">{m.message}</p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <Label htmlFor="evaluation-message" className="sr-only">
                  {t.message_placeholder}
                </Label>
                <Textarea
                  id="evaluation-message"
                  rows={2}
                  placeholder={t.message_placeholder}
                  className="flex-1"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => sendMessage.mutate()}
                  disabled={sendMessage.isPending || !message.trim()}
                  className="shrink-0"
                >
                  <Send aria-hidden />
                  {t.message_send}
                </Button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-20 mt-8 flex flex-wrap items-center justify-between gap-3 rounded-t-lg border-t border-border bg-card px-5 py-4 shadow-float">
        <div className="flex min-w-0 items-center gap-3">
          <StatusBadge status={status} />
          <p className="hidden truncate text-small text-muted-foreground sm:block">{orgName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" onClick={() => saveDraft.mutate(undefined)} disabled={busy}>
            <Save aria-hidden />
            {t.save_draft}
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirm("return")}
            disabled={busy || status === "returned"}
            className="border-danger/40 text-danger hover:bg-danger/5 hover:text-danger"
          >
            <Undo2 aria-hidden />
            {t.return}
          </Button>
          <Button onClick={() => setConfirm("approve")} disabled={busy || status === "approved"}>
            <Check aria-hidden />
            {t.approve}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "approve" ? t.approve_confirm_title : t.return_confirm_title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "approve" ? t.approve_confirm_desc : t.return_confirm_desc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-3">
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={runConfirmed}
              className={cn(confirm === "return" && "bg-danger text-danger-foreground hover:bg-danger/90")}
            >
              {confirm === "approve" ? t.approve : t.return}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EvaluationDetails;
