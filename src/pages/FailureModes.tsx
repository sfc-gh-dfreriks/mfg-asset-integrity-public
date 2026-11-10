import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatPct, formatNumber } from '@/lib/utils';
import { boe, num1 } from '@/lib/oge';
import MetricCard, { CurrencyIcon, Activity, Gauge, TrendingDown } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';
import IsOilNotice from '@/components/IsOilNotice';

export default function FailureModes() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('failures', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const trend = data?.trend ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <IsOilNotice gaps={data?.isOilGaps} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Failures (24 months)" value={formatNumber(k.failures)} icon={Activity} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`MTTR ${num1(k.mttr)} h · ${num1(k.avgTbf)} d between repeat failures`} deltaType="negative" />
          <MetricCard title="Repair Cost" value={formatDollar(k.repairCost)} icon={CurrencyIcon} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta="Actual cost of breakdown orders" deltaType="neutral" />
          <MetricCard title="Deferred by Failures" value={`${boe(k.deferredBoe)} BOE`} icon={TrendingDown} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50" delta="IS-Oil downtime linked to the notification" deltaType="negative" />
          <MetricCard title="Seen Coming" value={formatPct(k.precursorPct)} icon={Gauge} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta="Instrumented failures with a historian alarm in the 30 days before" deltaType="positive" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Reliability by Equipment Class" subtitle="MTBF (asset-days / failures), MTTR (mean malfunction duration)" className="lg:col-span-2">
            <DataTable data={data?.reliability ?? []} columns={[
              { key: 'name', label: 'Class' }, { key: 'assets', label: 'Assets', format: formatNumber }, { key: 'failures', label: 'Failures', format: formatNumber },
              { key: 'mtbfDays', label: 'MTBF (d)', format: formatNumber }, { key: 'mttrHours', label: 'MTTR (h)', format: num1 },
              { key: 'rate', label: 'Failures / asset-yr', format: (v: any) => (v == null ? '–' : Number(v).toFixed(2)) },
              { key: 'repairCost', label: 'Repair cost', format: formatDollar }, { key: 'deferredBoe', label: 'Deferred BOE', format: boe },
              { key: 'precursorAlarmPct', label: 'Alarm first', format: formatPct },
            ]} />
          </ChartCard>
          <ChartCard title="Top Failure Modes" subtitle="Damage code by equipment class, failures">
            <Bars rows={data?.byDamage ?? []} label="name" value="failures" color="#ef4444" height={360} format={formatNumber} leftPad={250} />
          </ChartCard>
          <ChartCard title="Failure Causes" subtitle="Cause code, failures">
            <Bars rows={data?.byCause ?? []} label="name" value="failures" color="#f97316" height={360} format={formatNumber} leftPad={190} />
          </ChartCard>
          <ChartCard title="Failures by Month" subtitle="With and without a precursor historian alarm">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 40, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) }, yAxis: { type: 'value' },
              series: [
                { name: 'Alarm first', type: 'bar', stack: 'f', data: trend.map((r: any) => r.withPrecursor), itemStyle: { color: '#8b5cf6' } },
                { name: 'No warning', type: 'bar', stack: 'f', data: trend.map((r: any) => r.failures - r.withPrecursor), itemStyle: { color: '#cbd5e1' } },
              ],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Deferred Production by Cause" subtitle="BOE, 24 months">
            <Bars rows={data?.deferredByCause ?? []} label="name" value="boe" color="#f59e0b" height={300} format={boe} leftPad={220} />
          </ChartCard>
          <ChartCard title="Bad Actors" subtitle="Equipment with two or more failures" className="lg:col-span-2">
            <DataTable data={data?.badActors ?? []} columns={[
              { key: 'name', label: 'Asset' }, { key: 'cls', label: 'Class' }, { key: 'facility', label: 'Facility' },
              { key: 'failures', label: 'Failures' }, { key: 'hours', label: 'Downtime (h)', format: num1 },
              { key: 'cost', label: 'Repair cost', format: formatDollar }, { key: 'boe', label: 'Deferred BOE', format: boe },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
