import { useEffect, useRef } from 'react';

/** Shows an image stored as a Blob in IndexedDB and frees the object URL when done. */
export function BlobImage({ blob, alt, className }: { blob: Blob | undefined; alt: string; className?: string }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !blob) return;
    const url = URL.createObjectURL(blob);
    el.src = url;
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return <img ref={ref} alt={alt} className={className} />;
}
