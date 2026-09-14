import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  ShieldAlert,
  HardDrive,
  Download,
  Filter,
  Check,
  Zap,
  Sliders,
  Radio,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Search,
  RotateCcw,
  Camera,
  Activity,
  Car,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Share2,
  Play,
  Square,
  Server,
} from 'lucide-react';
import { SnapshotRecord, Vehicle } from '../types';

interface SmartphoneTabProps {
  speedLimit: number;
  onUpdateSpeedLimit: (newLimit: number) => void;
  recentSnapshots: SnapshotRecord[];
  onOpenSnapshotModal: (record: SnapshotRecord) => void;
  onTriggerShutter?: (vehicle: Partial<Vehicle>) => void;
  soundEnabled?: boolean;
  onNavigateTab?: (tab: 'monitor' | 'smartphone' | 'server' | string) => void;
  isSimulating?: boolean;
  onToggleSimulating?: () => void;
  autoTabSwitchTarget?: 'smartphone' | 'server' | 'alternate' | 'off';
  onChangeAutoTabSwitchTarget?: (target: 'smartphone' | 'server' | 'alternate' | 'off') => void;
}

export const SmartphoneTab: React.FC<SmartphoneTabProps> = ({
  speedLimit,
  onUpdateSpeedLimit,
  recentSnapshots,
  onOpenSnapshotModal,
  onTriggerShutter,
  soundEnabled = true,
  onNavigateTab,
  isSimulating = false,
  onToggleSimulating,
  autoTabSwitchTarget = 'smartphone',
  onChangeAutoTabSwitchTarget,
}) => {
  // Mobile device state
  const [deviceConnected, setDeviceConnected] = useState<boolean>(true);
  const [connectionMode, setConnectionMode] = useState<'ap' | 'ble' | 'cloud'>('ap');
  const [signalStrength, setSignalStrength] = useState<number>(92);
  const [batteryLevel, setBatteryLevel] = useState<number>(98);
  const [pushAlertsEnabled, setPushAlertsEnabled] = useState<boolean>(true);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);
  const [soundAlerts, setSoundAlerts] = useState<boolean>(soundEnabled);
  const [activeMobileView, setActiveMobileView] = useState<'live' | 'gallery' | 'settings'>('live');

  // Filter & Search inside Mobile Gallery
  const [mobileSearchQuery, setMobileSearchQuery] = useState<string>('');
  const [mobileFilterRange, setMobileFilterRange] = useState<'all' | 'severe' | 'today'>('all');
  const [selectedMobileSnapshot, setSelectedMobileSnapshot] = useState<SnapshotRecord | null>(null);

  // Download & Batch status
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(100);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Latest pushed overspeed alert banner on phone
  const [pushedAlert, setPushedAlert] = useState<SnapshotRecord | null>(null);
  const prevSnapshotCountRef = useRef<number>(recentSnapshots.length);

  // Audio tone for smartphone push alert
  const mobileAudioCtxRef = useRef<AudioContext | null>(null);

  const playMobilePushBeep = () => {
    if (!soundAlerts) return;
    try {
      if (!mobileAudioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          mobileAudioCtxRef.current = new AudioCtx();
        }
      }
      const ctx = mobileAudioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.1); // E6
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio autoplay policy
    }
  };

  // Watch for new snapshots and trigger push banner & vibration
  useEffect(() => {
    if (recentSnapshots.length > prevSnapshotCountRef.current) {
      const latest = recentSnapshots[0];
      if (latest && latest.isOverspeed && pushAlertsEnabled) {
        setPushedAlert(latest);
        playMobilePushBeep();

        // Browser Vibration API if supported on real mobile devices
        if (vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([150, 80, 150]);
          } catch {
            // ignore
          }
        }

        // Auto-dismiss push banner after 6 seconds
        const timer = setTimeout(() => {
          setPushedAlert((prev) => (prev?.id === latest.id ? null : prev));
        }, 6000);
        return () => clearTimeout(timer);
      }
    }
    prevSnapshotCountRef.current = recentSnapshots.length;
  }, [recentSnapshots, pushAlertsEnabled, vibrationEnabled, soundAlerts]);

  // Handle manual test from smartphone view
  const handleMobileTestTrigger = () => {
    if (!onTriggerShutter) return;
    const testSpeed = Math.floor(Math.random() * 32 + 42); // 42 ~ 74 km/h
    const plates = ['서울34가 8921', '경기88누 3049', '인천72라 1102', '부산90어 4567'];
    const plate = plates[Math.floor(Math.random() * plates.length)];

    onTriggerShutter({
      plate,
      speed: testSpeed,
      isOverspeed: true,
    });
  };

  // Handle Sync / SD download
  const handleSyncSD = () => {
    setIsSyncing(true);
    setSyncProgress(20);
    setTimeout(() => setSyncProgress(65), 500);
    setTimeout(() => {
      setSyncProgress(100);
      setIsSyncing(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 1100);
  };

  // Filtered list for mobile viewer
  const filteredMobileSnapshots = recentSnapshots.filter((snap) => {
    if (!snap.isOverspeed) return false;
    if (mobileFilterRange === 'severe' && snap.speed < speedLimit + 20) return false;
    if (mobileFilterRange === 'today') {
      const todayStr = '2026-09-14';
      if (snap.date && snap.date !== todayStr) return false;
    }
    if (mobileSearchQuery.trim()) {
      const q = mobileSearchQuery.trim().toLowerCase().replace(/\s+/g, '');
      const matchPlate = snap.plate.toLowerCase().replace(/\s+/g, '').includes(q);
      const matchMemo = (snap.memo || '').toLowerCase().includes(q);
      if (!matchPlate && !matchMemo) return false;
    }
    return true;
  });

  // Recent overspeed stats
  const totalOverspeedInMobile = recentSnapshots.filter((s) => s.isOverspeed).length;
  const severeOverspeedInMobile = recentSnapshots.filter((s) => s.isOverspeed && s.speed >= speedLimit + 20).length;

  return (
    <section id="tab-smartphone-monitoring" className="space-y-4">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>스마트폰 현장 과속 차량 관제 & 무선 AP 모니터링 시스템</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                PWA / Web-App
              </span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
            옥외 함체를 열지 않고 현장 요원이나 교통 순찰관의 스마트폰 브라우저에서 독립 Wi-Fi AP(192.168.4.1) 또는 BLE로 직결하여
            <strong> 실시간 과속 차량 푸시 알림 수신, 번호판 단속 사진 검토, 속도 제한값({speedLimit}km/h) 즉각 튜닝</strong>을 수행합니다.
          </p>
        </div>

        {/* Connection Mode Badges */}
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 self-stretch md:self-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 px-1">
            <span className={`w-2 h-2 rounded-full ${deviceConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span>{deviceConnected ? 'AP 직결 연결됨' : '연결 끊김'}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setConnectionMode('ap')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                connectionMode === 'ap'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Wi-Fi AP
            </button>
            <button
              onClick={() => setConnectionMode('ble')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                connectionMode === 'ble'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              BLE
            </button>
          </div>
        </div>
      </div>

      {/* 시뮬레이터 연동 및 자동 탭 전환 제어 툴바 */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">시뮬레이터 연동 상태:</span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                  isSimulating
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isSimulating ? '시뮬레이션 동작 중 (과속 차량 자동 주행)' : '시뮬레이션 일시 정지'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {autoTabSwitchTarget === 'smartphone'
                ? '현재 [스마트폰 탭 우선 자동 전환] 모드입니다. 단속 시 즉시 이 화면으로 유지·갱신됩니다.'
                : autoTabSwitchTarget === 'server'
                ? '현재 [관제 서버 탭 자동 전환] 모드입니다. 단속 시 관제 서버로 화면이 전환됩니다.'
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
                onClick={() => onNavigateTab('server')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 rounded-lg transition text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                title="3. 관제 서버 화면으로 이동"
              >
                <Server className="w-3 h-3" />
                <span>관제 서버 가기</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Dual-Column: Smartphone Interactive Simulator + Engineering Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT / CENTER: Smartphone Interactive Device Frame (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2 text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              스마트폰 현장 화면 실시간 모의기기 (Mobile View)
            </span>
            <span className="text-[11px] text-slate-500">iOS / Android Web-App 반응형</span>
          </div>

          {/* Realistic Smartphone Shell */}
          <div className="w-full max-w-[340px] sm:max-w-[360px] bg-slate-950 border-[6px] border-slate-800 rounded-[42px] shadow-2xl p-3 relative overflow-hidden ring-1 ring-slate-700/60">
            {/* Dynamic Island / Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-between px-3 border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 block" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block animate-ping" />
            </div>

            {/* Mobile Status Bar */}
            <div className="pt-5 pb-2 px-3 flex justify-between items-center text-[11px] text-slate-300 font-mono border-b border-slate-800/80">
              <span className="font-semibold text-slate-100">14:15</span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <Wifi className="w-3 h-3" /> AP {signalStrength}%
                </span>
                <span className="text-[10px] text-slate-300 font-sans">🔋 {batteryLevel}%</span>
              </div>
            </div>

            {/* Mobile In-App Header */}
            <div className="py-2.5 px-1 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  스쿨존 과속 지능형 가디언
                </div>
                <div className="text-xs text-slate-300 font-semibold">현장 모니터링 콘솔 v2.4</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPushAlertsEnabled(!pushAlertsEnabled)}
                  title={pushAlertsEnabled ? '푸시 알림 켜짐' : '푸시 알림 꺼짐'}
                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                    pushAlertsEnabled
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {pushAlertsEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setSoundAlerts(!soundAlerts)}
                  title={soundAlerts ? '경고음 켜짐' : '음소거'}
                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                    soundAlerts
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {soundAlerts ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Pop-up Push Alert Toast on Phone */}
            {pushedAlert && (
              <div
                onClick={() => {
                  onOpenSnapshotModal(pushedAlert);
                  setPushedAlert(null);
                }}
                className="mb-2 p-2.5 bg-red-950/90 border border-red-500/80 rounded-xl text-xs space-y-1 shadow-xl animate-in slide-in-from-top duration-300 cursor-pointer hover:bg-red-900/90 transition"
              >
                <div className="flex justify-between items-center text-red-200">
                  <span className="font-bold flex items-center gap-1 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-bounce" />
                    [긴급 푸시] 스쿨존 과속 차량 적발!
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{pushedAlert.time}</span>
                </div>
                <div className="flex justify-between items-center text-white">
                  <span className="font-mono font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-[11px]">
                    {pushedAlert.plate}
                  </span>
                  <span className="text-red-400 font-extrabold text-sm font-digital">
                    {pushedAlert.speed} km/h{' '}
                    <span className="text-[10px] font-sans font-normal text-red-300">
                      (+{pushedAlert.speed - speedLimit})
                    </span>
                  </span>
                </div>
                <div className="text-[9px] text-amber-300 flex items-center justify-between pt-0.5">
                  <span>터치하여 단속 사진 및 관리자 메모 열기</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            )}

            {/* Mobile Navigation Tabs (Inside Phone Screen) */}
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] mb-2.5">
              <button
                onClick={() => setActiveMobileView('live')}
                className={`py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeMobileView === 'live'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>라이브</span>
              </button>
              <button
                onClick={() => setActiveMobileView('gallery')}
                className={`py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1 relative ${
                  activeMobileView === 'gallery'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3 h-3" />
                <span>SD 갤러리</span>
                {totalOverspeedInMobile > 0 && (
                  <span className="w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {Math.min(totalOverspeedInMobile, 99)}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveMobileView('settings')}
                className={`py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeMobileView === 'settings'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>현장 설정</span>
              </button>
            </div>

            {/* View 1: Mobile Live View */}
            {activeMobileView === 'live' && (
              <div className="space-y-2.5 min-h-[360px]">
                {/* Real-time Radar Speedometer Card */}
                <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-center space-y-2 relative overflow-hidden">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Radio className="w-3 h-3 animate-pulse" />
                      HLK-LD2451 레이더 감시
                    </span>
                    <span className="font-mono">제한: {speedLimit}km/h</span>
                  </div>

                  {/* Big Speed Dial Display */}
                  <div className="py-2">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                      CURRENT DETECTED SPEED
                    </div>
                    <div className="text-4xl sm:text-5xl font-extrabold font-digital text-amber-400 mt-0.5 tracking-tight flex items-baseline justify-center gap-1">
                      {recentSnapshots[0]?.speed || 0}
                      <span className="text-xs font-sans font-normal text-slate-400">km/h</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {recentSnapshots[0]?.plate ? (
                        <span className="text-slate-300 font-mono">
                          최근 통과: <strong>{recentSnapshots[0].plate}</strong> ({recentSnapshots[0].time})
                        </span>
                      ) : (
                        '차량 접근 대기 중...'
                      )}
                    </div>
                  </div>

                  {/* Test Action Trigger inside Mobile */}
                  <button
                    onClick={handleMobileTestTrigger}
                    className="w-full py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>스마트폰 모의 과속 적발 테스트</span>
                  </button>
                </div>

                {/* Mobile Quick Stats 3-Grid */}
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-slate-900/80 border border-slate-800/80 p-2 rounded-xl">
                    <div className="text-[9px] text-slate-400">총 과속 적발</div>
                    <div className="text-base font-bold font-digital text-red-400 mt-0.5">
                      {totalOverspeedInMobile}
                    </div>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800/80 p-2 rounded-xl">
                    <div className="text-[9px] text-slate-400">심각(+20km)</div>
                    <div className="text-base font-bold font-digital text-purple-400 mt-0.5">
                      {severeOverspeedInMobile}
                    </div>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800/80 p-2 rounded-xl">
                    <div className="text-[9px] text-slate-400">SD 잔여용량</div>
                    <div className="text-xs font-bold font-mono text-emerald-400 mt-1">
                      17.8 GB
                    </div>
                  </div>
                </div>

                {/* Live Stream / Latest Snapshot Preview */}
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-amber-400" />
                      최신 적발 캡처 스냅샷
                    </span>
                    {recentSnapshots[0] && (
                      <span className="text-[9px] font-mono text-slate-400">{recentSnapshots[0].time}</span>
                    )}
                  </div>

                  {recentSnapshots[0] ? (
                    <div
                      onClick={() => onOpenSnapshotModal(recentSnapshots[0])}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-2 cursor-pointer hover:border-amber-500/50 transition group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="bg-slate-900 px-2 py-1 rounded border border-slate-700 text-xs font-mono font-bold text-white group-hover:text-amber-400 transition">
                          {recentSnapshots[0].plate}
                        </div>
                        <div className="text-red-400 font-bold font-digital text-sm">
                          {recentSnapshots[0].speed} km/h
                        </div>
                      </div>
                      {recentSnapshots[0].memo && (
                        <div className="mt-1 text-[10px] text-amber-300/90 truncate flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>{recentSnapshots[0].memo}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-500">
                      수집된 과속 캡처 데이터가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* View 2: Mobile SD Gallery */}
            {activeMobileView === 'gallery' && (
              <div className="space-y-2 min-h-[360px] flex flex-col">
                {/* Search & Filter Bar */}
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="차량번호 또는 메모 검색..."
                      value={mobileSearchQuery}
                      onChange={(e) => setMobileSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-7 pr-2 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex gap-1 text-[10px]">
                    <button
                      onClick={() => setMobileFilterRange('all')}
                      className={`px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                        mobileFilterRange === 'all'
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      전체 ({recentSnapshots.filter((s) => s.isOverspeed).length})
                    </button>
                    <button
                      onClick={() => setMobileFilterRange('severe')}
                      className={`px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                        mobileFilterRange === 'severe'
                          ? 'bg-purple-600 text-white font-bold border-purple-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      심각(+20km) ({severeOverspeedInMobile})
                    </button>
                    <button
                      onClick={() => setMobileFilterRange('today')}
                      className={`px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                        mobileFilterRange === 'today'
                          ? 'bg-red-600 text-white font-bold border-red-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      오늘
                    </button>
                  </div>
                </div>

                {/* Snapshot Records Scroll Area */}
                <div className="space-y-1.5 overflow-y-auto max-h-[260px] pr-0.5 scrollbar-thin scrollbar-thumb-slate-700 flex-grow">
                  {filteredMobileSnapshots.length > 0 ? (
                    filteredMobileSnapshots.map((snap) => (
                      <div
                        key={snap.id}
                        onClick={() => onOpenSnapshotModal(snap)}
                        className="p-2 bg-slate-900/90 hover:bg-slate-850 rounded-xl border border-slate-800 text-[10px] space-y-1 cursor-pointer transition"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-200 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-700">
                            {snap.plate}
                          </span>
                          <span className="font-extrabold text-red-400 font-digital text-xs">
                            {snap.speed} km/h
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400 text-[9px]">
                          <span>{snap.date || '2026-09-14'} {snap.time}</span>
                          <span className="text-amber-400/80 font-mono">초과 +{snap.speed - speedLimit}</span>
                        </div>
                        {snap.memo && (
                          <div className="text-[9px] text-amber-300 truncate bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            📝 {snap.memo}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-500">
                      검색 조건에 일치하는 단속 기록이 없습니다.
                    </div>
                  )}
                </div>

                {/* Mobile Sync & ZIP Download */}
                <button
                  onClick={handleSyncSD}
                  disabled={isSyncing}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSyncing ? (
                    <span>SD카드 동기화 중 ({syncProgress}%)...</span>
                  ) : downloadSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                      <span>스마트폰 앨범/다운로드 저장 완료!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>SD카드 단속 사진 일괄 다운로드 (ZIP)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* View 3: Mobile Field Settings */}
            {activeMobileView === 'settings' && (
              <div className="space-y-3 min-h-[360px] text-xs">
                {/* Speed Limit Adjuster */}
                <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-bold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      단속 기준 제한속도
                    </span>
                    <span className="text-amber-400 font-digital font-bold text-base">
                      {speedLimit} km/h
                    </span>
                  </div>

                  <input
                    type="range"
                    min="20"
                    max="60"
                    step="5"
                    value={speedLimit}
                    onChange={(e) => onUpdateSpeedLimit(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>20km/h (유치원)</span>
                    <span className="text-amber-400 font-semibold">30km/h (스쿨존 표준)</span>
                    <span>50km/h (간선)</span>
                  </div>
                </div>

                {/* Radar Sensitivity & Offset */}
                <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl space-y-2">
                  <span className="font-bold text-slate-300 block text-[11px]">
                    📡 레이더 탐지 거리 & 감도 설정
                  </span>
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">최대 유효 탐지 거리:</span>
                      <span className="font-mono text-emerald-400 font-bold">100 m</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">셔터 트리거 펄스폭:</span>
                      <span className="font-mono text-amber-400 font-bold">50 ms (광절연)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">차량 속도 보정값(오프셋):</span>
                      <span className="font-mono text-slate-200">±0.0 km/h</span>
                    </div>
                  </div>
                </div>

                {/* Network & AP Info */}
                <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl space-y-1.5 text-[11px]">
                  <span className="font-bold text-slate-300 block">📶 무선 AP 네트워크 정보</span>
                  <div className="flex justify-between text-slate-400">
                    <span>SSID:</span>
                    <span className="font-mono text-slate-200">SchoolZone_Radar_AP</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Gateway IP:</span>
                    <span className="font-mono text-emerald-400">192.168.4.1:80</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>BLE UUID:</span>
                    <span className="font-mono text-slate-400">0000ffe0-0000-1000...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Home Bar Indicator */}
            <div className="pt-2 pb-1 flex justify-center">
              <div className="w-24 h-1 bg-slate-700 rounded-full" />
            </div>
          </div>
        </div>

        {/* RIGHT: Smartphone Monitoring Architecture, Protocols & Field Guide (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card 1: System Workflow & Specifications */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>스마트폰 과속 모니터링 시스템 4대 핵심 구조</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" />
                  1. 독립 SoftAP 웹소켓 직결
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  외부 이동통신(LTE/5G) 유심 개통 없이도 제어기(ESP32/라즈베리파이)가 자체 AP(192.168.4.1)를 생성하여 30~50m 거리에서 스마트폰으로 즉시 접속 가능.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-red-400 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  2. 0.05초 초저지연 푸시 알림
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  레이더가 제한속도({speedLimit}km/h) 초과를 감지하는 순간 하드웨어 인터럽트와 동시에 스마트폰에 WebSocket 메시지 및 진동/경보 사운드를 즉시 타전.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  3. SD카드 무선 갤러리 뷰어
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  높은 전신주 함체에 사다리를 타고 올라갈 필요 없이, 지상에서 스마트폰으로 SD카드에 저장된 과속 고해상도 JPG 및 번호판 ALPR 결과를 검색/다운로드.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-purple-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  4. 원격 OTA 파라미터 튜닝
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  단속 기준속도, 레이더 감지 거리(0~100m), 주야간 노출값, 광절연 셔터 펄스폭(50ms)을 스마트폰 웹 UI에서 원클릭으로 변경 및 플래시 메모리 보존.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Interactive Field Workflows & Real Operations */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>현장 관리자 / 단속 요원 스마트폰 실무 운영 시나리오</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <div>
                  <strong className="text-slate-200">차량 접근 시 순찰차 내 원격 실시간 모니터링:</strong>
                  <p className="text-slate-400 mt-0.5 text-[11px]">
                    경찰관이나 모범운전자 요원이 순찰차 또는 횡단보도 안전지대에서 스마트폰 거치대를 켜두면, 50m 전방에서 과속 차량이 접근할 때 경보음과 함께 차량 번호와 초과 속도가 화면에 즉시 팝업됩니다.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <div>
                  <strong className="text-slate-200">현장 계도 및 즉석 증거 제시:</strong>
                  <p className="text-slate-400 mt-0.5 text-[11px]">
                    신호 대기 중인 과속 운전자에게 스마트폰 화면의 단속 사진(차량 번호판, 속도, 시각 스탬프)을 즉시 보여주며 현장 계도장 발부 및 단속 불복 시비를 원천 차단합니다.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <div>
                  <strong className="text-slate-200">정기 점검 시 고화질 단속 이미지 무선 일괄 수거:</strong>
                  <p className="text-slate-400 mt-0.5 text-[11px]">
                    월 1회 점검 시 스마트폰의 [SD카드 단속 사진 일괄 다운로드] 버튼을 누르면 당월 적발된 모든 과속 사진과 CSV 로그가 압축 ZIP 파일로 스마트폰에 고속 전송되어 구청 관제센터로 이첩됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: ESP32 / Raspberry Pi Hardware & Software Stack */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <span>무선 AP 및 웹 서버 펌웨어 스택 (ESP32 / 라즈베리파이)</span>
            </h3>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-2 overflow-x-auto">
              <div className="text-slate-400">// ESP32 Arduino / ESP-IDF 웹소켓 푸시 아키텍처 예시</div>
              <div className="text-emerald-400">#include &lt;WiFi.h&gt;</div>
              <div className="text-emerald-400">#include &lt;AsyncTCP.h&gt;</div>
              <div className="text-emerald-400">#include &lt;ESPAsyncWebServer.h&gt;</div>
              <div className="text-slate-300 pt-1">
                WiFi.softAP(<span className="text-amber-300">"SchoolZone_Radar_AP"</span>, <span className="text-amber-300">"safe1234!"</span>);
              </div>
              <div className="text-slate-300">
                ws.onEvent(onWebSocketEvent); <span className="text-slate-500">// 스마트폰 브라우저 양방향 연결</span>
              </div>
              <div className="text-purple-400 pt-1">
                void onRadarOverspeedDetected(float speed, const char* plate) &#123;
              </div>
              <div className="pl-4 text-slate-300">
                triggerOptocouplerShutter(); <span className="text-slate-500">// PC817 광절연 50ms 펄스</span>
              </div>
              <div className="pl-4 text-amber-300">
                String payload = String("&#123;\"speed\":") + speed + ",\"plate\":\"" + plate + "\"&#125;";
              </div>
              <div className="pl-4 text-emerald-400">
                ws.textAll(payload); <span className="text-slate-500">// 스마트폰에 실시간 푸시 전송</span>
              </div>
              <div className="text-purple-400">&#125;</div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                iOS 사파리 & 안드로이드 크롬 100% 무설치 호환 (PWA)
              </span>
              <span className="text-[11px] text-amber-400 font-mono">
                소모전력 증가: Wi-Fi AP 구동 시 +0.35W 미만
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
