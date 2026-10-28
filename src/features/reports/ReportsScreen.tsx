import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { reportApi } from '../../api/reports';
import type { ReportData } from '../../api/types';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import {
  Download,
  AlertCircle,
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<string>('all_time');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ranges = [
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_quarter', label: 'This Quarter' },
    { id: 'year_to_date', label: 'Year to Date' },
    { id: 'all_time', label: 'All Time' },
  ];

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportApi.getReport(selectedRange);
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate financial report.');
    } finally {
      setLoading(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await reportApi.downloadCsv(selectedRange);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const metrics = reportData?.metrics;
  const recoveryRate =
    metrics && metrics.totalRepaymentExpected > 0
      ? Math.min(100, Math.round((metrics.totalCollected / metrics.totalRepaymentExpected) * 100))
      : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Financial Reports & Analytics
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Portfolio performance, recovery metrics, and collection audit summaries.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleExportCsv}
          loading={exporting}
          icon={<Download className="h-4 w-4" />}
        >
          Export CSV Report
        </Button>
      </div>

      {/* Range Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {ranges.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setSelectedRange(r.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedRange === r.id
                ? 'bg-white text-[#1E3A8A] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outlined" size="sm" onClick={fetchReport}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner fullHeight label="Generating report and metrics..." />
      ) : reportData && metrics ? (
        <div className="space-y-6">
          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Principal Disbursed
              </span>
              <h3 className="text-2xl font-bold text-[#0F172A] mt-2">
                {formatCurrency(metrics.totalPrincipalDisbursed)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Across {metrics.totalLoans} originated loan plans
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Collections Received
              </span>
              <h3 className="text-2xl font-bold text-emerald-600 mt-2">
                {formatCurrency(metrics.totalCollected)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {recoveryRate}% portfolio recovery rate
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Outstanding Principal
              </span>
              <h3 className="text-2xl font-bold text-blue-900 mt-2">
                {formatCurrency(metrics.outstandingPrincipal)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Target repayment: {formatCurrency(metrics.totalRepaymentExpected)}
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Borrower Portfolio
              </span>
              <h3 className="text-2xl font-bold text-[#1E3A8A] mt-2">
                {metrics.totalCustomers} Borrowers
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {metrics.activeCustomers} currently active
              </p>
            </div>
          </div>

          {/* Portfolio & Recovery Health Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">
                Portfolio Recovery Progress ({reportData.range})
              </h3>
              <span className="text-sm font-bold text-emerald-600">{recoveryRate}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${recoveryRate}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
              <div>
                <span className="text-slate-400 block">Total Borrowers:</span>
                <span className="font-bold text-slate-800">{metrics.totalCustomers}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Active Loans:</span>
                <span className="font-bold text-slate-800">{metrics.totalLoans}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Installments Generated:</span>
                <span className="font-bold text-slate-800">{metrics.totalInstallments}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Report Filter:</span>
                <span className="font-bold text-[#1E3A8A]">{reportData.range}</span>
              </div>
            </div>
          </div>

          {/* Borrower Directory Table in Report */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#0F172A]">
                Borrower Directory in this Scope ({reportData.customers.length})
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Registered On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {reportData.customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-bold text-slate-800">
                        {c.full_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {c.phone || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={c.status === 'active' ? 'success' : 'neutral'}>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(c.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
