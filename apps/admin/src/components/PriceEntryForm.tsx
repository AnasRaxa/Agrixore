import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, History as HistoryIcon } from 'lucide-react';
import { useState } from 'react';
import { COMMODITY_IDS, todayInPakistan, type AdminPriceDto, type CommodityId, type PriceInput } from '@agrixore/shared';
import { ApiError, api } from '../api';
import { COMMODITY_LABEL, DISTRICTS, districtLabel } from '../labels';
import { draftFromPrevious, draftFromRecords, emptyDraft, fillBlanks, isBlank, rowsEqual, toBatch, type Draft, type RowDraft } from '../lib/entry';
import { formatDate } from '../lib/format';
import { Button, Card, Notice, Spinner, inputClass } from './ui';

export interface Target { district: string; date: string }

/** One commodity per row: name, three prices, status. On a phone the name sits above a row of three inputs. */
const ROW = 'grid grid-cols-3 gap-x-2 gap-y-1 sm:grid-cols-[6rem_repeat(3,minmax(0,1fr))_8rem] sm:items-start sm:gap-x-3';

interface Props {
  target: Target;
  onTarget: (t: Target) => void;
  /** Changes when the person presses Edit in the history, so the grid reloads from saved data. */
  nonce: number;
  sectionRef: React.RefObject<HTMLElement | null>;
}

