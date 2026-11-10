import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { boe, num1, BAND_COLOR } from '@/lib/oge';
import MetricCard, { Gauge, Activity, TrendingDown } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';
import IsOilNotice from '@/components/IsOilNotice';
import { ShieldAlert, ScanSearch } from 'lucide-react';

export default function AssetRisk() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('asset-risk', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const top = (data?.top ?? []).slice(0, 15);
  const bands = data?.bands ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <IsOilNotice gaps={data?.isOilGaps} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Critical / High Risk" value={`${formatNumber(k.critical)} / ${formatNumber(k.high)}`} icon={ShieldAlert} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`of ${formatNumber(k.assets)} assets · average score ${num1(k.avgScore)}`} deltaType="negative" />
          <MetricCard title="Production at Risk" value={`${boe(k.boeAtRisk)} BOE/d`} icon={Gauge} accent="border-orange-300/50 bg-gradient-to-br from-orange-50 to-amber-50" delta="Wells the CRITICAL and HIGH assets can take offline" deltaType="negative" />
          <MetricCard title="Expected Deferral (30 d)" value={`${boe(k.expectedDeferral)} BOE`} icon={TrendingDown} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-yellow-50" delta="BOE/d at risk x class MTTR x risk score" deltaType="neutral" />
          <MetricCard title="Degrading / Thin Wall" value={`${formatNumber(k.degrading)} / ${formatNumber(k.thinWall)}`} icon={ScanSearch} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta="Sensors half-way to HI limit · remaining life under 5 years" deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Risk Score Components, Top 15 Assets" subtitle="Sensor, inspection, failure history and open work (before criticality weighting)" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }, legend: { top: 0 }, grid: { left: 240, right: 30, bottom: 20, top: 40 },
              xAxis: { type: 'value' }, yAxis: { type: 'category', inverse: true, data: top.map((r: any) => r.name), axisLabel: { fontSize: 10, width: 225, overflow: 'truncate' } },
              series: [
                { name: 'Sensor', type: 'bar', stack: 's', data: top.map((r: any) => r.sensorScore), itemStyle: { color: '#8b5cf6' } },
                { name: 'Inspection', type: 'bar', stack: 's', data: top.map((r: any) => r.inspectionScore), itemStyle: { color: '#0ea5e9' } },
                { name: 'Failures', type: 'bar', stack: 's', data: top.map((r: any) => r.failureScore), itemStyle: { color: '#ef4444' } },
                { name: 'Open work', type: 'bar', stack: 's', data: top.map((r: any) => r.openWorkScore), itemStyle: { color: '#f59e0b' } },
              ],
            }} style={{ height: 420 }} />
          </ChartCard>
          <ChartCard title="Assets by Risk Band" subtitle="Count of assets">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }, grid: { left: 90, right: 40, bottom: 20, top: 10 },
              xAxis: { type: 'value' }, yAxis: { type: 'category', inverse: true, data: bands.map((r: any) => r.name) },
              series: [{ type: 'bar', barMaxWidth: 22, label: { show: true, position: 'right' },
                         data: bands.map((r: any) => ({ value: r.assets, itemStyle: { color: BAND_COLOR[r.name], borderRadius: [0, 4, 4, 0] } })) }],
            }} style={{ height: 260 }} />
          </ChartCard>
          <ChartCard title="Expected 30-Day Deferral by Facility" subtitle="BOE">
            <Bars rows={data?.byFacility ?? []} label="name" value="expected" color="#f97316" height={260} format={boe} leftPad={220} />
          </ChartCard>
          <ChartCard title="Primary Risk Driver" subtitle="CRITICAL and HIGH assets">
            <Bars rows={data?.drivers ?? []} label="name" value="assets" color="#8b5cf6" height={220} format={formatNumber} leftPad={190} />
          </ChartCard>
          <ChartCard title="Asset Risk Register" subtitle="Highest risk first" className="lg:col-span-2">
            <DataTable data={data?.top ?? []} columns={[
              { key: 'name', label: 'Asset' }, { key: 'facility', label: 'Facility' }, { key: 'crit', label: 'Crit.' },
              { key: 'score', label: 'Score', format: num1 }, { key: 'band', label: 'Band' }, { key: 'driver', label: 'Driver' },
              { key: 'worstTag', label: 'Worst tag' }, { key: 'rl', label: 'Rem. life (y)', format: num1 }, { key: 'failures365d', label: 'Fail. 12m' },
              { key: 'overduePm', label: 'Overdue PM' }, { key: 'openLeaks', label: 'Open leaks' }, { key: 'boe', label: 'BOE/d at risk', format: boe },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
