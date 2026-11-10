import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { formatPct, formatNumber } from '@/lib/utils';
import { fetchPage } from '@/lib/api';
import { num1, num2, dt } from '@/lib/oge';
import MetricCard, { Activity, Gauge, Calendar, TrendingDown } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

const t = (v: number) => `${formatNumber(v)} t`;

export default function Methane() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('methane', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const tr = data?.trend ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Methane Emitted" value={t(k.methaneT)} icon={TrendingDown} accent="border-teal-300/50 bg-gradient-to-br from-teal-50 to-cyan-50" delta={`${formatNumber(k.co2eT)} t CO2e (GWP 28) from ${formatNumber(k.leaks)} leaks`} deltaType="negative" />
          <MetricCard title="Open Leaks" value={formatNumber(k.open)} icon={Activity} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${formatNumber(k.openLate)} past the repair deadline · ${num1(k.openKgH)} kg/h still leaking`} deltaType="negative" />
          <MetricCard title="Repaired On Time" value={formatPct(k.onTimePct)} icon={Calendar} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta={`Average ${num1(k.repairDays)} days to repair`} deltaType={k.onTimePct >= 90 ? 'positive' : 'negative'} />
          <MetricCard title="Super-Emitters" value={formatNumber(k.superEmitters)} icon={Gauge} accent="border-orange-300/50 bg-gradient-to-br from-orange-50 to-amber-50" delta="Leaks of 100 kg/h or more (mostly satellite finds)" deltaType="negative" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Methane by Month" subtitle="Tonnes emitted (by detection month) and leaks found" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 60, right: 60, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: tr.map((r: any) => r.month) }, yAxis: [{ type: 'value', name: 't CH4' }, { type: 'value', name: 'leaks' }],
              series: [
                { name: 'Methane (t)', type: 'bar', data: tr.map((r: any) => r.methaneT?.toFixed?.(1)), itemStyle: { color: '#14b8a6' } },
                { name: 'Leaks', type: 'line', yAxisIndex: 1, smooth: true, data: tr.map((r: any) => r.leaks), itemStyle: { color: '#8b5cf6' } },
                { name: 'Repaired late', type: 'line', yAxisIndex: 1, smooth: true, data: tr.map((r: any) => r.late), itemStyle: { color: '#ef4444' } },
              ],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Methane by Component" subtitle="Tonnes emitted">
            <Bars rows={data?.byComponent ?? []} label="name" value="methaneT" color="#14b8a6" height={280} format={t} leftPad={160} />
          </ChartCard>
          <ChartCard title="Methane by Detection Method" subtitle="Tonnes emitted">
            <Bars rows={data?.byMethod ?? []} label="name" value="methaneT" color="#0ea5e9" height={280} format={t} leftPad={120} />
          </ChartCard>
          <ChartCard title="Methane by Facility" subtitle="Tonnes emitted" className="lg:col-span-2">
            <Bars rows={data?.byFacility ?? []} label="name" value="methaneT" color="#0d9488" height={340} format={t} leftPad={230} />
          </ChartCard>
          <ChartCard title="Open Leaks, Largest First" className="lg:col-span-2">
            <DataTable data={data?.open ?? []} columns={[
              { key: 'leakId', label: 'Leak' }, { key: 'facility', label: 'Facility' }, { key: 'component', label: 'Component' }, { key: 'method', label: 'Method' },
              { key: 'detected', label: 'Detected', format: dt }, { key: 'due', label: 'Repair due', format: dt }, { key: 'rate', label: 'kg/h', format: num2 },
              { key: 'status', label: 'Status' }, { key: 'late', label: 'Late', format: (v: any) => (v ? 'yes' : 'no') }, { key: 'orderId', label: 'SAP order' },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
