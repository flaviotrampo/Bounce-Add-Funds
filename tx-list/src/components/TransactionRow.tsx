import type { Transaction, Flow, Status } from '../types';

// ─── Static lookups (Sets for O(1)) ──────────────────────────────────────────

const IN_PROGRESS_SET = new Set<Status>(['in_progress', 'pending_acceptance', 'awaiting_your_action']);

const BAD_SET = new Set<Status>([
  'declined', 'cancelled', 'expired',
  'errored_fixable', 'errored_new_tx',
  'failed_fixable', 'failed_new_tx',
  'declined_by_recipient', 'declined_by_you',
]);

const P2C_FLOWS = new Set<Flow>(['p2c_send', 'p2c_receive', 'p2c_request', 'p2c_refund']);
const OWN_FLOWS = new Set<Flow>(['own_transfer_out', 'own_transfer_in']);

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; cls: string }> = {
  completed:            { label: 'Completed',              cls: 'bg-green-100 text-green-700' },
  in_progress:          { label: 'In progress',            cls: 'bg-blue-100 text-blue-700' },
  declined:             { label: 'Declined',               cls: 'bg-red-100 text-red-700' },
  cancelled:            { label: 'Cancelled',              cls: 'bg-gray-100 text-gray-500' },
  expired:              { label: 'Expired',                cls: 'bg-amber-100 text-amber-700' },
  errored_fixable:      { label: 'Error · fix & retry',    cls: 'bg-red-100 text-red-700' },
  errored_new_tx:       { label: 'Error · new transfer',   cls: 'bg-red-100 text-red-700' },
  pending_acceptance:   { label: 'Pending',                cls: 'bg-blue-100 text-blue-700' },
  awaiting_your_action: { label: 'Action needed',          cls: 'bg-blue-100 text-blue-700' },
  fulfilled:            { label: 'Fulfilled',              cls: 'bg-green-100 text-green-700' },
  declined_by_recipient:{ label: 'Declined by recipient',  cls: 'bg-red-100 text-red-700' },
  declined_by_you:      { label: 'Declined by you',        cls: 'bg-red-100 text-red-700' },
  refunded:             { label: 'Refunded',               cls: 'bg-green-100 text-green-700' },
  failed_fixable:       { label: 'Failed · fix & retry',   cls: 'bg-red-100 text-red-700' },
  failed_new_tx:        { label: 'Failed · new transfer',  cls: 'bg-red-100 text-red-700' },
};

// ─── Avatar colour palette ────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-violet-200 text-violet-800',
  'bg-sky-200 text-sky-800',
  'bg-emerald-200 text-emerald-800',
  'bg-rose-200 text-rose-800',
  'bg-amber-200 text-amber-800',
  'bg-indigo-200 text-indigo-800',
  'bg-teal-200 text-teal-800',
  'bg-pink-200 text-pink-800',
];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initial(counterparty: string): string {
  return counterparty.replace(/^@/, '').charAt(0).toUpperCase();
}

function formatAmount(n: number): string {
  return n
    .toLocaleString('en-CA', { style: 'currency', currency: 'CAD', currencyDisplay: 'symbol' })
    .replace('CA$', '$');
}

function getAmountStyle(tx: Transaction): { color: string; prefix: string } {
  if (BAD_SET.has(tx.status)) return { color: 'text-gray-400', prefix: '' };
  if (tx.direction === 'receive') return { color: 'text-green-600', prefix: '+' };
  if (tx.direction === 'neutral' && tx.status === 'fulfilled') return { color: 'text-green-600', prefix: '+' };
  return { color: 'text-[#0C0A0B]', prefix: '' };
}

// ─── SVG / icon sub-components (hoisted — never re-created inside render) ────

