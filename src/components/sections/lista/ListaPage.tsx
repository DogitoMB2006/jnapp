import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ListChecks } from "lucide-react";
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
import type { ListaItem, Profile } from "../../../types";

export function ListaPage() {
  const { user, profile } = useAuthStore();
  const [items, setItems] = useState<ListaItem[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ListaItem | null>(null);
  const [inputText, setInputText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchItems = async (opts?: { silent?: boolean }) => {
    const { data } = await insforge.database
      .from("lista_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setItems(data as ListaItem[]);
      await loadProfiles(data as ListaItem[]);
    }
    if (!opts?.silent) setLoading(false);
  };

  const loadProfiles = async (items: ListaItem[]) => {
    const ids = [
      ...new Set(
        items.flatMap((i) =>
          [i.created_by, i.edited_by].filter(Boolean) as string[]
        )
      ),
    ];
    if (ids.length === 0) return;
    const { data } = await insforge.database
      .from("profiles")
      .select("*")
      .in("user_id", ids);
    if (data) {
      const map: Record<string, Profile> = {};
      (data as Profile[]).forEach((p) => (map[p.user_id] = p));
      setProfiles((prev) => ({ ...prev, ...map }));
    }
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  useSectionDataSync(() => fetchItems({ silent: true }));

  useRealtime("lista_items", (payload) => {
    const msg = parseTableChangePayload(payload);
    if (!msg) return;
    if (msg.op === "DELETE") {
      const id = msg.id;
      if (!id) return;
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    const row = msg.record as unknown as ListaItem & { op?: string };
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

  const handleAdd = async () => {
    if (!inputText.trim() || !user || saving) return;
    setSaving(true);
    const text = inputText.trim();
    const { data, error } = await insforge.database
      .from("lista_items")
      .insert([
        {
          content: text,
          completed: false,
          created_by: user.id,
        },
      ])
      .select("*");
    if (error || !data?.length) {
      toast.error("Error al agregar");
      setSaving(false);
      return;
    }
    const row = data[0] as ListaItem;
    setItems((prev) => (prev.some((i) => i.id === row.id) ? prev : [row, ...prev]));
    void loadProfiles([row]);
    toast.success("Agregado");
    setInputText("");
    setShowModal(false);
    setSaving(false);
    void notifyPartnerNewContent({
      actorUserId: user.id,
      displayName: profile?.display_name || profile?.username || "Tu pareja",
      section: "lista",
      detail: text,
    });
  };

  const handleEdit = async () => {
    if (!editItem || !inputText.trim() || !user || saving) return;
    setSaving(true);
    const { data, error } = await insforge.database
      .from("lista_items")
      .update({
        content: inputText.trim(),
        edited_by: user.id,
        last_edited_at: new Date().toISOString(),
      })
      .eq("id", editItem.id)
      .select("*");
    if (error || !data?.length) {
      toast.error("Error al editar");
      setSaving(false);
      return;
    }
    const row = data[0] as ListaItem;
    setItems((prev) => prev.map((i) => (i.id === row.id ? row : i)));
    void loadProfiles([row]);
    toast.success("Editado");
    setEditItem(null);
    setInputText("");
    setShowModal(false);
    setSaving(false);
  };

  const handleToggle = async (item: ListaItem) => {
    const { data } = await insforge.database
      .from("lista_items")
      .update({ completed: !item.completed })
      .eq("id", item.id)
      .select("*");
    const row = data?.[0] as ListaItem | undefined;
    if (row) {
      setItems((prev) => prev.map((i) => (i.id === row.id ? row : i)));
    }
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Eliminado");
    const { error } = await insforge.database.from("lista_items").delete().eq("id", id);
    if (error) {
      toast.error("No se pudo eliminar");
      await fetchItems({ silent: true });
    }
  };

  const openEdit = (item: ListaItem) => {
    setEditItem(item);
    setInputText(item.content);
    setShowModal(true);
  };

  const openAdd = () => {
    setEditItem(null);
    setInputText("");
    setShowModal(true);
  };

  const pending = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed);

  return (
    <div className="relative min-h-full">
      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-dots loading-md text-primary" />
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 gap-3"
        >
          <ListChecks size={40} className="text-base-content/20" />
          <p className="text-base-content/40 text-sm">La lista está vacía</p>
          <button onClick={openAdd} className="btn btn-primary btn-sm gap-2">
            <Plus size={16} /> Agregar algo
          </button>
        </motion.div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-2">
                Pendiente · {pending.length}
              </p>
              <AnimatePresence>
                {pending.map((item) => (
                  <ItemCard
                    key={item.id}
                    title={item.content}
                    creator={profiles[item.created_by]}
                    editedBy={item.edited_by ? profiles[item.edited_by] : undefined}
                    lastEditedAt={item.last_edited_at}
                    completed={item.completed}
                    onToggle={() => handleToggle(item)}
                    onEdit={() => openEdit(item)}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
          {done.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-2">
                Completado · {done.length}
              </p>
              <AnimatePresence>
                {done.map((item) => (
                  <ItemCard
                    key={item.id}
                    title={item.content}
                    creator={profiles[item.created_by]}
                    editedBy={item.edited_by ? profiles[item.edited_by] : undefined}
                    lastEditedAt={item.last_edited_at}
                    completed={item.completed}
                    onToggle={() => handleToggle(item)}
                    onEdit={() => openEdit(item)}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={openAdd}
        className="fixed bottom-20 right-4 btn btn-primary btn-circle shadow-lg shadow-primary/30"
      >
        <Plus size={22} />
      </motion.button>

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditItem(null); setInputText(""); }}
        title={editItem ? "Editar tarea" : "Nueva tarea"}
      >
        <div className="flex flex-col gap-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="¿Qué hay que hacer?"
            className="textarea textarea-bordered w-full bg-base-100 resize-none focus:outline-primary"
            rows={3}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                editItem ? handleEdit() : handleAdd();
              }
            }}
          />
          <button
            onClick={editItem ? handleEdit : handleAdd}
            disabled={!inputText.trim() || saving}
            className="btn btn-primary w-full gap-2"
          >
            {saving ? (
              <span className="loading loading-spinner loading-sm" />
            ) : editItem ? (
              "Guardar cambios"
            ) : (
              <>
                <Plus size={16} /> Agregar
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}
