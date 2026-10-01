/* eslint-disable @next/next/no-img-element */
"use client";

// Video section (docs/04 SECTION 5.7): one or two lazy, self-managing video frames that
// borrow the page music while they are unmuted.
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useWish } from "@/components/wish/WishProvider";
import { EASE, rise } from "@/lib/motion";
import { poster, videoSrc, videosOf, type WishMedia } from "@/lib/wish-media";
import type { SectionProps } from "@/lib/wish-theme";
import { useViewport } from "@/lib/wish-hooks";

// Every mounted frame registers here so two videos can never play at the same time.
const liveVideos = new Map<string, HTMLVideoElement>();

// Watches the frame with two observers: one lazy-loads the source near the viewport, the
// other gates playback on half visibility. Preview mode never autoplays.
function useVideoObservers(
  frameRef: React.RefObject<HTMLDivElement | null>,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  reducedMotion: boolean,
  allowPlay: boolean,
) {
  const [near, setNear] = useState(false);
  const [visibleEnough, setVisibleEnough] = useState(false);

  // Lazy source: assigned only when the frame comes within 300px of the viewport.
  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => setNear(entries[0]?.isIntersecting ?? false),
      {
        rootMargin: "300px",
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [frameRef]);

  // Playback gate: the frame must be at least half visible.
  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => setVisibleEnough(entries[0]?.isIntersecting ?? false),
      {
        threshold: 0.5,
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [frameRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (allowPlay && !reducedMotion && near && visibleEnough) {
      const started = video.play();
      if (started && typeof started.catch === "function") started.catch(() => undefined);
    } else {
      video.pause();
    }
  }, [allowPlay, near, visibleEnough, reducedMotion, videoRef]);

  return near;
}

type FrameProps = {
  media: WishMedia;
  tokens: SectionProps["tokens"];
};

