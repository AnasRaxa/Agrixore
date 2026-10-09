import { CloudSun, House, ScanLine, Store } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/', key: 'home', Icon: House, end: true },
  { to: '/scan', key: 'scan', Icon: ScanLine, end: false },
  { to: '/weather', key: 'weather', Icon: CloudSun, end: false },
  { to: '/mandi', key: 'mandi', Icon: Store, end: false },
] as const;
