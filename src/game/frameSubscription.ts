/** Coalesce UI notifications only. The store keeps accepting every command immediately. */
export function subscribeOnFrame(
  subscribe: (listener: () => void) => () => void,
  listener: () => void,
  request: (callback: () => void) => number = callback => requestAnimationFrame(callback),
  cancel: (id: number) => void = id => cancelAnimationFrame(id),
): () => void {
  let frame: number | null = null;
  const unsubscribe = subscribe(() => {
    if (frame === null) frame = request(() => { frame = null; listener(); });
  });
  return () => { unsubscribe(); if (frame !== null) cancel(frame); };
}
