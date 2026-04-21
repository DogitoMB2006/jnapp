import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Film, Check, ImagePlus, X } from "lucide-react";
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
import type { Pelicula, Profile } from "../../../types";

export function PeliculasPage() {
  const { user, profile } = useAuthStore();
  const [items, setItems] = useState<Pelicula[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Pelicula | null>(null);
  const [form, setForm] = useState({ title: "", description: "", genre: "", posterUrl: "" });
  const [saving, setSaving] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const posterFileRef = useRef<HTMLInputElement>(null);

  const loadProfiles = async (items: Pelicula[]) => {
    const ids = [...new Set(items.flatMap((i) => [i.created_by, i.edited_by].filter(Boolean) as string[]))];
    if (!ids.length) return;
    const { data } = await insforge.database.from("profiles").select("*").in("user_id", ids);
    if (data) {
      const map: Record<string, Profile> = {};
      (data as Profile[]).forEach((p) => (map[p.user_id] = p));
      setProfiles((prev) => ({ ...prev, ...map }));
    }
  };

  const fetchPeliculas = async (opts?: { silent?: boolean }) => {
    const { data } = await insforge.database.from("peliculas").select("*").order("created_at", { ascending: false });
    if (data) { setItems(data as Pelicula[]); await loadProfiles(data as Pelicula[]); }
    if (!opts?.silent) setLoading(false);
  };

  useEffect(() => {
    void fetchPeliculas();
  }, []);

  useSectionDataSync(() => fetchPeliculas({ silent: true }));

  useRealtime("peliculas", (payload) => {
    const msg = parseTableChangePayload(payload);
    if (!msg) return;
    if (msg.op === "DELETE") {
      const id = msg.id;
      if (!id) return;
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    const row = msg.record as unknown as Pelicula & { op?: string };
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
    const posterUrl = form.posterUrl.trim();
    const posterField = posterUrl ? { poster_url: posterUrl } : {};

    if (editItem) {
      const { data, error } = await insforge.database.from("peliculas").update({
        title: form.title.trim(), description: form.description || null,
        genre: form.genre || null, ...posterField,
        edited_by: user.id, last_edited_at: new Date().toISOString(),
      }).eq("id", editItem.id).select("*");
      if (error || !data?.length) {
        const message = String(error || "");
        if (message.toLowerCase().includes("poster_url")) {
          toast.error("Falta migración DB: agrega columna poster_url en peliculas");
        } else {
          toast.error("Error al guardar");
        }
        setSaving(false);
        return;
      }
      const row = data[0] as Pelicula;
      setItems((prev) => prev.map((i) => (i.id === row.id ? row : i)));
      void loadProfiles([row]);
    } else {
      const { data, error } = await insforge.database.from("peliculas").insert([{
        title: form.title.trim(), description: form.description || null,
        genre: form.genre || null, ...posterField,
        watched: false, created_by: user.id,
      }]).select("*");
      if (error || !data?.length) {
        const message = String(error || "");
        if (message.toLowerCase().includes("poster_url")) {
          toast.error("Falta migración DB: agrega columna poster_url en peliculas");
        } else {
          toast.error("Error al agregar");
        }
        setSaving(false);
        return;
      }
      const row = data[0] as Pelicula;
      setItems((prev) => (prev.some((i) => i.id === row.id) ? prev : [row, ...prev]));
      void loadProfiles([row]);
      void notifyPartnerNewContent({
        actorUserId: user.id,
        displayName: profile?.display_name || profile?.username || "Tu pareja",
        section: "peliculas",
        detail: row.title,
      });
    }
    toast.success(editItem ? "Película editada" : "Película agregada");
    setShowModal(false); setEditItem(null); setForm({ title: "", description: "", genre: "", posterUrl: "" });
    setSaving(false);
  };

  const handleToggleWatched = async (item: Pelicula) => {
    const { data } = await insforge.database
      .from("peliculas")
      .update({ watched: !item.watched })
      .eq("id", item.id)
      .select("*");
    const row = data?.[0] as Pelicula | undefined;
    if (row) {
      setItems((prev) => prev.map((i) => (i.id === row.id ? row : i)));
    }
    if (!item.watched) toast.success("¡Marcada como vista!");
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPoster(true);

    const ext = file.name.split(".").pop() || "jpg";
    const key = `posters/${user.id}-${Date.now()}.${ext}`;

    const { data: uploadData, error: uploadError } = await insforge.storage
      .from("avatars")
      .upload(key, file);

    if (uploadError || !uploadData?.url) {
      toast.error("Error al subir póster");
      setUploadingPoster(false);
      return;
    }

    setForm((prev) => ({ ...prev, posterUrl: uploadData.url }));
    toast.success("Póster subido");
    setUploadingPoster(false);
    e.target.value = "";
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Eliminado");
    const { error } = await insforge.database.from("peliculas").delete().eq("id", id);
    if (error) {
      toast.error("No se pudo eliminar");
      await fetchPeliculas({ silent: true });
    }
  };

  const openEdit = (item: Pelicula) => {
    setEditItem(item);
    setForm({
      title: item.title,
      description: item.description || "",
      genre: item.genre || "",
      posterUrl: item.poster_url || "",
    });
    setShowModal(true);
  };

  const pending = items.filter((i) => !i.watched);
  const watched = items.filter((i) => i.watched);

  return (
    <div className="relative min-h-full">
      {loading ? (
        <div className="flex justify-center py-12"><span className="loading loading-dots loading-md text-primary" /></div>
      ) : items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 gap-3">
          <Film size={40} className="text-base-content/20" />
          <p className="text-base-content/40 text-sm">Sin películas aún</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm gap-2"><Plus size={16} /> Agregar película</button>
        </motion.div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-2">Por ver · {pending.length}</p>
              <AnimatePresence>
                {pending.map((item) => (
                  <ItemCard
                    key={item.id}
                    title={item.title}
                    subtitle={item.description || undefined}
                    creator={profiles[item.created_by]}
                    editedBy={item.edited_by ? profiles[item.edited_by] : undefined}
                    lastEditedAt={item.last_edited_at}
                    badge={item.genre || undefined}
                    onEdit={() => openEdit(item)}
                    onDelete={() => handleDelete(item.id)}
                  >
                    {item.poster_url && (
                      <div className="mt-2 mb-2 overflow-hidden rounded-xl border border-base-300">
                        <img
                          src={item.poster_url}
                          alt={`Poster de ${item.title}`}
                          className="w-full h-44 object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <button
                      onClick={() => handleToggleWatched(item)}
                      className="btn btn-xs btn-outline btn-success mt-1 gap-1"
                    >
                      <Check size={12} /> Ya la vi
                    </button>
                  </ItemCard>
                ))}
              </AnimatePresence>
            </div>
          )}
          {watched.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-2">Vista · {watched.length}</p>
              <AnimatePresence>
                {watched.map((item) => (
                  <ItemCard
                    key={item.id}
                    title={item.title}
                    subtitle={item.description || undefined}
                    creator={profiles[item.created_by]}
                    editedBy={item.edited_by ? profiles[item.edited_by] : undefined}
                    lastEditedAt={item.last_edited_at}
                    badge={item.genre || undefined}
                    badgeColor="badge-success"
                    completed={true}
                    onEdit={() => openEdit(item)}
                    onDelete={() => handleDelete(item.id)}
                  >
                    {item.poster_url && (
                      <div className="mt-2 mb-2 overflow-hidden rounded-xl border border-base-300">
                        <img
                          src={item.poster_url}
                          alt={`Poster de ${item.title}`}
                          className="w-full h-44 object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <button
                      onClick={() => handleToggleWatched(item)}
                      className="btn btn-xs btn-ghost mt-1 gap-1 text-base-content/40"
                    >
                      Marcar como no vista
                    </button>
                  </ItemCard>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      <motion.button whileTap={{ scale: 0.92 }}
        onClick={() => { setEditItem(null); setForm({ title: "", description: "", genre: "", posterUrl: "" }); setShowModal(true); }}
        className="fixed bottom-20 right-4 btn btn-primary btn-circle shadow-lg shadow-primary/30">
        <Plus size={22} />
      </motion.button>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem ? "Editar película" : "Nueva película"}>
        <div className="flex flex-col gap-3">
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Nombre de la película" className="input input-bordered w-full bg-base-100 focus:outline-primary" autoFocus />
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Descripción (opcional)" className="textarea textarea-bordered w-full bg-base-100 resize-none" rows={2} />
          <input value={form.genre} onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
            placeholder="Género (Terror, Comedia...)" className="input input-bordered w-full bg-base-100 focus:outline-primary" />
          <input
            ref={posterFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePosterUpload}
          />
          <button
            onClick={() => posterFileRef.current?.click()}
            disabled={uploadingPoster}
            className="btn btn-outline btn-primary gap-2"
          >
            {uploadingPoster ? <span className="loading loading-spinner loading-sm" /> : <ImagePlus size={16} />}
            {uploadingPoster ? "Subiendo..." : "Adjuntar póster desde dispositivo"}
          </button>
          {form.posterUrl && (
            <div className="rounded-xl border border-base-300 overflow-hidden">
              <img src={form.posterUrl} alt="Preview del póster" className="w-full h-40 object-cover" />
              <button
                onClick={() => setForm((f) => ({ ...f, posterUrl: "" }))}
                className="btn btn-ghost btn-xs w-full gap-1 rounded-none"
              >
                <X size={12} />
                Quitar póster
              </button>
            </div>
          )}
          <button onClick={handleSave} disabled={!form.title.trim() || saving} className="btn btn-primary w-full gap-2">
            {saving ? <span className="loading loading-spinner loading-sm" /> : editItem ? "Guardar" : <><Plus size={16} /> Agregar</>}
          </button>
        </div>
      </Modal>
    </div>
  );
}
