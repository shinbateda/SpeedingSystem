import React, { useEffect, useRef } from 'react';
import {
  Cpu,
  Thermometer,
  HardDrive,
  BatteryCharging,
  Clock,
  Pin,
  TrendingDown,
} from 'lucide-react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
);

export const DurabilityTab: React.FC = () => {
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['10대', '100대', '1,000대', '10,000대'],
        datasets: [
          {
            label: '라즈베리파이 기반 메인보드 단가 (원)',
            data: [300000, 280000, 250000, 230000],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 5,
            pointBackgroundColor: '#f59e0b',
          },
          {
            label: 'ESP32 커스텀 통합 PCBA 단가 (원)',
            data: [150000, 70000, 38000, 22000],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 5,
            pointBackgroundColor: '#10b981',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#cbd5e1',
              font: { size: 11 },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${Number(context.raw).toLocaleString()}원`,
            },
          },
        },
        scales: {
          y: {
            ticks: {
              color: '#94a3b8',
              callback: (value) => `${Number(value) / 10000}만`,
            },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            title: {
              display: true,
              text: '대당 단가 (원)',
              color: '#94a3b8',
            },
          },
          x: {
            ticks: { color: '#94a3b8' },
            grid: { display: false },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  return (
    <section id="tab-durability" className="space-y-4">
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800">
        <h2 className="text-base font-bold text-amber-400 flex items-center space-x-2 mb-2">
          <Cpu className="w-5 h-5" />
          <span>라즈베리파이 기반 현장 내구성 및 양산 단가 검토</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          옥외 도로 환경에서의 라즈베리파이(Raspberry Pi) 내구성 한계 극복 방안과 생산 수량 확대에 따른 ESP32 커스텀 PCBA 대비 양산 단가 추이를 검토합니다.
        </p>
      </div>

      {/* Durability Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2 text-amber-400 mb-2">
            <Thermometer className="w-4 h-4" />
            <h4 className="text-xs font-bold text-slate-100">동작 온도 & 방열</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            RPi4는 여름철 쇠함체 내부 온도가 60°C 초과 시 스로틀링 발생. <strong>방열판 및 방수 쿨링팬 필수</strong>. (ESP32는 -40~85°C 팬리스 무소음 작동)
          </p>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2 text-emerald-400 mb-2">
            <HardDrive className="w-4 h-4" />
            <h4 className="text-xs font-bold text-slate-100">SD카드 손상 방지</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            갑작스런 태양광 전원 차단 시 SD 파일시스템 깨짐 방지를 위해 <strong>OverlayFS(Read-Only OS)</strong> 적용 및 캡처 이미지 전용 파일 파티션 분리가 필수입니다.
          </p>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2 text-blue-400 mb-2">
            <BatteryCharging className="w-4 h-4" />
            <h4 className="text-xs font-bold text-slate-100">소비전력 (태양광/배터리)</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            RPi4 소비전력(약 5~7W)은 50W 태양광+35Ah 배터리로 안정적 운용이 가능하며, <strong>저전력 딥슬립 타이머 PCB</strong> 사용 시 무일조 유지 기간이 대폭 증가합니다.
          </p>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2 text-purple-400 mb-2">
            <Clock className="w-4 h-4" />
            <h4 className="text-xs font-bold text-slate-100">콜드 부팅 속도</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            RPi OS 부팅 35~45초 소요. 리셋 직후 초기 과속 감지 누락을 방지하기 위해 <strong>ESP32가 전광판/레이더를 즉각 제어</strong>하고 RPi는 서버전송을 전담합니다.
          </p>
        </div>
      </div>

      {/* Mass Production Cost Scale Chart & Tradeoff Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart Container */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
              <span>생산 수량별 대당 보드 제작 단가 비교 (양산 스케일링)</span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> 10,000대 시 2.2만원
              </span>
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              수량 증가 시 RPi 모듈 방식 vs ESP32 전용 단일 PCBA 수량별 단가 변화
            </p>
          </div>
          <div className="chart-container">
            <canvas ref={chartCanvasRef} id="massProductionChart" />
          </div>
        </div>

        {/* Strategy & Recommendations */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
          <h3 className="text-xs font-bold text-slate-200">양산 단계별 메인보드 선정 전략 및 결론</h3>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-400 block mb-1">
                1단계: 소량 제작 및 시범 사업 (10 ~ 100대)
              </span>
              <p className="text-slate-400">
                라즈베리파이 4 / Compute Module 4(CM4)를 적용하는 것이 개발 기간을 80% 단축시키며, 파이썬 기반 ALPR 번호판 인식 알고리즘 이식이 매우 용이합니다.
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-bold text-emerald-400 block mb-1">
                2단계: 본격 양산 단계 (1,000대 이상)
              </span>
              <p className="text-slate-400">
                ESP32-S3 + 전용 188 LED 드라이버 통합 단일 PCBA를 직접 양산 설계하면, 제어보드 단가를 30만원에서 4만원 이하로 85% 이상 절감 가능합니다.
              </p>
            </div>
          </div>

          <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-800/60 text-xs text-purple-200 flex items-start gap-2">
            <Pin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong>최종 구조 제안:</strong> 초기 양산은{' '}
              <strong>ESP32(레이더/LED/셔터 펄스전담) + 라즈베리파이(SD저장/AP웹서버전담) 하이브리드 구조</strong>로 구축하여 현장 내구성과 단가 목표를 동시에 만족시키는 것이 최선입니다.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
