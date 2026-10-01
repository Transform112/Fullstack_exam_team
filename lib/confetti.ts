// canvas-confetti is loaded on demand so it is not part of the initial page bundle.
export async function cannon(colors: string[], reduced: boolean) {
  if (reduced) return;
  const confetti = (await import("canvas-confetti")).default;
  const base = {
    colors,
    ticks: 220,
    gravity: 0.9,
    disableForReducedMotion: true,
    zIndex: 70,
  };
  confetti({
    ...base,
    particleCount: 90,
    angle: 60,
    spread: 70,
    origin: { x: 0, y: 0.9 },
    startVelocity: 55,
  });
  confetti({
    ...base,
    particleCount: 90,
    angle: 120,
    spread: 70,
    origin: { x: 1, y: 0.9 },
    startVelocity: 55,
  });
}

export async function fireworks(colors: string[], reduced: boolean) {
  if (reduced) return;
  const confetti = (await import("canvas-confetti")).default;
  let i = 0;
  const id = setInterval(() => {
    confetti({
      colors,
      particleCount: 60,
      spread: 360,
      startVelocity: 30,
      ticks: 70,
      gravity: 0.8,
      zIndex: 70,
      origin: { x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.3 },
      disableForReducedMotion: true,
    });
    if (++i >= 6) clearInterval(id);
  }, 280);
}
