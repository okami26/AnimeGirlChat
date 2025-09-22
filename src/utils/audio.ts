export function b64ToBlobUrl(b64: string, mime: string): string {
  const pure = b64.includes(',') ? b64.split(',').pop()! : b64
  const bin = atob(pure)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: mime }))
}

export function playBase64Wav(base64: string): HTMLAudioElement {
  const url = b64ToBlobUrl(base64, 'audio/wav')
  const audio = new Audio(url)
  const cleanup = () => { try { if (url.startsWith('blob:')) URL.revokeObjectURL(url) } catch {} }
  audio.addEventListener('ended', cleanup, { once: true })
  audio.addEventListener('error', cleanup, { once: true })
  try { void audio.play() } catch {}
  return audio
}

export function playBase64Audio(base64: string, mime = 'audio/mpeg'): HTMLAudioElement {
  const url = b64ToBlobUrl(base64, mime)
  const audio = new Audio(url)
  const cleanup = () => { try { if (url.startsWith('blob:')) URL.revokeObjectURL(url) } catch {} }
  audio.addEventListener('ended', cleanup, { once: true })
  audio.addEventListener('error', cleanup, { once: true })
  try { void audio.play() } catch {}
  return audio
}

export function revokeObjectUrlFromAudio(a: HTMLAudioElement) {
  try { if (a.src?.startsWith('blob:')) URL.revokeObjectURL(a.src) } catch {}
}
