import type { Transaction } from '../types';
import { TransactionRow } from './TransactionRow';

interface Props {
  title: string;
  transactions: Transaction[];
}

export function TransactionSection({ title, transactions }: Props) {
  if (transactions.length === 0) return null;

  return (
    <section>
      {/* Sticky section header */}
      <div className="sticky top-0 z-10 bg-[#F7F6F7] px-4 py-2 border-b border-gray-100">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 m-0 leading-none">
          {title}
        </h2>
      </div>

      {/* Rows separated by hairline dividers */}
      <div className="divide-y divide-gray-100">
        {transactions.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </div>
    </section>
  );
}
