type Listener = (message: string) => void

const listeners = new Set<Listener>()

export function toast(message: string): void {
  for (const listen of listeners) listen(message)
}

export function onToast(listen: Listener): () => void {
  listeners.add(listen)
  return () => {
    listeners.delete(listen)
  }
}
