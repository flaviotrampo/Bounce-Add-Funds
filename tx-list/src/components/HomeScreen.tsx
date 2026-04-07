import { useMemo } from 'react';
import type { Transaction, Status } from '../types';
import { TransactionSection } from './TransactionSection';
import { IN_PROGRESS_SET } from './TransactionRow';

// Hoisted — stable reference, never recreated on render
const IN_PROGRESS_STATUSES: Status[] = ['in_progress', 'pending_acceptance', 'awaiting_your_action'];

function formatBalance(n: number): string {
  return n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', currencyDisplay: 'symbol' })
          .replace('CA$', '$');
}

// Hoisted static header SVGs
const BounceLogo = (
  <svg width="25" height="22" viewBox="0 0 40 35" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M37.8117 10.2979C37.3446 8.47255 36.3965 6.80436 35.0665 5.46648C33.7365 4.12859 32.0732 3.16879 30.2505 2.68805C28.4279 2.20731 26.5116 2.22225 24.6966 2.73131C22.8817 3.24037 21.2336 4.22527 19.9243 5.58318L5.60437 20.546C4.54219 21.6567 3.78391 23.0227 3.40735 24.5119C3.0308 26.001 3.04943 27.5618 3.46145 29.0413C3.87347 30.5208 4.6643 31.8687 5.75204 32.9536C6.83978 34.0385 8.18791 34.8247 9.66771 35.2319C11.1475 35.6392 12.7083 35.6529 14.1951 35.2717C15.6819 34.8905 17.0439 34.1272 18.1508 33.0614L32.4707 18.0985C33.7746 16.754 34.7411 15.0905 35.2799 13.2685C35.8186 11.4465 35.9125 9.52058 35.5535 7.65509" fill="#0C0A0B"/>
    <path d="M20.7289 27.9327C18.9035 27.4657 17.2353 26.5176 15.8974 25.1876C14.5596 23.8576 13.5997 22.1943 13.119 20.3717C12.6382 18.549 12.6532 16.6328 13.1622 14.8178C13.6713 13.0028 14.6562 11.3547 16.0141 10.0454L16.0576 10.0019H4.37507C2.84619 10.0019 1.37966 10.6103 0.294248 11.6958C-0.791167 12.7812 -0.791167 14.2477 0.294248 15.3332L0.294248 15.3332C1.37966 16.4186 2.84619 17.027 4.37507 17.027H6.09745V30.7083C6.09745 31.4442 6.38546 32.1499 6.89962 32.6687C7.41378 33.1875 8.11248 33.4807 8.84199 33.4807H8.84199C9.5715 33.4807 10.2702 33.1875 10.7844 32.6687L10.7844 32.6687C11.2985 32.1499 11.5866 31.4442 11.5866 30.7083V17.027H16.0576L20.7289 27.9327Z" fill="#0C0A0B"/>
  </svg>
);

const BalanceLogo = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#D8F835"/>
    <g clipPath="url(#clip0_home_b)">
      <g clipPath="url(#clip1_home_b)">
        <path d="M18.0117 9.33004C17.7789 8.42754 17.2969 7.60656 16.6186 6.9585C15.9403 6.31043 15.0927 5.85944 14.172 5.65225C13.2513 5.44505 12.2921 5.48938 11.3946 5.78035C10.4971 6.07132 9.6962 6.5978 9.07869 7.30498L1.95563 14.7978C1.4257 15.3527 1.05744 16.043 0.886984 16.7932C0.716527 17.5434 0.749971 18.3258 0.983256 19.0589C1.21654 19.7919 1.64119 20.4484 2.21398 20.9598C2.78677 21.4713 3.48672 21.8189 4.24008 21.9666C4.99345 22.1142 5.77197 22.0564 6.49537 21.7992C7.21877 21.5421 7.86015 21.0947 8.35259 20.5041L15.4757 13.0113C16.1251 12.3341 16.5856 11.4988 16.8112 10.5895C17.0368 9.68017 17.0195 8.72832 16.7611 7.82769" fill="#0C0A0B"/>
        <path d="M10.5215 16.2315C9.60966 15.9986 8.78868 15.5167 8.14061 14.8384C7.49255 14.1601 7.04156 13.3125 6.83437 12.3917C6.62717 11.471 6.6715 10.5118 6.96248 9.61431C7.25345 8.71685 7.77993 7.91587 8.48711 7.29835L8.50847 7.27699H2.76693C2.0062 7.27699 1.27657 7.57947 0.73894 8.1171C0.201314 8.65473 -0.101172 9.38436 -0.101172 10.1451V10.1451C-0.101172 10.9058 0.201314 11.6354 0.73894 12.1731C1.27657 12.7107 2.0062 13.0132 2.76693 13.0132H3.62434V20.0754C3.62434 20.4462 3.77163 20.8018 4.03394 21.0641C4.29625 21.3264 4.65184 21.4737 5.02262 21.4737H5.02262C5.3934 21.4737 5.74899 21.3264 6.0113 21.0641V21.0641C6.27361 20.8018 6.4209 20.4462 6.4209 20.0754V13.0132H8.50847L10.5215 16.2315Z" fill="#0C0A0B"/>
      </g>
    </g>
    <defs>
      <clipPath id="clip0_home_b"><rect width="13.5" height="13.5" fill="white" transform="translate(5.25 5.25)"/></clipPath>
      <clipPath id="clip1_home_b"><rect width="13.5" height="11.8125" fill="white" transform="translate(5.25 5.8125)"/></clipPath>
    </defs>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  transactions: Transaction[];
  balance?: number;
}

export function HomeScreen({ transactions, balance = 10_000 }: Props) {
  const { inProgress, today } = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return {
      inProgress: sorted.filter((tx) => IN_PROGRESS_SET.has(tx.status)),
      today: sorted.filter((tx) => !IN_PROGRESS_SET.has(tx.status)),
    };
  }, [transactions]);

  return (
    <div className="flex flex-col h-full bg-[#F7F6F7]">

      {/* ── Header ── */}
      <header className="bg-white px-4 pt-14 pb-4 shrink-0">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {BounceLogo}
            <span className="text-lg font-bold tracking-tight text-[#0C0A0B]">BOUNCE</span>
          </div>
          {/* Notification bell placeholder */}
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3l-2 2v1h16v-1l-2-2V8a6 6 0 00-6-6zm0 16a2 2 0 100-4 2 2 0 000 4z"/>
            </svg>
          </div>
        </div>

        {/* Balance pill */}
        <div className="inline-flex items-center gap-2 bg-[#D8F835] rounded-full px-4 py-2">
          {BalanceLogo}
          <span className="text-xl font-bold text-[#0C0A0B] tabular-nums">
            {formatBalance(balance)}
          </span>
        </div>
      </header>

      {/* ── Transaction feed ── */}
      <main className="flex-1 overflow-y-auto">
        <TransactionSection title="In progress" transactions={inProgress} />
        <TransactionSection title="Today" transactions={today} />
      </main>

    </div>
  );
}

// For the dev reference page: export the section header label array
export const SECTION_LABELS = ['In progress', 'Today'] as const;
export { IN_PROGRESS_STATUSES };
