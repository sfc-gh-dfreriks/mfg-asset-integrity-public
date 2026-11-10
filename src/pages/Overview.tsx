import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatPct, formatNumber } from '@/lib/utils';
import { boe, num1, BAND_COLOR } from '@/lib/oge';
import MetricCard, { CurrencyIcon, Gauge, Activity, TrendingDown, Calendar } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';
import IsOilNotice from '@/components/IsOilNotice';
import { ShieldAlert, Wind, ScanSearch } from 'lucide-react';

export default function Overview() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('overview', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const top = data?.topRisk ?? [];
  const dtr = data?.deferredTrend ?? [];
  const cost = data?.costTrend ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <IsOilNotice gaps={data?.isOilGaps} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="High-Risk Assets" value={formatNumber(k.highRisk)} icon={ShieldAlert} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`of ${formatNumber(k.assets)} assets in the CRITICAL / HIGH band`} deltaType="negative" />
          <MetricCard title="Production at Risk" value={`${boe(k.boeAtRisk)} BOE/d`} icon={Gauge} accent="border-orange-300/50 bg-gradient-to-br from-orange-50 to-amber-50" delta={`${boe(k.expectedDeferral)} BOE expected deferral, next 30 days`} deltaType="negative" />
          <MetricCard title="Deferred Production" value={`${boe(k.deferredBoe)} BOE`} icon={TrendingDown} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-yellow-50" delta={`${boe(k.equipmentDeferredBoe)} BOE from equipment failures (24 months)`} deltaType="neutral" />
          <MetricCard title="Failures (12 months)" value={formatNumber(k.failures)} icon={Activity} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta={`MTTR ${num1(k.mttr)} h · ${formatPct(k.precursorPct)} had a historian alarm first`} deltaType="neutral" />
          <MetricCard title="Maintenance Cost" value={formatDollar(k.maintCost)} icon={CurrencyIcon} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta="Actual cost, 24 months" deltaType="neutral" />
          <MetricCard title="PM Compliance" value={formatPct(k.pmCompliance)} icon={Calendar} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta={`${formatNumber(k.backlog)} orders in backlog · ${formatNumber(k.overdue)} overdue`} deltaType={k.pmCompliance >= 85 ? 'positive' : 'negative'} />
          <MetricCard title="Overdue Inspections" value={formatNumber(k.overdueInspections)} icon={ScanSearch} accent="border-sky-300/50 bg-gradient-to-br from-sky-50 to-blue-50" delta={`of ${formatNumber(k.inspectionPlans)} risk-based inspection plans`} deltaType={k.overdueInspections > 0 ? 'negative' : 'positive'} />
          <MetricCard title="Methane Emitted" value={`${formatNumber(k.methaneT)} t`} icon={Wind} accent="border-teal-300/50 bg-gradient-to-br from-teal-50 to-cyan-50" delta={`${formatNumber(k.openLeaks)} leaks still open`} deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Assets Most Likely to Fail or Leak Next" subtitle="Risk score 0-100, highest first">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }, grid: { left: 230, right: 40, bottom: 20, top: 10 },
              xAxis: { type: 'value', max: 100 }, yAxis: { type: 'category', inverse: true, data: top.map((r: any) => r.name), axisLabel: { fontSize: 10, width: 215, overflow: 'truncate' } },
              series: [{ type: 'bar', barMaxWidth: 16, label: { show: true, position: 'right', formatter: '{c}' },
                         data: top.map((r: any) => ({ value: r.score, itemStyle: { color: BAND_COLOR[r.band], borderRadius: [0, 4, 4, 0] } })) }],
            }} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="Production at Risk by Basin" subtitle="BOE/d carried by CRITICAL and HIGH risk assets">
            <Bars rows={data?.atRiskByBasin ?? []} label="name" value="boe" color="#f97316" height={320} format={boe} leftPad={150} />
          </ChartCard>
          <ChartCard title="Deferred Production by Month" subtitle="BOE; equipment failures vs weather, power and midstream" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 60, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: dtr.map((d: any) => d.month) }, yAxis: { type: 'value', axisLabel: { formatter: (v: number) => boe(v) } },
              series: [
                { name: 'Equipment failure', type: 'bar', stack: 'd', data: dtr.map((d: any) => d.equipment), itemStyle: { color: '#ef4444' } },
                { name: 'Weather, power, midstream', type: 'bar', stack: 'd', data: dtr.map((d: any) => d.other), itemStyle: { color: '#94a3b8' } },
              ],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Maintenance Cost by Month" subtitle="Reactive (breakdown, corrective) vs planned (preventive, inspection) vs LDAR repair">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 60, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: cost.map((d: any) => d.month) }, yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              series: [
                { name: 'Reactive', type: 'bar', stack: 'c', data: cost.map((d: any) => d.reactive), itemStyle: { color: '#f97316' } },
                { name: 'Planned', type: 'bar', stack: 'c', data: cost.map((d: any) => d.planned), itemStyle: { color: '#29b5e8' } },
                { name: 'LDAR repair', type: 'bar', stack: 'c', data: cost.map((d: any) => d.ldar), itemStyle: { color: '#14b8a6' } },
              ],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Maintenance Cost by Source System" subtitle="One canonical model across the selected SAP sources">
            <Bars rows={data?.bySource ?? []} label="name" value="cost" color="#29b5e8" height={300} />
          </ChartCard>
        </div>
        <p className="text-[11px] text-gray-400">Synthetic data through 2026-09-30. BOE = oil + gas / 6.</p>
      </div>
    </PageState>
  );
}
