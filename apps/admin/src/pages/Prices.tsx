import { useRef, useState } from 'react';
import { todayInPakistan, type PriceRecord } from '@agrixore/shared';
import { PriceEntryForm, type Target } from '../components/PriceEntryForm';
import { PriceHistory } from '../components/PriceHistory';

export function PricesPage() {
  const [target, setTarget] = useState<Target>({ district: '', date: todayInPakistan() });
  const [nonce, setNonce] = useState(0);
  const formRef = useRef<HTMLElement>(null);

  // Pressing Edit in the history loads that district and day into the form above.
  const edit = (r: PriceRecord) => {
    setTarget({ district: r.districtId, date: r.marketDate });
    setNonce((n) => n + 1);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    formRef.current?.focus({ preventScroll: true });
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-canopy">Mandi prices</h1>
        <p className="text-sm text-muted">Prices you save here appear in the farmer app within a minute or two.</p>
      </div>
      <PriceEntryForm target={target} onTarget={setTarget} nonce={nonce} sectionRef={formRef} />
      <PriceHistory onEdit={edit} />
    </>
  );
}
