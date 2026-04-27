import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Film, Check, ImagePlus, X, Eye, EyeOff, Pencil, Trash2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Modal } from "../../shared/Modal";
import { AiIdeasModal } from "../../shared/AiIdeasModal";
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
import { Avatar } from "../../shared/Avatar";
import { PostInteractions } from "../../shared/PostInteractions";
import type { Pelicula, Profile } from "../../../types";

function MovieCard({
  item,
  creator,
  groupId,
  userId,
  onEdit,
  onDelete,
  onToggleWatched,
  highlighted,
}: {
  item: Pelicula;
  creator?: Profile;
  groupId?: string;
  userId?: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleWatched: () => void;
  highlighted?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      data-item-id={item.id}
      className="mb-4 rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
        border: highlighted ? "1px solid rgba(255,45,107,0.6)" : "1px solid rgba(255,255,255,0.08)",
        boxShadow: highlighted
          ? "0 4px 28px rgba(0,0,0,0.35), 0 0 0 3px rgba(255,45,107,0.18), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "0 4px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
        opacity: item.watched ? 0.65 : 1,
      }}
    >
      {/* Poster */}
      {item.poster_url && (
        <div
          className="w-full overflow-hidden relative"
          style={{ maxHeight: "220px" }}
        >
          <img
            src={item.poster_url}
            alt={item.title}
            loading="lazy"
            style={{
              width: "100%",
              height: "220px",
              objectFit: "cover",
              objectPosition: "center top",
              display: "block",
            }}
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, transparent 40%, rgba(21,6,32,0.95) 100%)",
            }}
          />
          {/* Genre badge on image */}
          {item.genre && (
            <span
              className="absolute top-3 right-3 text-white font-semibold"
              style={{
                background: "rgba(255,45,107,0.85)",
                backdropFilter: "blur(6px)",
                borderRadius: "8px",
                padding: "3px 10px",
                fontSize: "11px",
                letterSpacing: "0.04em",
              }}
            >
              {item.genre}
            </span>
          )}
          {/* Watched badge on image */}
          {item.watched && (
            <span
              className="absolute top-3 left-3 text-white font-semibold flex items-center gap-1"
              style={{
                background: "rgba(34,197,94,0.85)",
                backdropFilter: "blur(6px)",
                borderRadius: "8px",
                padding: "3px 10px",
                fontSize: "11px",
                letterSpacing: "0.04em",
              }}
            >
              <Check size={10} /> {t("peliculas.watched")}
            </span>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Title + no-poster genre */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <p
            className="font-bold text-base-content leading-tight"
            style={{
              fontSize: "16px",
              letterSpacing: "-0.02em",
              textDecoration: item.watched ? "line-through" : "none",
              opacity: item.watched ? 0.5 : 1,
            }}
          >
            {item.title}
          </p>
          {!item.poster_url && item.genre && (
            <span
              className="font-semibold flex-shrink-0"
              style={{
                background: "rgba(255,45,107,0.2)",
                color: "#ff2d6b",
                borderRadius: "8px",
                padding: "2px 9px",
                fontSize: "10px",
                letterSpacing: "0.05em",
              }}
            >
              {item.genre}
            </span>
          )}
        </div>

        {item.description && (
          <p className="text-sm text-base-content/55 mb-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-2.5 mt-1"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-1.5">
            {creator && (
              <>
                <Avatar profile={creator} size="xs" />
                <span style={{ fontSize: "11px" }} className="text-base-content/40">
                  {creator.display_name || creator.username}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onToggleWatched}
              className="flex items-center gap-1 font-semibold"
              style={{
                background: item.watched
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(34,197,94,0.15)",
                color: item.watched ? "rgba(255,255,255,0.35)" : "#22c55e",
                borderRadius: "10px",
                padding: "4px 10px",
                fontSize: "11px",
                border: item.watched
                  ? "1px solid rgba(255,255,255,0.06)"
                  : "1px solid rgba(34,197,94,0.25)",
              }}
            >
              {item.watched ? <EyeOff size={11} /> : <Eye size={11} />}
              {item.watched ? t("peliculas.notWatched") : t("peliculas.watched")}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onEdit}
              className="btn btn-ghost btn-xs btn-circle"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              <Pencil size={12} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onDelete}
              className="btn btn-ghost btn-xs btn-circle hover:text-error"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              <Trash2 size={12} />
            </motion.button>
          </div>
        </div>

        <PostInteractions
          targetType="peliculas"
          targetId={item.id}
          groupId={groupId}
          userId={userId}
        />
      </div>
    </motion.div>
  );
}

export function PeliculasPage() {
  const { user, profile } = useAuthStore();
  const { group } = useGroupStore();
  const [items, setItems] = useState<Pelicula[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAiIdeas, setShowAiIdeas] = useState(false);
  const [editItem, setEditItem] = useState<Pelicula | null>(null);
  const [form, setForm] = useState({ title: "", description: "", genre: "", posterUrl: "" });
  const [saving, setSaving] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const posterFileRef = useRef<HTMLInputElement>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useTranslation();
  const { pendingItemId, clearPendingItemId } = useNavigationStore();

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
    if (!group) return;
    const { data } = await insforge.database.from("peliculas").select("*").eq("group_id", group.id).order("created_at", { ascending: false });
    if (data) { setItems(data as Pelicula[]); await loadProfiles(data as Pelicula[]); }
    if (!opts?.silent) setLoading(false);
  };

  useEffect(() => {
    if (!group?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    void fetchPeliculas();
  }, [group?.id]);

  useSectionDataSync(() => fetchPeliculas({ silent: true }));
  useOnSectionRefresh("peliculas", () => {
    void fetchPeliculas({ silent: true });
  });

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

    if (!group) { setSaving(false); return; }

    if (editItem) {
      const { data, error } = await insforge.database.from("peliculas").update({
        title: form.title.trim(), description: form.description || null,
        genre: form.genre || null, ...posterField,
        edited_by: user.id, last_edited_at: new Date().toISOString(),
      }).eq("id", editItem.id).select("*");
      if (error || !data?.length) {
        toast.error(t("peliculas.saveError"));
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
        watched: false, created_by: user.id, group_id: group.id,
      }]).select("*");
      if (error || !data?.length) {
        toast.error(t("peliculas.addError"));
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
        itemId: row.id,
      });
    }
    toast.success(editItem ? t("peliculas.edited") : t("peliculas.added"));
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
    if (!item.watched) toast.success(t("peliculas.markedWatched"));
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
      toast.error(t("peliculas.posterError"));
      setUploadingPoster(false);
      return;
    }

    setForm((prev) => ({ ...prev, posterUrl: uploadData.url }));
    toast.success(t("peliculas.posterUploaded"));
    setUploadingPoster(false);
    e.target.value = "";
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success(t("peliculas.deleted"));
    const { error } = await insforge.database.from("peliculas").delete().eq("id", id);
    if (error) {
      toast.error(t("peliculas.deleteError"));
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

  const useAiIdea = (idea: { title: string; description: string; genre?: string }) => {
    setEditItem(null);
    setForm({ title: idea.title, description: idea.description, genre: idea.genre || "", posterUrl: "" });
    setShowAiIdeas(false);
    setShowModal(true);
  };

  const pending = items.filter((i) => !i.watched);
  const watched = items.filter((i) => i.watched);

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
          <Film size={40} className="text-base-content/20" />
          <p className="text-base-content/40 text-sm">{t("peliculas.empty")}</p>
          <div className="flex gap-2">
            <button onClick={() => setShowAiIdeas(true)} className="btn btn-ghost btn-sm gap-2 border border-white/10">
              <Sparkles size={16} /> {t("aiIdeas.emptyButton")}
            </button>
            <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm gap-2">
              <Plus size={16} /> {t("peliculas.add")}
            </button>
          </div>
        </motion.div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-1">
              <p
                className="uppercase mb-3 font-semibold tracking-widest"
                style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}
              >
                {t("peliculas.toWatch")} · {pending.length}
              </p>
              <AnimatePresence>
                {pending.map((item) => (
                  <MovieCard
                    key={item.id}
                    item={item}
                    creator={profiles[item.created_by]}
                    groupId={group?.id}
                    userId={user?.id}
                    highlighted={item.id === highlightedId}
                    onEdit={() => openEdit(item)}
                    onDelete={() => handleDelete(item.id)}
                    onToggleWatched={() => handleToggleWatched(item)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
          {watched.length > 0 && (
            <div>
              <p
                className="uppercase mb-3 font-semibold tracking-widest"
                style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}
              >
                {t("peliculas.watched")} · {watched.length}
              </p>
              <AnimatePresence>
                {watched.map((item) => (
                  <MovieCard
                    key={item.id}
                    item={item}
                    creator={profiles[item.created_by]}
                    groupId={group?.id}
                    userId={user?.id}
                    highlighted={item.id === highlightedId}
                    onEdit={() => openEdit(item)}
                    onDelete={() => handleDelete(item.id)}
                    onToggleWatched={() => handleToggleWatched(item)}
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
        onClick={() => {
          setEditItem(null);
          setForm({ title: "", description: "", genre: "", posterUrl: "" });
          setShowModal(true);
        }}
        className="fixed z-40 bottom-[max(6.5rem,calc(env(safe-area-inset-bottom,0px)+4.5rem))] right-4 btn btn-primary btn-circle shadow-lg shadow-primary/30"
      >
        <Plus size={22} />
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setShowAiIdeas(true)}
        className="fixed z-40 bottom-[max(10.5rem,calc(env(safe-area-inset-bottom,0px)+8.5rem))] right-4 btn btn-secondary btn-circle shadow-lg shadow-secondary/30"
      >
        <Sparkles size={20} />
      </motion.button>

      <AiIdeasModal
        open={showAiIdeas}
        section="peliculas"
        existingTitles={items.map((item) => item.title)}
        existingItems={items.map((item) => [
          item.title,
          item.genre ? `genre: ${item.genre}` : "",
          item.description ? `description: ${item.description}` : "",
          item.watched ? "watched" : "to watch",
        ].filter(Boolean).join(" | "))}
        onClose={() => setShowAiIdeas(false)}
        onUse={useAiIdea}
      />

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditItem(null); }}
        title={editItem ? t("peliculas.editModal") : t("peliculas.newModal")}
      >
        <div className="flex flex-col gap-3">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder={t("peliculas.titlePlaceholder")}
            className="input input-bordered w-full bg-base-100 focus:outline-primary"
            autoFocus
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder={t("peliculas.descPlaceholder")}
            className="textarea textarea-bordered w-full bg-base-100 resize-none"
            rows={2}
          />
          <input
            value={form.genre}
            onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
            placeholder={t("peliculas.genrePlaceholder")}
            className="input input-bordered w-full bg-base-100 focus:outline-primary"
          />
          <input
            ref={posterFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePosterUpload}
          />

          {/* Poster preview or upload button */}
          {form.posterUrl ? (
            <div className="rounded-xl overflow-hidden relative" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <img
                src={form.posterUrl}
                alt="Preview"
                style={{
                  width: "100%",
                  height: "180px",
                  objectFit: "cover",
                  objectPosition: "center top",
                  display: "block",
                }}
              />
              <button
                onClick={() => setForm((f) => ({ ...f, posterUrl: "" }))}
                className="absolute top-2 right-2 btn btn-circle btn-xs"
                style={{ background: "rgba(0,0,0,0.7)", border: "none", color: "white" }}
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => posterFileRef.current?.click()}
              disabled={uploadingPoster}
              className="flex items-center justify-center gap-2 w-full font-semibold"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1.5px dashed rgba(255,255,255,0.12)",
                borderRadius: "14px",
                padding: "14px",
                color: "rgba(255,255,255,0.5)",
                fontSize: "13px",
              }}
            >
              {uploadingPoster ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <ImagePlus size={16} />
              )}
              {uploadingPoster ? t("peliculas.uploading") : t("peliculas.uploadPoster")}
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={!form.title.trim() || saving}
            className="btn btn-primary w-full gap-2 mt-1"
          >
            {saving ? (
              <span className="loading loading-spinner loading-sm" />
            ) : editItem ? (
              t("peliculas.save")
            ) : (
              <><Plus size={16} /> {t("peliculas.addBtn")}</>
            )}
          </motion.button>
        </div>
      </Modal>
    </div>
  );
}
