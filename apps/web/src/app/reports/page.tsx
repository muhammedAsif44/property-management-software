'use client';

import React, { useState } from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { AppHeader } from '@/components/app-header';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { useReportsQuery } from '@/features/reports/api/use-reports';
import { ReportPeriodPicker, ReportPeriod } from '@/features/reports/components/report-period-picker';
import { ReportsKpiGrid } from '@/features/reports/components/reports-kpi-grid';
import { useTranslation } from '@/lib/i18n';
import { BarChart3, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  const { t } = useTranslation();
  useActivePropertyQuery();
  const activeProperty = usePropertyStore((s) => s.activeProperty);

  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading, isError } = useReportsQuery(activeProperty?.id || null, { period, from, to });

  // Stub export functions - normally would use jspdf and xlsx libraries here
  const exportPDF = () => {
    alert('PDF Export feature generated from reports data');
  };

  const exportExcel = () => {
    alert('Excel Export feature generated from reports data');
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative">
      <DashboardSidebar />
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <AppHeader>
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {t('reportsAndAnalytics') || 'Reports & Analytics'}
              </h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {activeProperty?.name || t('activeManagementHub')}
              </p>
            </div>
          </div>
        </AppHeader>

        <div className="p-6 max-w-[1400px] w-full mx-auto flex-1 space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <ReportPeriodPicker 
              period={period} 
              setPeriod={setPeriod} 
              from={from} 
              setFrom={setFrom} 
              to={to} 
              setTo={setTo} 
            />
            
            <div className="flex gap-2 w-full lg:w-auto">
              <Button variant="outline" onClick={exportPDF} disabled={!data || isLoading} className="flex-1 lg:flex-none">
                <Download className="h-4 w-4 mr-2" /> PDF
              </Button>
              <Button variant="outline" onClick={exportExcel} disabled={!data || isLoading} className="flex-1 lg:flex-none">
                <Download className="h-4 w-4 mr-2" /> Excel
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : isError ? (
            <div className="text-center py-20 text-red-500">
              {t('errorLoadingReports') || 'Error loading reports. Please check your date range.'}
            </div>
          ) : !data ? (
            <div className="text-center py-20 text-slate-500">
              {t('selectDateRange') || 'Select a valid date range to view reports.'}
            </div>
          ) : (
            <>
              <ReportsKpiGrid data={data} />
              
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 mt-6">
                <p>{t('additionalChartsComingSoon') || 'Detailed charts and graphs for this period will appear here.'}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
