/** Shares text through the system share sheet, or falls back to a WhatsApp link. */
export async function shareText(text: string): Promise<void> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}
