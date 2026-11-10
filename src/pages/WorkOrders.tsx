import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatPct, formatNumber } from '@/lib/utils';
import { num1, dt } from '@/lib/oge';
import MetricCard, { CurrencyIcon, Calendar, Activity, Gauge } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

export default function WorkOrders() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('work-orders', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const trend = data?.trend ?? [];
  const aging = data?.aging ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Maintenance Cost" value={formatDollar(k.cost)} icon={CurrencyIcon} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${formatNumber(k.orders)} orders · ${formatNumber(k.hours)} confirmed hours`} deltaType="neutral" />
          <MetricCard title="Backlog" value={formatNumber(k.backlog)} icon={Activity} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50" delta={`${formatNumber(k.overdue)} overdue · average age ${num1(k.backlogAge)} d`} deltaType="negative" />
          <MetricCard title="PM Compliance" value={formatPct(k.pmCompliance)} icon={Calendar} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta="Preventive / inspection orders done within 7 days of due" deltaType={k.pmCompliance >= 85 ? 'positive' : 'negative'} />
          <MetricCard title="Reactive Share of Cost" value={formatPct(k.reactivePct)} icon={Gauge} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta="Breakdown and corrective work" deltaType="negative" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Cost by Order Category" subtitle="Actual cost, USD">
            <Bars rows={data?.byCategory ?? []} label="name" value="cost" color="#29b5e8" height={260} leftPad={120} />
          </ChartCard>
          <ChartCard title="Backlog Aging" subtitle="Open orders by age since creation">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 50, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: aging.map((r: any) => r.name) }, yAxis: { type: 'value', name: 'orders' },
              series: [
                { name: 'Open', type: 'bar', data: aging.map((r: any) => r.orders), itemStyle: { color: '#c7d2fe' } },
                { name: 'Overdue', type: 'bar', data: aging.map((r: any) => r.overdue), itemStyle: { color: '#ef4444' } },
              ],
            }} style={{ height: 260 }} />
          </ChartCard>
          <ChartCard title="Orders, Cost and PM Compliance by Month" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 70, right: 60, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) },
              yAxis: [{ type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } }, { type: 'value', name: '%', min: 0, max: 100 }],
              series: [
                { name: 'Cost', type: 'bar', data: trend.map((r: any) => r.cost), itemStyle: { color: '#bae6fd' } },
                { name: 'PM compliance %', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((r: any) => r.pmCompliance?.toFixed?.(1)), itemStyle: { color: '#10b981' } },
              ],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Cost by Equipment Class" subtitle="Actual cost, USD">
            <Bars rows={data?.byClass ?? []} label="name" value="cost" color="#8b5cf6" height={280} leftPad={120} />
          </ChartCard>
          <ChartCard title="Backlog by Equipment Class" subtitle="Open orders">
            <Bars rows={data?.byClass ?? []} label="name" value="backlog" color="#f59e0b" height={280} format={formatNumber} leftPad={120} />
          </ChartCard>
          <ChartCard title="Overdue Work, Critical Equipment First" className="lg:col-span-2">
            <DataTable data={data?.overdue ?? []} columns={[
              { key: 'orderId', label: 'Order' }, { key: 'category', label: 'Category' }, { key: 'text', label: 'Description' },
              { key: 'facility', label: 'Facility' }, { key: 'crit', label: 'Crit.' }, { key: 'priority', label: 'Prio' },
              { key: 'due', label: 'Due', format: dt }, { key: 'daysOverdue', label: 'Days overdue', format: formatNumber },
              { key: 'plannedCost', label: 'Planned cost', format: formatDollar },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
