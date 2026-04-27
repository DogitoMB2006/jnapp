import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Compass, MapPin, CalendarDays, Sparkles } from "lucide-react";
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
import type { Salida, Profile } from "../../../types";

export function SalidasPage() {
  const { user, profile } = useAuthStore();
  const { group } = useGroupStore();
  const [items, setItems] = useState<Salida[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAiIdeas, setShowAiIdeas] = useState(false);
  const [editItem, setEditItem] = useState<Salida | null>(null);
  const [form, setForm] = useState({ title: "", description: "", date: "", location: "" });
  const [saving, setSaving] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const { t } = useTranslation();
  const { pendingItemId, clearPendingItemId } = useNavigationStore();
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pendingItemId) return;
    setHighlightedId(pendingItemId);
    clearPendingItemId();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const loadProfiles = async (items: Salida[]) => {
    const ids = [...new Set(items.flatMap((i) => [i.created_by, i.edited_by].filter(Boolean) as string[]))];
    if (!ids.length) return;
    const { data } = await insforge.database.from("profiles").select("*").in("user_id", ids);
    if (data) {
      const map: Record<string, Profile> = {};
      (data as Profile[]).forEach((p) => (map[p.user_id] = p));
      setProfiles((prev) => ({ ...prev, ...map }));
    }
  };

  const fetchSalidas = async (opts?: { silent?: boolean }) => {
    if (!group) return;
    const { data } = await insforge.database.from("salidas").select("*").eq("group_id", group.id).order("created_at", { ascending: false });
    if (data) { setItems(data as Salida[]); await loadProfiles(data as Salida[]); }
    if (!opts?.silent) setLoading(false);
  };

  useEffect(() => {
    if (!group?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    void fetchSalidas();
  }, [group?.id]);

  useSectionDataSync(() => fetchSalidas({ silent: true }));
  useOnSectionRefresh("salidas", () => {
    void fetchSalidas({ silent: true });
  });

  useRealtime("salidas", (payload) => {
    const msg = parseTableChangePayload(payload);
    if (!msg) return;
    if (msg.op === "DELETE") {
      const id = msg.id;
      if (!id) return;
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    const row = msg.record as unknown as Salida & { op?: string };
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
      const { data, error } = await insforge.database.from("salidas").update({
        title: form.title.trim(), description: form.description || null,
        date: form.date || null, location: form.location || null,
        edited_by: user.id, last_edited_at: new Date().toISOString(),
      }).eq("id", editItem.id).select("*");
      if (error || !data?.length) {
        toast.error(t("salidas.saveError"));
        setSaving(false);
        return;
      }
      const row = data[0] as Salida;
      setItems((prev) => prev.map((i) => (i.id === row.id ? row : i)));
      void loadProfiles([row]);
    } else {
      const { data, error } = await insforge.database.from("salidas").insert([{
        title: form.title.trim(), description: form.description || null,
        date: form.date || null, location: form.location || null, created_by: user.id, group_id: group.id,
      }]).select("*");
      if (error || !data?.length) {
        toast.error(t("salidas.addError"));
        setSaving(false);
        return;
      }
      const row = data[0] as Salida;
      setItems((prev) => (prev.some((i) => i.id === row.id) ? prev : [row, ...prev]));
      void loadProfiles([row]);
      void notifyPartnerNewContent({
        actorUserId: user.id,
        displayName: profile?.display_name || profile?.username || "Tu pareja",
        section: "salidas",
        detail: row.title,
        itemId: row.id,
      });
    }
    toast.success(editItem ? t("salidas.edited") : t("salidas.added"));
    setShowModal(false); setEditItem(null); setForm({ title: "", description: "", date: "", location: "" });
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success(t("salidas.deleted"));
    const { error } = await insforge.database.from("salidas").delete().eq("id", id);
    if (error) {
      toast.error(t("salidas.deleteError"));
      await fetchSalidas({ silent: true });
    }
  };

  const openEdit = (item: Salida) => {
    setEditItem(item);
    setForm({ title: item.title, description: item.description || "", date: item.date || "", location: item.location || "" });
    setShowModal(true);
  };

  const useAiIdea = (idea: { title: string; description: string; location?: string }) => {
    setEditItem(null);
    setForm({ title: idea.title, description: idea.description, date: "", location: idea.location || "" });
    setShowAiIdeas(false);
    setShowModal(true);
  };

  return (
    <div className="relative min-h-full">
      {loading ? (
        <div className="flex justify-center py-12"><span className="loading loading-dots loading-md text-primary" /></div>
      ) : items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 gap-3">
          <Compass size={40} className="text-base-content/20" />
          <p className="text-base-content/40 text-sm">{t("salidas.empty")}</p>
          <div className="flex gap-2">
            <button onClick={() => setShowAiIdeas(true)} className="btn btn-ghost btn-sm gap-2 border border-white/10"><Sparkles size={16} /> {t("aiIdeas.emptyButton")}</button>
            <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm gap-2"><Plus size={16} /> {t("salidas.plan")}</button>
          </div>
        </motion.div>
      ) : (
        <AnimatePresence>
          {items.map((item) => (
            <ItemCard
              key={item.id}
              itemId={item.id}
              highlighted={item.id === highlightedId}
              title={item.title}
              subtitle={item.description || undefined}
              creator={profiles[item.created_by]}
              editedBy={item.edited_by ? profiles[item.edited_by] : undefined}
              lastEditedAt={item.last_edited_at}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item.id)}
            >
              <div className="flex flex-wrap gap-2 mt-1">
                {item.date && (
                  <div className="flex items-center gap-1">
                    <CalendarDays size={12} className="text-primary" />
                    <span className="text-xs text-primary">{formatDate(item.date)}</span>
                  </div>
                )}
                {item.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={12} className="text-secondary" />
                    <span className="text-xs text-secondary">{item.location}</span>
                  </div>
                )}
              </div>
              <PostInteractions
                targetType="salidas"
                targetId={item.id}
                groupId={group?.id}
                userId={user?.id}
              />
            </ItemCard>
          ))}
        </AnimatePresence>
      )}

      <motion.button whileTap={{ scale: 0.92 }}
        onClick={() => { setEditItem(null); setForm({ title: "", description: "", date: "", location: "" }); setShowModal(true); }}
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
        section="salidas"
        existingTitles={items.map((item) => item.title)}
        existingItems={items.map((item) => [
          item.title,
          item.description ? `description: ${item.description}` : "",
          item.location ? `location: ${item.location}` : "",
          item.date ? `date: ${item.date}` : "",
        ].filter(Boolean).join(" | "))}
        onClose={() => setShowAiIdeas(false)}
        onUse={useAiIdea}
      />

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem ? t("salidas.editModal") : t("salidas.newModal")}>
        <div className="flex flex-col gap-3">
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder={t("salidas.wherePlaceholder")} className="input input-bordered w-full bg-base-100 focus:outline-primary" autoFocus />
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder={t("salidas.descPlaceholder")} className="textarea textarea-bordered w-full bg-base-100 resize-none" rows={2} />
          <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder={t("salidas.locationPlaceholder")} className="input input-bordered w-full bg-base-100 focus:outline-primary" />
          <div className="form-control">
            <label className="label py-0"><span className="label-text text-xs">{t("salidas.datePlaceholder")}</span></label>
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="input input-bordered w-full bg-base-100 focus:outline-primary" />
          </div>
          <button onClick={handleSave} disabled={!form.title.trim() || saving} className="btn btn-primary w-full gap-2">
            {saving ? <span className="loading loading-spinner loading-sm" /> : editItem ? t("salidas.save") : <><Plus size={16} /> {t("salidas.add")}</>}
          </button>
        </div>
      </Modal>
    </div>
  );
}
