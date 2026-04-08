import type { Transaction, Flow, Status, PaymentMethod, Direction } from './types';

// ─── Timestamp generator — 2-min apart, all within today ─────────────────────
const now = new Date();
let tsSeq = 0;
const nextTs = (): string =>
  new Date(now.getTime() - tsSeq++ * 2 * 60_000).toISOString();

// ─── Status → human label (used in transaction name) ─────────────────────────
const STATUS_LABEL: Record<Status, string> = {
  in_progress:          'In Progress',
  completed:            'Completed',
  declined:             'Declined',
  declined_by_recipient:'Declined by Recipient',
  declined_by_you:      'Declined by You',
  cancelled:            'Cancelled',
  expired:              'Expired',
  errored_fixable:      'Error (Fixable)',
  errored_new_tx:       'Error (New Tx)',
  failed_fixable:       'Failed (Fixable)',
  failed_new_tx:        'Failed',
  pending_acceptance:   'Pending',
  awaiting_your_action: 'Awaiting',
  fulfilled:            'Fulfilled',
  refunded:             'Refunded',
};

// ─── Counterparty pools ───────────────────────────────────────────────────────
const P2P = [
  '@alex_h', '@maya_s', '@james_r', '@lisa_m', '@tom_b', '@nina_p',
  '@oliver_f', '@emma_d', '@ryan_c', '@marcus_w', '@sarah_k', '@derek_n',
  '@zoe_l', '@chris_m', '@kayla_t', '@ben_r', '@julia_w', '@max_p',
  '@sophie_f', '@leo_b', '@anna_k', '@dan_m', '@chloe_w', '@ethan_b',
  '@mia_k', '@lucas_b', '@grace_r', '@noah_s', '@ava_m', '@liam_p',
];

const P2C = [
  'Starbucks', 'Amazon', 'Netflix', 'Spotify', 'Apple', 'Uber', 'Airbnb',
  "Jake's Barbershop", 'Corner Store', "Maria's Salon", 'Freelance Co.',
  'Design Studio', 'Tech Solutions', 'Metro Grocers', 'The Coffee House',
  'Quick Eats', 'Pixel Agency', 'CloudSoft Inc', 'BookNook', 'EcoMart',
];

const BANKS = [
  'TD Bank', 'RBC Chequing', 'Desjardins', 'BMO Savings',
  'Scotiabank', 'CIBC Chequing',
];

// ─── Amount sequence (realistic, $8–$500) ────────────────────────────────────
const AMOUNTS = [
  8.50, 12.99, 24.00, 35.00, 45.00, 55.00, 60.00, 75.00,
  85.00, 95.00, 120.00, 130.00, 150.00, 180.00, 200.00,
  220.00, 250.00, 299.00, 350.00, 400.00, 450.00, 500.00,
];

// ─── Direction logic ──────────────────────────────────────────────────────────
function direction(flow: Flow, status: Status): Direction {
  if (flow === 'p2p_send' || flow === 'p2c_send' || flow === 'own_transfer_out') return 'send';
  if (flow === 'p2p_receive' || flow === 'p2c_receive' || flow === 'p2c_refund' || flow === 'own_transfer_in') return 'receive';
  // request flows: fulfilled = money moves, otherwise neutral
  if (flow === 'p2p_request_sent' || flow === 'p2c_request') return status === 'fulfilled' ? 'receive' : 'neutral';
  if (flow === 'p2p_request_received') return status === 'fulfilled' ? 'send' : 'neutral';
  return 'neutral';
}

