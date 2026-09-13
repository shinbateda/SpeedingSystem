import React, { useEffect, useRef } from 'react';
import { Sliders, CheckCircle2, AlertOctagon, Lightbulb } from 'lucide-react';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export const CameraSpecsTab: React.FC = () => {
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
      type: 'bar',
      data: {
        labels: ['AR0234 (USB 3.0)', 'Hikrobot (GigE)', '한화 XNB-6002', '일반 롤링 셔터'],
        datasets: [
          {
            label: '지연시간 (ms)',
            data: [2, 4, 180, 450],
            backgroundColor: [
              'rgba(16, 185, 129, 0.85)',
              'rgba(59, 130, 246, 0.85)',
              'rgba(245, 158, 11, 0.85)',
              'rgba(239, 68, 68, 0.85)',
            ],
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `반응 지연시간: ${context.raw} ms`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            title: {
              display: true,
              text: '트리거 지연 (ms)',
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
    <section id="tab-specs" className="space-y-4">
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800">
        <h2 className="text-base font-bold text-amber-400 flex items-center space-x-2 mb-2">
          <Sliders className="w-5 h-5" />
          <span>외부 트리거 셔터링 지원 카메라 사양 및 지연시간 비교</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          과속(30km/h 이상) 발생 시 젤로(Jello) 잔상 없이 선명한 번호판 이미지를 SD 카드 및 서버에 저장하기 위한 센서 사양입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Latency Chart */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
              <span>카메라별 외부 트리거 반응 지연시간 (ms)</span>
              <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-mono">
                낮을수록 우수
              </span>
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              ESP32/RPi 하드웨어 신호 전송 후 센서 노출 시작까지 소요 시간
            </p>
          </div>
          <div className="chart-container">
            <canvas ref={chartCanvasRef} id="cameraLatencyChart" />
          </div>
        </div>

        {/* Spec Comparison Table */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 mb-3">상세 카메라 모델 비교표</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="p-2.5 font-bold">카메라 모델</th>
                    <th className="p-2.5 font-bold">셔터 방식</th>
                    <th className="p-2.5 font-bold">인터페이스</th>
                    <th className="p-2.5 font-bold">재료비/단가</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  <tr className="hover:bg-slate-800/50 bg-emerald-950/20">
                    <td className="p-2.5 font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      AR0234 USB 3.0
                    </td>
                    <td className="p-2.5 text-emerald-400 font-semibold">Global Shutter</td>
                    <td className="p-2.5">USB 3.0 / V4L2</td>
                    <td className="p-2.5 font-medium text-emerald-300">5만~12만원 (권장)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/50">
                    <td className="p-2.5 font-bold text-blue-400">Hikrobot MV-CS020</td>
                    <td className="p-2.5 text-emerald-400 font-semibold">Global Shutter</td>
                    <td className="p-2.5">GigE / Hardware GPIO</td>
                    <td className="p-2.5">40만~60만원</td>
                  </tr>
                  <tr className="hover:bg-slate-800/50">
                    <td className="p-2.5 font-bold text-amber-400">한화 XNB-6002</td>
                    <td className="p-2.5 text-amber-400 font-semibold">Rolling (분리형)</td>
                    <td className="p-2.5">IP / Alarm IN</td>
                    <td className="p-2.5">30만~35만원</td>
                  </tr>
                  <tr className="hover:bg-slate-800/50 text-slate-400">
                    <td className="p-2.5 font-bold flex items-center gap-1.5 text-red-400">
                      <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                      일반 USB 롤링 셔터
                    </td>
                    <td className="p-2.5 text-red-400 font-semibold">Rolling Shutter</td>
                    <td className="p-2.5">USB 2.0</td>
                    <td className="p-2.5 text-red-400 font-semibold">1만~3만원 (사용불가)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>추천 결론:</strong> 5만원 대 재료비 목표 달성을 위해{' '}
              <strong className="text-emerald-400">AR0234 USB 3.0 글로벌 셔터 모듈</strong>을 라즈베리파이 UVC
              포트로 직접 연동하는 방식이 가장 효율적이며 젤로 현상(비틀림 왜곡)을 완벽히 방지합니다.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
