export interface Customer {
  id: string;
  full_name: string;
  name?: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  id_type: string | null;
  id_number: string | null;
  status: 'active' | 'inactive';
  initial_amount_collected: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface LoanMetadata {
  monthly_interest_rate?: number;
  monthly_interest_amount?: number;
  total_interest?: number;
  duration_in_months?: number;
  first_due_date?: string;
  final_due_date?: string;
  notes?: string;
}

export interface Loan {
  id: string;
  plan_code: string;
  loan_code: string;
  customer_id: string;
  customer?: {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    status: string;
  } | null;
  customer_name?: string | null;
  title: string;
  principal_amount: number;
  interest_rate: number;
  total_amount: number;
  total_repayment: number;
  total_interest?: number;
  monthly_interest_amount?: number;
  duration_in_months?: number;
  down_payment?: number;
  total_installments: number;
  frequency: 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'defaulted';
  notes: string;
  created_at: string;
  updated_at: string;

  // Enriched metrics
  amount_collected?: number;
  total_collected?: number;
  outstanding_balance?: number;
  progress?: number;
  paid_installments_count?: number;
  overdue_installments_count?: number;
  next_due_date?: string | null;
  next_due_amount?: number;
}

export interface Installment {
  id: string;
  plan_id: string;
  customer_id: string;
  customer?: {
    id: string;
    full_name: string;
    phone: string | null;
  } | null;
  customer_name?: string | null;
  plan?: {
    id: string;
    title: string;
    plan_code: string;
    frequency: string;
  } | null;
  plan_code?: string | null;
  installment_number: number;
  period_label: string;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  outstanding_balance: number;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  payment_reference: string;
  customer_id: string;
  plan_id: string;
  installment_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'upi' | 'bank_transfer' | 'cheque' | string;
  notes: string | null;
  receipt_url: string | null;
  created_at: string;
  customers?: {
    id: string;
    full_name: string;
    phone: string | null;
  } | null;
  payment_plans?: {
    id: string;
    title: string;
    plan_code: string;
  } | null;
}

export interface LoanPreviewSummary {
  principal: number;
  monthlyInterestRate: number;
  frequency: 'weekly' | 'monthly';
  totalInstallments: number;
  durationInMonths: number;
  monthlyInterest: number;
  totalInterest: number;
  totalRepayment: number;
  baseInstallment: number;
  finalInstallmentAdjustment: number;
  regularInstallmentAmount: number;
  startDate: string;
  firstDueDate: string;
  finalDueDate: string;
  totalScheduledAmount: number;
  isReconciled: boolean;
}

export interface LoanPreviewInstallment {
  installment_number: number;
  period_label: string;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  outstanding_balance: number;
  status: string;
}

export interface LoanPreviewResponse {
  summary: LoanPreviewSummary;
  installments: LoanPreviewInstallment[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: PaginationMeta;
}

export interface CustomersListResponse {
  customers: Customer[];
  pagination: PaginationMeta;
}

export interface ReportMetrics {
  totalCustomers: number;
  activeCustomers: number;
  totalLoans: number;
  totalPrincipalDisbursed: number;
  totalRepaymentExpected: number;
  totalCollected: number;
  outstandingPrincipal: number;
  totalInstallments: number;
}

export interface ReportData {
  range: string;
  startDate: string | null;
  endDate: string | null;
  metrics: ReportMetrics;
  customers: Customer[];
  loans: Loan[];
  installments: Installment[];
}
