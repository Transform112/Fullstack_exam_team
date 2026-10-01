"use client";

// Step 4 - Media (docs/03 P2-05): uploads, the sortable grid with captions, the music
// picker and memory linking. At least one photo is required before Next.
import { useCallback } from "react";
import { MediaUploader } from "./MediaUploader";
import { MediaGrid } from "./MediaGrid";
import { useWizardData, FieldError } from "./Wizard";

export function StepMedia() {
  const { data, pageId, errors, refetchAndMerge, registerField } = useWizardData();

  // Uploads and deletes bump the server revision; the next queued write needs it.
  const onUploaded = useCallback(() => {
    void refetchAndMerge().catch(() => undefined);
  }, [refetchAndMerge]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-ink">Photos and videos</h2>
        <p className="mt-1 text-sm text-muted">
          Add up to 15 photos and 2 videos. Photos are resized in your browser before upload.
        </p>
      </div>

      <div ref={registerField("media")} tabIndex={-1} className="outline-none">
        <MediaUploader pageId={pageId} onUploaded={onUploaded} />
      </div>
      <FieldError message={errors.media} />

      <MediaGrid />

      {data.media.length > 0 && (
        <p className="text-xs text-muted">
          {data.media.filter((item) => item.type === "image").length} photos,{" "}
          {data.media.filter((item) => item.type === "video").length} videos ready.
        </p>
      )}
    </div>
  );
}

export default StepMedia;
