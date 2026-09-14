import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Area,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Zap,
  Clock,
  Car,
  ChevronRight,
} from 'lucide-react';
import { SnapshotRecord } from '../types';

interface WeeklyOverspeedTrendProps {
  recentSnapshots: SnapshotRecord[];
  speedLimit: number;
  onSelectDateFilter?: (dateStr: string) => void;
  selectedDateFilter?: string;
}

interface DayStatItem {
  date: string; // 'YYYY-MM-DD'
  displayDate: string; // '09/14 (월)'
  dayName: string; // '오늘', '어제', '3일전' or day of week
  totalMeasured: number; // estimated or recorded
  overspeedCount: number; // 과속 단속 건수
  severeCount: number; // 20km/h 초과 심각 단속
  avgSpeed: number; // 평균 단속 속도
  maxSpeed: number; // 최고 단속 속도
  isToday: boolean;
}

export const WeeklyOverspeedTrend: React.FC<WeeklyOverspeedTrendProps> = ({
  recentSnapshots,
  speedLimit,
  onSelectDateFilter,
  selectedDateFilter,
}) => {
  const [chartType, setChartType] = useState<'composed' | 'bar' | 'severe'>('composed');

  // Generate 7 consecutive days ending today (today = 2026-09-14)
  const weeklyData: DayStatItem[] = React.useMemo(() => {
    // Determine baseline today date from snapshots or current system date
    const today = new Date('2026-09-14T12:00:00');
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    const days: DayStatItem[] = [];

    // Pre-calculated base patterns for days without recorded snapshots (realistic school zone traffic history)
    const baselineHistorical: Record<
      string,
      { overspeed: number; severe: number; total: number; avgSpeed: number; maxSpeed: number }
    > = {
      '2026-09-08': { overspeed: 11, severe: 2, total: 245, avgSpeed: 44.5, maxSpeed: 62 },
      '2026-09-09': { overspeed: 15, severe: 4, total: 310, avgSpeed: 47.1, maxSpeed: 68 },
      '2026-09-10': { overspeed: 18, severe: 5, total: 340, avgSpeed: 48.3, maxSpeed: 71 },
      '2026-09-11': { overspeed: 14, severe: 3, total: 290, avgSpeed: 45.2, maxSpeed: 65 },
      '2026-09-12': { overspeed: 9, severe: 2, total: 195, avgSpeed: 43.8, maxSpeed: 73 }, // Saturday
      '2026-09-13': { overspeed: 7, severe: 1, total: 160, avgSpeed: 42.1, maxSpeed: 57 }, // Sunday
      '2026-09-14': { overspeed: 12, severe: 3, total: 275, avgSpeed: 46.0, maxSpeed: 64 }, // Monday (Today)
    };

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const monthDay = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
      const dayOfWeek = dayNames[d.getDay()];

      const isToday = i === 0;
      const isYesterday = i === 1;
      const dayLabel = isToday ? '오늘' : isYesterday ? '어제' : `${dayOfWeek}요일`;

      // Filter snapshots for this specific day
      const daySnaps = recentSnapshots.filter((s) => s.date === dateStr && s.isOverspeed);
      const base = baselineHistorical[dateStr] || {
        overspeed: 8,
        severe: 2,
        total: 200,
        avgSpeed: 44,
        maxSpeed: 58,
      };

      // Combine historical baseline with any dynamically simulated/captured snapshots for today/past days
      const dynamicCount = daySnaps.length;
      const finalOverspeed = Math.max(base.overspeed, dynamicCount);

      // Severe overspeed (e.g. speed >= speedLimit + 20)
      const dynamicSevereCount = daySnaps.filter((s) => s.speed >= speedLimit + 20).length;
      const finalSevere = Math.max(base.severe, dynamicSevereCount);

      // Speeds
      const daySpeeds = daySnaps.map((s) => s.speed);
      const maxRecorded = daySpeeds.length > 0 ? Math.max(...daySpeeds, base.maxSpeed) : base.maxSpeed;
      const avgRecorded =
        daySpeeds.length > 0
          ? Math.round((daySpeeds.reduce((acc, v) => acc + v, 0) / daySpeeds.length) * 10) / 10
          : base.avgSpeed;

      days.push({
        date: dateStr,
        displayDate: `${monthDay} (${dayOfWeek})`,
        dayName: dayLabel,
        totalMeasured: base.total + dynamicCount * 4,
        overspeedCount: finalOverspeed,
        severeCount: finalSevere,
        avgSpeed: avgRecorded,
        maxSpeed: maxRecorded,
        isToday,
      });
    }

    return days;
  }, [recentSnapshots, speedLimit]);

  // Aggregate stats across the 7 days
  const weeklySummary = React.useMemo(() => {
    const totalOverspeed = weeklyData.reduce((sum, d) => sum + d.overspeedCount, 0);
    const totalSevere = weeklyData.reduce((sum, d) => sum + d.severeCount, 0);
    const totalMeasured = weeklyData.reduce((sum, d) => sum + d.totalMeasured, 0);
    const maxSpeedWeek = Math.max(...weeklyData.map((d) => d.maxSpeed));
    const dailyAvg = Math.round((totalOverspeed / weeklyData.length) * 10) / 10;
    const overspeedRate = Math.round((totalOverspeed / totalMeasured) * 1000) / 10;

    // Compare today vs 7-day average
    const todayData = weeklyData[weeklyData.length - 1];
    const diffFromAvg = Math.round((todayData.overspeedCount - dailyAvg) * 10) / 10;
    const isUp = diffFromAvg > 0;

    return {
      totalOverspeed,
      totalSevere,
      totalMeasured,
      maxSpeedWeek,
      dailyAvg,
      overspeedRate,
      diffFromAvg,
      isUp,
      todayCount: todayData.overspeedCount,
    };
  }, [weeklyData]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* 1. Header & Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5">
                최근 7일간 과속 차량 발생 추이 (Recharts 주간 통계)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold font-mono">
                7-Day Trend
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              스쿨존 제한속도 {speedLimit}km/h 기준 일자별 과속 적발 건수 및 고위험 심각 과속(+20km/h 초과) 추이
            </p>
          </div>
        </div>

        {/* Chart View Mode Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-stretch sm:self-auto justify-end text-xs">
          <button
            onClick={() => setChartType('composed')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              chartType === 'composed'
                ? 'bg-red-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            복합 분석
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              chartType === 'bar'
                ? 'bg-red-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            단속 건수
          </button>
          <button
            onClick={() => setChartType('severe')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              chartType === 'severe'
                ? 'bg-red-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            심각 과속
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Strip (7-day Aggregates) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>주간 총 과속 적발</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-digital text-red-400 mt-0.5">
            {weeklySummary.totalOverspeed} <span className="text-xs font-sans text-slate-400 font-normal">건</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            일평균 약 {weeklySummary.dailyAvg}건 적발
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>오늘 적발 건수</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-digital text-amber-400 mt-0.5">
            {weeklySummary.todayCount} <span className="text-xs font-sans text-slate-400 font-normal">건</span>
          </div>
          <div className="text-[10px] flex items-center gap-1 mt-1">
            {weeklySummary.isUp ? (
              <span className="text-red-400 font-medium flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                평균 대비 +{weeklySummary.diffFromAvg}건 증가
              </span>
            ) : (
              <span className="text-emerald-400 font-medium flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" />
                평균 대비 {weeklySummary.diffFromAvg}건 감소
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>고위험 심각 과속 (+20km)</span>
            <Zap className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-digital text-purple-400 mt-0.5">
            {weeklySummary.totalSevere} <span className="text-xs font-sans text-slate-400 font-normal">건</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            전체 과속의 {Math.round((weeklySummary.totalSevere / weeklySummary.totalOverspeed) * 100)}% 차지
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>주간 최고 단속 속도</span>
            <Car className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-digital text-orange-400 mt-0.5">
            {weeklySummary.maxSpeedWeek} <span className="text-xs font-sans text-slate-400 font-normal">km/h</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            기준 대비 +{weeklySummary.maxSpeedWeek - speedLimit}km/h 초과
          </div>
        </div>
      </div>

      {/* 3. Recharts Visualizer Canvas */}
      <div className="w-full h-72 sm:h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={weeklyData} margin={{ top: 12, right: 12, left: -10, bottom: 6 }}>
            <defs>
              <linearGradient id="overspeedBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="severeBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#7e22ce" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="speedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />

            <XAxis
              dataKey="displayDate"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#475569' }}
              tickLine={false}
            />

            {/* Left Y Axis: Vehicle Count */}
            <YAxis
              yAxisId="left"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#475569' }}
              tickLine={false}
              domain={[0, (dataMax: number) => Math.max(dataMax + 4, 20)]}
              label={{
                value: '단속 건수 (건)',
                angle: -90,
                position: 'insideLeft',
                fill: '#64748b',
                fontSize: 10,
                offset: 14,
              }}
            />

            {/* Right Y Axis: Speed (km/h) for Composed chart */}
            {chartType === 'composed' && (
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[20, 80]}
                tick={{ fill: '#f59e0b', fontSize: 11 }}
                axisLine={{ stroke: '#475569' }}
                tickLine={false}
                label={{
                  value: '속도 (km/h)',
                  angle: 90,
                  position: 'insideRight',
                  fill: '#f59e0b',
                  fontSize: 10,
                  offset: 14,
                }}
              />
            )}

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as DayStatItem;
                  return (
                    <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 z-50">
                      <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
                        <span>{label}</span>
                        {data.isToday && (
                          <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 rounded text-[10px] font-bold">
                            TODAY
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 pt-0.5">
                        <div className="flex justify-between gap-4 text-slate-300">
                          <span className="flex items-center gap-1 text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            총 과속 단속:
                          </span>
                          <span className="font-bold text-red-400 font-digital">{data.overspeedCount} 건</span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-300">
                          <span className="flex items-center gap-1 text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                            심각 과속 (+20km):
                          </span>
                          <span className="font-bold text-purple-400 font-digital">{data.severeCount} 건</span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-300">
                          <span className="flex items-center gap-1 text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            평균 적발 속도:
                          </span>
                          <span className="font-bold text-amber-400 font-digital">{data.avgSpeed} km/h</span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-300">
                          <span className="flex items-center gap-1 text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-orange-400" />
                            주간 최고 속도:
                          </span>
                          <span className="font-bold text-orange-400 font-digital">{data.maxSpeed} km/h</span>
                        </div>
                      </div>
                      {onSelectDateFilter && (
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80 text-center">
                          클릭하여 {data.displayDate} 상세 기록 필터링
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend
              verticalAlign="top"
              height={32}
              formatter={(value) => <span className="text-xs text-slate-300 font-medium mr-2">{value}</span>}
            />

            {/* Elements based on View Mode */}
            {chartType === 'composed' && (
              <>
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgSpeed"
                  name="평균 속도 (km/h)"
                  fill="url(#speedAreaGrad)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
                <Bar
                  yAxisId="left"
                  dataKey="overspeedCount"
                  name="일반 과속 단속 (건)"
                  fill="url(#overspeedBarGrad)"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
                <Bar
                  yAxisId="left"
                  dataKey="severeCount"
                  name="심각 과속 (50km+)"
                  fill="url(#severeBarGrad)"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="maxSpeed"
                  name="최고 속도 (km/h)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#ef4444' }}
                />
              </>
            )}

            {chartType === 'bar' && (
              <>
                <Bar
                  yAxisId="left"
                  dataKey="overspeedCount"
                  name="과속 단속 건수 (건)"
                  fill="url(#overspeedBarGrad)"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
              </>
            )}

            {chartType === 'severe' && (
              <>
                <Bar
                  yAxisId="left"
                  dataKey="severeCount"
                  name="고위험 심각 과속 건수 (건)"
                  fill="url(#severeBarGrad)"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Interactive 7-Day Filter Pills */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>일자별 원클릭 단속 목록 동기화:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {onSelectDateFilter && (
            <button
              onClick={() => onSelectDateFilter('all')}
              className={`px-2 py-1 rounded-lg border text-xs transition cursor-pointer ${
                selectedDateFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              전체
            </button>
          )}

          {weeklyData.map((d) => {
            const isSelected = selectedDateFilter === d.date;
            return (
              <button
                key={d.date}
                onClick={() => onSelectDateFilter && onSelectDateFilter(d.date)}
                className={`px-2 py-1 rounded-lg border text-xs transition cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-red-500 text-slate-950 font-bold border-red-400'
                    : d.isToday
                    ? 'bg-slate-950 text-amber-300 border-amber-500/40 hover:border-amber-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span>{d.displayDate.split(' ')[0]}</span>
                <span
                  className={`text-[10px] font-bold px-1 rounded ${
                    isSelected ? 'bg-slate-950 text-red-400' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {d.overspeedCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
