import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Compass, Map, MapPin, Plus, CalendarDays, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { ItemCard } from "../../shared/ItemCard";
import { Modal } from "../../shared/Modal";
import { AiIdeasModal } from "../../shared/AiIdeasModal";
import { PostInteractions } from "../../shared/PostInteractions";
import { useRealtime } from "../../../hooks/useRealtime";
import { useOnSectionRefresh } from "../../../hooks/useOnSectionRefresh";
import { useSectionDataSync } from "../../../hooks/useSectionDataSync";
import insforge from "../../../lib/insforge";
import { notifyPartnerNewContent } from "../../../lib/notifyPartner";
import { parseTableChangePayload } from "../../../lib/realtimePayload";
import { isLikelyNotificationRealtimeRow } from "../../../lib/realtimeGuards";
import { useAuthStore } from "../../../store/authStore";
import { useGroupStore } from "../../../store/groupStore";
import { useNavigationStore } from "../../../store/navigationStore";
import { formatDate } from "../../../lib/utils";
import type { Plan, Profile } from "../../../types";

type PlanKind = "plan" | "outing";

const emptyForm = (kind: PlanKind = "plan") => ({
  title: "",
  description: "",
  date: "",
  location: "",
  kind,
  completed: false,
});

export function PlanesPage() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const group = useGroupStore((s) => s.group);
  const [items, setItems] = useState<Plan[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showAiIdeas, setShowAiIdeas] = useState(false);
  const [editItem, setEditItem] = useState<Plan | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const { t } = useTranslation();
  const { pendingItemId, clearPendingItemId } = useNavigationStore();
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Consume pending deep-link item on mount
  useEffect(() => {
    if (!pendingItemId) return;
    setHighlightedId(pendingItemId);
    clearPendingItemId();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to highlighted item once it's rendered
  useEffect(() => {
    if (!highlightedId || loading) return;
    const el = document.querySelector(`[data-item-id="${highlightedId}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightedId(null), 2500);
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, [highlightedId, loading, items]);

  const loadProfiles = async (items: Plan[]) => {
    const ids = [...new Set(items.flatMap((i) => [i.created_by, i.edited_by].filter(Boolean) as string[]))];
    if (!ids.length) return;
    const { data } = await insforge.database.from("profiles").select("*").in("user_id", ids);
    if (data) {
      const map: Record<string, Profile> = {};
      (data as Profile[]).forEach((p) => (map[p.user_id] = p));
      setProfiles((prev) => ({ ...prev, ...map }));
    }
  };

  const fetchPlanes = async (opts?: { silent?: boolean }) => {
    if (!group) return;
    const { data } = await insforge.database.from("planes").select("*").eq("group_id", group.id).order("created_at", { ascending: false });
    if (data) { setItems(data as Plan[]); await loadProfiles(data as Plan[]); }
    if (!opts?.silent) setLoading(false);
  };

  useEffect(() => {
    if (!group?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    void fetchPlanes();
  }, [group?.id]);

  useSectionDataSync(() => fetchPlanes({ silent: true }));
  useOnSectionRefresh("planes", () => {
    void fetchPlanes({ silent: true });
  });

  useRealtime("planes", (payload) => {
    const msg = parseTableChangePayload(payload);
    if (!msg) return;
    if (msg.op === "DELETE") {
      const id = msg.id;
      if (!id) return;
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    const row = msg.record as unknown as Plan & { op?: string };
    if (isLikelyNotificationRealtimeRow(row as unknown as Record<string, unknown>)) return;
    const rid = typeof row.id === "string" ? row.id : String(row.id ?? "");
    if (!rid) return;
    if (msg.op === "INSERT") {
      const item = row;
      setItems((prev) => (prev.some((i) => i.id === rid) ? prev : [item, ...prev]));
      void loadProfiles([item]);
    } else if (msg.op === "UPDATE") {
      const item = row;
      setItems((prev) => prev.map((i) => (i.id === rid ? item : i)));
    }
  });

  const handleSave = async () => {
    if (!form.title.trim() || !user || saving) return;
    setSaving(true);
    if (!group) { setSaving(false); return; }
    if (editItem) {
      const { data, error } = await insforge.database.from("planes").update({
        title: form.title.trim(), description: form.description.trim() || null,
        date: form.date || null,
        kind: form.kind,
        location: form.kind === "outing" ? form.location.trim() || null : null,
        completed: form.kind === "outing" ? form.completed : false,
        edited_by: user.id,
        last_edited_at: new Date().toISOString(),
      }).eq("id", editItem.id).select("*");
      if (error || !data?.length) {
        toast.error(t("planes.saveError"));
        setSaving(false);
        return;
      }
      const row = data[0] as Plan;
      setItems((prev) => prev.map((i) => (i.id === row.id ? row : i)));
      void loadProfiles([row]);
    } else {
      const { data, error } = await insforge.database.from("planes").insert([{
        title: form.title.trim(), description: form.description.trim() || null,
        date: form.date || null,
        kind: form.kind,
        location: form.kind === "outing" ? form.location.trim() || null : null,
        completed: form.kind === "outing" ? form.completed : false,
        created_by: user.id,
        group_id: group.id,
      }]).select("*");
      if (error || !data?.length) {
        toast.error(t("planes.addError"));
        setSaving(false);
        return;
      }
      const row = data[0] as Plan;
      setItems((prev) => (prev.some((i) => i.id === row.id) ? prev : [row, ...prev]));
      void loadProfiles([row]);
      void notifyPartnerNewContent({
        actorUserId: user.id,
        displayName: profile?.display_name || profile?.username || "Tu pareja",
        section: "planes",
        detail: row.title,
        itemId: row.id,
      });
    }
    toast.success(editItem ? t("planes.edited") : t("planes.added"));
    setShowModal(false); setEditItem(null); setForm(emptyForm());
    setSaving(false);
  };

  const handleDelete = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success(t("planes.deleted"));
    const { error } = await insforge.database.from("planes").delete().eq("id", id);
    if (error) {
      toast.error(t("planes.deleteError"));
      await fetchPlanes({ silent: true });
    }
  }, [t]);

  const handleToggleCompleted = useCallback(async (item: Plan) => {
    if (item.kind !== "outing") return;
    const nextCompleted = !item.completed;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, completed: nextCompleted } : i)));
    const { data, error } = await insforge.database
      .from("planes")
      .update({ completed: nextCompleted, last_edited_at: new Date().toISOString() })
      .eq("id", item.id)
      .select("*");
    if (error || !data?.length) {
      toast.error(t("planes.saveError"));
      await fetchPlanes({ silent: true });
      return;
    }
    const row = data[0] as Plan;
    setItems((prev) => prev.map((i) => (i.id === row.id ? row : i)));
  }, [t]);

  const openEdit = useCallback((item: Plan) => {
    const kind = item.kind === "outing" ? "outing" : "plan";
    setEditItem(item); setForm({
      title: item.title,
      description: item.description || "",
      date: item.date || "",
      location: item.location || "",
      kind,
      completed: Boolean(item.completed),
    });
    setShowModal(true);
  }, []);

  const openTypePicker = () => {
    setEditItem(null);
    setForm(emptyForm());
    setShowTypePicker(true);
  };

  const startCreate = (kind: PlanKind) => {
    setEditItem(null);
    setForm(emptyForm(kind));
    setShowTypePicker(false);
    setShowModal(true);
  };

  const handleEditById = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      if (item) openEdit(item);
    },
    [items, openEdit],
  );

  const handleDeleteById = useCallback(
    (id: string) => {
      void handleDelete(id);
    },
    [handleDelete],
  );

  const useAiIdea = (idea: { title: string; description: string }) => {
    setEditItem(null);
    setForm({ ...emptyForm("plan"), title: idea.title, description: idea.description });
    setShowAiIdeas(false);
    setShowModal(true);
  };

  return (
    <div className="relative min-h-full">
      {loading ? (
        <div className="flex justify-center py-12"><span className="loading loading-dots loading-md text-primary" /></div>
      ) : items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 gap-3">
          <Map size={40} className="text-base-content/20" />
          <p className="text-base-content/40 text-sm">{t("planes.empty")}</p>
          <div className="flex gap-2">
            <button onClick={() => setShowAiIdeas(true)} className="btn btn-ghost btn-sm gap-2 border border-white/10"><Sparkles size={16} /> {t("aiIdeas.emptyButton")}</button>
            <button onClick={openTypePicker} className="btn btn-primary btn-sm gap-2"><Plus size={16} /> {t("planes.create")}</button>
          </div>
        </motion.div>
      ) : (
        <AnimatePresence>
          {items.map((item) => {
            const isOuting = item.kind === "outing";
            return (
              <ItemCard
                key={item.id}
                itemId={item.id}
                highlighted={item.id === highlightedId}
                title={item.title}
                subtitle={item.description || undefined}
                meta={item.date ? formatDate(item.date) : undefined}
                creator={profiles[item.created_by]}
                editedBy={item.edited_by ? profiles[item.edited_by] : undefined}
                lastEditedAt={item.last_edited_at}
                onEdit={handleEditById}
                onDelete={handleDeleteById}
              >
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${isOuting ? "bg-secondary/15 text-secondary" : "bg-primary/15 text-primary"}`}>
                    {isOuting ? <Compass size={12} strokeWidth={2.4} /> : <Map size={12} strokeWidth={2.4} />}
                    {isOuting ? t("planes.outing") : t("planes.plan")}
                  </span>
                  {item.date && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                      <CalendarDays size={12} strokeWidth={2.4} />
                      {formatDate(item.date)}
                    </span>
                  )}
                  {isOuting && item.location && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-bold text-secondary">
                      <MapPin size={12} strokeWidth={2.4} />
                      {item.location}
                    </span>
                  )}
                </div>
                {isOuting && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => void handleToggleCompleted(item)}
                    className={`mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-bold transition-colors ${item.completed ? "border-success/30 bg-success/15 text-success" : "border-base-300 bg-base-200/60 text-base-content/60 hover:border-primary/30 hover:text-base-content"}`}
                  >
                    {item.completed ? <CheckCircle2 size={17} strokeWidth={2.5} /> : <Circle size={17} strokeWidth={2.5} />}
                    {item.completed ? t("planes.completed") : t("planes.weWent")}
                  </motion.button>
                )}
                <PostInteractions
                  targetType="planes"
                  targetId={item.id}
                  groupId={group?.id}
                  userId={user?.id}
                />
              </ItemCard>
            )
          })}
        </AnimatePresence>
      )}

      <motion.button whileTap={{ scale: 0.92 }} onClick={openTypePicker}
        className="fixed z-40 bottom-[max(6.5rem,calc(env(safe-area-inset-bottom,0px)+4.5rem))] right-4 btn btn-primary btn-circle shadow-lg shadow-primary/30"
      >
        <Plus size={22} />
      </motion.button>

      <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowAiIdeas(true)}
        className="fixed z-40 bottom-[max(10.5rem,calc(env(safe-area-inset-bottom,0px)+8.5rem))] right-4 btn btn-secondary btn-circle shadow-lg shadow-secondary/30"
      >
        <Sparkles size={20} />
      </motion.button>

      <AiIdeasModal
        open={showAiIdeas}
        section="planes"
        existingTitles={items.map((item) => item.title)}
        existingItems={items.map((item) => [
          item.title,
          item.kind === "outing" ? "outing" : "plan",
          item.description ? `description: ${item.description}` : "",
          item.location ? `location: ${item.location}` : "",
          item.completed ? "completed" : "planned",
          item.date ? `date: ${item.date}` : "",
        ].filter(Boolean).join(" | "))}
        onClose={() => setShowAiIdeas(false)}
        onUse={useAiIdea}
      />

      <Modal open={showTypePicker} onClose={() => setShowTypePicker(false)} title={t("planes.chooseType")}>
        <div className="grid gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => startCreate("plan")}
            className="flex min-h-28 items-center gap-4 rounded-3xl border border-primary/20 bg-primary/10 p-4 text-left transition-colors hover:bg-primary/15"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-content shadow-lg shadow-primary/20">
              <Map size={24} strokeWidth={2.4} />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold text-base-content">{t("planes.plan")}</span>
              <span className="mt-1 block text-sm leading-relaxed text-base-content/55">{t("planes.planHint")}</span>
            </span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => startCreate("outing")}
            className="flex min-h-28 items-center gap-4 rounded-3xl border border-secondary/20 bg-secondary/10 p-4 text-left transition-colors hover:bg-secondary/15"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-content shadow-lg shadow-secondary/20">
              <Compass size={24} strokeWidth={2.4} />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold text-base-content">{t("planes.outing")}</span>
              <span className="mt-1 block text-sm leading-relaxed text-base-content/55">{t("planes.outingHint")}</span>
            </span>
          </motion.button>
        </div>
      </Modal>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem ? t("planes.editModal") : t("planes.newModal")}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-base-300 bg-base-100/40 p-1">
            {(["plan", "outing"] as PlanKind[]).map((kind) => {
              const active = form.kind === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, kind, location: kind === "outing" ? f.location : "", completed: kind === "outing" ? f.completed : false }))}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${active ? "bg-primary text-primary-content shadow-md shadow-primary/20" : "text-base-content/55 hover:bg-base-200"}`}
                >
                  {kind === "outing" ? <Compass size={16} strokeWidth={2.4} /> : <Map size={16} strokeWidth={2.4} />}
                  {kind === "outing" ? t("planes.outing") : t("planes.plan")}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-3 rounded-3xl border border-base-300 bg-base-100/35 p-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              {form.kind === "outing" ? <Compass size={22} strokeWidth={2.35} /> : <CalendarDays size={22} strokeWidth={2.35} />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-base-content">{editItem ? t("planes.editModal") : t("planes.newModal")}</p>
              <p className="text-xs leading-relaxed text-base-content/50">{form.kind === "outing" ? t("planes.outingHint") : t("planes.planHint")}</p>
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="px-1 text-xs font-bold uppercase tracking-wide text-base-content/45">{t("planes.titlePlaceholder")}</span>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t("planes.titlePlaceholder")} className="input input-bordered min-h-12 w-full rounded-2xl bg-base-100/80 text-base focus:outline-primary" autoFocus />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="px-1 text-xs font-bold uppercase tracking-wide text-base-content/45">{t("planes.descPlaceholder")}</span>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder={t("planes.descPlaceholder")} className="textarea textarea-bordered min-h-24 w-full resize-none rounded-2xl bg-base-100/80 text-base leading-relaxed focus:outline-primary" rows={3} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="px-1 text-xs font-bold uppercase tracking-wide text-base-content/45">{t("planes.datePlaceholder")}</span>
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="input input-bordered min-h-12 w-full rounded-2xl bg-base-100/80 text-base focus:outline-primary" />
          </label>
          {form.kind === "outing" && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="px-1 text-xs font-bold uppercase tracking-wide text-base-content/45">{t("planes.locationPlaceholder")}</span>
                <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder={t("planes.locationPlaceholder")} className="input input-bordered min-h-12 w-full rounded-2xl bg-base-100/80 text-base focus:outline-primary" />
              </label>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, completed: !f.completed }))}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border text-sm font-bold transition-colors ${form.completed ? "border-success/30 bg-success/15 text-success" : "border-base-300 bg-base-100/45 text-base-content/65"}`}
              >
                {form.completed ? <CheckCircle2 size={17} strokeWidth={2.5} /> : <Circle size={17} strokeWidth={2.5} />}
                {form.completed ? t("planes.completed") : t("planes.weWent")}
              </button>
            </>
          )}
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={!form.title.trim() || saving} className="btn btn-primary min-h-12 w-full gap-2 rounded-2xl text-sm font-bold disabled:cursor-default disabled:opacity-50">
            {saving ? <span className="loading loading-spinner loading-sm" /> : editItem ? t("planes.save") : <><Plus size={16} /> {t("planes.add")}</>}
          </motion.button>
        </div>
      </Modal>
    </div>
  );
}
