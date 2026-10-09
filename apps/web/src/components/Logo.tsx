export function Logo({ className = 'size-8' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" className={className}>
      <rect width="64" height="64" rx="16" fill="var(--canopy)" />
      <path d="M32 49V30" stroke="#E6F0E1" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M32 34c-9 0-14-5-14-14 9 0 14 5 14 14Z" fill="#E6F0E1" />
      <path d="M32 29c0-8 5-13 14-13 0 8-5 13-14 13Z" fill="#8FC27A" />
    </svg>
  );
}
