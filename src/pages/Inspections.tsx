import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatPct, formatNumber } from '@/lib/utils';
import { num1, num2, dt } from '@/lib/oge';
import MetricCard, { Calendar, Gauge, Activity, TrendingDown } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import PageState from '@/components/PageState';

export default function Inspections() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('inspections', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const st = [...(data?.byStatus ?? [])].sort((a: any, b: any) => b.overdue - a.overdue);
  const lb = data?.lifeBuckets ?? [];
  const fac = data?.byFacility ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Inspection Compliance" value={formatPct(k.compliance)} icon={Calendar} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta={`${formatNumber(k.plans)} risk-based inspection plans`} deltaType={k.compliance >= 95 ? 'positive' : 'negative'} />
          <MetricCard title="Overdue" value={formatNumber(k.overdue)} icon={Activity} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${formatNumber(k.due30)} more due in the next 30 days`} deltaType="negative" />
          <MetricCard title="Under 5 Years Life" value={formatNumber(k.under5)} icon={TrendingDown} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50" delta={`${formatNumber(k.critical)} with a CRITICAL finding (< 2 years)`} deltaType="negative" />
          <MetricCard title="Fastest Corrosion" value={`${num2(k.maxCr)} mm/y`} icon={Gauge} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta="Highest CML corrosion rate at the latest inspection" deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Inspection Status by Equipment Class" subtitle="Plans overdue, due in 30 days and compliant (most overdue first)">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }, legend: { top: 0 }, grid: { left: 100, right: 30, bottom: 20, top: 40 },
              xAxis: { type: 'value' }, yAxis: { type: 'category', inverse: true, data: st.map((r: any) => r.name) },
              series: [
                { name: 'Overdue', type: 'bar', stack: 's', data: st.map((r: any) => r.overdue), itemStyle: { color: '#ef4444' } },
                { name: 'Due 30 d', type: 'bar', stack: 's', data: st.map((r: any) => r.due30), itemStyle: { color: '#f59e0b' } },
                { name: 'Compliant', type: 'bar', stack: 's', data: st.map((r: any) => r.compliant), itemStyle: { color: '#10b981' } },
              ],
            }} style={{ height: 260 }} />
          </ChartCard>
          <ChartCard title="Remaining Wall Life" subtitle="Plans by shortest remaining life at the latest inspection">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, grid: { left: 50, right: 20, bottom: 30, top: 20 },
              xAxis: { type: 'category', data: lb.map((r: any) => r.name) }, yAxis: { type: 'value', name: 'plans' },
              series: [{ type: 'bar', data: lb.map((r: any, i: number) => ({ value: r.plans, itemStyle: { color: ['#dc2626', '#f97316', '#f59e0b', '#84cc16', '#10b981'][i] ?? '#10b981' } })) }],
            }} style={{ height: 260 }} />
          </ChartCard>
          <ChartCard title="Overdue Inspections by Facility" subtitle="Most overdue first" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }, legend: { top: 0 }, grid: { left: 220, right: 60, bottom: 20, top: 40 },
              xAxis: [{ type: 'value', name: 'overdue' }], yAxis: { type: 'category', inverse: true, data: fac.map((r: any) => r.name), axisLabel: { fontSize: 10 } },
              series: [{ name: 'Overdue plans', type: 'bar', data: fac.map((r: any) => r.overdue), itemStyle: { color: '#ef4444' }, barMaxWidth: 14,
                         label: { show: true, position: 'right', formatter: (p: any) => `min life ${num1(fac[p.dataIndex]?.minRl)} y` } }],
            }} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="Inspection Worklist" subtitle="Overdue first, then shortest remaining life" className="lg:col-span-2">
            <DataTable data={data?.worst ?? []} columns={[
              { key: 'name', label: 'Asset' }, { key: 'cls', label: 'Class' }, { key: 'facility', label: 'Facility' }, { key: 'method', label: 'Method' },
              { key: 'riskRank', label: 'RBI rank' }, { key: 'status', label: 'Status' }, { key: 'daysOverdue', label: 'Days overdue', format: formatNumber },
              { key: 'minMeasuredMm', label: 'Min wall (mm)', format: num2 }, { key: 'minRequiredMm', label: 't-min (mm)', format: num2 },
              { key: 'cr', label: 'CR (mm/y)', format: num2 }, { key: 'rl', label: 'Rem. life (y)', format: num1 }, { key: 'severity', label: 'Finding' },
            ]} />
          </ChartCard>
        </div>
        <p className="text-[11px] text-gray-400">Remaining life = (measured wall - minimum required wall) / corrosion rate, per condition monitoring location. Last-inspected and due dates as of {dt('2026-09-30')}.</p>
      </div>
    </PageState>
  );
}
