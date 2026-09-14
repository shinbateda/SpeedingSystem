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
  Gauge,
  Sparkles,
  Sliders,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ArrowUpDown,
  RotateCcw,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Edit3,
  Bookmark,
} from 'lucide-react';
import { Vehicle, SnapshotRecord } from '../types';

interface MonitoringTabProps {
  totalCarsCount: number;
  overspeedCount: number;
  sdSavedCount: number;
  recentSnapshots: SnapshotRecord[];
  onTriggerShutter: (vehicle: Partial<Vehicle>) => void;
  onOpenSnapshotModal: (record: SnapshotRecord) => void;
  onUpdateMemo?: (recordId: number, memo: string) => void;
  soundEnabled: boolean;
  speedLimit: number;
}

const plateRegions = ['서울', '경기', '인천', '부산', '대구', '경남', '충남', '전북', '광주', '대전'];
const plateChars = ['가', '나', '다', '라', '마', '거', '너', '더', '러', '머', '고', '노', '도', '로', '모'];

function generatePlateNumber() {
  const region = plateRegions[Math.floor(Math.random() * plateRegions.length)];
  const num1 = Math.floor(Math.random() * 89 + 10);
  const char = plateChars[Math.floor(Math.random() * plateChars.length)];
  const num2 = Math.floor(Math.random() * 9000 + 1000);
  return `${region}${num1}${char} ${num2}`;
}

/**
 * 차량 속도 랜덤 생성 로직
 * - 과속: 제한속도(30km/h) + 3 ~ 55km/h (33km/h ~ 85km/h 현실적 가중치 랜덤)
 * - 정상: 15km/h ~ (제한속도 - 1)km/h (15km/h ~ 29km/h)
 * - 혼합: 65% 확률 과속, 35% 확률 준수 주행
 */
function generateRandomVehicleSpeed(
  mode: 'random' | 'overspeed' | 'normal',
  limit: number
): { speed: number; isOverspeed: boolean; severity: 'normal' | 'low' | 'mid' | 'high' } {
  if (mode === 'overspeed') {
    const roll = Math.random();
    let delta = 0;
    let severity: 'low' | 'mid' | 'high' = 'low';

    if (roll < 0.50) {
      // 일반 과속 (+3 ~ +14 km/h): 33 ~ 44 km/h
      delta = Math.floor(Math.random() * 12) + 3;
      severity = 'low';
    } else if (roll < 0.85) {
      // 중대 과속 (+15 ~ +28 km/h): 45 ~ 58 km/h
      delta = Math.floor(Math.random() * 14) + 15;
      severity = 'mid';
    } else {
      // 초과속 위험 (+29 ~ +55 km/h): 59 ~ 85 km/h
      delta = Math.floor(Math.random() * 27) + 29;
      severity = 'high';
    }

    return {
      speed: limit + delta,
      isOverspeed: true,
      severity,
    };
  }

  if (mode === 'normal') {
    const minSpeed = Math.max(15, limit - 14);
    const maxSpeed = Math.max(minSpeed + 2, limit - 1);
    const speed = Math.floor(Math.random() * (maxSpeed - minSpeed + 1)) + minSpeed;
    return {
      speed,
      isOverspeed: false,
      severity: 'normal',
    };
  }

  // 혼합 모드: 65% 과속 생성 (단속 시스템 검증용)
  const isOver = Math.random() < 0.65;
  return generateRandomVehicleSpeed(isOver ? 'overspeed' : 'normal', limit);
}

