import React, { useRef, useEffect, useState } from 'react';
import {
  Car,
  AlertTriangle,
  HardDrive,
  Wifi,
  Video,
  BatteryCharging,
  CheckCircle,
  Zap,
  Play,
  Square,
  Aperture,
} from 'lucide-react';
import { Vehicle, SnapshotRecord } from '../types';

interface MonitoringTabProps {
  totalCarsCount: number;
  overspeedCount: number;
  sdSavedCount: number;
  recentSnapshots: SnapshotRecord[];
  onTriggerShutter: (vehicle: Partial<Vehicle>) => void;
  onOpenSnapshotModal: (record: SnapshotRecord) => void;
  soundEnabled: boolean;
  speedLimit: number;
}

const plateRegions = ['서울', '경기', '인천', '부산', '대구', '경남', '충남', '전북'];
const plateChars = ['가', '나', '다', '라', '마', '거', '너', '더', '러', '머'];

function generatePlateNumber() {
  const num1 = Math.floor(Math.random() * 90 + 10);
  const char = plateChars[Math.floor(Math.random() * plateChars.length)];
  const num2 = Math.floor(Math.random() * 9000 + 1000);
  return `${num1}${char} ${num2}`;
}

export const MonitoringTab: React.FC<MonitoringTabProps> = ({
  totalCarsCount,
  overspeedCount,
  sdSavedCount,
  recentSnapshots,
  onTriggerShutter,
  onOpenSnapshotModal,
  speedLimit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const vehiclesRef = useRef<Vehicle[]>([]);
  const [currentDisplaySpeed, setCurrentDisplaySpeed] = useState<number>(0);
  const [isDisplayOverspeed, setIsDisplayOverspeed] = useState<boolean>(false);
  const [sdStatus, setSdStatus] = useState<'idle' | 'saving'>('idle');
  const [autoLoopActive, setAutoLoopActive] = useState<boolean>(false);

  // Canvas road animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Asphalt Road
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, canvas.height * 0.25, canvas.width, canvas.height * 0.55);

      // Center Dotted Line
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.setLineDash([18, 14]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.52);
      ctx.lineTo(canvas.width, canvas.height * 0.52);
      ctx.stroke();
      ctx.setLineDash([]);

      const radarX = canvas.width * 0.33;
      const cameraX = canvas.width * 0.66;

      // Radar zone line
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(radarX, 0);
      ctx.lineTo(radarX, canvas.height);
      ctx.stroke();

      // Camera shutter line
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cameraX, 0);
      ctx.lineTo(cameraX, canvas.height);
      ctx.stroke();

      const list = vehiclesRef.current;
      let activeDisplaySpeed = 0;
      let activeIsOverspeed = false;

      for (let i = list.length - 1; i >= 0; i--) {
        const v = list[i];
        v.x += v.speed / 10;

        // In Radar Detection Zone
        if (v.x > radarX - 45 && v.x < cameraX + 45) {
          activeDisplaySpeed = Math.round(v.speed);
          activeIsOverspeed = v.isOverspeed;
        }

        // Camera trigger threshold crossed
        if (v.x >= cameraX && !v.triggered) {
          v.triggered = true;
          onTriggerShutter(v);
          if (v.isOverspeed) {
            setSdStatus('saving');
            setTimeout(() => {
              setSdStatus('idle');
            }, 1600);
          }
        }

        // Render vehicle body
        ctx.fillStyle = v.color;
        ctx.beginPath();
        ctx.roundRect(v.x, v.y - 14, 58, 28, 6);
        ctx.fill();

        // Vehicle Plate Graphic
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(v.x + 8, v.y - 6, 42, 12);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 9px sans-serif';
        const plateText = v.plate.split(' ')[1] || '1234';
        ctx.fillText(plateText, v.x + 12, v.y + 3);

        // Bounding Box
        ctx.strokeStyle = v.isOverspeed ? '#ef4444' : '#10b981';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(v.x - 3, v.y - 18, 64, 36);

        // Remove out-of-screen vehicles
        if (v.x > canvas.width + 120) {
          list.splice(i, 1);
        }
      }

      if (activeDisplaySpeed > 0) {
        setCurrentDisplaySpeed(activeDisplaySpeed);
        setIsDisplayOverspeed(activeIsOverspeed);
      } else if (list.length === 0) {
        setCurrentDisplaySpeed(0);
        setIsDisplayOverspeed(false);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [onTriggerShutter]);

  // Auto spawn interval
  useEffect(() => {
    if (!autoLoopActive) return;
    const interval = setInterval(() => {
      const isOverspeed = Math.random() > 0.55;
      spawnVehicle(isOverspeed ? 'overspeed' : 'normal');
    }, 2800);
    return () => clearInterval(interval);
  }, [autoLoopActive]);

  const spawnVehicle = (type: 'normal' | 'overspeed') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const isOver = type === 'overspeed';
    const baseSpeed = isOver
      ? speedLimit + Math.floor(Math.random() * 20 + 8)
      : Math.floor(Math.random() * 8 + 18);

    const newVehicle: Vehicle = {
      id: Date.now() + Math.random(),
      x: -80,
      y: canvas.height * 0.48,
      speed: baseSpeed,
      isOverspeed: isOver,
      plate: generatePlateNumber(),
      color: isOver ? '#ef4444' : '#10b981',
      triggered: false,
    };
    vehiclesRef.current.push(newVehicle);
  };

  const handleManualTest = () => {
    const dummy: Partial<Vehicle> = {
      id: Date.now(),
      speed: 43,
      isOverspeed: true,
      plate: generatePlateNumber(),
    };
    onTriggerShutter(dummy);
    setSdStatus('saving');
    setTimeout(() => {
      setSdStatus('idle');
    }, 1500);
  };

  return (
    <section id="tab-monitor" className="space-y-4">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">총 측정 차량</p>
            <p id="stat-total" className="text-2xl font-bold font-digital text-white mt-0.5">
              {totalCarsCount} 대
            </p>
          </div>
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
            <Car className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">{speedLimit}km/h 초과 단속</p>
            <p id="stat-overspeed" className="text-2xl font-bold font-digital text-red-400 mt-0.5">
              {overspeedCount} 건
            </p>
          </div>
          <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">SD카드 저장 완료</p>
            <p id="stat-sd" className="text-2xl font-bold font-digital text-amber-400 mt-0.5">
              {sdSavedCount} 매
            </p>
          </div>
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">서버 전송 상태</p>
            <p id="stat-server" className="text-xs font-bold text-emerald-400 mt-1">
              AP 대기 (동기화 100%)
            </p>
          </div>
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Wifi className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 188 LED 전광판 & 실시간 캔버스 도로 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1단 1열 188 LED 전광판 시뮬레이션 */}
        <div className="dfs-panel rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden min-h-[340px] border border-slate-800">
          <div>
            <div className="w-full bg-amber-500 text-slate-950 font-black text-center py-2 rounded-xl text-base tracking-wider shadow">
              속도 제한 구역 ({speedLimit} KM/H 이상 단속)
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              1단 1열 188 LED PCB 하드웨어 응답 모듈
            </p>
          </div>

          {/* 188 LED Digital Box */}
          <div className="led-188 rounded-2xl p-5 my-3 text-center flex flex-col items-center justify-center relative">
            <span className="text-[10px] text-amber-500/60 font-mono tracking-widest block mb-1">
              REALTIME RADAR SPEED
            </span>
            <div
              id="dfsSpeedDisplay"
              className={`font-digital text-6xl font-black tracking-wider transition-all duration-150 py-1 ${
                isDisplayOverspeed
                  ? 'text-red-500 animate-pulse drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                  : currentDisplaySpeed > 0
                  ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                  : 'text-slate-600'
              }`}
            >
              {currentDisplaySpeed > 0 ? String(currentDisplaySpeed).padStart(2, '0') : '00'}
            </div>
            <span className="text-xs font-mono text-slate-500 mt-1">KM/H</span>
          </div>

          {/* Operational Indicators */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400">카메라 셔터 연동 (SD):</span>
              <span
                id="sdStatusText"
                className={`font-semibold ${
                  sdStatus === 'saving' ? 'text-red-400 animate-pulse' : 'text-slate-400'
                }`}
              >
                {sdStatus === 'saving' ? 'SD카드 저장 중... (OK)' : '대기 중'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400">태양광 & 배터리(35Ah):</span>
              <span className="font-mono text-emerald-400 flex items-center gap-1">
                <BatteryCharging className="w-3.5 h-3.5" /> 13.8V (정상 충전)
              </span>
            </div>
          </div>
        </div>

        {/* Live Road Track Canvas & Controls */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Video className="w-4 h-4 text-emerald-400" />
              <span>실시간 도로 감지 및 셔터 카메라 캡처 트랙</span>
            </span>
            <span className="text-[11px] text-slate-400">
              단속 기준: <strong className="text-amber-400">{speedLimit} KM/H</strong>
            </span>
          </div>

          {/* Canvas Frame */}
          <div className="relative w-full h-56 bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
            <canvas ref={canvasRef} id="roadCanvas" className="w-full h-full block" />

            <div className="absolute left-1/3 top-0 bottom-0 border-l-2 border-dashed border-amber-500/60 pointer-events-none flex items-center">
              <span className="text-[10px] bg-amber-950/90 text-amber-300 px-1 py-0.5 rounded rotate-90 -ml-3">
                레이더 감지 (5만원)
              </span>
            </div>
            <div className="absolute left-2/3 top-0 bottom-0 border-l-2 border-solid border-red-500/80 pointer-events-none flex items-center">
              <span className="text-[10px] bg-red-950/90 text-red-300 px-1 py-0.5 rounded rotate-90 -ml-3">
                카메라 SD/서버 전송
              </span>
            </div>
          </div>

          {/* Simulation Control Buttons */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => spawnVehicle('normal')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow transition cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>정상 차량 (22km/h)</span>
            </button>
            <button
              onClick={() => spawnVehicle('overspeed')}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow transition cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>과속 차량 (45km/h)</span>
            </button>
            <button
              onClick={() => setAutoLoopActive((prev) => !prev)}
              id="autoLoopBtn"
              className={`${
                autoLoopActive
                  ? 'bg-red-600 hover:bg-red-500'
                  : 'bg-blue-600 hover:bg-blue-500'
              } text-white font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow transition cursor-pointer`}
            >
              {autoLoopActive ? (
                <>
                  <Square className="w-4 h-4" />
                  <span>자동 트래픽 중지</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>자동 트래픽 시작</span>
                </>
              )}
            </button>
            <button
              onClick={handleManualTest}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow transition cursor-pointer"
            >
              <Aperture className="w-4 h-4" />
              <span>강제 스냅샷 테스트</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Captured Snapshots Gallery */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>SD카드 및 서버 저장 과속 단속 캡처 이미지 ({speedLimit}km/h 이상 감지)</span>
          </span>
          <span className="text-xs text-slate-400">클립 클릭 시 ALPR 증거 이미지 팝업</span>
        </div>
        <div
          id="recentSnapshotsList"
          className="flex space-x-3 overflow-x-auto pb-1 min-h-[95px] items-center text-xs text-slate-500"
        >
          {recentSnapshots.length === 0 ? (
            <p className="w-full text-center py-4 text-slate-500">
              아직 촬영된 과속 데이터가 없습니다. 과속 차량을 발생시켜 보세요.
            </p>
          ) : (
            recentSnapshots.map((item) => (
              <div
                key={item.id}
                onClick={() => onOpenSnapshotModal(item)}
                className="flex-shrink-0 bg-slate-950 border border-slate-800 hover:border-red-500 p-2 rounded-xl cursor-pointer transition w-44 space-y-1 text-slate-300"
              >
                <div className="h-16 bg-slate-900 rounded-lg flex flex-col items-center justify-center border border-slate-800 p-1">
                  <span className="text-xs font-black bg-white text-slate-950 px-2 py-0.5 rounded border border-slate-300">
                    {item.plate}
                  </span>
                  <span className="text-[10px] font-mono text-red-400 font-bold mt-1">
                    {item.speed} km/h (과속)
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 px-1">
                  <span>{item.time}</span>
                  <span className="text-amber-400 font-semibold">SD Saved</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
