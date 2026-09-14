import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  Activity,
  ShieldAlert,
  Radio,
  MapPin,
  Send,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Car,
  FileText,
  Layers,
  Code2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Wifi,
  HardDrive,
  Copy,
  Check,
  Play,
  Square,
  Smartphone,
  RotateCcw,
} from 'lucide-react';
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
} from 'recharts';
import { SnapshotRecord, Vehicle } from '../types';

interface CentralServerTabProps {
  recentSnapshots: SnapshotRecord[];
  speedLimit: number;
  onOpenSnapshotModal: (record: SnapshotRecord) => void;
  onNavigateTab?: (tab: 'monitor' | 'smartphone' | 'server' | string) => void;
  isSimulating?: boolean;
  onToggleSimulating?: () => void;
  onTriggerShutter?: (vehicle: Partial<Vehicle>) => void;
  autoTabSwitchTarget?: 'smartphone' | 'server' | 'alternate' | 'off';
  onChangeAutoTabSwitchTarget?: (target: 'smartphone' | 'server' | 'alternate' | 'off') => void;
}

interface EnforcementNode {
  id: string;
  name: string;
  location: string;
  ip: string;
  status: 'online' | 'warning' | 'offline';
  todayPassCount: number;
  todayOverspeedCount: number;
  lastPing: string;
  speedLimit: number;
  radarModel: string;
  cameraModel: string;
}

interface HourlyTrafficStat {
  hour: string; // '07시', '08시' ...
  totalTraffic: number;
  overspeedCount: number;
  severeCount: number;
  avgSpeed: number;
}

