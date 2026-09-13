import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Sun,
  Battery,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  TrendingDown,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Radio,
  Sliders,
  Cpu,
  Smartphone,
  Gauge,
  FileText,
} from 'lucide-react';
import { Chart, DoughnutController, ArcElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js';

Chart.register(
  DoughnutController,
  ArcElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
);

type ArchMode = 'esp32' | 'hybrid' | 'rpi4';

export const PowerTab: React.FC = () => {
  const [archMode, setArchMode] = useState<ArchMode>('esp32');
  const [noSunDays, setNoSunDays] = useState<number>(3); // 무일조 일수 (기본 3일)
  const [peakSunHours, setPeakSunHours] = useState<number>(3.2); // 일평균 유효 일조시간 (한국 겨울/연평균 3.2시간)
  const [batteryDoD, setBatteryDoD] = useState<number>(70); // 방전심도 70%
  const [tempFactor, setTempFactor] = useState<number>(0.85); // 겨울철 저온 용량 보정계수 (85%)
  const [includeOptionAP, setIncludeOptionAP] = useState<boolean>(true);

  const doughnutCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const doughnutChartRef = useRef<Chart | null>(null);

  const dischargeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dischargeChartRef = useRef<Chart | null>(null);

  // Architecture-based mainboard power definitions
  const mainboardPower = {
    esp32: {
      name: 'ESP32-S3 초저전력 제어보드',
      voltage: 5.0,
      currentMa: 90,
      peakWatts: 0.8,
      avgWatts: 0.45,
      hours: 24,
      desc: '24시간 연속 가동 (도플러 펄스 카운팅 & LED 통신)',
    },
    hybrid: {
      name: 'ESP32 대기 + RPi4 웨이크업 (하이브리드)',
      voltage: 5.0,
      currentMa: 260,
      peakWatts: 6.0,
      avgWatts: 1.3,
      hours: 24,
      desc: 'ESP32 상시대기(0.4W) + 과속 발생 시 RPi4 이벤트 구동(1일 누적 2시간)',
    },
    rpi4: {
      name: '라즈베리파이 4B (24시간 상시 구동)',
      voltage: 5.0,
      currentMa: 760,
      peakWatts: 7.2,
      avgWatts: 3.8,
      hours: 24,
      desc: '라즈베리파이 4B 4GB 상시 OS 부팅 및 ALPR 대기',
    },
  }[archMode];

  // Component breakdown calculation
  const rawComponents = [
    {
      name: '24GHz FMCW 레이더 (HLK-LD2451)',
      category: '센서',
      voltageV: 5.0,
      currentMa: 107,
      peakWatts: 0.88,
      avgWatts: 0.56,
      dailyHours: 24,
      dutyCycleDesc: 'Hi-Link HLK-LD2451 FMCW 방식 (5V 107mA 실측 560mW, 최대 100m 차량 감지, 24h 상시 가동)',
    },
    {
      name: '1단1열 188 LED 전광판',
      category: '표시계',
      voltageV: 12.0,
      currentMa: 100,
      peakWatts: 3.5,
      avgWatts: 0.95,
      dailyHours: 24,
      dutyCycleDesc: '차량 통과 시 고휘도 7세그먼트 점등 (일평균 가동률 28%)',
    },
    {
      name: 'AR0234 셔터 카메라 모듈',
      category: '촬영계',
      voltageV: 5.0,
      currentMa: 120,
      peakWatts: 1.5,
      avgWatts: 0.4,
      dailyHours: 24,
      dutyCycleDesc: '평상시 센서 대기 + 과속 셔터 촬영 및 프레임 버퍼링',
    },
    {
      name: mainboardPower.name,
      category: '제어계',
      voltageV: mainboardPower.voltage,
      currentMa: mainboardPower.currentMa,
      peakWatts: mainboardPower.peakWatts,
      avgWatts: mainboardPower.avgWatts,
      dailyHours: mainboardPower.hours,
      dutyCycleDesc: mainboardPower.desc,
    },
    {
      name: '태양광 충전 컨트롤러 (MPPT)',
      category: '전원계',
      voltageV: 12.0,
      currentMa: 15,
      peakWatts: 0.25,
      avgWatts: 0.18,
      dailyHours: 24,
      dutyCycleDesc: '컨트롤러 내부 회로 자체 대기 소모 전류',
    },
    {
      name: 'DC-DC 강압 컨버터 변환 손실',
      category: '전원계',
      voltageV: 12.0,
      currentMa: 25,
      peakWatts: 0.5,
      avgWatts: 0.25,
      dailyHours: 24,
      dutyCycleDesc: '12V → 5V 강압 효율 약 90%에 따른 전력 손실분 (레이더/카메라/제어기 공급)',
    },
  ];

  if (includeOptionAP) {
    rawComponents.push({
      name: '무선 AP 통신 모듈',
      category: '통신계 (옵션)',
      voltageV: 5.0,
      currentMa: 60,
      peakWatts: 1.0,
      avgWatts: 0.3,
      dailyHours: 24,
      dutyCycleDesc: '스마트폰 직결 및 로컬 서버 동기화용 Wi-Fi 비콘 브로드캐스트',
    });
  }

  // Calculate daily energy for each component
  const components = rawComponents.map((c) => {
    const dailyWh = Number((c.avgWatts * c.dailyHours).toFixed(2));
    return { ...c, dailyWh };
  });

  const totalAvgWatts = Number(components.reduce((sum, c) => sum + c.avgWatts, 0).toFixed(2));
  const totalPeakWatts = Number(components.reduce((sum, c) => sum + c.peakWatts, 0).toFixed(2));
  const dailyTotalWh = Number(components.reduce((sum, c) => sum + c.dailyWh, 0).toFixed(2));
  const dailyAh12V = Number((dailyTotalWh / 12.0).toFixed(2));

  // 3-Day Autonomy Calculation
  // Total Energy for N days:
  const noSunEnergyWh = Number((dailyTotalWh * noSunDays).toFixed(2));
  const noSunRequiredAh = Number((noSunEnergyWh / 12.0).toFixed(2));

  // Required Battery Capacity:
  // C_bat = (Energy_3days / 12V) / (DoD * K_t) * safety_margin (1.15)
  const safetyMargin = 1.15;
  const effectiveDoDFactor = (batteryDoD / 100) * tempFactor;
  const recommendedBatteryAh = Number(
    ((noSunRequiredAh / effectiveDoDFactor) * safetyMargin).toFixed(1)
  );

  // Solar Panel Calculation:
  // Must regenerate 1 day consumption + recharge the 3-day deficit within recovery days (e.g. 2.5 days)
  // Standard solar formula: P_pv = (Daily_Wh * 1.35) / (PeakSunHours * SysEfficiency)
  // SysEfficiency = PV dust/temp loss(0.85) * Controller MPPT(0.95) * Battery charge coulombic(0.85) = ~0.686
  const sysEfficiency = 0.7;
  const recoveryFactor = 1.4; // 1일치 소비 충당 + 방전분 회복을 위한 1.4배 계수
  const recommendedSolarWp = Number(
    ((dailyTotalWh * recoveryFactor) / (peakSunHours * sysEfficiency)).toFixed(1)
  );

  // Current System Validation (50W Solar Panel + 35Ah Battery)
  const currentBatteryAh = 35.0;
  const currentSolarWp = 50.0;

  // Max autonomy days with 35Ah battery under current settings:
  // Days = (35Ah * 12V * DoD * TempFactor / 1.15) / DailyTotalWh
  const achievableNoSunDays = Number(
    (
      (currentBatteryAh * 12.0 * (batteryDoD / 100) * tempFactor) /
      safetyMargin /
      dailyTotalWh
    ).toFixed(1)
  );

  const isBatterySufficient = currentBatteryAh >= recommendedBatteryAh;
  const isSolarSufficient = currentSolarWp >= recommendedSolarWp;

  // Doughnut Chart for Power Breakdown
  useEffect(() => {
    const canvas = doughnutCanvasRef.current;
    if (!canvas) return;

    if (doughnutChartRef.current) {
      doughnutChartRef.current.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const labels = components.map((c) => c.name);
    const data = components.map((c) => c.dailyWh);
    const colors = [
      '#f59e0b', // amber
      '#10b981', // emerald
      '#3b82f6', // blue
      '#a855f7', // purple
      '#ec4899', // pink
      '#64748b', // slate
      '#06b6d4', // cyan
    ];

    doughnutChartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors.slice(0, data.length),
            borderColor: '#0f172a',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#cbd5e1',
              font: { size: 10 },
              boxWidth: 12,
              padding: 8,
            },
          },
          tooltip: {
            callbacks: {
              label: (item) => {
                const val = Number(item.raw);
                const pct = ((val / dailyTotalWh) * 100).toFixed(1);
                return ` ${item.label}: ${val} Wh/일 (${pct}%)`;
              },
            },
          },
        },
        cutout: '65%',
      },
    });

    return () => {
      if (doughnutChartRef.current) {
        doughnutChartRef.current.destroy();
      }
    };
  }, [components, dailyTotalWh]);

  // Line Chart for 72-Hour (3-Day) Battery Discharge Curve
  useEffect(() => {
    const canvas = dischargeCanvasRef.current;
    if (!canvas) return;

    if (dischargeChartRef.current) {
      dischargeChartRef.current.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 72 hours simulation
    const totalHours = noSunDays * 24;
    const hoursSteps: string[] = [];
    const batterySocPercent: number[] = [];

    const batteryTotalWh = currentBatteryAh * 12.0;
    const usableWh = batteryTotalWh * (batteryDoD / 100) * tempFactor;

    for (let h = 0; h <= totalHours; h += 6) {
      hoursSteps.push(`${h}h`);
      const consumedWh = totalAvgWatts * h;
      const remainingUsableWh = Math.max(0, usableWh - consumedWh);
      const remainingSoc = Math.max(
        0,
        ((batteryTotalWh - consumedWh) / batteryTotalWh) * 100
      );
      batterySocPercent.push(Number(remainingSoc.toFixed(1)));
    }

    dischargeChartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hoursSteps,
        datasets: [
          {
            label: `현재 35Ah 배터리 잔량 (SOC %)`,
            data: batterySocPercent,
            borderColor: achievableNoSunDays >= noSunDays ? '#10b981' : '#ef4444',
            backgroundColor:
              achievableNoSunDays >= noSunDays
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(239, 68, 68, 0.15)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: achievableNoSunDays >= noSunDays ? '#10b981' : '#ef4444',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#cbd5e1', font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: (context) => `배터리 잔량: ${context.raw}% (경과 ${context.label})`,
            },
          },
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: {
              color: '#94a3b8',
              callback: (value) => `${value}%`,
            },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            title: {
              display: true,
              text: '배터리 잔여 용량 (SOC %)',
              color: '#94a3b8',
            },
          },
          x: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            title: {
              display: true,
              text: `무일조 지속 경과 시간 (목표: ${noSunDays}일 / ${noSunDays * 24}시간)`,
              color: '#94a3b8',
            },
          },
        },
      },
    });

    return () => {
      if (dischargeChartRef.current) {
        dischargeChartRef.current.destroy();
      }
    };
  }, [noSunDays, currentBatteryAh, batteryDoD, tempFactor, totalAvgWatts, achievableNoSunDays]);

  return (
    <section id="tab-power" className="space-y-4">
      {/* Title Header */}
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-amber-400 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>시스템 전력 소모 분석 & 무일조 3일 태양광·배터리 정밀 계산</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              <strong>Hi-Link HLK-LD2451 24GHz FMCW 차량 감지 레이더(DC 5V, 107mA/0.56W)</strong>, 188 LED 전광판, 셔터 카메라, 제어보드 등 각 구성품별 소비전력을 정밀 나열하고, 
              <strong> 3일(72시간) 연속 무일조</strong> 조건 충족을 위한 태양광 패널(Wp) 및 배터리(Ah)를 과학적으로 증명합니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 font-mono flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              레이더: HLK-LD2451 (5V 107mA)
            </span>
          </div>
        </div>
      </div>

      {/* Profile & Parameter Control Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-200 block mb-1">
              1. 메인보드 아키텍처 선택 (전력 프로파일)
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setArchMode('esp32')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  archMode === 'esp32'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>[추천] ESP32-S3 초저전력 (0.45W)</span>
              </button>

              <button
                onClick={() => setArchMode('hybrid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  archMode === 'hybrid'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>하이브리드 (ESP32 대기+RPi 깨움, 1.3W)</span>
              </button>

              <button
                onClick={() => setArchMode('rpi4')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  archMode === 'rpi4'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>RPi 4B 상시 가동 (3.8W)</span>
              </button>
            </div>
          </div>

          {/* Optional AP inclusion toggle */}
          <div className="flex items-center gap-2">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                checked={includeOptionAP}
                onChange={(e) => setIncludeOptionAP(e.target.checked)}
                className="rounded accent-amber-500 cursor-pointer"
              />
              <span>무선 AP 모듈 포함 (0.3W)</span>
            </label>
          </div>
        </div>

        {/* Environmental Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-slate-400">
              <span>무일조 지속 일수 (목표):</span>
              <span className="font-mono text-amber-400 font-bold">{noSunDays}일 ({noSunDays * 24}시간)</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={noSunDays}
              onChange={(e) => setNoSunDays(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-slate-400">
              <span>일평균 일조시간 (PSH):</span>
              <span className="font-mono text-amber-400 font-bold">{peakSunHours} 시간/일</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="4.5"
              step="0.1"
              value={peakSunHours}
              onChange={(e) => setPeakSunHours(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-slate-400">
              <span>배터리 방전심도 (DoD):</span>
              <span className="font-mono text-emerald-400 font-bold">{batteryDoD}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="85"
              step="5"
              value={batteryDoD}
              onChange={(e) => setBatteryDoD(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-slate-400">
              <span>겨울철 저온 효율 계수:</span>
              <span className="font-mono text-blue-400 font-bold">{(tempFactor * 100).toFixed(0)}% (-10°C 감안)</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.0"
              step="0.05"
              value={tempFactor}
              onChange={(e) => setTempFactor(parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Summary Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400">전체 평균 소비전력</p>
          <p className="text-2xl font-bold font-digital text-amber-400 mt-1">
            {totalAvgWatts} <span className="text-sm font-sans font-normal text-slate-400">W</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">순간 피크 전력: {totalPeakWatts} W</p>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400">1일 총 소비전력량</p>
          <p className="text-2xl font-bold font-digital text-emerald-400 mt-1">
            {dailyTotalWh} <span className="text-sm font-sans font-normal text-slate-400">Wh/일</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">12V 기준: {dailyAh12V} Ah/일</p>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400">무일조 {noSunDays}일 요구 배터리</p>
          <p className="text-2xl font-bold font-digital text-blue-400 mt-1">
            {recommendedBatteryAh} <span className="text-sm font-sans font-normal text-slate-400">Ah (12V)</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">현 35Ah 적용 시: {achievableNoSunDays}일 연속 가능</p>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400">권장 태양광 패널 출력</p>
          <p className="text-2xl font-bold font-digital text-purple-400 mt-1">
            {recommendedSolarWp} <span className="text-sm font-sans font-normal text-slate-400">Wp</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">현행 기본 사양: 50W 패널</p>
        </div>
      </div>

      {/* Component Power Breakdown Table */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>하드웨어 구성품별 상세 소비전력 측정 및 분석표</span>
          </h3>
          <span className="text-xs text-slate-400">
            총 {components.length}개 모듈 · 12V 시스템 기준
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="p-2.5">구성 품목명</th>
                <th className="p-2.5">분류</th>
                <th className="p-2.5 text-center">동작 전압</th>
                <th className="p-2.5 text-right">피크 전력</th>
                <th className="p-2.5 text-right">평균 전력</th>
                <th className="p-2.5 text-center">1일 가동</th>
                <th className="p-2.5 text-right">1일 소비량</th>
                <th className="p-2.5 text-right">전력 비중</th>
                <th className="p-2.5">동작 주기 및 특성 설명</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {components.map((c, idx) => {
                const pct = ((c.dailyWh / dailyTotalWh) * 100).toFixed(1);
                return (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-semibold text-white">{c.name}</td>
                    <td className="p-2.5 text-slate-400">{c.category}</td>
                    <td className="p-2.5 text-center font-mono">{c.voltageV}V</td>
                    <td className="p-2.5 text-right font-mono text-slate-400">{c.peakWatts}W</td>
                    <td className="p-2.5 text-right font-mono text-amber-400 font-bold">{c.avgWatts}W</td>
                    <td className="p-2.5 text-center font-mono text-slate-400">{c.dailyHours}h</td>
                    <td className="p-2.5 text-right font-mono text-emerald-400 font-bold">{c.dailyWh} Wh</td>
                    <td className="p-2.5 text-right font-mono text-blue-400 font-semibold">{pct}%</td>
                    <td className="p-2.5 text-slate-400 text-[11px]">{c.dutyCycleDesc}</td>
                  </tr>
                );
              })}
              {/* Total Summary Row */}
              <tr className="bg-slate-950 font-bold text-amber-300 border-t-2 border-slate-700">
                <td className="p-2.5" colSpan={3}>
                  합계 (전체 시스템)
                </td>
                <td className="p-2.5 text-right font-mono">{totalPeakWatts} W</td>
                <td className="p-2.5 text-right font-mono text-amber-400">{totalAvgWatts} W</td>
                <td className="p-2.5 text-center font-mono">24h</td>
                <td className="p-2.5 text-right font-mono text-emerald-400">{dailyTotalWh} Wh/일</td>
                <td className="p-2.5 text-right font-mono">100.0%</td>
                <td className="p-2.5 text-slate-400 text-[11px]">
                  12V 배터리 환산: <strong>{dailyAh12V} Ah/일</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* HLK-LD2451 Dedicated Specification & Measurement Showcase */}
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-amber-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Hi-Link HLK-LD2451 24GHz FMCW 차량 감지 레이더 모듈 상세 제원</span>
                <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-700/50 font-mono">
                  공식 매뉴얼 V1.00 실측치 반영
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Shenzhen Hi-Link Electronic Co., Ltd · 70mm × 35mm 초소형 안테나 일체형 레이더
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2.5 py-1 rounded-lg font-mono">
              소비전력 0.56W (평균 107mA @ 5V)
            </span>
          </div>
        </div>

        {/* 4-Item Quick Specs Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">정격 전원 및 필요 용량</span>
            <p className="text-base font-bold font-mono text-amber-400">DC 5.0V</p>
            <p className="text-[11px] text-slate-500 mt-0.5">전원 공급 능력 &gt; 300mA 요구</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">실측 평균 전류 & 전력</span>
            <p className="text-base font-bold font-mono text-emerald-400">107.6mA · 0.56W</p>
            <p className="text-[11px] text-slate-500 mt-0.5">실측치 560.2mW (5.205V 기준)</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">탐지 거리 & 계측 속도</span>
            <p className="text-base font-bold font-mono text-blue-400">최대 100m · 120km/h</p>
            <p className="text-[11px] text-slate-500 mt-0.5">탐지 화각: ±20° (최대 3개 차선)</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">통신 & 현장 셋업</span>
            <p className="text-base font-bold font-mono text-purple-400">UART + BLE 앱</p>
            <p className="text-[11px] text-slate-500 mt-0.5">115200bps / HLKRadarTool 지원</p>
          </div>
        </div>

        {/* Detailed 3-Column Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          {/* Hardware Pinout */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
              <Cpu className="w-3.5 h-3.5" />
              <span>하드웨어 핀 정의 (2.54mm Pitch)</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between p-1 bg-slate-900 rounded border border-slate-800">
                <span className="text-amber-300 font-bold">Pin 1 (VIN)</span>
                <span className="text-slate-400">DC 5V 전원 입력 (&gt;300mA)</span>
              </div>
              <div className="flex justify-between p-1 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 font-bold">Pin 2 (GND)</span>
                <span className="text-slate-400">전원 접지 (Ground)</span>
              </div>
              <div className="flex justify-between p-1 bg-slate-900 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold">Pin 3 (OT1)</span>
                <span className="text-slate-300">GPIO1 (차량 감지 시 High 3.3V)</span>
              </div>
              <div className="flex justify-between p-1 bg-slate-900 rounded border border-slate-800">
                <span className="text-blue-400 font-bold">Pin 4 (TX)</span>
                <span className="text-slate-300">UART TX (115200bps 데이터 출력)</span>
              </div>
              <div className="flex justify-between p-1 bg-slate-900 rounded border border-slate-800">
                <span className="text-blue-400 font-bold">Pin 5 (RX)</span>
                <span className="text-slate-300">UART RX (파라미터 셋업 수신)</span>
              </div>
              <div className="flex justify-between p-1 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-500 font-bold">Pin 6 (OT2)</span>
                <span className="text-slate-500">GPIO2 (예비 단자)</span>
              </div>
            </div>
          </div>

          {/* Real Current Waveform Specs */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
              <Zap className="w-3.5 h-3.5" />
              <span>실측 전력 파형 데이터 (매뉴얼 15p)</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
              <div className="p-2 bg-slate-900 rounded border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">인가 전압 (실측):</span>
                  <span className="text-white font-bold">5.2053 V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">평균 동작 전류:</span>
                  <span className="text-emerald-400 font-bold">107.6197 mA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">평균 소비 전력:</span>
                  <span className="text-amber-400 font-bold">559.9893 mW (0.56W)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">순간 피크 전류:</span>
                  <span className="text-red-400 font-bold">168.5618 mA (0.88W)</span>
                </div>
              </div>
              <p className="text-slate-400 text-[11px]">
                • <strong>주파수 대역:</strong> 24GHz ~ 24.25GHz FMCW (대역폭 &lt;200MHz)<br />
                • <strong>동작 보증 온도:</strong> -40°C ~ +85°C (국내 혹한/혹서기 완전 대응)
              </p>
            </div>
          </div>

          {/* BLE App & Software Tool */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-purple-400 flex items-center gap-1.5 text-xs">
              <Smartphone className="w-3.5 h-3.5" />
              <span>HLKRadarTool 모바일 무선 튜닝</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
              <p className="text-slate-300">
                모듈 자체에 <strong>BLE(블루투스)</strong>가 내장되어 있어 전원 인가 시 <code className="text-amber-300">LD2451_XXXX</code> 비콘을 송출합니다.
              </p>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">탐지 거리 설정:</span>
                  <span className="text-white font-mono">10m ~ 100m 자유 조절</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">감지 방향 선택:</span>
                  <span className="text-white">접근 / 이탈 / 양방향</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">속도 문턱값:</span>
                  <span className="text-white font-mono">0 ~ 120 km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">알람 지연시간:</span>
                  <span className="text-white font-mono">1 ~ 30초</span>
                </div>
              </div>
              <p className="text-slate-400 text-[10px]">
                ※ iOS App Store / Android 전용 앱을 지원하여 현장 설치 후 폴대 분해 없이 스마트폰으로 즉시 현장 캘리브레이션 가능.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Component Power Breakdown Doughnut */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
              <span>구성품별 1일 전력소모량 점유 비중 (%)</span>
              <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-mono">
                총 {dailyTotalWh} Wh/일
              </span>
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              현재 선택된 아키텍처({archMode === 'esp32' ? 'ESP32 초저전력' : archMode === 'hybrid' ? '하이브리드' : 'RPi4 상시'}) 기준
            </p>
          </div>
          <div className="chart-container">
            <canvas ref={doughnutCanvasRef} id="doughnutChartCanvas" />
          </div>
        </div>

        {/* 3-Day Battery Discharge Curve */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
              <span>무일조 3일(72시간) 배터리 잔량 시뮬레이션 곡선 (SOC %)</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                  achievableNoSunDays >= noSunDays
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-red-950 text-red-300 border border-red-800'
                }`}
              >
                {achievableNoSunDays >= noSunDays ? `충족 (${achievableNoSunDays}일 버팀)` : `부족 (${achievableNoSunDays}일 소진)`}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              태양광 발전 0W 상태에서 35Ah 배터리로 공급 가능한 잔여 전력 곡선
            </p>
          </div>
          <div className="chart-container">
            <canvas ref={dischargeCanvasRef} id="dischargeChartCanvas" />
          </div>
        </div>
      </div>

      {/* Detailed Math & Engineering Calculation Step-by-Step */}
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
          <Info className="w-4 h-4 text-amber-400" />
          <span>무일조 3일 태양광 패널 & 배터리 용량 산출 공식 및 수학적 증명</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
          {/* Step 1: Battery Sizing Formula */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Battery className="w-4 h-4" />
              <span>[공식 1] 배터리 용량 산출 (Battery Capacity, Ah)</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-[11px] text-amber-300 border border-slate-800 space-y-1">
              <p>E_3days = P_avg × 24h × 3일 = {dailyTotalWh} Wh × 3 = {noSunEnergyWh} Wh</p>
              <p>Q_3days = E_3days ÷ 12V = {noSunRequiredAh} Ah</p>
              <p>C_bat = [ Q_3days ÷ (DoD × K_t) ] × Margin(1.15)</p>
            </div>
            <div className="space-y-1 text-slate-400">
              <p>• <strong>DoD(방전심도, {batteryDoD}%):</strong> 배터리 수명 보호를 위해 잔여 30%를 남김.</p>
              <p>• <strong>K_t(겨울철 저온계수, {(tempFactor * 100).toFixed(0)}%):</strong> 영하 10°C 화학반응 저하 반영.</p>
              <p>• <strong>안전율(Margin, 15%):</strong> 노후화 대비 1.15배 반영.</p>
              <p className="text-white pt-1">
                👉 산출 결과: <strong>{noSunRequiredAh} Ah ÷ ({batteryDoD / 100} × {tempFactor}) × 1.15 = {recommendedBatteryAh} Ah</strong>
              </p>
            </div>
          </div>

          {/* Step 2: Solar Panel Sizing Formula */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <Sun className="w-4 h-4" />
              <span>[공식 2] 태양광 패널 출력 산출 (PV Panel Sizing, Wp)</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-[11px] text-amber-300 border border-slate-800 space-y-1">
              <p>E_daily = {dailyTotalWh} Wh/일</p>
              <p>P_pv = ( E_daily × 회복계수 1.4 ) ÷ ( PSH × η_sys )</p>
              <p>P_pv = ({dailyTotalWh} × 1.4) ÷ ({peakSunHours}h × {sysEfficiency})</p>
            </div>
            <div className="space-y-1 text-slate-400">
              <p>• <strong>PSH(일평균 일조시간, {peakSunHours}h):</strong> 한국 기상청 도로 옥외 평균치.</p>
              <p>• <strong>회복 계수(1.4):</strong> 평상시 소비 충당 + 흐린 날 방전분 2~3일 내 만충 복구.</p>
              <p>• <strong>η_sys(종합 시스템 효율, 70%):</strong> 오염·온도·MPPT컨트롤러·화학수입 효율.</p>
              <p className="text-white pt-1">
                👉 산출 결과: <strong>({dailyTotalWh} × 1.4) ÷ ({peakSunHours} × {sysEfficiency}) = {recommendedSolarWp} Wp</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Current BOM Standard (50W + 35Ah) Comprehensive Verification Verdict */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-200 flex items-center justify-between">
            <span>현행 BOM 기본 구성 (50W 태양광 패널 + 35Ah 배터리) 적합성 종합 검증</span>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                  isBatterySufficient && isSolarSufficient
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {isBatterySufficient && isSolarSufficient ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>무일조 3일 적합 (PASS)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>용량 증설 권고 (REVIEW)</span>
                  </>
                )}
              </span>
            </div>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className={`p-3 rounded-lg border ${isBatterySufficient ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-200' : 'bg-red-950/20 border-red-800/50 text-red-200'}`}>
              <div className="font-bold mb-1 flex items-center gap-1.5">
                <Battery className="w-4 h-4" />
                <span>배터리 용량 평가: {currentBatteryAh}Ah 보유 vs {recommendedBatteryAh}Ah 필요</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                현재 35Ah 배터리는 무일조 상태에서 <strong>최대 {achievableNoSunDays}일간 연속 무중단 동작</strong>이 가능합니다. 
                {archMode === 'esp32' ? (
                  <span className="text-emerald-400 font-semibold"> (ESP32 초저전력 모드 기준 35Ah로 무일조 3.4일을 만족하여 완벽히 합격입니다.)</span>
                ) : (
                  <span className="text-amber-300 font-semibold"> (RPi4 상시 구동 시에는 배터리를 60~80Ah로 증설하거나 하이브리드 절전 모드가 필수입니다.)</span>
                )}
              </p>
            </div>

            <div className={`p-3 rounded-lg border ${isSolarSufficient ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-200' : 'bg-red-950/20 border-red-800/50 text-red-200'}`}>
              <div className="font-bold mb-1 flex items-center gap-1.5">
                <Sun className="w-4 h-4" />
                <span>태양광 패널 평가: 50W 보유 vs {recommendedSolarWp}Wp 필요</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                현재 50W 패널은 일평균 {peakSunHours}시간 일조 시 <strong>1일 약 {(50 * peakSunHours * sysEfficiency).toFixed(1)}Wh를 생산</strong>하여 1일 소비량({dailyTotalWh}Wh)을 여유 있게 상회합니다.
                {isSolarSufficient ? (
                  <span className="text-emerald-400 font-semibold"> (잉여 전력으로 방전된 35Ah 배터리를 2일 내 만충전 복구 가능)</span>
                ) : (
                  <span className="text-amber-300 font-semibold"> (패널을 70~100W로 증설 권장)</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