// ─── payerName: shown on interac+completed rows for receive/request flows ─────
function payerName(flow: Flow, status: Status, method: PaymentMethod, counterparty: string): string | undefined {
  const isReceiveFlow = flow === 'p2p_receive' || flow === 'p2c_receive'
    || flow === 'p2p_request_sent' || flow === 'p2c_request';
  if (method !== 'interac' || status !== 'completed' || !isReceiveFlow) return undefined;
  return counterparty
    .replace(/^@/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Generator ────────────────────────────────────────────────────────────────
let idx = 0;

function gen(
  flow: Flow,
  nameLabel: string,
  status: Status,
  method: PaymentMethod,
  pool: string[],
): Transaction {
  const id = String(++idx);
  const amount = AMOUNTS[idx % AMOUNTS.length];
  const dir = direction(flow, status);
  const counterparty = pool[idx % pool.length];
  const fee = method === 'credit_card' ? Math.round(amount * 0.0175 * 100) / 100 : undefined;

  return {
    id,
    name: `${nameLabel} ${STATUS_LABEL[status]}`,
    flow,
    status,
    paymentMethod: method,
    direction: dir,
    amount,
    counterparty,
    timestamp: nextTs(),
    fee,
    payerName: payerName(flow, status, method, counterparty),
    refNumber: `#RP${(3800 + idx).toString().padStart(5, '0')}`,
  };
}

// ─── Full matrix ──────────────────────────────────────────────────────────────
//
//  Each entry: [flow, nameLabel, statuses[], methods[], pool]
//
//  Resulting count:
//    p2p_send            6 × 5 =  30
//    p2p_receive         4 × 5 =  20
//    p2p_request_sent    5 × 2 =  10
//    p2p_request_received 4 × 3 = 12
//    p2c_send            6 × 5 =  30
//    p2c_receive         3 × 3 =   9
//    p2c_request         4 × 2 =   8
//    p2c_refund          3 × 2 =   6
//    own_transfer_out    4 × 1 =   4
//    own_transfer_in     4 × 1 =   4
//                              ─────
//                                133
//
type MatrixRow = [Flow, string, Status[], PaymentMethod[], string[]];

const MATRIX: MatrixRow[] = [
  [
    'p2p_send', 'P2P Send',
    ['in_progress', 'completed', 'declined', 'cancelled', 'errored_fixable', 'errored_new_tx'],
    ['wallet', 'eft', 'interac', 'debit', 'credit_card'],
    P2P,
  ],
  [
    'p2p_receive', 'P2P Receive',
    ['in_progress', 'completed', 'cancelled', 'errored_new_tx'],
    ['wallet', 'eft', 'interac', 'debit', 'credit_card'],
    P2P,
  ],
  [
    'p2p_request_sent', 'P2P Request Sent',
    ['pending_acceptance', 'fulfilled', 'cancelled', 'expired', 'declined_by_recipient'],
    ['interac', 'debit'],
    P2P,
  ],
  [
    'p2p_request_received', 'P2P Request Received',
    ['awaiting_your_action', 'fulfilled', 'declined_by_you', 'expired'],
    ['wallet', 'debit', 'credit_card'],
    P2P,
  ],
  [
    'p2c_send', 'P2C Send',
    ['in_progress', 'completed', 'declined', 'cancelled', 'errored_fixable', 'errored_new_tx'],
    ['wallet', 'eft', 'interac', 'debit', 'credit_card'],
    P2C,
  ],
  [
    'p2c_receive', 'P2C Receive',
    ['in_progress', 'completed', 'errored_new_tx'],
    ['wallet', 'eft', 'debit'],
    P2C,
  ],
  [
    'p2c_request', 'P2C Request',
    ['pending_acceptance', 'fulfilled', 'expired', 'cancelled'],
    ['interac', 'debit'],
    P2C,
  ],
  [
    'p2c_refund', 'P2C Refund',
    ['in_progress', 'refunded', 'failed_new_tx'],
    ['wallet', 'eft'],
    P2C,
  ],
  [
    'own_transfer_out', 'Internal Transfer Out',
    ['in_progress', 'completed', 'failed_fixable', 'failed_new_tx'],
    ['eft'],
    BANKS,
  ],
  [
    'own_transfer_in', 'Internal Transfer In',
    ['in_progress', 'completed', 'failed_fixable', 'failed_new_tx'],
    ['eft'],
    BANKS,
  ],
];

export const transactions: Transaction[] = MATRIX.flatMap(
  ([flow, nameLabel, statuses, methods, pool]) =>
    statuses.flatMap((status) =>
      methods.map((method) => gen(flow, nameLabel, status, method, pool)),
    ),
);
