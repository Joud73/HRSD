import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Calculator, CheckCircle2, ChevronLeft, ChevronRight, FileText, Paperclip, X } from "lucide-react";
import { assessmentCopy as t } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { ease, transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import IndicatorNav, { type IndicatorState } from "@/components/assessment/IndicatorNav";
import ImprovementPlanPanel from "@/components/assessment/ImprovementPlanPanel";
import EvidencePanel from "@/components/assessment/EvidencePanel";
import NotesPanel from "@/components/assessment/NotesPanel";
import TaskDialog from "@/components/assessment/TaskDialog";
import {
  coursesData,
  type EvidenceRecord,
  type ImprovementTask,
  type Indicator,
  type NoteRecord,
  type VerificationItem,
} from "@/components/assessment/indicatorsData";
import { RESULT, itemKey, stripOrdinal, type ResultType } from "@/components/assessment/indicatorUtils";

type PanelTab = "plan" | "evidence" | "notes";

const TrackAssessment = ({ courseSlug }: { courseSlug?: string }) => {
  const { toast } = useToast();
  const reduced = useReducedMotion();

  // Find the current course
  const currentCourse = coursesData.find((c) => c.slug === courseSlug) || coursesData[0];
  const allIndicators = currentCourse.criteria.flatMap((c) => c.indicators);

  // Selected indicator in the navigation list
  const [selectedId, setSelectedId] = useState<string>(allIndicators[0]?.id ?? "");

  // Checked items, keyed per indicator (item ids repeat across indicators): { [indicatorId::itemId]: boolean }
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // State for indicator results: { [indicatorId]: ResultType }
  const [indicatorResults, setIndicatorResults] = useState<Record<string, ResultType>>({});

  // Active detail tab per indicator
  const [activeButtons, setActiveButtons] = useState<Record<string, PanelTab | null>>({});

  // Evidence records state with localStorage persistence
  const [evidenceRecords, setEvidenceRecords] = useState<EvidenceRecord[]>(() => {
    const saved = localStorage.getItem(`evidence-${courseSlug}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Improvement tasks state with localStorage persistence
  const [improvementTasks, setImprovementTasks] = useState<ImprovementTask[]>(() => {
    const saved = localStorage.getItem(`improvement-tasks-${courseSlug}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Team members state with localStorage persistence
  const [teamMembers, setTeamMembers] = useState<string[]>(() => {
    const saved = localStorage.getItem(`team-members-${courseSlug}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Notes state with localStorage persistence
  const [notes, setNotes] = useState<NoteRecord[]>(() => {
    const saved = localStorage.getItem(`notes-${courseSlug}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Note input and inline validation per indicator
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [noteErrors, setNoteErrors] = useState<Record<string, string | undefined>>({});

  // Modal states
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [activeIndicatorForTask, setActiveIndicatorForTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<ImprovementTask | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newMemberName, setNewMemberName] = useState("");

  // Persist evidence to localStorage
  useEffect(() => {
    localStorage.setItem(`evidence-${courseSlug}`, JSON.stringify(evidenceRecords));
  }, [evidenceRecords, courseSlug]);

  // Persist improvement tasks to localStorage
  useEffect(() => {
    localStorage.setItem(`improvement-tasks-${courseSlug}`, JSON.stringify(improvementTasks));
  }, [improvementTasks, courseSlug]);

  // Persist team members to localStorage
  useEffect(() => {
    localStorage.setItem(`team-members-${courseSlug}`, JSON.stringify(teamMembers));
  }, [teamMembers, courseSlug]);

  // Persist notes to localStorage
  useEffect(() => {
    localStorage.setItem(`notes-${courseSlug}`, JSON.stringify(notes));
  }, [notes, courseSlug]);

  // File input refs, per item of the visible indicator
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const formTopRef = useRef<HTMLDivElement | null>(null);

  // Helper to get item label from item index
  const getItemLabel = (index: number): string => {
    const labels = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"];
    return `البند ${labels[index] || index + 1}`;
  };

  // Stored date stamp, DD-MM
  const stampDate = (): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${day}-${month}`;
  };

  const isChecked = (indicatorId: string, itemId: string) => !!checkedItems[itemKey(indicatorId, itemId)];
  const answeredCount = (indicator: Indicator) => indicator.items.filter((item) => isChecked(indicator.id, item.id)).length;

  // Get evidence count for an indicator
  const getEvidenceCount = (indicatorId: string): number => {
    return evidenceRecords.filter((e) => e.indicatorId === indicatorId && !e.hidden).length;
  };

  const stateOf = (indicator: Indicator): IndicatorState => {
    const answered = answeredCount(indicator);
    if (answered === indicator.items.length && indicator.items.length > 0) return "complete";
    if (answered > 0 || getEvidenceCount(indicator.id) > 0) return "in_progress";
    return "not_started";
  };

  const handleTabChange = (indicatorId: string, tab: PanelTab) => {
    setActiveButtons((prev) => ({ ...prev, [indicatorId]: tab }));
  };

  const handleCheckChange = (indicatorId: string, itemId: string, checked: boolean) => {
    setCheckedItems((prev) => ({ ...prev, [itemKey(indicatorId, itemId)]: checked }));
  };

  const handleUploadClick = (itemId: string) => {
    fileInputRefs.current[itemId]?.click();
  };

  const handleFileChange = (itemId: string, indicatorId: string, itemIndex: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    // Create evidence record
    const newEvidence: EvidenceRecord = {
      id: `${itemId}-${Date.now()}`,
      indicatorId,
      itemId,
      itemLabel: getItemLabel(itemIndex),
      fileName: file.name,
      uploadedAt: stampDate(),
      status: "غير معتمد",
      hidden: false,
    };

    setEvidenceRecords((prev) => [...prev, newEvidence]);
    toast({ title: t.evidence_attached, description: file.name });
  };

  const handleGeneralEvidenceUpload = (indicatorId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const newEvidence: EvidenceRecord = {
      id: `general-${indicatorId}-${Date.now()}`,
      indicatorId,
      itemId: `general-${indicatorId}`,
      itemLabel: t.evidence_general_label,
      fileName: file.name,
      uploadedAt: stampDate(),
      status: "غير معتمد",
      hidden: false,
    };

    setEvidenceRecords((prev) => [...prev, newEvidence]);
    toast({ title: t.evidence_attached, description: file.name });
  };

  const toggleEvidenceVisibility = (evidenceId: string) => {
    setEvidenceRecords((prev) => prev.map((e) => (e.id === evidenceId ? { ...e, hidden: !e.hidden } : e)));
  };

  const deleteEvidence = (evidenceId: string) => {
    setEvidenceRecords((prev) => prev.filter((e) => e.id !== evidenceId));
  };

  const calculateIndicatorResult = (indicator: Indicator) => {
    const checkedCount = answeredCount(indicator);
    const totalItems = indicator.items.length;
    const percentage = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

    let result: ResultType;
    if (percentage === 0) {
      result = "incomplete";
    } else if (percentage < 50) {
      result = "needs_major";
    } else if (percentage < 100) {
      result = "needs_minor";
    } else {
      result = "complete";
    }

    setIndicatorResults((prev) => ({ ...prev, [indicator.id]: result }));

    // Regenerate auto tasks based on result
    regenerateAutoTasks(
      indicator.id,
      result,
      indicator.items.filter((item) => !isChecked(indicator.id, item.id))
    );
  };

  // Generate/regenerate auto tasks for an indicator
  const regenerateAutoTasks = (indicatorId: string, result: ResultType, uncheckedItems: VerificationItem[]) => {
    setImprovementTasks((prev) => {
      const filtered = prev.filter((task) => !(task.indicatorId === indicatorId && task.isAuto));

      // If result is "complete", no auto tasks needed
      if (result === "complete") {
        return filtered;
      }

      // Generate auto tasks for unchecked items (max 2)
      const autoTasks: ImprovementTask[] = uncheckedItems.slice(0, 2).map((item, index) => {
        const text = stripOrdinal(item.text);
        return {
          id: `auto-${indicatorId}-${item.id}-${Date.now()}-${index}`,
          indicatorId,
          type: "آلي",
          taskText: `${t.task_auto_prefix}${text.length > 80 ? `${text.substring(0, 80)}…` : text}`,
          date: stampDate(),
          assignee: "",
          status: "تحت التنفيذ",
          isAuto: true,
        };
      });

      return [...filtered, ...autoTasks];
    });
  };

  // Handle saving a note
  const handleSaveNote = (indicatorId: string) => {
    const noteText = noteInputs[indicatorId]?.trim();

    if (!noteText) {
      setNoteErrors((prev) => ({ ...prev, [indicatorId]: t.notes_required }));
      return;
    }

    const newNote: NoteRecord = {
      id: `note-${indicatorId}-${Date.now()}`,
      indicatorId,
      text: noteText,
      date: stampDate(),
      source: "المنظمة",
    };

    setNotes((prev) => [...prev, newNote]);
    setNoteInputs((prev) => ({ ...prev, [indicatorId]: "" }));
    setNoteErrors((prev) => ({ ...prev, [indicatorId]: undefined }));

    toast({ title: t.notes_saved });
  };

  // Open add task modal
  const openAddTaskModal = (indicatorId: string) => {
    setActiveIndicatorForTask(indicatorId);
    setNewTaskText("");
    setNewTaskAssignee("");
    setIsAddTaskModalOpen(true);
  };

  // Add new manual task
  const handleAddTask = () => {
    if (!newTaskText.trim() || !activeIndicatorForTask) return;

    const newTask: ImprovementTask = {
      id: `manual-${activeIndicatorForTask}-${Date.now()}`,
      indicatorId: activeIndicatorForTask,
      type: "يدوي",
      taskText: newTaskText.trim(),
      date: stampDate(),
      assignee: newTaskAssignee,
      status: "تحت التنفيذ",
      isAuto: false,
    };

    setImprovementTasks((prev) => [...prev, newTask]);
    setIsAddTaskModalOpen(false);
    setNewTaskText("");
    setNewTaskAssignee("");
    setActiveIndicatorForTask(null);
    toast({ title: t.task_added });
  };

  // Open edit task modal
  const openEditTaskModal = (task: ImprovementTask) => {
    setEditingTask(task);
    setNewTaskAssignee(task.assignee);
    setNewTaskText(task.taskText);
    setIsEditTaskModalOpen(true);
  };

  // Save edited task
  const handleSaveEditTask = () => {
    if (!editingTask) return;

    setImprovementTasks((prev) =>
      prev.map((task) =>
        task.id === editingTask.id
          ? {
              ...task,
              assignee: newTaskAssignee,
              taskText: !editingTask.isAuto ? newTaskText : task.taskText,
            }
          : task
      )
    );
    setIsEditTaskModalOpen(false);
    setEditingTask(null);
    setNewTaskAssignee("");
    setNewTaskText("");
    toast({ title: t.task_saved });
  };

  // Delete task (only manual)
  const handleDeleteTask = (task: ImprovementTask) => {
    if (task.isAuto) {
      toast({
        title: t.task_delete_blocked_title,
        description: t.task_delete_blocked_desc,
        variant: "destructive",
      });
      return;
    }
    setImprovementTasks((prev) => prev.filter((x) => x.id !== task.id));
  };

  // Update task status
  const handleStatusChange = (taskId: string, newStatus: ImprovementTask["status"]) => {
    setImprovementTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)));
  };

  // Add team member
  const handleAddTeamMember = () => {
    if (!newMemberName.trim()) return;
    if (!teamMembers.includes(newMemberName.trim())) {
      setTeamMembers((prev) => [...prev, newMemberName.trim()]);
    }
    setNewMemberName("");
  };

  // ---------- Derived view data ----------
  const selectedIndex = Math.max(0, allIndicators.findIndex((i) => i.id === selectedId));
  const indicator = allIndicators[selectedIndex];
  const criterionIndex = currentCourse.criteria.findIndex((c) => c.indicators.some((i) => i.id === indicator?.id));
  const criterion = currentCourse.criteria[criterionIndex];
  const indicatorNumber = `${formatNumber(criterionIndex + 1)}.${formatNumber((criterion?.indicators.findIndex((i) => i.id === indicator?.id) ?? 0) + 1)}`;

  const totalItems = allIndicators.reduce((sum, i) => sum + i.items.length, 0);
  const totalAnswered = allIndicators.reduce((sum, i) => sum + answeredCount(i), 0);
  const completeIndicators = allIndicators.filter((i) => stateOf(i) === "complete").length;
  const trackEvidence = evidenceRecords.filter((e) => !e.hidden).length;
  const trackPct = totalItems > 0 ? Math.round((totalAnswered / totalItems) * 100) : 0;

  const goTo = (index: number) => {
    const next = allIndicators[index];
    if (!next) return;
    setSelectedId(next.id);
    formTopRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  const trackTitle = `${t.page_title_prefix} ${currentCourse.name}`;

  return (
    <>
      <PageHeader
        title={trackTitle}
        description={t.page_desc}
        breadcrumbs={[{ label: t.crumb_portal, to: "/dashboard" }, { label: t.crumb_assessment }, { label: trackTitle }]}
        meta={
          <section aria-label={t.progress_label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <p className="text-small font-hrsd-medium text-ink">
                {t.progress_label} <span className="tabular ms-2 text-primary">{formatNumber(trackPct)}%</span>
              </p>
              <dl className="flex flex-wrap gap-x-6 gap-y-1 text-small text-muted-foreground">
                <div className="flex gap-2">
                  <dt>{t.progress_items}</dt>
                  <dd className="tabular font-hrsd-medium text-ink">
                    {formatNumber(totalAnswered)} / {formatNumber(totalItems)}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt>{t.progress_indicators}</dt>
                  <dd className="tabular font-hrsd-medium text-ink">
                    {formatNumber(completeIndicators)} / {formatNumber(allIndicators.length)}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt>{t.progress_evidence}</dt>
                  <dd className="tabular font-hrsd-medium text-ink">{formatNumber(trackEvidence)}</dd>
                </div>
              </dl>
            </div>
            <div
              role="progressbar"
              aria-label={t.progress_label}
              aria-valuemin={0}
              aria-valuemax={totalItems}
              aria-valuenow={totalAnswered}
              className="mt-3 h-2 overflow-hidden rounded-full bg-section-alt"
            >
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: `${trackPct}%` }}
                transition={reduced ? { duration: 0 } : { duration: 0.6, ease }}
              />
            </div>
          </section>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
        <IndicatorNav
          course={currentCourse}
          selectedId={indicator?.id ?? ""}
          onSelect={setSelectedId}
          answered={answeredCount}
          stateOf={stateOf}
        />

        <div ref={formTopRef} className="min-w-0 scroll-mt-24">
          {indicator && (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={indicator.id}
                initial={reduced ? { opacity: 0 } : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, transition: transition.micro }}
                transition={transition.ui}
                className="flex flex-col gap-6"
              >
                {/* Indicator and its verification items */}
                <article className="rounded-lg border border-border bg-card">
                  <header className="flex flex-col gap-3 border-b border-border p-5 md:p-6">
                    <p className="text-caption text-muted-foreground">
                      {t.standard_label} {formatNumber(criterionIndex + 1)}: {criterion ? stripOrdinal(criterion.name) : "—"}
                      <span aria-hidden className="mx-2">
                        ·
                      </span>
                      {t.indicator_label} {indicatorNumber}
                    </p>
                    <h2 className="text-h3 text-ink">{stripOrdinal(indicator.title)}</h2>
                    <div className="flex flex-wrap items-center gap-3">
                      {stateOf(indicator) === "complete" ? (
                        <span className="inline-flex h-7 items-center gap-1.5 text-small font-hrsd-medium text-success">
                          <CheckCircle2 aria-hidden className="h-4 w-4" />
                          {t.indicator_complete}
                        </span>
                      ) : (
                        <StatusBadge status={stateOf(indicator)} />
                      )}
                      <span className="tabular text-small text-muted-foreground">
                        {formatNumber(answeredCount(indicator))} {t.of} {formatNumber(indicator.items.length)} {t.items_answered}
                      </span>
                    </div>
                  </header>

                  <div className="px-5 pt-4 md:px-6">
                    <h3 className="text-small font-hrsd-medium text-ink">{t.items_heading}</h3>
                    <p className="text-caption text-muted-foreground">{t.item_check_hint}</p>
                  </div>

                  <ul className="mt-2 divide-y divide-border">
                    {indicator.items.map((item, itemIndex) => {
                      const checked = isChecked(indicator.id, item.id);
                      const files = evidenceRecords.filter((e) => e.indicatorId === indicator.id && e.itemId === item.id && !e.hidden);
                      const checkboxId = `item-${indicator.id}-${item.id}`;
                      return (
                        <li
                          key={item.id}
                          className={cn(
                            "flex flex-col gap-3 px-5 py-4 transition-colors duration-micro sm:flex-row sm:items-start sm:gap-4 md:px-6",
                            checked && "bg-primary/5"
                          )}
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <Checkbox
                              id={checkboxId}
                              checked={checked}
                              onCheckedChange={(value) => handleCheckChange(indicator.id, item.id, value === true)}
                              className="mt-1 h-5 w-5 rounded-[4px]"
                            />
                            <div className="min-w-0 flex-1">
                              <label htmlFor={checkboxId} className="block cursor-pointer">
                                <span className="block text-caption text-muted-foreground">
                                  {t.item_label} {formatNumber(itemIndex + 1)}
                                </span>
                                <span className="block text-body text-ink">{stripOrdinal(item.text)}</span>
                              </label>
                              {files.length > 0 && (
                                <ul className="mt-3 flex flex-wrap gap-2">
                                  {files.map((file) => (
                                    <li
                                      key={file.id}
                                      className="inline-flex h-8 max-w-full items-center gap-2 rounded-full border border-border bg-section-alt pe-1 ps-3 text-caption text-ink"
                                    >
                                      <FileText aria-hidden className="h-3.5 w-3.5 shrink-0 text-primary" />
                                      <span className="max-w-[200px] truncate" dir="auto">
                                        {file.fileName}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => deleteEvidence(file.id)}
                                        aria-label={`${t.remove_file} ${file.fileName}`}
                                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-micro hover:bg-danger/10 hover:text-danger"
                                      >
                                        <X aria-hidden className="h-3.5 w-3.5" />
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                          <div className="ps-8 sm:ps-0">
                            <Button variant="outline" size="sm" onClick={() => handleUploadClick(item.id)} className="text-small">
                              <Paperclip aria-hidden />
                              {files.length > 0 ? t.attach_another : t.attach_evidence}
                            </Button>
                            <input
                              type="file"
                              ref={(el) => (fileInputRefs.current[item.id] = el)}
                              onChange={(e) => handleFileChange(item.id, indicator.id, itemIndex, e)}
                              className="hidden"
                              tabIndex={-1}
                              aria-hidden
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <footer className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
                    <p className="flex items-center gap-2 text-small" aria-live="polite">
                      <span className="text-muted-foreground">{t.result_label}:</span>
                      <motion.span
                        key={indicatorResults[indicator.id] ?? "pending"}
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: 1 }}
                        transition={transition.ui}
                        className={cn("inline-flex items-center gap-1.5 font-hrsd-medium", RESULT[indicatorResults[indicator.id] ?? "pending"].text)}
                      >
                        <span aria-hidden className={cn("h-2 w-2 rounded-full", RESULT[indicatorResults[indicator.id] ?? "pending"].dot)} />
                        {RESULT[indicatorResults[indicator.id] ?? "pending"].label}
                      </motion.span>
                    </p>
                    <Button variant="outline" onClick={() => calculateIndicatorResult(indicator)}>
                      <Calculator aria-hidden />
                      {t.result_calculate}
                    </Button>
                  </footer>
                </article>

                {/* Improvement plan, evidence, notes */}
                <section aria-label={t.tabs_label} className="rounded-lg border border-border bg-card">
                  <Tabs
                    dir="rtl"
                    value={activeButtons[indicator.id] ?? "evidence"}
                    onValueChange={(v) => handleTabChange(indicator.id, v as PanelTab)}
                  >
                    <TabsList className="scrollbar-thin flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-none rounded-t-lg border-b border-border bg-transparent p-0 px-3 md:px-4">
                      {(
                        [
                          { value: "evidence", label: t.tab_evidence, count: getEvidenceCount(indicator.id) },
                          { value: "plan", label: t.tab_plan, count: improvementTasks.filter((x) => x.indicatorId === indicator.id).length },
                          { value: "notes", label: t.tab_notes, count: notes.filter((n) => n.indicatorId === indicator.id).length },
                        ] as { value: PanelTab; label: string; count: number }[]
                      ).map((tab) => {
                        const active = (activeButtons[indicator.id] ?? "evidence") === tab.value;
                        return (
                          <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="relative h-12 gap-2 rounded-none bg-transparent px-3 text-small font-hrsd-medium text-muted-foreground shadow-none transition-colors duration-micro hover:text-ink data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                          >
                            {tab.label}
                            {tab.count > 0 && (
                              <span className="tabular rounded-full bg-section-alt px-2 text-caption text-ink">{formatNumber(tab.count)}</span>
                            )}
                            {active && (
                              <motion.span
                                layoutId={`tab-underline-${indicator.id}`}
                                transition={reduced ? { duration: 0 } : transition.ui}
                                className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary"
                              />
                            )}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>

                    <div className="p-5 md:p-6">
                      <TabsContent value="evidence" className="mt-0">
                        <EvidencePanel
                          records={evidenceRecords.filter((e) => e.indicatorId === indicator.id)}
                          onToggle={toggleEvidenceVisibility}
                          onDelete={deleteEvidence}
                          onUploadGeneral={(e) => handleGeneralEvidenceUpload(indicator.id, e)}
                        />
                      </TabsContent>
                      <TabsContent value="plan" className="mt-0">
                        <ImprovementPlanPanel
                          tasks={improvementTasks.filter((x) => x.indicatorId === indicator.id)}
                          onAdd={() => openAddTaskModal(indicator.id)}
                          onEdit={openEditTaskModal}
                          onDelete={handleDeleteTask}
                          onStatusChange={handleStatusChange}
                        />
                      </TabsContent>
                      <TabsContent value="notes" className="mt-0">
                        <NotesPanel
                          indicatorId={indicator.id}
                          notes={notes.filter((n) => n.indicatorId === indicator.id)}
                          value={noteInputs[indicator.id] || ""}
                          error={noteErrors[indicator.id]}
                          onChange={(value) => {
                            setNoteInputs((prev) => ({ ...prev, [indicator.id]: value }));
                            if (noteErrors[indicator.id]) setNoteErrors((prev) => ({ ...prev, [indicator.id]: undefined }));
                          }}
                          onSave={() => handleSaveNote(indicator.id)}
                        />
                      </TabsContent>
                    </div>
                  </Tabs>
                </section>

                {/* Previous / next indicator */}
                <nav className="flex items-center justify-between gap-3">
                  <Button variant="outline" onClick={() => goTo(selectedIndex - 1)} disabled={selectedIndex === 0}>
                    <ChevronRight aria-hidden />
                    {t.prev_indicator}
                  </Button>
                  <Button onClick={() => goTo(selectedIndex + 1)} disabled={selectedIndex >= allIndicators.length - 1}>
                    {t.next_indicator}
                    <ChevronLeft aria-hidden />
                  </Button>
                </nav>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      <TaskDialog
        open={isAddTaskModalOpen}
        onOpenChange={setIsAddTaskModalOpen}
        mode="add"
        taskText={newTaskText}
        onTaskTextChange={setNewTaskText}
        assignee={newTaskAssignee}
        onAssigneeChange={setNewTaskAssignee}
        teamMembers={teamMembers}
        memberName={newMemberName}
        onMemberNameChange={setNewMemberName}
        onAddMember={handleAddTeamMember}
        onSubmit={handleAddTask}
        onCancel={() => setIsAddTaskModalOpen(false)}
      />

      {/* Edit Task Modal */}
      <TaskDialog
        open={isEditTaskModalOpen}
        onOpenChange={setIsEditTaskModalOpen}
        mode="edit"
        isAuto={editingTask?.isAuto}
        taskText={newTaskText}
        onTaskTextChange={setNewTaskText}
        assignee={newTaskAssignee}
        onAssigneeChange={setNewTaskAssignee}
        teamMembers={teamMembers}
        memberName={newMemberName}
        onMemberNameChange={setNewMemberName}
        onAddMember={handleAddTeamMember}
        onSubmit={handleSaveEditTask}
        onCancel={() => {
          setIsEditTaskModalOpen(false);
          setEditingTask(null);
        }}
      />
    </>
  );
};

/** Remount per track so state is read from, and saved to, the right track's storage keys. */
const TechnicalEvaluationIndicators = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  return <TrackAssessment key={courseSlug} courseSlug={courseSlug} />;
};

export default TechnicalEvaluationIndicators;