export const CentralServerTab: React.FC<CentralServerTabProps> = ({
  recentSnapshots,
  speedLimit,
  onOpenSnapshotModal,
  onNavigateTab,
  isSimulating = false,
  onToggleSimulating,
  onTriggerShutter,
  autoTabSwitchTarget = 'server',
  onChangeAutoTabSwitchTarget,
}) => {
  // Active Sub-view inside Server Tab
  const [activeServerView, setActiveServerView] = useState<'feed' | 'map' | 'analytics' | 'api'>('feed');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [searchPlate, setSearchPlate] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'severe' | 'pending'>('all');
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  // Administrative Dispatch State (State tracking sent e-notices)
  const [dispatchedIds, setDispatchedIds] = useState<Record<number, { status: string; sentAt: string }>>({
    1726040800000: { status: '발송완료(카카오알림톡)', sentAt: '17:48:10' },
    1725945600000: { status: '경찰청이파인이첩완료', sentAt: '15:10:00' },
  });
  const [lastDispatchedToast, setLastDispatchedToast] = useState<string | null>(null);

  // Managed Schoolzone Nodes in Metropolitan Traffic Grid
  const enforcementNodes: EnforcementNode[] = [
    {
      id: 'SZ-01',
      name: '서울 상암초 스쿨존 (현장 연동 노드)',
      location: '서울특별시 마포구 월드컵북로 400',
      ip: '10.240.12.101 (LTE-Cat.M1)',
      status: 'online',
      todayPassCount: 1240,
      todayOverspeedCount: recentSnapshots.filter((s) => s.isOverspeed).length,
      lastPing: '방금 전 (12ms)',
      speedLimit: speedLimit,
      radarModel: 'HLK-LD2451 24GHz',
      cameraModel: 'IMX296 Global Shutter',
    },
    {
      id: 'SZ-02',
      name: '서울 역삼초 어린이보호구역',
      location: '서울특별시 강남구 역삼로 215',
      ip: '10.240.12.102 (5G VPN)',
      status: 'online',
      todayPassCount: 1890,
      todayOverspeedCount: 14,
      lastPing: '3초 전 (19ms)',
      speedLimit: 30,
      radarModel: 'HLK-LD2451 24GHz',
      cameraModel: 'IMX296 Global Shutter',
    },
    {
      id: 'SZ-03',
      name: '경기 판교 운중초 스쿨존',
      location: '경기도 성남시 분당구 운중로 142',
      ip: '10.240.12.103 (광랜 직결)',
      status: 'online',
      todayPassCount: 1420,
      todayOverspeedCount: 9,
      lastPing: '1초 전 (8ms)',
      speedLimit: 30,
      radarModel: '옴니레이더 24GHz FMCW',
      cameraModel: 'Sony Pregius S 셔터',
    },
    {
      id: 'SZ-04',
      name: '대전 대덕초 연구단지 스쿨존',
      location: '대전광역시 유성구 대덕대로 580',
      ip: '10.240.12.104 (LTE-Cat.M1)',
      status: 'online',
      todayPassCount: 980,
      todayOverspeedCount: 6,
      lastPing: '4초 전 (22ms)',
      speedLimit: 30,
      radarModel: 'HLK-LD2451 24GHz',
      cameraModel: 'IMX296 Global Shutter',
    },
  ];

  // Hourly Traffic Analysis Data (8 AM to 7 PM - Schoolzone Enforcement Hours)
  const hourlyStats: HourlyTrafficStat[] = [
    { hour: '07시', totalTraffic: 140, overspeedCount: 3, severeCount: 1, avgSpeed: 38.2 },
    { hour: '08시 (등교피크)', totalTraffic: 390, overspeedCount: 11, severeCount: 3, avgSpeed: 44.5 },
    { hour: '09시', totalTraffic: 280, overspeedCount: 6, severeCount: 1, avgSpeed: 39.8 },
    { hour: '10시', totalTraffic: 190, overspeedCount: 4, severeCount: 0, avgSpeed: 37.1 },
    { hour: '11시', totalTraffic: 210, overspeedCount: 5, severeCount: 1, avgSpeed: 38.9 },
    { hour: '12시 (점심)', totalTraffic: 260, overspeedCount: 7, severeCount: 2, avgSpeed: 42.0 },
    { hour: '13시 (저학년하교)', totalTraffic: 310, overspeedCount: 8, severeCount: 2, avgSpeed: 41.5 },
    { hour: '14시 (본격하교)', totalTraffic: 380, overspeedCount: 13, severeCount: 4, avgSpeed: 45.2 },
    { hour: '15시 (학원차량)', totalTraffic: 350, overspeedCount: 10, severeCount: 3, avgSpeed: 43.8 },
    { hour: '16시', totalTraffic: 290, overspeedCount: 7, severeCount: 1, avgSpeed: 40.2 },
    { hour: '17시', totalTraffic: 330, overspeedCount: 9, severeCount: 2, avgSpeed: 42.6 },
    { hour: '18시 (퇴근피크)', totalTraffic: 420, overspeedCount: 15, severeCount: 5, avgSpeed: 47.1 },
    { hour: '19시', totalTraffic: 270, overspeedCount: 8, severeCount: 2, avgSpeed: 41.0 },
  ];

  // Dispatch Administrative Notice
  const handleDispatchNotice = (snap: SnapshotRecord, channel: 'kakao' | 'efine') => {
    const label = channel === 'kakao' ? '발송완료(카카오 모바일고지서)' : '경찰청 이파인(efine) 등록완료';
    const now = new Date().toLocaleTimeString('ko-KR', { hour12: false });

    setDispatchedIds((prev) => ({
      ...prev,
      [snap.id]: { status: label, sentAt: now },
    }));

    setLastDispatchedToast(`[${snap.plate}] 차량에 ${label} 처리가 완료되었습니다.`);
    setTimeout(() => {
      setLastDispatchedToast(null);
    }, 4000);
  };

  // Sample Edge MQTT / HTTP Ingestion JSON Schema
  const sampleIngestionJson = JSON.stringify(
    {
      event_id: 'EVT-20260914-SZ01-08429',
      zone_id: 'SZ-01',
      zone_name: '서울 상암초 스쿨존',
      speed_limit_kmh: speedLimit,
      vehicle: {
        detected_speed_kmh: recentSnapshots[0]?.speed || 48,
        over_speed_kmh: (recentSnapshots[0]?.speed || 48) - speedLimit,
        plate_number: recentSnapshots[0]?.plate || '서울34가 8921',
        alpr_confidence: 0.9942,
        vehicle_color: 'WHITE',
        timestamp: '2026-09-14T14:15:32.410+09:00',
      },
      hardware_meta: {
        radar_frequency_ghz: 24.15,
        shutter_speed_us: 250,
        optocoupler_pulse_ms: 50,
        battery_voltage_v: 12.8,
        signal_rssi_dbm: -62,
      },
      artifacts: {
        raw_image_url: 'https://cdn.traffic-sz.go.kr/snapshots/20260914/SZ01_08429_full.jpg',
        plate_crop_url: 'https://cdn.traffic-sz.go.kr/snapshots/20260914/SZ01_08429_crop.jpg',
        image_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
    },
    null,
    2
  );

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(sampleIngestionJson);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2500);
  };

  // Filtered snapshot records
  const filteredSnapshots = recentSnapshots.filter((snap) => {
    if (!snap.isOverspeed) return false;
    if (filterSeverity === 'severe' && snap.speed < speedLimit + 20) return false;
    if (filterSeverity === 'pending' && dispatchedIds[snap.id]) return false;
    if (searchPlate.trim()) {
      const q = searchPlate.trim().toLowerCase().replace(/\s+/g, '');
      const matchPlate = snap.plate.toLowerCase().replace(/\s+/g, '').includes(q);
      const matchMemo = (snap.memo || '').toLowerCase().includes(q);
      if (!matchPlate && !matchMemo) return false;
    }
    return true;
  });

  // Aggregates for Server Dashboard
  const totalSnapshots = recentSnapshots.filter((s) => s.isOverspeed).length;
  const severeCount = recentSnapshots.filter((s) => s.isOverspeed && s.speed >= speedLimit + 20).length;
  const totalDispatchedCount = Object.keys(dispatchedIds).length;

  return (
    <section id="tab-central-server-monitoring" className="space-y-4">
      {/* 1. Header Banner & Infrastructure Health Bar */}
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>스마트 스쿨존 중앙 통합 관제 서버 (Central Traffic Control Web System)</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-mono font-semibold">
                클라우드 / 온프레미스 관제센터 v3.8
              </span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
            분산 설치된 현장 엣지 단말기(ESP32 / 라즈베리파이 셔터 카메라)에서 무선(LTE/5G/광랜)으로 수신된 과속 데이터를 집계하여
            <strong> 실시간 ALPR 번호판 검증, 지도상 다중 사이트 관제, 경찰청(이파인) 및 모바일 전자고지서 자동 발송</strong>을 총괄 제어합니다.
          </p>
        </div>

        {/* Server Node Status Indicator */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs self-stretch md:self-auto justify-between">
          <div className="flex items-center gap-1.5 px-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">중앙 수집 큐 정상 (0 pending)</span>
          </div>
          <div className="h-4 w-px bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>처리 지연: <strong className="text-cyan-400">18ms</strong></span>
            <span>DB: <strong className="text-emerald-400">TimescaleDB</strong></span>
            <span>관제노드: <strong className="text-amber-400">4 / 4 가동 중</strong></span>
          </div>
        </div>
      </div>

      {/* 시뮬레이터 연동 및 자동 탭 전환 제어 툴바 */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">현장 셔터 카메라 시뮬레이터 연동:</span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                  isSimulating
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isSimulating ? '시뮬레이션 동작 중 (과속 차량 자동 수집)' : '시뮬레이션 대기 중'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {autoTabSwitchTarget === 'server'
                ? '현재 [관제 서버 탭 우선 자동 전환] 모드입니다. 단속 시 즉시 이 관제 웹 화면으로 전환되어 최신 로그가 갱신됩니다.'
                : autoTabSwitchTarget === 'smartphone'
                ? '현재 [스마트폰 과속 모니터링 탭 자동 전환] 모드입니다.'
                : autoTabSwitchTarget === 'alternate'
                ? '현재 [스마트폰 ↔ 관제서버 교대 전환] 모드입니다.'
                : '현재 자동 화면 전환이 꺼져 있습니다.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
          {onToggleSimulating && (
            <button
              onClick={onToggleSimulating}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                isSimulating
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isSimulating ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>시뮬레이션 중지</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>시뮬레이션 시작</span>
                </>
              )}
            </button>
          )}

          {onNavigateTab && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => onNavigateTab('monitor')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                title="1. 시뮬레이터 화면으로 이동"
              >
                <RotateCcw className="w-3 h-3" />
                <span>시뮬레이터 가기</span>
              </button>
              <button
                onClick={() => onNavigateTab('smartphone')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-lg transition text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                title="2. 스마트폰 과속 모니터링 화면으로 이동"
              >
                <Smartphone className="w-3 h-3" />
                <span>스마트폰 가기</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Strip (Centralized Intelligence) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>오늘 수집된 과속 적발</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-digital text-red-400 mt-1">
            {totalSnapshots} <span className="text-xs font-sans text-slate-400 font-normal">건</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>4개 스쿨존 관제소 합산</span>
            <span className="text-emerald-400">정상 적재 100%</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>ALPR 번호판 AI 인식률</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-digital text-cyan-400 mt-1">
            99.4 <span className="text-xs font-sans text-slate-400 font-normal">%</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            YOLOv8 + PaddleOCR 딥러닝 파이프라인
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>고위험 심각 과속 (+20km)</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-digital text-purple-400 mt-1">
            {severeCount} <span className="text-xs font-sans text-slate-400 font-normal">건</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            과태료 12만원 부과 대상 즉시 분류
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>전자고지서 행정 발송</span>
            <Send className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-digital text-emerald-400 mt-1">
            {totalDispatchedCount} <span className="text-xs font-sans text-slate-400 font-normal">건</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            모바일 알림톡 & 이파인 즉시 연계
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs inside Central Server */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-2 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setActiveServerView('feed')}
            className={`px-3 py-2 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeServerView === 'feed'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>실시간 단속 수집 피드 ({filteredSnapshots.length})</span>
          </button>
          <button
            onClick={() => setActiveServerView('map')}
            className={`px-3 py-2 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeServerView === 'map'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>스쿨존 노드 통합 GIS 지도</span>
          </button>
          <button
            onClick={() => setActiveServerView('analytics')}
            className={`px-3 py-2 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeServerView === 'analytics'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>시간대별 교통 빅데이터 분석</span>
          </button>
          <button
            onClick={() => setActiveServerView('api')}
            className={`px-3 py-2 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeServerView === 'api'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>서버 인프라 & API 명세</span>
          </button>
        </div>

        {/* Site Filter Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 hidden sm:inline">관제 구역:</span>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">전체 스쿨존 통합 관제 (4개소)</option>
            <option value="SZ-01">SZ-01 서울 상암초 (현장 연동)</option>
            <option value="SZ-02">SZ-02 서울 역삼초</option>
            <option value="SZ-03">SZ-03 경기 판교운중초</option>
            <option value="SZ-04">SZ-04 대전 대덕초</option>
          </select>
        </div>
      </div>

      {/* Toast Alert for Admin Action */}
      {lastDispatchedToast && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 rounded-xl text-xs text-emerald-200 flex items-center justify-between shadow-xl animate-in fade-in">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {lastDispatchedToast}
          </span>
          <button
            onClick={() => setLastDispatchedToast(null)}
            className="text-slate-400 hover:text-white text-xs px-1"
          >
            닫기
          </button>
        </div>
      )}

      {/* VIEW 1: Live Ingestion Feed & Administrative Enforcement */}
      {activeServerView === 'feed' && (
        <div className="space-y-3">
          {/* Search & Filter Toolbar */}
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 text-xs">
            <div className="relative flex-grow max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="차량번호 또는 관리자 메모 검색..."
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1.5 justify-end">
              <button
                onClick={() => setFilterSeverity('all')}
                className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  filterSeverity === 'all'
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setFilterSeverity('severe')}
                className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  filterSeverity === 'severe'
                    ? 'bg-purple-600 text-white font-bold border-purple-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                심각과속 (+20km)
              </button>
              <button
                onClick={() => setFilterSeverity('pending')}
                className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  filterSeverity === 'pending'
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                고지서 미발송 대기
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">수신 시각 / 관제 구역</th>
                    <th className="p-3">차량 번호판 (ALPR)</th>
                    <th className="p-3">단속 속도 / 초과치</th>
                    <th className="p-3">OCR 신뢰도</th>
                    <th className="p-3">행정 처리 상태</th>
                    <th className="p-3 text-right">관제 조치 (전자고지서)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredSnapshots.length > 0 ? (
                    filteredSnapshots.map((snap) => {
                      const isSevere = snap.speed >= speedLimit + 20;
                      const dispatchInfo = dispatchedIds[snap.id];

                      return (
                        <tr key={snap.id} className="hover:bg-slate-850/60 transition">
                          {/* 1. Time & Zone */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="font-mono text-slate-200 font-bold">{snap.time}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-cyan-400" />
                              <span>{snap.date || '2026-09-14'} • 서울 상암초 (SZ-01)</span>
                            </div>
                          </td>

                          {/* 2. Plate */}
                          <td className="p-3 whitespace-nowrap">
                            <div
                              onClick={() => onOpenSnapshotModal(snap)}
                              className="inline-flex items-center gap-1.5 font-mono font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700 hover:border-cyan-400 cursor-pointer text-slate-100 group transition"
                              title="단속 고해상도 사진 및 차량 메모 열기"
                            >
                              <Car className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition" />
                              <span>{snap.plate}</span>
                            </div>
                            {snap.memo && (
                              <div className="text-[10px] text-amber-300 truncate max-w-[200px] mt-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                <span>{snap.memo}</span>
                              </div>
                            )}
                          </td>

                          {/* 3. Speed */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-baseline gap-1.5">
                              <span
                                className={`text-base font-digital font-bold ${
                                  isSevere ? 'text-purple-400' : 'text-red-400'
                                }`}
                              >
                                {snap.speed} km/h
                              </span>
                              <span className="text-[11px] text-amber-400 font-mono">
                                (+{snap.speed - speedLimit})
                              </span>
                            </div>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                isSevere
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}
                            >
                              {isSevere ? '고위험 과태료(12만)' : '일반 과속(6만)'}
                            </span>
                          </td>

                          {/* 4. OCR Confidence */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-slate-200 font-mono font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>99.4%</span>
                            </div>
                            <div className="text-[10px] text-slate-500">셔터 왜곡 0% 무결성</div>
                          </td>

                          {/* 5. Dispatch Status */}
                          <td className="p-3 whitespace-nowrap">
                            {dispatchInfo ? (
                              <div>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] flex items-center gap-1 w-fit">
                                  <Check className="w-3 h-3" />
                                  {dispatchInfo.status}
                                </span>
                                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                  발송시각: {dispatchInfo.sentAt}
                                </div>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold text-[11px] flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3" />
                                발송 대기 중
                              </span>
                            )}
                          </td>

                          {/* 6. Admin Actions */}
                          <td className="p-3 whitespace-nowrap text-right space-x-1.5">
                            <button
                              onClick={() => handleDispatchNotice(snap, 'kakao')}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer active:scale-95"
                              title="과태료 모바일 전자고지서(알림톡) 즉시 발송"
                            >
                              모바일 고지
                            </button>
                            <button
                              onClick={() => handleDispatchNotice(snap, 'efine')}
                              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs transition cursor-pointer active:scale-95"
                              title="경찰청 이파인(efine) 연계 전송"
                            >
                              경찰청 이첩
                            </button>
                            <button
                              onClick={() => onOpenSnapshotModal(snap)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition cursor-pointer"
                              title="고해상도 사진 및 메모 보기"
                            >
                              증거 사진
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                        검색 조건에 부합하는 과속 단속 수신 기록이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Multi-Node GIS Map Simulation */}
      {activeServerView === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: GIS Map Visual Stage (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" />
                수도권 및 광역 스쿨존 단속 관제망 실시간 GIS 토폴로지
              </span>
              <span className="text-[11px] text-emerald-400 font-mono">ALL NODES ONLINE</span>
            </div>

            {/* Simulated Map Canvas */}
            <div className="relative w-full h-[380px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-4">
              {/* Grid Lines for Map Illusion */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage:
                    'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, #030712 1px)',
                  backgroundSize: '30px 30px',
                  backgroundPosition: '0 0, 15px 15px',
                }}
              />

              {/* Road Network Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-800/80" strokeWidth="2">
                <line x1="20%" y1="30%" x2="50%" y2="50%" strokeDasharray="4 4" />
                <line x1="50%" y1="50%" x2="75%" y2="70%" strokeDasharray="4 4" />
                <line x1="50%" y1="50%" x2="35%" y2="80%" strokeDasharray="4 4" />
              </svg>

              {/* Node Marker 1: 상암초 (Active) */}
              <div
                onClick={() => setSelectedSiteId('SZ-01')}
                className="absolute top-[28%] left-[20%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              >
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-8 h-8 rounded-full bg-red-500/30 animate-ping" />
                  <span className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-lg z-10" />
                </div>
                <div className="mt-1 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded-lg text-[10px] text-white shadow-lg whitespace-nowrap font-semibold group-hover:border-cyan-400 transition">
                  SZ-01 서울 상암초 ({recentSnapshots.filter((s) => s.isOverspeed).length}건 적발)
                </div>
              </div>

              {/* Node Marker 2: 역삼초 */}
              <div
                onClick={() => setSelectedSiteId('SZ-02')}
                className="absolute top-[48%] left-[50%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              >
                <div className="relative flex items-center justify-center">
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-900 shadow-lg z-10" />
                </div>
                <div className="mt-1 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded-lg text-[10px] text-white shadow-lg whitespace-nowrap font-semibold group-hover:border-cyan-400 transition">
                  SZ-02 서울 역삼초 (14건)
                </div>
              </div>

              {/* Node Marker 3: 판교 운중초 */}
              <div
                onClick={() => setSelectedSiteId('SZ-03')}
                className="absolute top-[70%] left-[75%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              >
                <div className="relative flex items-center justify-center">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 shadow-lg z-10" />
                </div>
                <div className="mt-1 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded-lg text-[10px] text-white shadow-lg whitespace-nowrap font-semibold group-hover:border-cyan-400 transition">
                  SZ-03 경기 판교운중초 (9건)
                </div>
              </div>

              {/* Node Marker 4: 대전 대덕초 */}
              <div
                onClick={() => setSelectedSiteId('SZ-04')}
                className="absolute top-[80%] left-[35%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              >
                <div className="relative flex items-center justify-center">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 shadow-lg z-10" />
                </div>
                <div className="mt-1 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded-lg text-[10px] text-white shadow-lg whitespace-nowrap font-semibold group-hover:border-cyan-400 transition">
                  SZ-04 대전 대덕초 (6건)
                </div>
              </div>

              {/* Map Overlay Footer */}
              <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center text-[10px] text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> 과속 다발
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> 주의
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> 원활
                  </span>
                </span>
                <span>클릭하여 해당 관제소 세부 진단 열기</span>
              </div>
            </div>
          </div>

          {/* Right: Selected Node Details & CCTV Telemetry (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            {enforcementNodes.map((node) => {
              const isSelected = selectedSiteId === node.id || selectedSiteId === 'all';
              if (!isSelected && selectedSiteId !== 'all') return null;

              return (
                <div
                  key={node.id}
                  className={`p-3.5 rounded-xl border transition ${
                    selectedSiteId === node.id
                      ? 'bg-slate-900 border-cyan-500 shadow-lg ring-1 ring-cyan-500/30'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-cyan-400">
                          {node.id}
                        </span>
                        <h4 className="text-xs font-bold text-white">{node.name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{node.location}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      {node.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
                    <div>
                      <span className="text-slate-500">당일 총 통행량:</span>{' '}
                      <strong className="text-slate-200">{node.todayPassCount.toLocaleString()}대</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">과속 단속 건수:</span>{' '}
                      <strong className="text-red-400">{node.todayOverspeedCount}건</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">제한속도 기준:</span>{' '}
                      <strong className="text-amber-400">{node.speedLimit} km/h</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">하트비트 핑:</span>{' '}
                      <strong className="text-cyan-400 font-mono">{node.lastPing}</strong>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-between">
                    <span>하드웨어: {node.radarModel}</span>
                    <span>카메라: {node.cameraModel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: Big Data Hourly Analytics (Recharts) */}
      {activeServerView === 'analytics' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>스쿨존 시간대별 과속 발생 빈도 및 등하교 위험도 상관 분석</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  등교 시간(08:00~09:00) 및 하교 시간(14:00~16:00) 대형 버스/학원차량 위반 집중도 모니터링
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                  최대 위험 피크: 14시~15시 하교시간
                </span>
              </div>
            </div>

            {/* Recharts Composed Chart */}
            <div className="w-full h-80 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={hourlyStats} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="serverBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient id="serverSevereGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#7e22ce" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#475569' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#475569' }}
                    tickLine={false}
                    label={{
                      value: '단속 건수 (건)',
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#64748b',
                      fontSize: 10,
                      offset: 14,
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[30, 55]}
                    tick={{ fill: '#f59e0b', fontSize: 11 }}
                    axisLine={{ stroke: '#475569' }}
                    tickLine={false}
                    label={{
                      value: '평균 위반속도 (km/h)',
                      angle: 90,
                      position: 'insideRight',
                      fill: '#f59e0b',
                      fontSize: 10,
                      offset: 14,
                    }}
                  />

                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as HourlyTrafficStat;
                        return (
                          <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                            <div className="font-bold text-slate-100 border-b border-slate-800 pb-1">{label}</div>
                            <div className="text-cyan-400 flex justify-between gap-4">
                              <span>총 과속 단속:</span>
                              <span className="font-bold font-digital">{data.overspeedCount} 건</span>
                            </div>
                            <div className="text-purple-400 flex justify-between gap-4">
                              <span>심각 과속 (+20km):</span>
                              <span className="font-bold font-digital">{data.severeCount} 건</span>
                            </div>
                            <div className="text-amber-400 flex justify-between gap-4">
                              <span>평균 적발 속도:</span>
                              <span className="font-bold font-digital">{data.avgSpeed} km/h</span>
                            </div>
                            <div className="text-slate-400 flex justify-between gap-4">
                              <span>전체 통과 교통량:</span>
                              <span className="font-bold">{data.totalTraffic} 대</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Legend verticalAlign="top" height={32} />

                  <Bar
                    yAxisId="left"
                    dataKey="overspeedCount"
                    name="일반 과속 단속 (건)"
                    fill="url(#serverBarGrad)"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="severeCount"
                    name="심각 과속 (+20km)"
                    fill="url(#serverSevereGrad)"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgSpeed"
                    name="평균 위반속도 (km/h)"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#f59e0b' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: Server Architecture & Ingestion REST API Spec */}
      {activeServerView === 'api' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: JSON Ingestion Payload Viewer (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-cyan-400" />
                현장 엣지 단말기 ➔ 중앙 서버 실시간 수신 JSON 전문 스키마
              </span>
              <button
                onClick={handleCopyPayload}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer"
              >
                {copiedPayload ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>복사 완료</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>JSON 복사</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto max-h-[380px] scrollbar-thin scrollbar-thumb-slate-700">
              <pre>{sampleIngestionJson}</pre>
            </div>
          </div>

          {/* Right: Technical Server Stack & Protocols (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 text-xs">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>중앙 서버 시스템 아키텍처 스펙</span>
              </h4>

              <div className="space-y-2 text-slate-300 text-[11px]">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <strong className="text-cyan-400 block mb-1">1. 메시지 브로커 (MQTT / AMQP)</strong>
                  <p className="text-slate-400">
                    EMQX Enterprise 클러스터 구성. 초당 최대 50,000건의 엣지 과속 텔레메트리 패킷 무손실 인제스천.
                  </p>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <strong className="text-amber-400 block mb-1">2. 객체 스토리지 & CDN</strong>
                  <p className="text-slate-400">
                    MinIO / AWS S3에 글로벌 셔터 원본 JPG 및 번호판 Crop 사진 영구 아카이빙 (SHA-256 해시 무결성 검증).
                  </p>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <strong className="text-purple-400 block mb-1">3. 경찰청 이파인(WICS) 연계 API</strong>
                  <p className="text-slate-400">
                    전자정부 표준프레임워크 및 mTLS 보안 터널을 통해 과속 차량 과태료 고지서 전산 원스톱 접수.
                  </p>
                </div>
              </div>
            </div>

            {/* REST API Endpoints Quick Reference */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-xs space-y-2">
              <span className="font-bold text-white block">주요 RESTful 엔드포인트</span>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex items-center gap-2 text-emerald-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  <span className="font-bold">POST</span>
                  <span className="text-slate-300">/api/v1/enforcement/event</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  <span className="font-bold">POST</span>
                  <span className="text-slate-300">/api/v1/enforcement/upload-image</span>
                </div>
                <div className="flex items-center gap-2 text-cyan-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  <span className="font-bold">GET</span>
                  <span className="text-slate-300">/api/v1/enforcement/statistics/daily</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
