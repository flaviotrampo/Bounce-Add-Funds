export type Flow =
  | 'p2p_send' | 'p2p_receive' | 'p2p_request_sent' | 'p2p_request_received'
  | 'p2c_send' | 'p2c_receive' | 'p2c_request' | 'p2c_refund'
  | 'own_transfer_out' | 'own_transfer_in';

export type Status =
  | 'completed' | 'in_progress' | 'declined' | 'cancelled' | 'expired'
  | 'errored_fixable' | 'errored_new_tx'
  | 'pending_acceptance'
  | 'awaiting_your_action'
  | 'fulfilled'
  | 'declined_by_recipient'
  | 'declined_by_you'
  | 'refunded'
  | 'failed_fixable' | 'failed_new_tx';

export type PaymentMethod = 'wallet' | 'eft' | 'interac' | 'debit' | 'credit_card';

export type Direction = 'send' | 'receive' | 'neutral';

export interface Transaction {
  id: string;
  name: string;
  flow: Flow;
  status: Status;
  paymentMethod: PaymentMethod;
  direction: Direction;
  amount: number;
  counterparty: string;
  timestamp: string;
  fee?: number;
  payerName?: string;
  refNumber: string;
}
