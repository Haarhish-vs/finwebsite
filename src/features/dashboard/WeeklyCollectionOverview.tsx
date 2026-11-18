import React, { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../../api/dashboard';
import type {
  WeeklyCollectionsResponse,
  WeekdayBreakdown,
  WeeklyCollectionItem,
  Installment,
} from '../../api/types';
import { formatCurrency } from '../../utils/currency';
import { formatDate, toInputDateFormat } from '../../utils/date';
import { RecordPaymentModal } from '../payments/RecordPaymentModal';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Users,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Phone,
  ArrowUpRight,
  CalendarDays,
} from 'lucide-react';

interface WeeklyCollectionOverviewProps {
  onDataChanged?: () => void;
}

export const WeeklyCollectionOverview: React.FC<WeeklyCollectionOverviewProps> = ({
  onDataChanged,
}) => {
  // Current anchor date (defaults to today)
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  const [data, setData] = useState<WeeklyCollectionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected weekday for the drill-down table (default to Monday or today's weekday)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [todayIso] = useState<string>(() => toInputDateFormat(new Date()));

  // Payment modal state
  const [activeInstallmentForPayment, setActiveInstallmentForPayment] =
    useState<Installment | null>(null);

  const fetchCollections = useCallback(async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = toInputDateFormat(date);
      const res = await dashboardApi.getWeeklyCollections({ week_date: dateStr });
      setData(res);

      // Auto-select today's day of the week if within this week range, otherwise first weekday
      const matchIdx = res.weekdays.findIndex((w) => w.date === todayIso);
      if (matchIdx >= 0) {
        setSelectedDayIndex(matchIdx);
      } else {
        setSelectedDayIndex(0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load weekly collection overview');
    } finally {
      setLoading(false);
    }
  }, [todayIso]);

  useEffect(() => {
    fetchCollections(anchorDate);
  }, [anchorDate, fetchCollections]);

  // Week navigation helpers
  const handlePrevWeek = () => {
    const prev = new Date(anchorDate);
    prev.setDate(prev.getDate() - 7);
    setAnchorDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(anchorDate);
    next.setDate(next.getDate() + 7);
    setAnchorDate(next);
  };

  const handleCurrentWeek = () => {
    setAnchorDate(new Date());
  };

  const handleRefresh = () => {
    fetchCollections(anchorDate);
  };

  const handleOpenPaymentModal = (item: WeeklyCollectionItem) => {
    const inst: Installment = {
      id: item.installment_id,
      plan_id: '',
      customer_id: item.customer_id || '',
      customer_name: item.customer_name,
      customer: {
        id: item.customer_id || '',
        full_name: item.customer_name,
        phone: item.phone_number,
      },
      plan_code: item.plan_code,
      period_label: `Week ${item.installment_number}`,
      installment_number: item.installment_number,
      due_date: item.due_date,
      amount_due: item.installment_amount,
      amount_paid: item.amount_paid,
      outstanding_balance: item.outstanding_balance,
      status: (item.status || 'pending') as Installment['status'],
      paid_at: null,
      created_at: '',
      updated_at: '',
    };
    setActiveInstallmentForPayment(inst);
  };

  const handlePaymentSuccess = () => {
    setActiveInstallmentForPayment(null);
    fetchCollections(anchorDate);
    if (onDataChanged) {
      onDataChanged();
    }
  };

  const selectedWeekdayData: WeekdayBreakdown | undefined =
    data?.weekdays?.[selectedDayIndex];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header & Week Selector */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1E3A8A]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Weekly Collection Overview</h2>
              <span className="text-[11px] font-semibold bg-[#1E3A8A]/10 text-[#1E3A8A] px-2 py-0.5 rounded-full">
                7-Day Schedule
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Weekday-wise scheduled collections for weekly borrowers
            </p>
          </div>
        </div>

        {/* Date Navigator Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="px-3 text-xs font-bold text-slate-800 whitespace-nowrap">
              {data ? (
                <span>
                  {formatDate(data.week_start)} &ndash; {formatDate(data.week_end)}
                </span>
              ) : (
                'Loading week...'
              )}
            </div>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Next Week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleCurrentWeek}
            className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            Current Week
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl shadow-xs transition-colors"
            title="Refresh"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="m-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Tiles for the Selected Week */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-5 bg-white border-b border-slate-100">
        <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100/70 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100/80 flex items-center justify-center text-[#1E3A8A]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Weekly Borrowers Due
            </span>
            <div className="text-xl font-bold text-slate-900">
              {data ? data.total_weekly_customers : 0}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100/70 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-100/80 flex items-center justify-center text-indigo-700">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Total Scheduled Due
            </span>
            <div className="text-xl font-bold text-indigo-900">
              {formatCurrency(data?.total_weekly_amount_due || 0)}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100/70 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-100/80 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Total Weekly Collected
            </span>
            <div className="text-xl font-bold text-emerald-700">
              {formatCurrency(data?.total_weekly_collected || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Weekday Selector Cards (Monday through Sunday) */}
      <div className="p-4 sm:p-5 bg-slate-50/30 border-b border-slate-100">
        <div className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between">
          <span>Click a day to view scheduled borrowers</span>
          <span className="text-slate-400 font-normal">Monday &ndash; Sunday</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {(data?.weekdays || []).map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            const isToday = day.date === todayIso;

            return (
              <button
                key={day.weekday}
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-md ring-2 ring-blue-300'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {isToday && (
                  <span
                    className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isSelected
                        ? 'bg-blue-300 text-blue-950'
                        : 'bg-blue-100 text-[#1E3A8A]'
                    }`}
                  >
                    Today
                  </span>
                )}

                <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {day.weekday}
                </div>
                <div
                  className={`text-[11px] mb-2 ${
                    isSelected ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {formatDate(day.date)}
                </div>

                <div className="mt-1 flex items-baseline justify-between">
                  <span
                    className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {day.customer_count} {day.customer_count === 1 ? 'due' : 'due'}
                  </span>
                </div>

                <div
                  className={`text-sm font-bold mt-1.5 truncate ${
                    isSelected ? 'text-white' : 'text-[#1E3A8A]'
                  }`}
                >
                  {formatCurrency(day.total_due)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Weekday Drill-down List */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {selectedWeekdayData ? `${selectedWeekdayData.weekday} Collections` : 'Day Collections'}
            </h3>
            <p className="text-xs text-slate-500">
              {selectedWeekdayData?.date
                ? `Due date: ${formatDate(selectedWeekdayData.date)}`
                : ''}
            </p>
          </div>
          {selectedWeekdayData && (
            <div className="text-xs font-semibold text-slate-600">
              Scheduled:{' '}
              <span className="font-bold text-[#1E3A8A]">
                {formatCurrency(selectedWeekdayData.total_due)}
              </span>{' '}
              | Collected:{' '}
              <span className="font-bold text-emerald-600">
                {formatCurrency(selectedWeekdayData.total_collected)}
              </span>
            </div>
          )}
        </div>

        {selectedWeekdayData?.items && selectedWeekdayData.items.length > 0 ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3.5 py-2.5 text-left font-semibold text-slate-600">
                      Borrower
                    </th>
                    <th className="px-3.5 py-2.5 text-left font-semibold text-slate-600">
                      Loan / Period
                    </th>
                    <th className="px-3.5 py-2.5 text-right font-semibold text-slate-600">
                      Installment
                    </th>
                    <th className="px-3.5 py-2.5 text-right font-semibold text-slate-600">
                      Paid
                    </th>
                    <th className="px-3.5 py-2.5 text-right font-semibold text-slate-600">
                      Outstanding
                    </th>
                    <th className="px-3.5 py-2.5 text-center font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-3.5 py-2.5 text-center font-semibold text-slate-600">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {selectedWeekdayData.items.map((item) => {
                    const isPaid = item.status === 'paid' || item.outstanding_balance <= 0;
                    const isOverdue = item.status === 'overdue';

                    return (
                      <tr key={item.installment_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3.5 py-2.5">
                          <div className="font-bold text-slate-900">{item.customer_name}</div>
                          {item.phone_number && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3" />
                              <span>{item.phone_number}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-600">
                          <div className="font-medium text-slate-800">
                            {item.plan_code || 'Loan'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Week {item.installment_number}
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                          {formatCurrency(item.installment_amount)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-semibold text-emerald-600">
                          {formatCurrency(item.amount_paid)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-[#1E3A8A]">
                          {formatCurrency(item.outstanding_balance)}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOverdue
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          {isPaid ? (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Settled
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenPaymentModal(item)}
                              className="px-2.5 py-1 bg-[#1E3A8A] text-white hover:bg-blue-900 font-semibold text-[11px] rounded-lg shadow-xs transition-colors inline-flex items-center gap-1"
                            >
                              <span>Collect</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <div className="text-xs font-semibold text-slate-600">
              No installments scheduled for {selectedWeekdayData?.weekday || 'this day'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Borrowers with weekly repayment on {selectedWeekdayData?.weekday} will show up here.
            </p>
          </div>
        )}
      </div>

      {/* Payment Recording Modal */}
      {activeInstallmentForPayment && (
        <RecordPaymentModal
          isOpen={true}
          installment={activeInstallmentForPayment}
          onClose={() => setActiveInstallmentForPayment(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