function BankIcon({ className = 'text-gray-400' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 2L2 7h16L10 2zm-7 6h2v6H3v-6zm4 0h2v6H7v-6zm4 0h2v6h-2v-6zm4 0h2v6h-2v-6zM1 16h18v2H1v-2z" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M17 6H3L2 2h16l-1 4zM2 7h16l1 3H1l1-3zm1 4v6h12v-6H3zm2 1h8v4H5v-4z" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 16" fill="currentColor" aria-hidden>
      <rect x="0" y="0" width="20" height="16" rx="2" fill="#d1d5db" />
      <rect x="0" y="4" width="20" height="4" fill="#9ca3af" />
      <rect x="2" y="10" width="5" height="2" rx="1" fill="#6b7280" />
    </svg>
  );
}

function InteracBadge() {
  return (
    <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
      <span className="text-[7px] font-black text-yellow-900 leading-none">INT</span>
    </div>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ tx }: { tx: Transaction }) {
  if (OWN_FLOWS.has(tx.flow)) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
        <BankIcon />
      </div>
    );
  }
  if (P2C_FLOWS.has(tx.flow)) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
        <StoreIcon />
      </div>
    );
  }
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${avatarColor(tx.counterparty)}`}>
      {initial(tx.counterparty)}
    </div>
  );
}

// ─── Payment-method icon ───────────────────────────────────────────────────────

function WalletIcon() {
  return (
    <svg className="w-4 h-4 text-[#839C02]" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v1H2V4zm0 3h16v9a2 2 0 01-2 2H4a2 2 0 01-2-2V7zm11 2a1 1 0 000 2h2a1 1 0 100-2h-2z"/>
    </svg>
  );
}

function PaymentMethodIcon({ method }: { method: Transaction['paymentMethod'] }) {
  if (method === 'wallet')  return <WalletIcon />;
  if (method === 'interac') return <InteracBadge />;
  if (method === 'eft')     return <BankIcon />;
  return <CardIcon />; // debit or credit_card
}

// ─── Pill labels ──────────────────────────────────────────────────────────────

function FeePill() {
  return (
    <span className="inline-block text-[10.5px] font-medium px-1.5 py-0.5 rounded-full leading-none bg-gray-100 text-gray-500">
      CC fee
    </span>
  );
}

function InteracPill() {
  return (
    <span className="inline-block text-[10.5px] font-medium px-1.5 py-0.5 rounded-full leading-none bg-yellow-50 text-yellow-700">
      Interac
    </span>
  );
}

// ─── Main row ─────────────────────────────────────────────────────────────────

interface Props {
  tx: Transaction;
}

export function TransactionRow({ tx }: Props) {
  const { color, prefix } = getAmountStyle(tx);
  const badge = STATUS_CONFIG[tx.status];
  const showBadge = tx.status !== 'completed';
  const showFeePill = tx.paymentMethod === 'credit_card' && tx.fee != null;
  const showInteracPill = tx.paymentMethod === 'interac' && tx.status !== 'completed';

  const counterpartyDisplay =
    tx.paymentMethod === 'interac' && tx.status === 'completed' && tx.payerName
      ? `Paid by ${tx.payerName}`
      : tx.counterparty;

  const hasPills = showBadge || showFeePill || showInteracPill;

  return (
    <button
      className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors text-left cursor-pointer border-0 appearance-none"
      onClick={() => console.log(tx)}
    >
      <Avatar tx={tx} />

      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-[#0C0A0B] leading-snug truncate m-0">
          {tx.name}
        </p>
        <p className="text-[12px] text-gray-500 leading-snug mt-0.5 truncate m-0">
          {counterpartyDisplay}
        </p>
        {hasPills && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {showBadge && (
              <span className={`inline-block text-[10.5px] font-medium px-1.5 py-0.5 rounded-full leading-none ${badge.cls}`}>
                {badge.label}
              </span>
            )}
            {showFeePill && <FeePill />}
            {showInteracPill && <InteracPill />}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`text-[13.5px] font-semibold tabular-nums leading-snug ${color}`}>
          {prefix}{formatAmount(tx.amount)}
        </span>
        <PaymentMethodIcon method={tx.paymentMethod} />
      </div>
    </button>
  );
}

// Re-export for use in IN_PROGRESS_SET checks from other modules
export { IN_PROGRESS_SET };