function VideoFrame({ media, tokens }: FrameProps) {
  const { t, mode, reducedMotion, music } = useWish();
  const viewport = useViewport();
  const frameRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const musicWasPlaying = useRef(false);
  const touched = useRef(false);

  const live = mode === "live";
  const near = useVideoObservers(frameRef, videoRef, reducedMotion, live && !failed);
  const portrait = (media.h || 1) >= (media.w || 1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !live) return;
    liveVideos.set(media.id, video);
    return () => {
      liveVideos.delete(media.id);
    };
  }, [media.id, live, near]);

  // The unmute hint shows once, for three seconds, at the first view.
  useEffect(() => {
    if (!live || reducedMotion || !near) return;
    setShowHint(true);
    const id = window.setTimeout(() => setShowHint(false), 3000);
    return () => window.clearTimeout(id);
  }, [live, reducedMotion, near]);

  // Mute is derived state: sound is only on while the frame is still in view.
  useEffect(() => {
    if (touched.current) return;
    const video = videoRef.current;
    if (video) video.muted = !(soundOn && near);
  }, [soundOn, near]);

  // A newly playing frame silences its sibling so two videos never overlap.
  const onPlay = useCallback(() => {
    liveVideos.forEach((other, id) => {
      if (id !== media.id) other.pause();
    });
  }, [media.id]);

  // Unmuting hands the sound over to the video; muting (or leaving the view) gives it back.
  const onTouched = useCallback(() => {
    const video = videoRef.current;
    if (!video || failed) return;
    const next = !soundOn;
    touched.current = true;
    if (next) {
      musicWasPlaying.current = music.playing && !music.muted;
      if (musicWasPlaying.current) music.pause();
    } else if (musicWasPlaying.current) {
      musicWasPlaying.current = false;
      music.play();
    }
    setSoundOn(next);
    if (next) video.muted = false;
    setShowHint(false);
  }, [soundOn, music, failed]);

  // A video that scrolled away hands the music back once.
  useEffect(() => {
    if (live && !near && soundOn) {
      setSoundOn(false);
      if (musicWasPlaying.current) {
        musicWasPlaying.current = false;
        music.play();
      }
    }
  }, [live, near, soundOn, music]);

  const variant = tokens.id;
  const radius = variant === "pastel-dream" ? 32 : 24;
  const frameBorder =
    variant === "pastel-dream" ? "6px solid #FFFFFF" : `1px solid ${tokens.colors.primary}80`;
  const frameRotation = variant === "pastel-dream" && !reducedMotion ? "rotate(-1deg)" : undefined;

  return (
    <motion.div
      {...rise(reducedMotion)}
      viewport={viewport}
      style={{ width: "100%", maxWidth: portrait ? 420 : 720, margin: "0 auto" }}
    >
      <div style={{ position: "relative", transform: frameRotation }}>
        <div
          aria-hidden
          className="wish-twinkle"
          style={{
            position: "absolute",
            inset: -8,
            background: tokens.colors.primary,
            filter: "blur(40px)",
            opacity: 0.35,
            transform: "scale(1.05)",
            borderRadius: radius + 8,
          }}
        />

        <div
          ref={frameRef}
          style={{
            position: "relative",
            aspectRatio: media.w && media.h ? `${media.w} / ${media.h}` : "9 / 16",
            borderRadius: radius,
            overflow: "hidden",
            border: frameBorder,
            background: tokens.colors.bgAlt,
            zIndex: 1,
          }}
        >
          <img
            src={poster(media.url)}
            alt={media.caption || t("video.title")}
            width={media.w}
            height={media.h}
            loading="lazy"
            decoding="async"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: mode === "preview" ? 1 : near && ready ? 0 : 1,
            }}
          />

          <video
            ref={videoRef}
            muted
            playsInline
            loop
            preload="none"
            poster={poster(media.url)}
            src={near && !failed ? videoSrc(media.url) : undefined}
            onPlay={onPlay}
            onError={() => setFailed(true)}
            onLoadedData={() => setReady(true)}
            onClick={onTouched}
            aria-label={media.caption || t("video.title")}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: mode === "preview" ? 0 : 1,
            }}
          />

          {reducedMotion && live && !failed ? (
            <button
              type="button"
              aria-label={t("video.play")}
              onClick={() => {
                const video = videoRef.current;
                if (!video) return;
                const started = video.play();
                if (started && typeof started.catch === "function") started.catch(() => undefined);
              }}
              style={{
                position: "absolute",
                inset: 0,
                margin: "auto",
                width: 64,
                height: 64,
                borderRadius: 9999,
                background: "rgba(255,255,255,0.9)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0E0E10",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          ) : null}

          {live && near && !failed ? (
            <>
              <button
                type="button"
                aria-label={soundOn ? t("video.mute") : t("video.unmute")}
                onClick={onTouched}
                style={{
                  position: "absolute",
                  right: "calc(10px + env(safe-area-inset-right))",
                  bottom: "calc(10px + env(safe-area-inset-bottom))",
                  width: 44,
                  height: 44,
                  borderRadius: 9999,
                  border: "1px solid rgba(255,255,255,0.35)",
                  background: "rgba(0,0,0,0.45)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {soundOn ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
                    <path
                      d="M16 9.5a4 4 0 010 5M18.5 7a7.5 7.5 0 010 10"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
                    <path
                      d="M16 9.5l5 5M21 9.5l-5 5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>

              {showHint && !reducedMotion ? (
                <span
                  style={{
                    position: "absolute",
                    right: 16,
                    bottom: 64,
                    fontFamily: tokens.fonts.body,
                    fontSize: 14,
                    color: "#FFFFFF",
                    background: "rgba(0,0,0,0.5)",
                    borderRadius: 9999,
                    padding: "6px 12px",
                    maxWidth: "80%",
                  }}
                >
                  {t("video.unmute")}
                </span>
              ) : null}
            </>
          ) : null}

          {variant === "royal-gold" ? (
            <span
              aria-hidden
              style={{
                position: "absolute",
                inset: 6,
                border: `1px solid ${tokens.colors.primary}80`,
                borderRadius: Math.max(2, radius - 6),
                pointerEvents: "none",
              }}
            />
          ) : null}
        </div>
      </div>

      {media.caption ? (
        <p
          style={{
            textAlign: "center",
            marginTop: 12,
            fontFamily: tokens.fonts.body,
            fontSize: 14,
            color: tokens.colors.muted,
          }}
        >
          {media.caption}
        </p>
      ) : null}
    </motion.div>
  );
}

export function VideoSection({ data, tokens }: SectionProps) {
  const { t, reducedMotion } = useWish();
  const viewport = useViewport();
  const videos = videosOf(data.media ?? []).slice(0, 2);

  if (!videos.length) return null;

  return (
    <section
      id="video"
      className="wish-section px-6 py-16 md:py-24"
      style={{ background: tokens.colors.bg }}
    >
      <div className="mx-auto" style={{ maxWidth: 1100 }}>
        <motion.h2
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: reducedMotion ? 0.3 : 0.7, ease: EASE }}
          className="mb-8 text-center md:mb-12"
          style={{
            fontFamily: tokens.fonts.display,
            color: tokens.colors.text,
            fontSize: "clamp(26px, 6vw, 40px)",
          }}
        >
          {t("video.title")}
        </motion.h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {videos.map((media) => (
            <VideoFrame key={media.id} media={media} tokens={tokens} />
          ))}
        </div>
      </div>
    </section>
  );
}