export const MonitoringTab: React.FC<MonitoringTabProps> = ({
  totalCarsCount,
  overspeedCount,
  sdSavedCount,
  recentSnapshots,
  onTriggerShutter,
  onOpenSnapshotModal,
  onUpdateMemo,
  speedLimit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const vehiclesRef = useRef<Vehicle[]>([]);
  const [currentDisplaySpeed, setCurrentDisplaySpeed] = useState<number>(0);
  const [isDisplayOverspeed, setIsDisplayOverspeed] = useState<boolean>(false);
  const [sdStatus, setSdStatus] = useState<'idle' | 'saving'>('idle');

  // 시뮬레이션 상태 관리
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simIntervalMs, setSimIntervalMs] = useState<number>(2400);
  const [simMode, setSimMode] = useState<'mixed' | 'overspeed_only'>('mixed');
  const [lastSpawned, setLastSpawned] = useState<{
    plate: string;
    speed: number;
    isOverspeed: boolean;
    time: string;
    severity: string;
  } | null>(null);
  const [simulationStats, setSimulationStats] = useState<{ totalSpawned: number; overspeedSpawned: number }>({
    totalSpawned: 0,
    overspeedSpawned: 0,
  });

  // 단속 기록 검색 및 필터링 상태
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all'); // 'all' or 'today' or 'YYYY-MM-DD'
  const [selectedSpeedRange, setSelectedSpeedRange] = useState<string>('all'); // 'all' | '31-40' | '41-50' | '51-60' | '61+'
  const [searchPlateQuery, setSearchPlateQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'latest' | 'speed_desc' | 'speed_asc'>('latest');
  const [onlyWithMemo, setOnlyWithMemo] = useState<boolean>(false);

  // 추출 가능한 고유 날짜 목록
  const uniqueDates = React.useMemo(() => {
    const dates = new Set<string>();
    recentSnapshots.forEach((s) => {
      if (s.date) dates.add(s.date);
    });
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [recentSnapshots]);

  // 메모 작성된 기록 총 건수
  const totalMemoCount = React.useMemo(() => {
    return recentSnapshots.filter((r) => !!r.memo && r.memo.trim().length > 0).length;
  }, [recentSnapshots]);

  // 필터링 및 정렬된 단속 기록 목록
  const filteredSnapshots = React.useMemo(() => {
    return recentSnapshots
      .filter((record) => {
        // 관리자 메모 유무 필터
        if (onlyWithMemo && (!record.memo || record.memo.trim().length === 0)) {
          return false;
        }

        // 날짜 필터
        if (selectedDateFilter !== 'all') {
          const todayStr = new Date().toISOString().split('T')[0];
          if (selectedDateFilter === 'today') {
            if (record.date && record.date !== todayStr) return false;
          } else if (record.date !== selectedDateFilter) {
            return false;
          }
        }

        // 속도 구간 필터
        if (selectedSpeedRange !== 'all') {
          const sp = record.speed;
          if (selectedSpeedRange === '31-40' && (sp < 31 || sp > 40)) return false;
          if (selectedSpeedRange === '41-50' && (sp < 41 || sp > 50)) return false;
          if (selectedSpeedRange === '51-60' && (sp < 51 || sp > 60)) return false;
          if (selectedSpeedRange === '61+' && sp < 61) return false;
        }

        // 번호판 및 관리자 메모 통합 검색 쿼리
        if (searchPlateQuery.trim()) {
          const query = searchPlateQuery.trim().toLowerCase();
          const cleanPlate = record.plate.replace(/\s+/g, '').toLowerCase();
          const memoText = (record.memo || '').toLowerCase();
          const cleanQuery = query.replace(/\s+/g, '');
          const matchPlate = cleanPlate.includes(cleanQuery);
          const matchMemo = memoText.includes(query);
          if (!matchPlate && !matchMemo) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'speed_desc') return b.speed - a.speed;
        if (sortOrder === 'speed_asc') return a.speed - b.speed;
        return b.id - a.id; // latest
      });
  }, [recentSnapshots, onlyWithMemo, selectedDateFilter, selectedSpeedRange, searchPlateQuery, sortOrder]);

  // 필터링된 단속 기록 CSV 다운로드 함수
  const handleDownloadCsv = () => {
    if (filteredSnapshots.length === 0) return;

    // CSV 헤더 정의 (관리자 메모 포함)
    const headers = [
      '단속ID',
      '단속일자',
      '촬영시각',
      '차량번호',
      '단속속도(km/h)',
      '제한속도(km/h)',
      '초과속도(km/h)',
      '과속여부',
      '관리자메모',
      '메모수정시각',
      '저장상태',
      'ALPR신뢰도',
    ];

    // 행 데이터 변환
    const rows = filteredSnapshots.map((item) => {
      const overspeedDelta = item.speed - speedLimit;
      return [
        item.id,
        item.date || new Date().toISOString().split('T')[0],
        item.time,
        `"${item.plate.replace(/"/g, '""')}"`,
        item.speed,
        speedLimit,
        overspeedDelta > 0 ? `+${overspeedDelta}` : '0',
        item.isOverspeed ? '과속' : '정상',
        `"${(item.memo || '').replace(/"/g, '""')}"`,
        item.memoUpdatedAt ? `"${item.memoUpdatedAt}"` : '""',
        'SD카드 및 서버 저장 완료',
        '98.5%',
      ];
    });

    // CSV 문자열 조립 (엑셀 한글 깨짐 방지를 위한 UTF-8 BOM '\uFEFF' 추가)
    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

    // Blob 생성 및 다운로드 트리거
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const nowStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `단속기록_${nowStr}_${filteredSnapshots.length}건.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
        v.x += Math.max(2.2, v.speed / 11);

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
        ctx.roundRect(v.x, v.y - 14, 60, 28, 6);
        ctx.fill();

        // Windshield & Roof
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(v.x + 18, v.y - 11, 24, 22);

        // Vehicle Plate Graphic
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(v.x + 8, v.y - 5, 44, 11);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8px sans-serif';
        const plateParts = v.plate.split(' ');
        const plateText = plateParts[1] ? `${plateParts[0].slice(-2)}${plateParts[1]}` : v.plate;
        ctx.fillText(plateText, v.x + 10, v.y + 3);

        // Headlights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(v.x + 56, v.y - 12, 3, 5);
        ctx.fillRect(v.x + 56, v.y + 7, 3, 5);

        // Bounding Box
        ctx.strokeStyle = v.isOverspeed ? '#ef4444' : '#10b981';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(v.x - 3, v.y - 18, 66, 36);

        // Dynamic Speed Tag above vehicle
        ctx.fillStyle = v.isOverspeed ? '#ef4444' : '#10b981';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`${Math.round(v.speed)} km/h`, v.x + 6, v.y - 22);

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

  // 차량 생성 함수 (랜덤 속도 생성 로직 적용)
  const spawnVehicle = (type: 'normal' | 'overspeed' | 'random') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { speed, isOverspeed, severity } = generateRandomVehicleSpeed(type, speedLimit);
    const plate = generatePlateNumber();
    
    // 차종/과속에 따른 색상 랜덤 배정
    const overspeedColors = ['#ef4444', '#dc2626', '#b91c1c', '#ea580c', '#e11d48'];
    const normalColors = ['#10b981', '#059669', '#3b82f6', '#6366f1', '#475569'];
    const carColor = isOverspeed
      ? overspeedColors[Math.floor(Math.random() * overspeedColors.length)]
      : normalColors[Math.floor(Math.random() * normalColors.length)];

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const newVehicle: Vehicle = {
      id: Date.now() + Math.random(),
      x: -85,
      y: canvas.height * 0.48,
      speed,
      isOverspeed,
      plate,
      color: carColor,
      triggered: false,
    };

    vehiclesRef.current.push(newVehicle);

    setLastSpawned({
      plate,
      speed,
      isOverspeed,
      time: timeStr,
      severity,
    });

    setSimulationStats((prev) => ({
      totalSpawned: prev.totalSpawned + 1,
      overspeedSpawned: prev.overspeedSpawned + (isOverspeed ? 1 : 0),
    }));
  };

  // '시뮬레이션 시작' 자동 루프 타이머
  useEffect(() => {
    if (!isSimulating) return;

    // 시뮬레이션 시작 즉시 첫 번째 차량 발생
    spawnVehicle(simMode === 'overspeed_only' ? 'overspeed' : 'random');

    const interval = setInterval(() => {
      spawnVehicle(simMode === 'overspeed_only' ? 'overspeed' : 'random');
    }, simIntervalMs);

    return () => clearInterval(interval);
  }, [isSimulating, simIntervalMs, simMode, speedLimit]);

  const handleManualTest = () => {
    const { speed, severity } = generateRandomVehicleSpeed('overspeed', speedLimit);
    const plate = generatePlateNumber();
    const dummy: Partial<Vehicle> = {
      id: Date.now(),
      speed,
      isOverspeed: true,
      plate,
    };
    onTriggerShutter(dummy);
    setSdStatus('saving');
    setTimeout(() => {
      setSdStatus('idle');
    }, 1500);

    const now = new Date();
    setLastSpawned({
      plate,
      speed,
      isOverspeed: true,
      time: now.toTimeString().split(' ')[0],
      severity,
    });
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

        {/* Live Road Track Canvas & Simulation Controls */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Video className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-200">
                실시간 도로 레이더 감지 & 셔터 카메라 캡처 트랙
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">
                단속 기준: <strong className="text-amber-400 font-mono">{speedLimit} KM/H</strong>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">
                시뮬레이션 발생: <strong className="text-white font-mono">{simulationStats.totalSpawned}대</strong> (과속 <strong className="text-red-400 font-mono">{simulationStats.overspeedSpawned}건</strong>)
              </span>
            </div>
          </div>

          {/* Canvas Frame */}
          <div className="relative w-full h-56 bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
            <canvas ref={canvasRef} id="roadCanvas" className="w-full h-full block" />

            <div className="absolute left-1/3 top-0 bottom-0 border-l-2 border-dashed border-amber-500/60 pointer-events-none flex items-center">
              <span className="text-[10px] bg-amber-950/90 text-amber-300 px-1 py-0.5 rounded rotate-90 -ml-3">
                HLK-LD2451 감지 (최대 100m)
              </span>
            </div>
            <div className="absolute left-2/3 top-0 bottom-0 border-l-2 border-solid border-red-500/80 pointer-events-none flex items-center">
              <span className="text-[10px] bg-red-950/90 text-red-300 px-1 py-0.5 rounded rotate-90 -ml-3">
                카메라 SD/서버 전송
              </span>
            </div>

            {/* Simulation Status Watermark Indicator */}
            {isSimulating && (
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 bg-red-950/80 border border-red-800/80 rounded-lg text-[10px] text-red-300 font-semibold animate-pulse pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>가상 트래픽 시뮬레이션 동작 중 ({simIntervalMs / 1000}s 주기)</span>
              </div>
            )}
          </div>

          {/* Realtime Telemetry Strip (최근 발생 차량 실시간 알림 바) */}
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <Gauge className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-slate-400">최근 생성 차량:</span>
              {lastSpawned ? (
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-white font-mono px-2 py-0.5 rounded border border-slate-700 font-bold">
                    {lastSpawned.plate}
                  </span>
                  <span
                    className={`font-mono font-black ${
                      lastSpawned.isOverspeed ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {lastSpawned.speed} KM/H
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      lastSpawned.isOverspeed
                        ? 'bg-red-950/90 text-red-300 border border-red-800'
                        : 'bg-emerald-950/90 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {lastSpawned.isOverspeed
                      ? `과속 단속 대상 (+${lastSpawned.speed - speedLimit}km/h)`
                      : '정상 주행 (단속 제외)'}
                  </span>
                </div>
              ) : (
                <span className="text-slate-500 italic">아직 생성된 차량이 없습니다. 아래 버튼을 눌러보세요.</span>
              )}
            </div>

            {lastSpawned && (
              <span className="text-[10px] text-slate-500 font-mono sm:text-right">
                기록 시각: {lastSpawned.time}
              </span>
            )}
          </div>

          {/* Simulation Controls: Primary Start/Stop & Random Buttons */}
          <div className="space-y-2">
            {/* Top Row: Primary '시뮬레이션 시작' Button & Settings */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              {/* Main Simulation Start/Stop Button */}
              <button
                id="startSimulationBtn"
                onClick={() => setIsSimulating((prev) => !prev)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer ${
                  isSimulating
                    ? 'bg-red-600 hover:bg-red-500 text-white ring-2 ring-red-400/40'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white ring-1 ring-emerald-400/30'
                }`}
              >
                {isSimulating ? (
                  <>
                    <Square className="w-4 h-4 fill-white" />
                    <span>시뮬레이션 중지</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>시뮬레이션 시작 (랜덤 과속 차량 자동 발생)</span>
                  </>
                )}
              </button>

              {/* Simulation Mode & Interval Options */}
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center space-x-1 pl-1 text-slate-400 text-[11px]">
                  <Sliders className="w-3 h-3 text-slate-400" />
                  <span>주기:</span>
                </div>
                <select
                  value={simIntervalMs}
                  onChange={(e) => setSimIntervalMs(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value={1500}>빠름 (1.5초)</option>
                  <option value={2400}>보통 (2.4초)</option>
                  <option value={4000}>여유 (4.0초)</option>
                </select>

                <select
                  value={simMode}
                  onChange={(e) => setSimMode(e.target.value as 'mixed' | 'overspeed_only')}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="mixed">혼합 (과속 65%)</option>
                  <option value="overspeed_only">과속 전용 (100%)</option>
                </select>
              </div>
            </div>

            {/* Bottom Row: Instant Manual Spawn Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => spawnVehicle('overspeed')}
                className="bg-red-700/80 hover:bg-red-600 text-white font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 border border-red-600/50 shadow-sm transition cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>과속 차량 즉시 생성 (랜덤 33~85km/h)</span>
              </button>

              <button
                onClick={() => spawnVehicle('normal')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 border border-slate-700 transition cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>정상 차량 생성 (랜덤 15~29km/h)</span>
              </button>

              <button
                onClick={handleManualTest}
                className="col-span-2 sm:col-span-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition cursor-pointer"
              >
                <Aperture className="w-3.5 h-3.5" />
                <span>강제 스냅샷 (ALPR 즉시 캡처)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Captured Snapshots Gallery with Date & Speed Filtering */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
        {/* Header and Quick Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
              <HardDrive className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span>과속 단속 촬영 기록 보관함 (SD / 엣지 서버)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-semibold border border-slate-700">
                  {filteredSnapshots.length}건 / 총 {recentSnapshots.length}건
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                과속 기준 {speedLimit}km/h 초과 차량 번호판 및 글로벌 셔터 스냅샷 기록 (클릭 시 ALPR 상세 증거 팝업)
              </p>
            </div>
          </div>

          {/* Action Buttons: CSV Download & Reset Filters */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* CSV Download Button */}
            <button
              id="downloadCsvBtn"
              onClick={handleDownloadCsv}
              disabled={filteredSnapshots.length === 0}
              className={`text-xs font-semibold flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition cursor-pointer shadow-xs ${
                filteredSnapshots.length === 0
                  ? 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/50 shadow-emerald-950/40 hover:shadow'
              }`}
              title="현재 필터링된 단속 기록을 CSV(Excel 호환) 파일로 다운로드합니다"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV 다운로드 ({filteredSnapshots.length}건)</span>
            </button>

            {/* Reset Filters Button */}
            {(selectedDateFilter !== 'all' || selectedSpeedRange !== 'all' || searchPlateQuery.trim() !== '' || onlyWithMemo) && (
              <button
                onClick={() => {
                  setSelectedDateFilter('all');
                  setSelectedSpeedRange('all');
                  setSearchPlateQuery('');
                  setOnlyWithMemo(false);
                }}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>필터 초기화</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Toolbar: Date Filter, Speed Range Filter, Plate Search, Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {/* 1. 날짜별 필터 */}
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] text-slate-400 flex items-center space-x-1 font-medium">
              <Calendar className="w-3 h-3 text-blue-400" />
              <span>날짜별 조회:</span>
            </label>
            <div className="relative">
              <select
                id="filterDateSelect"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 appearance-none font-sans"
              >
                <option value="all">전체 날짜 (모든 일자)</option>
                <option value="today">오늘 (Today)</option>
                {uniqueDates.map((dateStr) => (
                  <option key={dateStr} value={dateStr}>
                    {dateStr}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 2. 속도 구간별 필터 */}
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] text-slate-400 flex items-center space-x-1 font-medium">
              <Gauge className="w-3 h-3 text-red-400" />
              <span>속도 구간별 필터:</span>
            </label>
            <div className="relative">
              <select
                id="filterSpeedSelect"
                value={selectedSpeedRange}
                onChange={(e) => setSelectedSpeedRange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 appearance-none"
              >
                <option value="all">전체 속도 구간</option>
                <option value="31-40">31 ~ 40 km/h (경미 과속)</option>
                <option value="41-50">41 ~ 50 km/h (중등 과속)</option>
                <option value="51-60">51 ~ 60 km/h (중대 과속)</option>
                <option value="61+">61 km/h 이상 (초과속 위험)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 3. 번호판 및 관리자 메모 검색 */}
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] text-slate-400 flex items-center space-x-1 font-medium">
              <Search className="w-3 h-3 text-amber-400" />
              <span>번호판 또는 메모 검색:</span>
            </label>
            <div className="relative">
              <input
                id="searchPlateInput"
                type="text"
                value={searchPlateQuery}
                onChange={(e) => setSearchPlateQuery(e.target.value)}
                placeholder="예: 서울, 8291, 계도장, 경찰서..."
                className="w-full bg-slate-950 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 placeholder-slate-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 4. 정렬 방식 */}
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] text-slate-400 flex items-center space-x-1 font-medium">
              <ArrowUpDown className="w-3 h-3 text-emerald-400" />
              <span>정렬 기준:</span>
            </label>
            <div className="relative">
              <select
                id="sortOrderSelect"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'latest' | 'speed_desc' | 'speed_asc')}
                className="w-full bg-slate-950 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 appearance-none"
              >
                <option value="latest">최신 촬영순 (시간순)</option>
                <option value="speed_desc">최고 속도순 (내림차순)</option>
                <option value="speed_asc">최저 속도순 (오름차순)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Speed Range Pills and Admin Memo Toggle */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500" />
            빠른 필터:
          </span>
          {[
            { id: 'all', label: '전체' },
            { id: '31-40', label: '31~40km/h' },
            { id: '41-50', label: '41~50km/h' },
            { id: '51-60', label: '51~60km/h' },
            { id: '61+', label: '61km/h+ (초과속)' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedSpeedRange(pill.id)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer font-medium ${
                selectedSpeedRange === pill.id
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}

          {/* Admin Memo Filter Button */}
          <button
            onClick={() => setOnlyWithMemo((prev) => !prev)}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer font-medium flex items-center gap-1 ml-auto sm:ml-2 ${
              onlyWithMemo
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-amber-400'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>메모 작성 건만 보기 ({totalMemoCount}건)</span>
          </button>
        </div>

        {/* Snapshots Grid / Scroll Display */}
        <div
          id="recentSnapshotsList"
          className="flex space-x-3 overflow-x-auto pb-2 pt-1 min-h-[110px] items-center text-xs text-slate-500"
        >
          {filteredSnapshots.length === 0 ? (
            <div className="w-full text-center py-6 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">일치하는 단속 기록이 없습니다.</p>
              <p className="text-[11px] text-slate-500">
                선택한 날짜({selectedDateFilter}) 또는 속도 구간({selectedSpeedRange}) 조건에 해당하는 차량이 없습니다.
              </p>
            </div>
          ) : (
            filteredSnapshots.map((item) => {
              const overDelta = item.speed - speedLimit;
              const isSevere = item.speed >= 55;

              return (
                <div
                  key={item.id}
                  onClick={() => onOpenSnapshotModal(item)}
                  className={`flex-shrink-0 bg-slate-950 border p-2.5 rounded-xl cursor-pointer transition w-52 space-y-2 text-slate-300 shadow-sm ${
                    isSevere
                      ? 'border-red-900/60 hover:border-red-500 hover:bg-slate-900'
                      : 'border-slate-800 hover:border-amber-500 hover:bg-slate-900'
                  }`}
                >
                  {/* Plate Preview Box */}
                  <div className="h-16 bg-slate-900/90 rounded-lg flex flex-col items-center justify-center border border-slate-800/80 p-1 relative overflow-hidden">
                    <span className="text-xs font-black bg-white text-slate-950 px-2 py-0.5 rounded border border-slate-300 font-mono tracking-tight shadow-xs">
                      {item.plate}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-bold mt-1.5 flex items-center gap-1 ${
                        isSevere ? 'text-red-400 font-black' : 'text-amber-400'
                      }`}
                    >
                      <span>{item.speed} km/h</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-red-950/80 text-red-300 border border-red-800/80">
                        +{overDelta}
                      </span>
                    </span>

                    {isSevere && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className="space-y-0.5 text-[10px] text-slate-400 px-0.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-mono">{item.date || '2026-09-14'}</span>
                      <span className="font-mono text-slate-300 font-medium">{item.time}</span>
                    </div>
                    <div className="flex justify-between items-center pt-0.5 border-t border-slate-800/70">
                      <span className="text-amber-400 font-medium flex items-center gap-0.5">
                        <HardDrive className="w-2.5 h-2.5 text-amber-400" />
                        <span>SD Saved</span>
                      </span>
                      <span className="text-slate-500">ALPR 100%</span>
                    </div>
                  </div>

                  {/* Admin Memo Display on Card */}
                  <div className="pt-1 border-t border-slate-800/60">
                    {item.memo ? (
                      <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-1.5 text-[10px] text-amber-200/90 flex items-start gap-1 shadow-xs">
                        <FileText className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-tight break-all font-sans">
                          {item.memo}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 hover:text-amber-400 flex items-center gap-1 px-1 py-0.5 rounded transition">
                        <Edit3 className="w-2.5 h-2.5 text-slate-500" />
                        <span>+ 관리자 메모 작성</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
