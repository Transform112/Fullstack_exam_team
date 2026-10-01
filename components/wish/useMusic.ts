"use client";

// Ambient sound for the generated page. The API is intentionally small: play() must be
// called from the Intro "Tap to begin" gesture.
import { useCallback, useEffect, useRef, useState } from "react";

export type MusicControls = {
  play: () => void;
  pause: () => void;
  toggleMute: () => void;
  muted: boolean;
  playing: boolean;
  available: boolean;
};

export function useMusic(track: string, enabled: boolean): MusicControls {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intentRef = useRef(false);
  const mutedRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(true);

  const clearFade = useCallback(() => {
    if (fadeRef.current) {
      clearInterval(fadeRef.current);
      fadeRef.current = null;
    }
  }, []);

  const fadeTo = useCallback(
    (target: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      clearFade();
      fadeRef.current = setInterval(() => {
        if (!audioRef.current) return clearFade();
        const delta = target - audio.volume;
        if (Math.abs(delta) < 0.03) {
          audio.volume = target;
          clearFade();
          return;
        }
        audio.volume = Math.min(0.5, Math.max(0, audio.volume + delta * 0.2));
      }, 90);
    },
    [clearFade],
  );

  // The <audio> element is created on the first play() call, never during render.
  const ensureAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio(`/music/${track}.mp3`);
    audio.loop = true;
    audio.preload = "none";
    audio.volume = 0;
    audio.addEventListener("playing", () => setPlaying(true));
    audio.addEventListener("pause", () => setPlaying(false));
    audio.addEventListener("error", () => setAvailable(false));
    audioRef.current = audio;
    return audio;
  }, [track]);

  const play = useCallback(() => {
    if (!enabled || !track || track === "none") return;
    const audio = ensureAudio();
    intentRef.current = true;
    audio.muted = mutedRef.current;
    // Started synchronously inside the user gesture: awaiting first would lose activation.
    const started = audio.play();
    if (started && typeof started.then === "function") {
      started
        .then(() => fadeTo(0.5))
        .catch(() => {
          // Autoplay can be rejected; that is not a missing file, so keep the control.
          setPlaying(false);
        });
    }
  }, [enabled, track, ensureAudio, fadeTo]);

  const pause = useCallback(() => {
    intentRef.current = false;
    clearFade();
    audioRef.current?.pause();
  }, [clearFade]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = next;
    if (!next && intentRef.current && audio.paused) {
      void audio.play().catch(() => setPlaying(false));
    }
  }, []);

  // A hidden tab resumes only music that was playing and unmuted before.
  useEffect(() => {
    const onVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) {
        if (!audio.paused) {
          audio.pause();
          setPlaying(false);
        }
      } else if (intentRef.current && !mutedRef.current && audio.paused) {
        void audio.play().catch(() => setPlaying(false));
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // A track change resets availability and releases the previous element.
  useEffect(() => {
    setAvailable(true);
    return () => {
      clearFade();
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audioRef.current = null;
      }
    };
  }, [track, clearFade]);

  return { play, pause, toggleMute, muted, playing, available };
}
