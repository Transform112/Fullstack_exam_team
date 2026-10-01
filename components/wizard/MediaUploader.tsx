"use client";

// The Media step dropzone (docs/03 P2-05, docs/02 SECTION 10). Files are validated,
// images are compressed, and each one gets a thumbnail plus a determinate progress bar.
import { useCallback, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Image as ImageIcon, Upload, Video as VideoIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWizardData } from "./Wizard";
import {
  compressImage,
  MAX_IMAGES,
  MAX_VIDEOS,
  resourceTypeOf,
  uploadToCloudinary,
  validateFile,
} from "@/lib/upload";

type UploadStatus = "queued" | "uploading" | "done" | "error";

type UploadTask = {
  key: string;
  name: string;
  preview: string;
  status: UploadStatus;
  progress: number;
  error?: string;
};

export type MediaUploaderProps = {
  pageId: string | null;
  // Called after every successful registration so the page revision can be refetched.
  onUploaded?: (mediaId: string) => void;
  disabled?: boolean;
};

export function MediaUploader({ pageId, onUploaded, disabled }: MediaUploaderProps) {
  const { data, setData, registerField } = useWizardData();
  const reduced = !!useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [rejections, setRejections] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const counter = useRef(0);
  const mediaRef = useRef(data.media);
  mediaRef.current = data.media;

  const patchTask = (key: string, patch: Partial<UploadTask>) =>
    setTasks((current) => current.map((task) => (task.key === key ? { ...task, ...patch } : task)));

  // Accepts images and mp4 only, then runs each file through the media pipeline.
  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      if (!pageId) {
        setRejections(["Finish step 1 first: the draft page is created when you save it."]);
        return;
      }
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setRejections([]);

      const created: Array<UploadTask & { file: File }> = [];
      const rejected: string[] = [];
      const accepted: Array<UploadTask & { file: File }> = [];

      for (const file of files) {
        const kind = resourceTypeOf(file);
        if (!kind) {
          rejected.push(`${file.name} is not a supported file type`);
          continue;
        }
        // HEIC/HEIF photos are accepted and uploaded as they are: the browser cannot
        // re-encode them, and the server verifier allows the format (MEDIA-1).
        counter.current += 1;
        accepted.push({
          key: `task-${counter.current}`,
          name: file.name,
          preview: kind === "image" ? URL.createObjectURL(file) : "",
          status: "queued",
          progress: 0,
          file,
        });
      }

      // Counts are checked against the running total so a batch cannot pass 15 photos.
      for (const task of accepted) {
        const kind = resourceTypeOf(task.file);
        if (!kind) continue;
        const result = await validateFile(task.file, mediaRef.current);
        if (!result.ok) {
          rejected.push(result.message);
          continue;
        }
        created.push(task);
        mediaRef.current = [
          ...mediaRef.current,
          {
            id: `pending-${task.key}`,
            type: kind,
            url: "",
            publicId: "",
            order: mediaRef.current.length,
          },
        ];
      }

      setRejections(rejected);
      if (created.length) setTasks((current) => [...created, ...current]);

      for (const task of created) {
        const kind = resourceTypeOf(task.file);
        if (!kind) continue;
        patchTask(task.key, { status: "uploading" });
        try {
          const prepared = kind === "image" ? await compressImage(task.file) : task.file;
          const item = await uploadToCloudinary(prepared, pageId, kind, (percent) =>
            patchTask(task.key, { progress: Math.min(1, percent / 100) }),
          );
          // The server is the source of truth for order and revision.
          setData((current) => ({
            ...current,
            media: [...current.media, { ...item, order: current.media.length }],
          }));
          mediaRef.current = [...mediaRef.current, { ...item, order: mediaRef.current.length }];
          patchTask(task.key, { status: "done", progress: 1 });
          onUploaded?.(item.id);
        } catch (err) {
          patchTask(task.key, {
            status: "error",
            error: err instanceof Error ? err.message : "Upload failed. Please try again.",
          });
        }
      }

      busyRef.current = false;
      setBusy(false);
    },
    [pageId, onUploaded, setData],
  );

  const images = data.media.filter((item) => item.type === "image").length;
  const videos = data.media.filter((item) => item.type === "video").length;

  const dismiss = (key: string) =>
    setTasks((current) => current.filter((task) => task.key !== key));

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled || busy}
        ref={registerField("media")}
        onClick={() => !disabled && !busy && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!disabled && !busy) inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (disabled || busy) return;
          void handleFiles(Array.from(event.dataTransfer.files));
        }}
        className={[
          "flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed p-6 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border bg-white hover:bg-canvas",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        <Upload className="h-6 w-6 text-primary" aria-hidden />
        <p className="text-sm font-medium text-ink">Drag photos and videos here</p>
        <p className="text-xs text-muted">or click to choose files - jpg, png, webp or mp4</p>
        <p className="text-xs text-muted">
          {images} of {MAX_IMAGES} photos, {videos} of {MAX_VIDEOS} videos
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4"
        multiple
        className="hidden"
        onChange={(event) => {
          void handleFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      {rejections.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-card border border-red-200 bg-red-50 p-3">
          {rejections.map((message) => (
            <li key={message} className="text-xs font-medium text-red-700">
              {message}
            </li>
          ))}
        </ul>
      )}

      {tasks.length > 0 && (
        <ul className="flex flex-col gap-2">
          {tasks.map((task, index) => (
            <motion.li
              key={task.key}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: reduced ? 0 : index * 0.06 }}
              className="flex items-center gap-3 rounded-card border border-border bg-white p-3"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-canvas">
                {task.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={task.preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-muted">
                    <VideoIcon className="h-5 w-5" aria-hidden />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                  <p className="truncate text-sm text-ink">{task.name}</p>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full w-full origin-left rounded-full ${
                      task.status === "error" ? "bg-red-500" : "bg-primary"
                    }`}
                    style={{ transform: `scaleX(${task.status === "error" ? 1 : task.progress})` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {task.status === "queued"
                    ? "Waiting..."
                    : task.status === "uploading"
                      ? `Uploading ${Math.round(task.progress * 100)}%`
                      : task.status === "done"
                        ? "Uploaded"
                        : (task.error ?? "Upload failed")}
                </p>
              </div>
              {(task.status === "done" || task.status === "error") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Dismiss ${task.name}`}
                  onClick={() => dismiss(task.key)}
                >
                  <X className="h-4 w-4" aria-hidden />
                </Button>
              )}
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MediaUploader;