export function PriceEntryForm({ target, onTarget, nonce, sectionRef }: Props) {
  const { district, date } = target;
  const today = todayInPakistan();
  const dateProblem = !date ? 'Choose a date.' : date > today ? 'The date cannot be in the future.' : null;

  // All saved prices of the district (newest first), so the form can show today's values and offer the previous ones.
  const history = useQuery({
    queryKey: ['prices', 'district', district],
    queryFn: () => api.prices({ district, limit: 200 }),
    enabled: !!district,
    refetchOnWindowFocus: false,
  });

  return (
    <Card>
      <section ref={sectionRef} aria-labelledby="set-prices" tabIndex={-1} className="outline-none">
        <h2 id="set-prices" className="text-lg font-bold text-canopy">Set prices</h2>
        <p className="mb-4 text-sm text-muted">Enter the prices you collected for one district and one market day. All prices are in PKR per 40 kg.</p>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="entry-district" className="mb-1 block text-sm font-medium">District</label>
            <select id="entry-district" value={district} onChange={(e) => onTarget({ ...target, district: e.target.value })} className={inputClass}>
              <option value="">Choose a district…</option>
              {DISTRICTS.map((d) => <option key={d.id} value={d.id}>{d.name.en}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="entry-date" className="mb-1 block text-sm font-medium">Market date</label>
            <input id="entry-date" type="date" max={today} value={date} onChange={(e) => onTarget({ ...target, date: e.target.value })} className={inputClass} />
          </div>
        </div>

        {dateProblem && <Notice tone="warn" live>{dateProblem}</Notice>}
        {!district && !dateProblem && <p className="text-sm text-muted">Choose a district to start.</p>}
        {district && !dateProblem && history.isPending && <Spinner label="Loading saved prices" />}
        {district && !dateProblem && history.isError && <Notice tone="error" live>Could not load the saved prices. Please try again.</Notice>}
        {district && !dateProblem && history.data && <EntryGrid key={`${district}|${date}|${nonce}`} district={district} date={date} records={history.data.items} />}
      </section>
    </Card>
  );
}

function EntryGrid({ district, date, records }: { district: string; date: string; records: AdminPriceDto[] }) {
  const qc = useQueryClient();
  const saved = draftFromRecords(records.filter((r) => r.marketDate === date));
  const previous = draftFromPrevious(records, date);
  const [draft, setDraft] = useState<Draft>(saved);
  const [errors, setErrors] = useState<Partial<Record<CommodityId, string>>>({});
  const [message, setMessage] = useState<string | null>(null);

  // Only rows that are new or different from what is already saved get sent.
  const changed = emptyDraft();
  for (const id of COMMODITY_IDS) if (!isBlank(draft[id]) && !rowsEqual(draft[id], saved[id])) changed[id] = draft[id];
  const changedCount = COMMODITY_IDS.filter((id) => !isBlank(changed[id])).length;
  const canFill = COMMODITY_IDS.some((id) => isBlank(draft[id]) && !isBlank(previous[id]));

  const save = useMutation({
    mutationFn: (prices: PriceInput[]) => api.savePrices({ prices }),
    onSuccess: (done) => {
      setErrors({});
      setMessage(`Saved ${done.length} ${done.length === 1 ? 'price' : 'prices'} for ${districtLabel(district)} on ${formatDate(date)}.`);
      void qc.invalidateQueries({ queryKey: ['prices'] });
      void qc.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (e, prices) => {
      setMessage(null);
      // Show the server's field messages on the right rows ("prices.2.modal" refers to the third price sent).
      const next: Partial<Record<CommodityId, string>> = {};
      if (e instanceof ApiError) for (const d of e.details ?? []) {
        const i = Number(/^prices\.(\d+)\./.exec(d.path)?.[1]);
        const id = prices[i]?.commodityId;
        if (id) next[id] = d.message;
      }
      setErrors(next);
    },
  });

  const edit = (id: CommodityId, field: keyof RowDraft, value: string) => {
    setDraft((d) => ({ ...d, [id]: { ...d[id], [field]: value } }));
    setErrors((e) => ({ ...e, [id]: undefined }));
    setMessage(null);
  };

  const submit = () => {
    const { prices, errors: found } = toBatch(changed, district, date);
    setErrors(found);
    setMessage(null);
    if (Object.keys(found).length === 0 && prices.length > 0) save.mutate(prices);
  };

  const status = (id: CommodityId) => {
    const row = draft[id];
    if (isBlank(row)) return isBlank(saved[id]) ? '' : 'Not changed';
    if (isBlank(saved[id])) return 'New';
    return rowsEqual(row, saved[id]) ? 'Saved' : 'Changed';
  };

  const hasSaved = COMMODITY_IDS.some((id) => !isBlank(saved[id]));
  const serverError = save.isError && Object.keys(errors).length === 0 ? (save.error instanceof ApiError ? save.error.message : 'Could not save. Please try again.') : null;

  return (
    <div>
      {hasSaved && <p className="mb-3 text-sm text-muted">Prices already saved for this day are filled in. Change a value and save to update it.</p>}
      {canFill && (
        <Button variant="secondary" className="mb-3 text-sm" onClick={() => setDraft((d) => fillBlanks(d, previous))}>
          <HistoryIcon aria-hidden="true" className="size-4" />Fill empty rows with the last saved prices
        </Button>
      )}

      <div role="group" aria-label={`Prices for ${districtLabel(district)} on ${formatDate(date)}`}>
        <div className={`${ROW} hidden border-b border-line text-sm text-muted sm:grid`} aria-hidden="true">
          <span>Commodity</span><span>Lowest</span><span>Typical</span><span>Highest</span><span>Status</span>
        </div>
        {COMMODITY_IDS.map((id) => {
          const badge = (
            <>
              {status(id) === 'Saved' && <span className="inline-flex items-center gap-1 font-semibold text-leaf"><Check aria-hidden="true" className="size-4" />Saved</span>}
              {status(id) === 'New' && <span className="font-semibold text-canopy">New</span>}
              {status(id) === 'Changed' && <span className="font-semibold text-grain">Changed</span>}
              {status(id) === 'Not changed' && <span className="text-muted">Not changed</span>}
            </>
          );
          return (
            <div key={id} role="group" aria-labelledby={`c-${id}`} className={`${ROW} border-b border-line/60 py-3 last:border-0`}>
              <div className="col-span-3 flex items-center justify-between sm:col-span-1 sm:block sm:pt-2">
                <span id={`c-${id}`} className="font-semibold">{COMMODITY_LABEL[id]}</span>
                <span className="text-xs sm:hidden">{badge}</span>
              </div>
              {(['min', 'modal', 'max'] as const).map((field) => {
                const word = field === 'min' ? 'lowest' : field === 'modal' ? 'typical' : 'highest';
                return (
                  <div key={field}>
                    <span aria-hidden="true" className="mb-0.5 block text-xs capitalize text-muted sm:hidden">{word}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      aria-label={`${COMMODITY_LABEL[id]} ${word} price`}
                      aria-invalid={errors[id] ? true : undefined}
                      aria-describedby={errors[id] ? `err-${id}` : undefined}
                      value={draft[id][field]}
                      onChange={(e) => edit(id, field, e.target.value)}
                      className={`${inputClass} tabular-nums ${errors[id] ? 'border-clay' : ''}`}
                    />
                  </div>
                );
              })}
              <div className="col-span-3 text-xs sm:col-span-1 sm:pt-2.5">
                <span className="hidden sm:inline">{badge}</span>
                {errors[id] && <p id={`err-${id}`} role="alert" className="text-clay sm:mt-1">{errors[id]}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-muted">Leave a row empty to skip that commodity. Emptying a saved row does not delete it; use Delete in the history below.</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={submit} disabled={changedCount === 0 || save.isPending}>
          {save.isPending ? 'Saving…' : changedCount === 0 ? 'Nothing to save' : `Save ${changedCount} ${changedCount === 1 ? 'price' : 'prices'}`}
        </Button>
        {message && <Notice tone="success" live>{message}</Notice>}
        {serverError && <Notice tone="error" live>{serverError}</Notice>}
        {Object.keys(errors).length > 0 && <Notice tone="error" live>Some prices need fixing. See the messages next to them.</Notice>}
      </div>
    </div>
  );
}
