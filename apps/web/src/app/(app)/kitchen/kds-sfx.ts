let audioCtx: AudioContext | null = null;

export async function playNewOrderSfx() {
  if (typeof window === "undefined") return;

  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;

    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const o1 = audioCtx.createOscillator();
    const g1 = audioCtx.createGain();
    o1.type = "sine";
    o1.frequency.setValueAtTime(880, now);
    g1.gain.setValueAtTime(0.0001, now);

    o1.connect(g1);
    g1.connect(audioCtx.destination);

    g1.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    o1.start(now);
    o1.stop(now + 0.24);

    // Small second tone
    const o2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    o2.type = "sine";
    o2.frequency.setValueAtTime(660, now + 0.25);
    g2.gain.setValueAtTime(0.0001, now + 0.25);
    o2.connect(g2);
    g2.connect(audioCtx.destination);
    g2.gain.exponentialRampToValueAtTime(0.1, now + 0.26);
    g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    o2.start(now + 0.25);
    o2.stop(now + 0.44);

    if (typeof window.navigator?.vibrate === "function") {
      window.navigator.vibrate(120);
    }
  } catch {
    // Ignore autoplay/policy errors
  }
}

export function flashDocumentTitle(text: string, ms = 3000) {
  if (typeof window === "undefined") return;
  const original = window.document.title;
  window.document.title = text;
  window.setTimeout(() => {
    window.document.title = original;
  }, ms);
}
