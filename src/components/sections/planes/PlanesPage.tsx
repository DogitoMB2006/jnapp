import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Map, CalendarDays } from "lucide-react";
import toast from "react-hot-toast";
import { ItemCard } from "../../shared/ItemCard";
import { Modal } from "../../shared/Modal";
import { useRealtime } from "../../../hooks/useRealtime";
import { useSectionDataSync } from "../../../hooks/useSectionDataSync";
import insforge from "../../../lib/insforge";
import { notifyPartnerNewContent } from "../../../lib/notifyPartner";
import { parseTableChangePayload } from "../../../lib/realtimePayload";
import { isLikelyNotificationRealtimeRow } from "../../../lib/realtimeGuards";
import { useAuthStore } from "../../../store/authStore";
import { useGroupStore } from "../../../store/groupStore";
import { formatDate } from "../../../lib/utils";
import type { Plan, Profile } from "../../../types";

export function PlanesPage() {
  const { user, profile } = useAuthStore();
  const { group } = useGroupStore();
  const [items, setItems] = useState<Plan[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Plan | null>(null);
  const [form, setForm] = useState({ title: "", description: "", date: "" });
  const [saving, setSaving] = useState(false);

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
        date: form.date || null, edited_by: user.id, last_edited_at: new Date().toISOString(),
      }).eq("id", editItem.id).select("*");
      if (error || !data?.length) {
        toast.error("Error al guardar");
        setSaving(false);
        return;
      }
      const row = data[0] as Plan;
      setItems((prev) => prev.map((i) => (i.id === row.id ? row : i)));
      void loadProfiles([row]);
    } else {
      const { data, error } = await insforge.database.from("planes").insert([{
        title: form.title.trim(), description: form.description.trim() || null,
        date: form.date || null, created_by: user.id, group_id: group.id,
      }]).select("*");
      if (error || !data?.length) {
        toast.error("Error al agregar");
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
      });
    }
    toast.success(editItem ? "Plan editado" : "Plan agregado");
    setShowModal(false); setEditItem(null); setForm({ title: "", description: "", date: "" });
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Eliminado");
    const { error } = await insforge.database.from("planes").delete().eq("id", id);
    if (error) {
      toast.error("No se pudo eliminar");
      await fetchPlanes({ silent: true });
    }
  };

  const openEdit = (item: Plan) => {
    setEditItem(item); setForm({ title: item.title, description: item.description || "", date: item.date || "" });
    setShowModal(true);
  };

  return (
    <div className="relative min-h-full">
      {loading ? (
        <div className="flex justify-center py-12"><span className="loading loading-dots loading-md text-primary" /></div>
      ) : items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 gap-3">
          <Map size={40} className="text-base-content/20" />
          <p className="text-base-content/40 text-sm">Sin planes aún</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm gap-2"><Plus size={16} /> Crear plan</button>
        </motion.div>
      ) : (
        <AnimatePresence>
          {items.map((item) => (
            <ItemCard
              key={item.id}
              title={item.title}
              subtitle={item.description || undefined}
              meta={item.date ? formatDate(item.date) : undefined}
              creator={profiles[item.created_by]}
              editedBy={item.edited_by ? profiles[item.edited_by] : undefined}
              lastEditedAt={item.last_edited_at}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item.id)}
            >
              {item.date && (
                <div className="flex items-center gap-1 mt-1">
                  <CalendarDays size={12} className="text-primary" />
                  <span className="text-xs text-primary">{formatDate(item.date)}</span>
                </div>
              )}
            </ItemCard>
          ))}
        </AnimatePresence>
      )}

      <motion.button whileTap={{ scale: 0.92 }} onClick={() => { setEditItem(null); setForm({ title: "", description: "", date: "" }); setShowModal(true); }}
        className="fixed bottom-20 right-4 btn btn-primary btn-circle shadow-lg shadow-primary/30">
        <Plus size={22} />
      </motion.button>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem ? "Editar plan" : "Nuevo plan"}>
        <div className="flex flex-col gap-3">
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="¿Qué planean hacer?" className="input input-bordered w-full bg-base-100 focus:outline-primary" autoFocus />
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Descripción (opcional)" className="textarea textarea-bordered w-full bg-base-100 resize-none" rows={2} />
          <div className="form-control">
            <label className="label py-0"><span className="label-text text-xs">Fecha (opcional)</span></label>
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="input input-bordered w-full bg-base-100 focus:outline-primary" />
          </div>
          <button onClick={handleSave} disabled={!form.title.trim() || saving} className="btn btn-primary w-full gap-2">
            {saving ? <span className="loading loading-spinner loading-sm" /> : editItem ? "Guardar" : <><Plus size={16} /> Agregar</>}
          </button>
        </div>
      </Modal>
    </div>
  );
}
