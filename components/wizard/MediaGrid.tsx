"use client";

// Saved media as sortable tiles with captions, a confirmed delete, the music picker
// and the memory linking rows (docs/03 P2-05).
import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GripVertical, Music, Pause, Play, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/client-api";
import { cld } from "@/lib/cloudinary-url";
import { MUSIC } from "@/lib/validators";
import type { MediaItem } from "@/lib/wizard";
import type { OwnerPage } from "@/lib/page-helpers";
import { useWizardData } from "./Wizard";

const MUSIC_LABELS: Record<string, string> = {
  none: "No music",
  "soft-piano": "Soft piano",
  "happy-pop": "Happy pop",
  "party-beat": "Party beat",
  "romantic-strings": "Romantic strings",
};

const MEDIA_SAVE_DELAY = 800;
const NO_PHOTO = "__none__";

type SortableTileProps = {
  item: MediaItem;
  caption: string;
  reduced: boolean;
  onCaption: (value: string) => void;
  onRemove: () => void;
};

function SortableTile({ item, caption, reduced, onCaption, onRemove }: SortableTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <motion.li
      ref={setNodeRef}
      layout={!reduced}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
      }}
      className={[
        "flex flex-col gap-2 rounded-card border border-border bg-white p-3",
        isDragging ? "scale-[1.05] shadow-card" : "",
      ].join(" ")}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-canvas">
        {item.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cld(item.url, "w_400,f_auto,q_auto")}
            alt={item.caption || "Uploaded photo"}
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            src={cld(item.url, "f_auto,q_auto")}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        )}
        {item.type === "video" && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-ink/80 px-2 py-1 text-[11px] font-medium text-white">
            <Video className="h-3 w-3" aria-hidden />
            Video
          </span>
        )}
        <button
          type="button"
          aria-label={`Reorder ${item.caption || "media"}`}
          className="absolute right-2 top-2 flex h-11 w-11 cursor-grab items-center justify-center rounded-full bg-white/90 text-ink shadow-card"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <Label htmlFor={`caption-${item.id}`} className="sr-only">
        Caption
      </Label>
      <Input
        id={`caption-${item.id}`}
        value={caption}
        maxLength={120}
        placeholder="Add a caption"
        onChange={(event) => onCaption(event.target.value)}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{caption.length}/120</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label="Delete this item"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Delete
        </Button>
      </div>
    </motion.li>
  );
}

