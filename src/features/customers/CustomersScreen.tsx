import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CustomerFormModal } from './CustomerFormModal';
import { CustomerDetailsModal } from './CustomerDetailsModal';
import { OriginateLoanModal } from '../loanOrigination/OriginateLoanModal';
import { customerApi } from '../../api/customers';
import type { Customer } from '../../api/types';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import {
  Users,
  Search,
  PlusCircle,
  Phone,
  AlertCircle,
  UserPlus,
  ChevronRight,
} from 'lucide-react';

interface CustomersScreenProps {
  onViewLoan?: (loanId: string) => void;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({ onViewLoan }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isOriginateLoanOpen, setIsOriginateLoanOpen] = useState(false);
  const [loanCustomer, setLoanCustomer] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerApi.getCustomers({
        search: searchQuery || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit: 50,
      });
      setCustomers(data.customers || []);
      setTotalRecords(data.pagination?.totalRecords || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer directory.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Open Details Modal
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailsOpen(true);
  };

  // Open Customer Form for Edit
  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  // Open Originate Loan Modal for Customer
  const handleOriginateLoanForCustomer = (customer: Customer) => {
    setLoanCustomer(customer);
    setIsOriginateLoanOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Page Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Customer Directory
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage borrower profiles, active loans, and initial security deposits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outlined"
            size="sm"
            onClick={() => {
              setEditingCustomer(null);
              setIsFormOpen(true);
            }}
            icon={<UserPlus className="h-4 w-4" />}
          >
            Add Profile Only
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setLoanCustomer(null);
              setIsOriginateLoanOpen(true);
            }}
            icon={<PlusCircle className="h-4 w-4" />}
          >
            Add Customer & Loan
          </Button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto text-xs font-semibold">
            {(['all', 'active', 'inactive'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setStatusFilter(tab);
                  setPage(1);
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg capitalize transition-all ${
                  statusFilter === tab
                    ? 'bg-white text-[#1E3A8A] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outlined" size="sm" onClick={fetchCustomers}>
            Retry
          </Button>
        </div>
      )}

      {/* Customers List / Table */}
      {loading ? (
        <LoadingSpinner fullHeight label="Fetching borrower directory..." />
      ) : customers.length === 0 ? (
        <EmptyState
          title="No Customers Found"
          subtitle={
            searchQuery
              ? `No borrowers matching "${searchQuery}".`
              : 'Add your first customer and originate a loan to get started.'
          }
          icon={<Users className="h-8 w-8" />}
          actionText="+ Add Customer & Loan"
          onAction={() => setIsOriginateLoanOpen(true)}
        />
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Borrower</th>
                  <th className="px-4 py-3.5">Phone Number</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Initial Deposit</th>
                  <th className="px-4 py-3.5">Registration</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-[#DBEAFE] text-[#1E3A8A] flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                          {c.full_name
                            .split(' ')
                            .map((s) => s[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <span className="font-bold text-[#0F172A] block text-sm">
                            {c.full_name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {c.address ? c.address.slice(0, 30) : 'No address'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-600">
                      {c.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge variant={c.status === 'active' ? 'success' : 'neutral'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right font-bold text-slate-700">
                      {formatCurrency(c.initial_amount_collected)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCustomer(c);
                          }}
                        >
                          View
                        </Button>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {customers.length} of {totalRecords} registered borrowers
            </span>
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCustomer(null);
        }}
        onSuccess={fetchCustomers}
        customer={editingCustomer}
      />

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onEdit={handleEditCustomer}
        onOriginateLoan={handleOriginateLoanForCustomer}
        onCustomerUpdated={fetchCustomers}
        onCustomerDeleted={fetchCustomers}
        onViewLoan={onViewLoan}
      />

      {/* Originate Loan Modal */}
      <OriginateLoanModal
        isOpen={isOriginateLoanOpen}
        onClose={() => {
          setIsOriginateLoanOpen(false);
          setLoanCustomer(null);
        }}
        onSuccess={fetchCustomers}
        initialCustomer={loanCustomer}
      />
    </div>
  );
};
