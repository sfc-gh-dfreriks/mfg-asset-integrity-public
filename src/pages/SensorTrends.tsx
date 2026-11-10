import { useState } from 'react';
import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { num2, dt } from '@/lib/oge';
import MetricCard, { Activity, Gauge, Calendar } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import ReactECharts from '@/components/Chart';
import PageState from '@/components/PageState';
import { cn } from '@/lib/utils';

export default function SensorTrends() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const [tag, setTag] = useState('');
  const { data, loading, error } = useQuery(() => fetchPage('sensors', apiCompanies, apiCategories, tag ? { tag } : {}), [...deps, tag]);
  const k = data?.kpis ?? {};
  const daily = data?.daily ?? [];
  const hourly = data?.hourly ?? [];
  const deg: any[] = data?.degrading ?? [];
  const cur = deg.find((d) => d.tag === data?.tag);
  const al = data?.alarmsByMonth ?? [];
  return (
    <PageState loading={loading && !data} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard title="Historian Tags" value={formatNumber(k.tags)} icon={Activity} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`Mapped to SAP equipment · data to ${dt(data?.asOf)}`} deltaType="neutral" />
          <MetricCard title="Abnormal Tags (7 d)" value={formatNumber(k.abnormalTags)} icon={Gauge} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta="ELEVATED (half-way to HI), HI or HIHI in the last 7 days" deltaType="negative" />
          <MetricCard title="Alarm Days (30 d)" value={formatNumber(k.alarmDays30)} icon={Calendar} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50" delta="Tag-days with a HI / HIHI excursion" deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ChartCard title="Degrading Tags" subtitle="Last 7 days, share of the way from baseline to HI limit; click to plot">
            <div className="max-h-[560px] space-y-1 overflow-y-auto">
              {deg.map((d) => (
                <button key={d.tag} onClick={() => setTag(d.tag)}
                  className={cn('w-full rounded-md border px-3 py-1.5 text-left text-xs hover:bg-sky-50', d.tag === data?.tag ? 'border-sf-primary bg-sky-50' : 'border-gray-200')}>
                  <div className="flex justify-between font-medium text-gray-800"><span className="truncate">{d.name}</span><span>{num2(d.pct)}</span></div>
                  <div className="h-1.5 rounded bg-gray-100"><div className="h-1.5 rounded bg-gradient-to-r from-amber-400 to-red-500" style={{ width: `${Math.min(Math.max(Number(d.pct) || 0, 0), 1.2) / 1.2 * 100}%` }} /></div>
                  <div className="text-[10px] text-gray-500">{d.measure} · {d.facility}</div>
                </button>
              ))}
            </div>
          </ChartCard>
          <div className="space-y-6 lg:col-span-2">
            <ChartCard title={`Daily Trend: ${cur?.name ?? data?.tag ?? ''}`} subtitle={`${data?.tag ?? ''} · daily average and maximum against baseline and alarm limits (${cur?.uom ?? ''}), last 240 days`}>
              <ReactECharts keepOrder option={{
                tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 60, right: 20, bottom: 30, top: 40 },
                xAxis: { type: 'category', data: daily.map((r: any) => r.day) }, yAxis: { type: 'value', scale: true },
                series: [
                  { name: 'Average', type: 'line', showSymbol: false, data: daily.map((r: any) => r.avg), itemStyle: { color: '#29b5e8' } },
                  { name: 'Maximum', type: 'line', showSymbol: false, data: daily.map((r: any) => r.max), itemStyle: { color: '#8b5cf6' }, lineStyle: { width: 1 } },
                  { name: 'Baseline', type: 'line', showSymbol: false, data: daily.map((r: any) => r.baseline), itemStyle: { color: '#94a3b8' }, lineStyle: { type: 'dashed' } },
                  { name: 'HI', type: 'line', showSymbol: false, data: daily.map((r: any) => r.hi), itemStyle: { color: '#f59e0b' }, lineStyle: { type: 'dotted' } },
                  { name: 'HIHI', type: 'line', showSymbol: false, data: daily.map((r: any) => r.hihi), itemStyle: { color: '#ef4444' }, lineStyle: { type: 'dotted' } },
                ],
              }} style={{ height: 300 }} />
            </ChartCard>
            <ChartCard title="Hourly Values, Last 45 Days" subtitle="Historian archive (hourly)">
              <ReactECharts keepOrder option={{
                tooltip: { trigger: 'axis' }, grid: { left: 60, right: 20, bottom: 30, top: 20 },
                xAxis: { type: 'category', data: hourly.map((r: any) => r.ts) }, yAxis: { type: 'value', scale: true },
                dataZoom: [{ type: 'inside' }],
                series: [{ name: 'Value', type: 'line', showSymbol: false, data: hourly.map((r: any) => r.value), itemStyle: { color: '#0ea5e9' }, lineStyle: { width: 1 } }],
              }} style={{ height: 240 }} />
            </ChartCard>
          </div>
          <ChartCard title="Historian Alarms by Month" subtitle="HI and HIHI limit violations" className="lg:col-span-3">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 40, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: al.map((r: any) => r.month) }, yAxis: { type: 'value' },
              series: [
                { name: 'HI', type: 'bar', stack: 'a', data: al.map((r: any) => r.hi), itemStyle: { color: '#f59e0b' } },
                { name: 'HIHI', type: 'bar', stack: 'a', data: al.map((r: any) => r.hihi), itemStyle: { color: '#ef4444' } },
              ],
            }} style={{ height: 260 }} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