export function MediaGrid() {
  const { data, setData, pageId, mergeOwnerPage, refetchAndMerge, saveStepData } = useWizardData();
  const reduced = !!useReducedMotion();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [missingMusic, setMissingMusic] = useState<string[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Music files are added by a human later: a missing file only disables its preview.
  useEffect(() => {
    let cancelled = false;
    const checks = MUSIC.filter((option) => option !== "none").map((option) =>
      fetch(`/music/${option}.mp3`, { method: "HEAD" })
        .then((res) => (res.ok ? null : String(option)))
        .catch(() => String(option)),
    );
    void Promise.all(checks).then((results) => {
      if (cancelled) return;
      setMissingMusic(results.filter((option): option is string => option !== null));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      audioRef.current?.pause();
    };
  }, []);

  // Reorder and caption edits are debounced into one PATCH through the shared queue.
  const scheduleMediaSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveStepData(4).catch((err) =>
        toast.error(err instanceof Error ? err.message : "Could not save the order."),
      );
    }, MEDIA_SAVE_DELAY);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = data.media.findIndex((item) => item.id === active.id);
    const newIndex = data.media.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(data.media, oldIndex, newIndex).map((item, index) => ({
      ...item,
      order: index,
    }));
    setData((current) => ({ ...current, media: next }));
    scheduleMediaSave();
  };

  const setCaption = (id: string, caption: string) => {
    const next = data.media.map((item) => (item.id === id ? { ...item, caption } : item));
    setData((current) => ({ ...current, media: next }));
    scheduleMediaSave();
  };

  const confirmDelete = async () => {
    if (!confirmId || !pageId) return;
    setDeleting(true);
    try {
      const result = await api<{ rev: number; page: OwnerPage }>(
        `/pages/${pageId}/media/${confirmId}`,
        { method: "DELETE" },
      );
      setData((current) => ({
        ...current,
        media: current.media.filter((item) => item.id !== confirmId),
      }));
      mergeOwnerPage(result.page, ["media", "memoryIds"]);
      toast.success("Photo removed.");
      setConfirmId(null);
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes("changed")) {
        // A queued reorder bumped the revision: reload and let the creator retry.
        void refetchAndMerge().catch(() => undefined);
      }
      toast.error(err instanceof Error ? err.message : "Could not delete that item.");
    } finally {
      setDeleting(false);
    }
  };

  const togglePreview = (option: string) => {
    const src = `/music/${option}.mp3`;
    if (missingMusic.includes(option)) return;
    if (playing === option) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(src);
    audio.loop = true;
    audio.play().catch(() => toast.error("That preview could not be played."));
    audioRef.current = audio;
    setPlaying(option);
  };

  const images = data.media.filter((item) => item.type === "image");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between">
          <Label>Your photos and videos</Label>
          <span className="text-xs text-muted">{data.media.length} items</span>
        </div>
        {data.media.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing uploaded yet.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={data.media.map((item) => item.id)}
              strategy={rectSortingStrategy}
            >
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <AnimatePresence initial={false}>
                  {data.media.map((item) => (
                    <SortableTile
                      key={item.id}
                      item={item}
                      caption={item.caption ?? ""}
                      reduced={reduced}
                      onCaption={(value) => setCaption(item.id, value)}
                      onRemove={() => setConfirmId(item.id)}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </SortableContext>
          </DndContext>
        )}
        <p className="mt-2 text-xs text-muted">
          Drag the handle to reorder. Captions save automatically.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Music</Label>
        <div className="flex flex-wrap gap-2">
          {MUSIC.map((option) => {
            const active = data.theme.music === option;
            const unavailable = option !== "none";
            return (
              <div key={option} className="flex items-center gap-1">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  animate={{ scale: active && !reduced ? 1.03 : 1 }}
                  onClick={() =>
                    setData((current) => ({
                      ...current,
                      theme: { ...current.theme, music: option },
                    }))
                  }
                  className={[
                    "flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm transition-colors",
                    active
                      ? "border-primary bg-primary/5 text-ink ring-2 ring-primary"
                      : "border-border bg-white text-ink hover:bg-canvas",
                  ].join(" ")}
                >
                  <Music className="h-4 w-4" aria-hidden />
                  {MUSIC_LABELS[option] ?? option}
                </motion.button>
                {unavailable && (
                  <button
                    type="button"
                    onClick={() => togglePreview(option)}
                    disabled={missingMusic.includes(option)}
                    aria-label={`Preview ${MUSIC_LABELS[option] ?? option}`}
                    title={
                      missingMusic.includes(option)
                        ? "The music file has not been added yet"
                        : "Play a preview"
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {playing === option ? (
                      <Pause className="h-4 w-4" aria-hidden />
                    ) : (
                      <Play className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted">
          The preview button stays off until the music files are added.
        </p>
      </div>

      {data.memories.length > 0 && (
        <div className="flex flex-col gap-3">
          <Label>Link photos to memories</Label>
          {images.length === 0 ? (
            <p className="text-sm text-muted">Add a photo first to link it to a memory.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.memories.map((memory, index) => {
                // Radix Select reserves the empty string, so "no photo" is an explicit sentinel.
                const value = memory.mediaId ? memory.mediaId : NO_PHOTO;
                const label = images.find((image) => image.id === memory.mediaId)?.caption?.trim();
                return (
                  <li
                    key={memory.id ?? `memory-${index}`}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">
                      {memory.title || `Memory ${index + 1}`}
                    </span>
                    <Select
                      value={value}
                      onValueChange={(next) =>
                        setData((current) => ({
                          ...current,
                          memories: current.memories.map((item, i) =>
                            i === index
                              ? { ...item, mediaId: next === NO_PHOTO ? "" : next }
                              : item,
                          ),
                        }))
                      }
                    >
                      <SelectTrigger
                        className="w-full sm:w-64"
                        aria-label={`Photo for memory ${index + 1}`}
                      >
                        <SelectValue placeholder="Choose a photo">{label}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_PHOTO}>No photo</SelectItem>
                        {images.map((image, imageIndex) => (
                          <SelectItem key={image.id} value={image.id}>
                            {image.caption?.trim() || `Photo ${imageIndex + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-xs text-muted">Saves with the rest of your draft.</p>
        </div>
      )}

      <Dialog open={!!confirmId} onOpenChange={(open) => !open && setConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this item?</DialogTitle>
            <DialogDescription>
              It is removed from the page and from Cloudinary. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmId(null)}>
              Keep it
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => void confirmDelete()}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MediaGrid;
