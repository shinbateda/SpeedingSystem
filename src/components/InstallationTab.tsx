import React, { useState, useMemo } from 'react';
import {
  HardHat,
  Ruler,
  Compass,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Camera,
  Radio,
  Sun,
  Moon,
  ShieldCheck,
  FileCheck,
  Layers,
  Wrench,
  HelpCircle,
  Copy,
  Check,
  Car,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';

interface InstallationTabProps {
  onNavigateTab?: (tab: string) => void;
}

export const InstallationTab: React.FC<InstallationTabProps> = ({ onNavigateTab }) => {
  // 1. Simulation Parameters
  const [poleHeight, setPoleHeight] = useState<number>(5.8); // 4.5m ~ 7.5m (meters)
  const [roadOffset, setRoadOffset] = useState<number>(1.8); // 1.0m ~ 3.5m (meters from curb/lane edge)
  const [tiltAngle, setTiltAngle] = useState<number>(17); // 10° ~ 28° (pitch down angle)
  const [focalLength, setFocalLength] = useState<number>(12); // 8, 12, 16, 25 mm
  const [laneWidth] = useState<number>(3.5); // 3.5m per lane
  const [targetLane, setTargetLane] = useState<number>(1); // Lane 1 or Lane 2
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [simTestSpeed, setSimTestSpeed] = useState<number>(55); // 30 ~ 90 km/h
  const [isVehiclePassing, setIsVehiclePassing] = useState<boolean>(false);
  const [simVehiclePos, setSimVehiclePos] = useState<number>(10); // Vehicle distance in meters from pole base
  const [activeSubSection, setActiveSubSection] = useState<'sim' | 'procedure' | 'considerations' | 'checklist'>('sim');
  const [copiedSpec, setCopiedSpec] = useState<boolean>(false);

  // 2. Interactive Checklist State
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    c1: true, // 콘크리트 기초 24MPa 7일 이상 양생 확인
    c2: true, // M24 이상 고장력 앙카볼트 이중너트 체결 및 레벨링
    c3: false, // 제3종 접지저항 (30Ω 이하) 테스터 측정 완료
    c4: true, // Class II/III 복합 서지보호기(SPD 10kA) 인입 배선
    c5: false, // 레이저 레벨기 이용 레이더 빔-카메라 광축 동축 정렬(Boresight)
    c6: true, // 글로벌 셔터 트리거 펄스 케이블(GPIO) 실드 차폐선 결선
    c7: false, // 850nm IR 스트로브 LED 플래시 동기화 지연시간 < 15μs 검증
    c8: true, // IP66 방수 하우징 메탈 케이블 글랜드 및 드립루프(Drip Loop) 마감
    c9: false, // 렌즈 전면창 결로 방지 PTC 발열선(De-fogging) 정상 통전 확인
    c10: true, // LTE 라우터 수신감도(RSRP > -90dBm) 및 외부 안테나 고정
    c11: false, // 시험 주행 차량(30, 50km/h) 5회 통과 실측 오차 ±3% 검증
    c12: true, // 경찰청/지자체 무인단속장비 표준 규격 로그 암호화 연동 테스트
  });

  // 3. Mathematical Physics & Optical Calculations
  const calculations = useMemo(() => {
    const tiltRad = (tiltAngle * Math.PI) / 180;

    // Optical ground capture distance: D = H / tan(tilt)
    const groundDistance = poleHeight / Math.tan(tiltRad);

    // Slant range to target vehicle license plate (assuming plate height 0.5m)
    const deltaH = Math.max(0.5, poleHeight - 0.5);
    const slantRange = Math.sqrt(groundDistance * groundDistance + deltaH * deltaH);

    // Horizontal lane center offset
    const laneCenterOffset = roadOffset + (targetLane - 0.5) * laneWidth;
    const horizontalAngleRad = Math.atan2(laneCenterOffset, groundDistance);
    const horizontalAngleDeg = (horizontalAngleRad * 180) / Math.PI;

    // 3D Compound Cosine Angle (theta_3D): cos(theta_3D) = cos(tilt) * cos(yaw)
    const cosCompound = Math.cos(tiltRad) * Math.cos(horizontalAngleRad);
    const compoundAngleDeg = (Math.acos(cosCompound) * 180) / Math.PI;

    // Doppler Radar Cosine Velocity Error: V_measured = V_actual * cos(compoundAngle)
    const velocityFactor = cosCompound; // e.g. 0.945 (-5.5%)
    const measuredSpeed = simTestSpeed * velocityFactor;
    const speedLossPercent = (1 - velocityFactor) * 100;
    const compensationMultiplier = 1 / cosCompound;

    // Optical FOV Calculations for standard 1/2.8" Sensor (5.6mm width, 1920px horizontal)
    const sensorWidthMm = 5.6;
    const hfovRad = 2 * Math.atan(sensorWidthMm / (2 * focalLength));
    const hfovDeg = (hfovRad * 180) / Math.PI;
    const fovWidthAtTarget = 2 * slantRange * Math.tan(hfovRad / 2);

    // Pixels Per Meter (PPM) at target distance
    const ppm = 1920 / fovWidthAtTarget;
    // Standard Korean License Plate is 520mm (0.52m) wide
    const platePixelWidth = Math.round(ppm * 0.52);

    // Blind zone distance (where camera beam first hits ground from pole base)
    const blindZoneDistance = poleHeight / Math.tan(tiltRad + hfovRad / 2);

    // Evaluation Score
    let status: 'optimal' | 'warning' | 'error' = 'optimal';
    const issues: string[] = [];

    if (ppm < 130) {
      status = 'warning';
      issues.push('화소 밀도(PPM) 부족: 번호판 OCR 오인식 위험 (렌즈 초점거리 확대 권장)');
    }
    if (compoundAngleDeg > 25) {
      status = 'warning';
      issues.push('코사인 각도 과대(>25°): 레이더 속도 왜곡 심화 및 사각지대 증가');
    }
    if (groundDistance < 12) {
      status = 'error';
      issues.push('촬영 거리 너무 짧음(<12m): 셔터 반응 래그로 번호판 상단 잘림 발생');
    }
    if (groundDistance > 32) {
      status = 'warning';
      issues.push('촬영 거리 너무 긺(>32m): 야간 스트로브 도달 광량 감쇠 우려');
    }

    return {
      groundDistance: Math.round(groundDistance * 10) / 10,
      slantRange: Math.round(slantRange * 10) / 10,
      laneCenterOffset: Math.round(laneCenterOffset * 10) / 10,
      horizontalAngleDeg: Math.round(horizontalAngleDeg * 10) / 10,
      compoundAngleDeg: Math.round(compoundAngleDeg * 10) / 10,
      velocityFactor: Math.round(velocityFactor * 1000) / 1000,
      measuredSpeed: Math.round(measuredSpeed * 10) / 10,
      speedLossPercent: Math.round(speedLossPercent * 10) / 10,
      compensationMultiplier: Math.round(compensationMultiplier * 1000) / 1000,
      hfovDeg: Math.round(hfovDeg * 10) / 10,
      fovWidthAtTarget: Math.round(fovWidthAtTarget * 10) / 10,
      ppm: Math.round(ppm),
      platePixelWidth,
      blindZoneDistance: Math.max(0, Math.round(blindZoneDistance * 10) / 10),
      status,
      issues,
    };
  }, [poleHeight, roadOffset, tiltAngle, focalLength, targetLane, laneWidth, simTestSpeed]);

  // Run vehicle animation pass
  const handleDriveVehicleTest = () => {
    if (isVehiclePassing) return;
    setIsVehiclePassing(true);
    setSimVehiclePos(40);

    let curr = 40;
    const interval = setInterval(() => {
      curr -= 2.2;
      setSimVehiclePos(Math.round(curr * 10) / 10);
      if (curr <= 2) {
        clearInterval(interval);
        setIsVehiclePassing(false);
      }
    }, 50);
  };

  const toggleCheckItem = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCheckCount = Object.values(checklist).filter(Boolean).length;
  const totalCheckCount = Object.keys(checklist).length;
  const checklistProgress = Math.round((completedCheckCount / totalCheckCount) * 100);

  const handleCopySpec = () => {
    const text = `[스마트 스쿨존 셔터카메라 현장 설치 설계 규격서]
- 지주대(Pole) 높이: ${poleHeight}m
- 갓길 이격 거리: ${roadOffset}m
- 하향 틸트 각도: ${tiltAngle}°
- 렌즈 초점거리: ${focalLength}mm (수평화각 ${calculations.hfovDeg}°)
- 단속 타깃 차로: ${targetLane}차로 (중심 이격 ${calculations.laneCenterOffset}m)
- 최적 셔터 포착 거리: ${calculations.groundDistance}m (사구간 경사거리 ${calculations.slantRange}m)
- 화소 밀도(PPM): ${calculations.ppm} PPM (번호판 해상도 ${calculations.platePixelWidth}px)
- 레이더 코사인 각도: ${calculations.compoundAngleDeg}° (속도 왜곡계수 ${calculations.velocityFactor}, 역보정 x${calculations.compensationMultiplier})
- 카메라 감지 사각지대: 지주 하단 전방 ${calculations.blindZoneDistance}m`;
    navigator.clipboard.writeText(text);
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2000);
  };

  return (
    <section id="tab-system-installation" className="space-y-5">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <HardHat className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
              <span>시스템 현장 설치 공학 & 가상 시뮬레이터</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono font-semibold">
                스쿨존 지주대·광축·레이더 통합 가이드 v2.6
              </span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
            무인 단속 셔터 카메라와 도플러 레이더를 실제 도로 지주대(Pole)에 시공할 때 필요한
            <strong> 토목 기초, 광학 FOV 화각, 레이더 코사인 오차 역보정, 야간 IR 스트로브 동기화 및 전기/접지 표준 시방서</strong>를 제공합니다.
          </p>
        </div>

        {/* Sub-tab Navigation Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs self-stretch md:self-auto">
          <button
            onClick={() => setActiveSubSection('sim')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubSection === 'sim'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>현장 시뮬레이터</span>
          </button>
          <button
            onClick={() => setActiveSubSection('procedure')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubSection === 'procedure'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>6단계 시공 방법</span>
          </button>
          <button
            onClick={() => setActiveSubSection('considerations')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubSection === 'considerations'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>핵심 고려사항</span>
          </button>
          <button
            onClick={() => setActiveSubSection('checklist')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubSection === 'checklist'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>설치 검수 체크리스트 ({completedCheckCount}/{totalCheckCount})</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: INTERACTIVE FIELD INSTALLATION SIMULATOR */}
      {activeSubSection === 'sim' && (
        <div className="space-y-4">
          {/* Controls & Realtime Canvas Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column: Parameter Tuners (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>현장 지주대 및 센서 배치 파라미터</span>
                </h3>
                <button
                  onClick={() => {
                    setPoleHeight(5.8);
                    setRoadOffset(1.8);
                    setTiltAngle(17);
                    setFocalLength(12);
                    setTargetLane(1);
                  }}
                  className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition cursor-pointer"
                  title="경찰청 스쿨존 표준 권장치로 초기화"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>표준값 복원</span>
                </button>
              </div>

              {/* Slider 1: Pole Height */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    <Ruler className="w-3.5 h-3.5 text-amber-400" />
                    지주대 설치 높이 (Pole Height)
                  </span>
                  <span className="font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {poleHeight.toFixed(1)} m
                  </span>
                </div>
                <input
                  type="range"
                  min="4.5"
                  max="7.5"
                  step="0.1"
                  value={poleHeight}
                  onChange={(e) => setPoleHeight(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>최저 4.5m (대형트럭 접촉 위험선)</span>
                  <span className="text-amber-400/80">스쿨존 표준 5.5~6.0m</span>
                  <span>최고 7.5m</span>
                </div>
              </div>

              {/* Slider 2: Camera Pitch / Tilt Angle */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    하향 틸트 각도 (Pitch / Tilt Down)
                  </span>
                  <span className="font-mono font-bold text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {tiltAngle}°
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="28"
                  step="1"
                  value={tiltAngle}
                  onChange={(e) => setTiltAngle(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>10° (원거리 전방 조망)</span>
                  <span className="text-cyan-400/80">최적 15°~18°</span>
                  <span>28° (근거리 급경사)</span>
                </div>
              </div>

              {/* Slider 3: Road Offset */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    <span>도로 갓길 이격 (Road Offset)</span>
                  </span>
                  <span className="font-mono font-bold text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {roadOffset.toFixed(1)} m
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.5"
                  step="0.1"
                  value={roadOffset}
                  onChange={(e) => setRoadOffset(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1.0m (인도 경계석 밀착)</span>
                  <span>권장 1.5~2.0m</span>
                  <span>3.5m (보도 안쪽 설치)</span>
                </div>
              </div>

              {/* Selector: Lens Focal Length & Lane Selection */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1 font-semibold">
                    카메라 렌즈 초점거리
                  </label>
                  <select
                    value={focalLength}
                    onChange={(e) => setFocalLength(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-amber-500"
                  >
                    <option value={8}>8mm (광각 / 광범위 감시)</option>
                    <option value={12}>12mm (스쿨존 표준 단속)</option>
                    <option value={16}>16mm (망원 / 번호판 확대)</option>
                    <option value={25}>25mm (초망원 30m+ 원거리)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1 font-semibold">
                    단속 목표 차로 지정
                  </label>
                  <select
                    value={targetLane}
                    onChange={(e) => setTargetLane(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-amber-500"
                  >
                    <option value={1}>1차로 (인도/폴대 인접 차선)</option>
                    <option value={2}>2차로 (중앙선 방면 외측 차선)</option>
                  </select>
                </div>
              </div>

              {/* Day / Night Strobe Toggle & Test Vehicle Speed */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                    {isNightMode ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                    주간 / 야간 IR 스트로브 모드
                  </span>
                  <button
                    onClick={() => setIsNightMode(!isNightMode)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isNightMode
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {isNightMode ? '야간 (850nm IR)' : '주간 (가시광 셔터)'}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">모의 차량 속도:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="30"
                      max="90"
                      step="5"
                      value={simTestSpeed}
                      onChange={(e) => setSimTestSpeed(parseInt(e.target.value, 10))}
                      className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                    <span className="font-mono font-bold text-red-400 w-16 text-right">
                      {simTestSpeed} km/h
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleDriveVehicleTest}
                  disabled={isVehiclePassing}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow cursor-pointer ${
                    isVehiclePassing
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{isVehiclePassing ? '차량 통과 주행 계측 중...' : '시험 주행 차량 통과 시뮬레이션 실행'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleCopySpec}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedSpec ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSpec ? '설계 시방서 복사됨!' : '현장 설치 파라미터 복사'}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Interactive Physical Cross-Section & Ray Tracing Canvas (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-sm text-white">
                    현장 측면 단면도 (Side-Elevation Optical & Radar Ray-Trace)
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> 카메라 FOV ({calculations.hfovDeg}°)
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> 도플러 24GHz 빔
                  </span>
                </div>
              </div>

              {/* SVG Canvas Simulator */}
              <div className="relative w-full h-[280px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden select-none">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 600 280"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Sky/Background */}
                  <rect
                    x="0"
                    y="0"
                    width="600"
                    height="210"
                    fill={isNightMode ? '#020617' : '#090d16'}
                  />

                  {/* Grid Lines */}
                  <line x1="0" y1="210" x2="600" y2="210" stroke="#334155" strokeWidth="2" />
                  {/* Asphalt Road Ground */}
                  <rect x="0" y="210" width="600" height="70" fill="#1e293b" />
                  {/* Road Center Dotted Line */}
                  <line
                    x1="0"
                    y1="245"
                    x2="600"
                    y2="245"
                    stroke="#e2e8f0"
                    strokeWidth="2"
                    strokeDasharray="14 10"
                  />

                  {/* Concrete Foundation Base */}
                  <rect x="35" y="200" width="40" height="15" fill="#475569" rx="2" />
                  <rect x="30" y="212" width="50" height="8" fill="#334155" />
                  {/* Anchor Bolts */}
                  <circle cx="40" cy="204" r="2" fill="#94a3b8" />
                  <circle cx="70" cy="204" r="2" fill="#94a3b8" />

                  {/* Pole (지주대) - Height proportional: 4.5m ~ 7.5m maps to y: 110 ~ 40 */}
                  {(() => {
                    const poleTopY = 200 - (poleHeight - 4.5) * 22 - 70; // 4.5m -> 130, 7.5m -> 64
                    const armEndX = 110;
                    const cameraX = 105;
                    const cameraY = poleTopY + 12;

                    // Capture point on ground (groundDistance 12m~35m maps to x: 220 ~ 520)
                    const targetX = Math.min(540, Math.max(180, 105 + calculations.groundDistance * 11));
                    const blindX = Math.min(targetX - 20, Math.max(120, 105 + calculations.blindZoneDistance * 11));

                    // Vehicle position on ground
                    const vehicleDisplayX = isVehiclePassing
                      ? Math.min(540, Math.max(60, 105 + simVehiclePos * 11))
                      : targetX;

                    return (
                      <g>
                        {/* Pole Main Body */}
                        <line
                          x1="55"
                          y1="200"
                          x2="55"
                          y2={poleTopY}
                          stroke="#94a3b8"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                        {/* Horizontal Support Arm */}
                        <line
                          x1="55"
                          y1={poleTopY + 8}
                          x2={armEndX}
                          y2={poleTopY + 8}
                          stroke="#64748b"
                          strokeWidth="5"
                          strokeLinecap="round"
                        />
                        {/* Arm Gusset Brace */}
                        <line
                          x1="55"
                          y1={poleTopY + 30}
                          x2={armEndX - 20}
                          y2={poleTopY + 8}
                          stroke="#475569"
                          strokeWidth="3"
                        />

                        {/* Solar Panel on top of pole */}
                        <line
                          x1="35"
                          y1={poleTopY - 14}
                          x2="75"
                          y2={poleTopY - 24}
                          stroke="#0284c7"
                          strokeWidth="4"
                        />

                        {/* Outdoor Enclosure (RPi / Battery Box) */}
                        <rect
                          x="38"
                          y={poleTopY + 45}
                          width="34"
                          height="45"
                          fill="#334155"
                          stroke="#64748b"
                          strokeWidth="1.5"
                          rx="3"
                        />
                        <circle cx="45" cy={poleTopY + 55} r="2" fill="#22c55e" />

                        {/* Camera & Radar Housing Bracket */}
                        <rect
                          x={cameraX - 10}
                          y={cameraY - 8}
                          width="24"
                          height="16"
                          fill="#f8fafc"
                          stroke="#cbd5e1"
                          strokeWidth="1"
                          rx="3"
                          transform={`rotate(${tiltAngle} ${cameraX} ${cameraY})`}
                        />
                        {/* Lens Sunshield */}
                        <path
                          d={`M ${cameraX + 8} ${cameraY - 6} L ${cameraX + 16} ${cameraY - 6} L ${cameraX + 10} ${cameraY + 6} Z`}
                          fill="#0f172a"
                          transform={`rotate(${tiltAngle} ${cameraX} ${cameraY})`}
                        />

                        {/* Radar Main Lobe 24GHz Cone (Amber) */}
                        <polygon
                          points={`${cameraX},${cameraY} ${targetX + 60},210 ${targetX - 40},210`}
                          fill="rgba(245, 158, 11, 0.12)"
                          stroke="rgba(245, 158, 11, 0.45)"
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                        />

                        {/* Camera Optical FOV Cone (Cyan) */}
                        <polygon
                          points={`${cameraX},${cameraY} ${targetX + 35},210 ${blindX},210`}
                          fill={isNightMode ? 'rgba(99, 102, 241, 0.22)' : 'rgba(6, 182, 212, 0.16)'}
                          stroke={isNightMode ? 'rgba(99, 102, 241, 0.8)' : 'rgba(6, 182, 212, 0.7)'}
                          strokeWidth="1.5"
                        />

                        {/* Central Optical Axis Ray */}
                        <line
                          x1={cameraX}
                          y1={cameraY}
                          x2={targetX}
                          y2="206"
                          stroke="#38bdf8"
                          strokeWidth="1.5"
                          strokeDasharray="5 3"
                        />

                        {/* Optimal Shutter Trigger Line on Ground */}
                        <line
                          x1={targetX}
                          y1="190"
                          x2={targetX}
                          y2="250"
                          stroke="#ef4444"
                          strokeWidth="2"
                        />
                        <text
                          x={targetX + 4}
                          y="185"
                          fill="#ef4444"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          단속 셔터 기준선 ({calculations.groundDistance}m)
                        </text>

                        {/* Blind Zone Hatching */}
                        <rect
                          x="55"
                          y="210"
                          width={Math.max(0, blindX - 55)}
                          height="10"
                          fill="rgba(239, 68, 68, 0.2)"
                          stroke="#ef4444"
                          strokeWidth="1"
                        />
                        <text
                          x="60"
                          y="228"
                          fill="#f87171"
                          fontSize="9"
                          fontFamily="sans-serif"
                        >
                          사각지대 ({calculations.blindZoneDistance}m)
                        </text>

                        {/* Vehicle on Road */}
                        <g transform={`translate(${vehicleDisplayX - 30}, 184)`}>
                          {/* Wheels */}
                          <circle cx="12" cy="26" r="6" fill="#0f172a" />
                          <circle cx="48" cy="26" r="6" fill="#0f172a" />
                          <circle cx="12" cy="26" r="3" fill="#64748b" />
                          <circle cx="48" cy="26" r="3" fill="#64748b" />

                          {/* Car Body */}
                          <path
                            d="M 2 24 L 8 16 L 20 12 L 40 12 L 52 18 L 58 24 Z"
                            fill={calculations.status === 'optimal' ? '#3b82f6' : '#eab308'}
                          />
                          {/* Car Roof & Windows */}
                          <path
                            d="M 18 13 L 24 6 L 38 6 L 44 13 Z"
                            fill="#0284c7"
                            opacity="0.8"
                          />
                          {/* Front License Plate */}
                          <rect x="0" y="19" width="4" height="6" fill="#ffffff" stroke="#000" strokeWidth="0.5" />

                          {/* Target Crosshair */}
                          <circle cx="2" cy="22" r="5" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                          <line x1="-3" y1="22" x2="7" y2="22" stroke="#ef4444" strokeWidth="1" />
                          <line x1="2" y1="17" x2="2" y2="27" stroke="#ef4444" strokeWidth="1" />

                          {/* Speed tag */}
                          <rect x="10" y="-8" width="50" height="12" fill="#020617" rx="3" stroke="#475569" strokeWidth="0.5" />
                          <text x="14" y="1" fill="#f8fafc" fontSize="8" fontWeight="bold" fontFamily="monospace">
                            {simTestSpeed} km/h
                          </text>
                        </g>

                        {/* Height Dimension Line */}
                        <line x1="25" y1="200" x2="25" y2={poleTopY} stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrow)" />
                        <text x="8" y={(200 + poleTopY) / 2} fill="#cbd5e1" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                          H={poleHeight}m
                        </text>
                      </g>
                    );
                  })()}
                </svg>

                {/* Status Badge inside Canvas */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-sm text-xs shadow-lg">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      calculations.status === 'optimal'
                        ? 'bg-emerald-400'
                        : calculations.status === 'warning'
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-red-400 animate-ping'
                    }`}
                  />
                  <span className="font-bold text-white">
                    설치 적합도:{' '}
                    {calculations.status === 'optimal'
                      ? '최적 (Optimal 100%)'
                      : calculations.status === 'warning'
                      ? '주의 (일부 파라미터 경계치)'
                      : '부적합 (재조정 필요)'}
                  </span>
                </div>
              </div>

              {/* Realtime Engineering Telemetry Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">최적 셔터 포착 거리</div>
                  <div className="text-base font-bold font-digital text-cyan-400 mt-0.5">
                    {calculations.groundDistance} <span className="text-xs font-sans text-slate-400 font-normal">m</span>
                  </div>
                  <div className="text-[10px] text-slate-500">경사거리 {calculations.slantRange}m</div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">번호판 해상도 (PPM)</div>
                  <div
                    className={`text-base font-bold font-digital mt-0.5 ${
                      calculations.ppm >= 180 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {calculations.ppm} <span className="text-xs font-sans text-slate-400 font-normal">PPM</span>
                  </div>
                  <div className="text-[10px] text-slate-500">번호판 가로폭 {calculations.platePixelWidth}px</div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">도플러 코사인 오차율</div>
                  <div className="text-base font-bold font-digital text-amber-400 mt-0.5">
                    -{calculations.speedLossPercent} <span className="text-xs font-sans text-slate-400 font-normal">%</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    합성각 {calculations.compoundAngleDeg}° (실측 {calculations.measuredSpeed}km/h)
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">펌웨어 속도 역보정 계수</div>
                  <div className="text-base font-bold font-digital text-indigo-400 mt-0.5">
                    x{calculations.compensationMultiplier}
                  </div>
                  <div className="text-[10px] text-slate-500">1/cos(θ) 실시간 승산</div>
                </div>
              </div>

              {/* Issues Warnings */}
              {calculations.issues.length > 0 && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold">현장 설치 파라미터 경고:</span>
                    <ul className="list-disc pl-4 text-[11px] text-amber-200/90 space-y-0.5">
                      {calculations.issues.map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: 6-STEP FIELD INSTALLATION PROCEDURE */}
      {activeSubSection === 'procedure' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Step 1: Foundation */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-lg font-bold text-xs font-mono">
                  STEP 01
                </span>
                <span className="text-[11px] text-slate-500">토목 기초 공사</span>
              </div>
              <h4 className="font-bold text-sm text-white">지주대 콘크리트 기초 및 앙카볼트 타설</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                풍하중(최대 순간풍속 45~50m/s 버팀성)을 견디기 위한 규격 기초를 시공합니다.
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <li>• <strong>터파기 규격</strong>: 가로 800mm × 세로 800mm × 깊이 1,200~1,500mm</li>
                <li>• <strong>콘크리트 강도</strong>: 레미콘 24MPa 이상, 타설 후 최소 7~14일 양생</li>
                <li>• <strong>앙카 볼트</strong>: M24 또는 M30 고장력 용융아연도금 앙카 4~6개소 템플릿 정렬</li>
                <li>• <strong>배관 인입</strong>: CD관(전원 28C, 통신 22C, 접지 16C) 기초 중앙 사전 매립</li>
              </ul>
            </div>

            {/* Step 2: Pole & Arm */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded-lg font-bold text-xs font-mono">
                  STEP 02
                </span>
                <span className="text-[11px] text-slate-500">구조물 건립</span>
              </div>
              <h4 className="font-bold text-sm text-white">원형 스틸 폴대 건립 & 방진 브라켓 장착</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                크레인 장비를 동원하여 지주대를 직립시키고 덤프트럭 진동 방지 댐퍼를 체결합니다.
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <li>• <strong>베이스 플레이트</strong>: 상·하 이중 너트(Double Nut) 수평계로 수직도 ±0.5° 정밀 레벨링</li>
                <li>• <strong>무수축 몰탈 사춤</strong>: 베이스 플레이트 하부 공극에 40MPa 무수축 몰탈 주입</li>
                <li>• <strong>방진 고무 패드</strong>: 카메라 하우징 브라켓 접촉면에 60 Duro EPDM 댐퍼 삽입</li>
                <li>• <strong>지주 암(Arm) 길이</strong>: 도로 폭 및 갓길 거리에 맞춰 1.5m ~ 3.5m 캔틸레버 체결</li>
              </ul>
            </div>

            {/* Step 3: Optical & Radar Alignment */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold text-xs font-mono">
                  STEP 03
                </span>
                <span className="text-[11px] text-slate-500">센서 정밀 정렬</span>
              </div>
              <h4 className="font-bold text-sm text-white">레이더 빔-글로벌 셔터 카메라 동축 정렬</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                도플러 레이더 측정 축과 카메라 광축을 지향 타깃(18~22m 전방)에 정확히 일치시킵니다.
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <li>• <strong>레이저 포인터 가이드</strong>: 하우징 정렬 지그를 장착하고 차로 중심 번호판 높이(0.5m) 조준</li>
                <li>• <strong>수직 틸트각 고정</strong>: 디지털 각도기를 부착하여 설계된 15°~18° 하향각 체결 록킹</li>
                <li>• <strong>수평 요(Yaw) 미세조정</strong>: 차로 중심선과의 평행도 유지, 도로 갓길 이격 편차 보정</li>
                <li>• <strong>렌즈 포커스 록</strong>: 조리개 F1.8~2.8 고정, 포커스 링 잠금 볼트 록타이트 도포</li>
              </ul>
            </div>

            {/* Step 4: Power & Grounding */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 rounded-lg font-bold text-xs font-mono">
                  STEP 04
                </span>
                <span className="text-[11px] text-slate-500">전원 및 접지</span>
              </div>
              <h4 className="font-bold text-sm text-white">전기 인입, 태양광 패널 결선 & 낙뢰 서지 보호</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                옥외 낙뢰 및 전압 강하로부터 ESP32 및 라즈베리파이 메인보드를 완벽 절연 보호합니다.
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <li>• <strong>제3종 접지 시공</strong>: 접지봉(동봉 14파이 1.0m 3연결) 매설, 접지저항 30Ω 이하 달성</li>
                <li>• <strong>서지보호기(SPD)</strong>: Class II/III 복합 10~20kA SPD를 AC/DC 인입단 1차 차단 배치</li>
                <li>• <strong>태양광 MPPT & 배터리</strong>: LiFePO4 배터리 함체 내 BMS 연결, DC 12V 5A 안정화 공급</li>
                <li>• <strong>차폐 케이블 접지</strong>: RS-485 및 셔터 트리거 펄스 케이블 실드(Shield) 1점 단일 접지</li>
              </ul>
            </div>

            {/* Step 5: Weatherproofing & Strobe */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded-lg font-bold text-xs font-mono">
                  STEP 05
                </span>
                <span className="text-[11px] text-slate-500">방수 및 조명</span>
              </div>
              <h4 className="font-bold text-sm text-white">IP66 방수 배선 & 850nm IR 스트로브 연동</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                폭우·폭설 침수를 원천 차단하고 야간 과속 단속을 위한 고출력 적외선 조명을 구성합니다.
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <li>• <strong>드립 루프(Drip Loop)</strong>: 케이블 인입 전 U자형 물방울 낙하 고리 형성 필수</li>
                <li>• <strong>메탈 케이블 글랜드</strong>: 황동 니켈도금 PG9/PG11 글랜드에 실리콘 오링 압착 마감</li>
                <li>• <strong>고어텍스 벤트(Vent)</strong>: 하우징 내부 습기 배출 및 내외부 기압 평형 통기 필터 설치</li>
                <li>• <strong>IR 스트로브 지향</strong>: 850nm IR 투광기(12~24W)를 카메라 FOV 정중앙과 100% 동기화</li>
              </ul>
            </div>

            {/* Step 6: Test & Acceptance */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-lg font-bold text-xs font-mono">
                  STEP 06
                </span>
                <span className="text-[11px] text-slate-500">현장 검수 테스트</span>
              </div>
              <h4 className="font-bold text-sm text-white">실차 통과 캘리브레이션 & 통신망 개통 검증</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                테스트 차량을 직접 주행하여 도플러 레이더 속도 정확도와 번호판 OCR 인식률을 인수합니다.
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <li>• <strong>정밀 GPS 계측 주행</strong>: 30km/h 및 50km/h로 왕복 10회 통과, 속도 오차 ±2km/h 이내 검증</li>
                <li>• <strong>셔터 트리거 래그 측정</strong>: 레이더 감지부터 셔터 노출 완료까지 지연시간 &lt; 15ms 확인</li>
                <li>• <strong>현장 스마트폰 AP 테스트</strong>: 감독관 스마트폰 접속 후 라이브 번호판 캡처 수신 확인</li>
                <li>• <strong>중앙 관제 서버 전송</strong>: LTE 통신망을 통한 MQTT/JSON 암호화 로그 수신 100% 확인</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: CRITICAL ENGINEERING CONSIDERATIONS */}
      {activeSubSection === 'considerations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Consideration 1 */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                  <Radio className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-white">
                  1. 도플러 레이더 코사인 오차(Cosine Effect)와 사각지대 극복
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                레이더는 전파가 반사되어 돌아오는 방사 속도(Radial Velocity)만을 측정하므로, 설치 위치가 도로 정중앙이 아닌
                지주대(갓길)에 위치하면 <strong>실제 속도보다 항상 느리게 측정되는 물리적 오차 (V_meas = V_real × cos θ)</strong>가 발생합니다.
              </p>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <p>• <strong>대책</strong>: 펌웨어 내 수직각(θ_tilt)과 수평 이격각(θ_yaw)을 합성한 cos(θ_3D) 보정 테이블을 적용하여 실시간 역산(V_real = V_meas / cos θ_3D)을 수행합니다.</p>
                <p>• <strong>권장치</strong>: 합성각 θ_3D ≤ 20° 이내로 유지해야 오차율이 6% 미만으로 억제되어 공단 오차 기준(±3%) 충족이 가능합니다.</p>
              </div>
            </div>

            {/* Consideration 2 */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
                  <Camera className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-white">
                  2. 1/2,000초 초고속 셔터와 조도 부족 (Global Shutter & IR Strobe)
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                시속 60km/h 주행 차량은 1초에 약 16.7m를 이동하므로, 번호판 블러(Motion Blur)를 1픽셀 미만으로 억제하려면
                최소 <strong>1/1,000s ~ 1/2,500s 초고속 셔터 스피드</strong>가 필수적입니다. 이 경우 렌즈로 들어오는 빛이 급감합니다.
              </p>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <p>• <strong>글로벌 셔터 채택</strong>: 일반 롤링 셔터(CMOS)의 젤로 현상(기울어짐)을 원천 차단하기 위해 Sony Pregius 등 글로벌 셔터 센서를 적용합니다.</p>
                <p>• <strong>하드웨어 펄스 동기화</strong>: 셔터 센서 Exposure Active GPIO 핀과 850nm IR 고출력 LED 드라이버를 직접 하드웨어 트리거로 직결(지연시간 10μs 미만)하여 찰나의 순간에만 순간 최대 광량을 투사합니다.</p>
              </div>
            </div>

            {/* Consideration 3 */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-white">
                  3. 대한민국 반사필름식 번호판 역반사 및 헤드라이트 눈부심 방지
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                2020년 이후 도입된 대한민국 8자리 반사필름 번호판(국가상징 태극문양)은 재귀반사(Retro-reflection) 특성이 매우 강하여,
                야간 투광기 빛이 번호판에 정면 입사되면 <strong>번호판 글자가 하얗게 타버리는 '화이트아웃(White-out)' 현상</strong>이 일어납니다.
              </p>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <p>• <strong>편광 필터(CPL) 장착</strong>: 렌즈 전면에 원형 편광 필터를 장착하여 난반사광 및 차량 전면 유리 반사광을 차단합니다.</p>
                <p>• <strong>듀얼 노출 / WDR 120dB</strong>: 번호판 전용 초단 노출(Short Exposure)과 배경 조망용 표준 노출을 1프레임 내 동시 합성 처리합니다.</p>
              </div>
            </div>

            {/* Consideration 4 */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
                  <Wrench className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-white">
                  4. 지주대 풍하중 흔들림(Vibration)과 캔틸레버 암 공진 억제
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                도로변 대형 화물차 통과 시 발생하는 지면 진동과 순간 돌풍은 긴 지주 암(Arm) 끝단에 부착된 카메라를 위아래로 ±30~50mm 진동시켜
                포커스 이탈 및 번호판 프레임 이탈의 주원인이 됩니다.
              </p>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <p>• <strong>가셋 플레이트 보강</strong>: 지주 기둥과 암 연결부에 삼각 보강 리브(Gusset)를 양방향 용접하여 비틀림 강성을 확보합니다.</p>
                <p>• <strong>동조 질량 댐퍼(Tuned Mass Damper)</strong>: 지주 암 끝단에 고무 탄성체 댐퍼를 배치하여 고유 진동수를 분산 흡수합니다.</p>
              </div>
            </div>

            {/* Consideration 5 */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
                  <Sun className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-white">
                  5. 혹한기 렌즈 결로/성에 방지(PTC Heater) 및 혹서기 썬실드 열관리
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                새벽 일교차로 인해 하우징 전면 글래스에 결로(김서림)가 생기거나 겨울철 영하 20℃ 혹한으로 성에가 끼면 카메라가 무력화됩니다.
                반대로 한여름 옥외 태양열 직사광선은 하우징 내부를 70℃ 이상으로 치솟게 하여 AP 과열 스로틀링을 유발합니다.
              </p>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <p>• <strong>PTC 서미스터 히터</strong>: 전면창 둘레에 12V 5W 저전력 발열선을 내장하여 외기 5℃ 이하 시 자동 통전 결로를 증발시킵니다.</p>
                <p>• <strong>이중 차광 썬실드(Sunshield)</strong>: 하우징 외측에 공기층을 둔 2중 차광 커버와 저소음 방수 팬(IP55)을 설치하여 복사열을 차단합니다.</p>
              </div>
            </div>

            {/* Consideration 6 */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-white">
                  6. 경찰청/도로교통공단 무인교통단속장비 표준 규격 준수 요건
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                법적 과태료 고지서 발부 및 단속 효력을 인정받기 위해서는 도로교통공단 무인단속장비 성능평가 및 경찰청 표준 규격을 100% 충족해야 합니다.
              </p>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <p>• <strong>속도 측정 오차 허용치</strong>: 100km/h 이하 구간에서 ±3km/h 이내 (100km/h 초과 시 ±3% 이내) 엄격 충족.</p>
                <p>• <strong>번호판 인식률(ALPR)</strong>: 주간 98.0% 이상, 야간 95.0% 이상 번호 일치율 검증 합격 필수.</p>
                <p>• <strong>단속 로그 무결성</strong>: 캡처 원본 이미지에 SHA-256 해시값 및 GPS 동기화 타임스탬프를 암호화 워터마크로 각인 저장.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: INTERACTIVE FIELD INSPECTION CHECKLIST */}
      {activeSubSection === 'checklist' && (
        <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>현장 시공 & 감리 인수 검사 체크리스트 (12대 핵심 항목)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                현장 시공 완료 후 항목별 점검 결과를 체크하여 합격률을 산출합니다.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400">인수 적합도 달성률</div>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {checklistProgress}% ({completedCheckCount}/{totalCheckCount})
                </div>
              </div>
              <div className="w-20 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    checklistProgress === 100
                      ? 'bg-emerald-500'
                      : checklistProgress >= 80
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {[
              { id: 'c1', title: '토목 기초 24MPa 양생 기간(7일 이상) 확인', category: '토목 기초' },
              { id: 'c2', title: 'M24/M30 고장력 앙카볼트 이중너트 체결 및 수직도 검사', category: '토목 기초' },
              { id: 'c3', title: '제3종 단독 접지저항 (30Ω 이하) 계측기 통과', category: '전기 안전' },
              { id: 'c4', title: 'Class II/III 복합 서지보호기(SPD 10kA) 인입부 설치', category: '전기 안전' },
              { id: 'c5', title: '레이저 레벨기 이용 레이더 빔-카메라 광축 동축 정렬 완료', category: '센서 광학' },
              { id: 'c6', title: '글로벌 셔터 트리거 펄스 GPIO 실드 차폐선 1점 접지', category: '센서 광학' },
              { id: 'c7', title: '850nm IR 스트로브 LED 플래시 동기화 지연시간 < 15μs 확인', category: '야간 조명' },
              { id: 'c8', title: 'IP66 하우징 방수 글랜드 체결 및 드립 루프(Drip Loop) 마감', category: '환경 내구' },
              { id: 'c9', title: '렌즈 전면창 결로 방지 PTC 발열선(De-fogging) 정상 통전', category: '환경 내구' },
              { id: 'c10', title: 'LTE 라우터 RSRP 수신감도 > -90dBm 및 외부 안테나 고정', category: '무선 통신' },
              { id: 'c11', title: '시험 주행 차량(30, 50km/h) 10회 통과 실측 오차 ±3% 합격', category: '계측 검증' },
              { id: 'c12', title: '단속 원본 이미지 SHA-256 해시값 생성 및 중앙 관제 전송 연동', category: '소프트웨어' },
            ].map((item) => (
              <label
                key={item.id}
                onClick={() => toggleCheckItem(item.id)}
                className={`p-3 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                  checklist[item.id]
                    ? 'bg-slate-950/90 border-emerald-500/40 text-slate-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-950'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition ${
                    checklist[item.id]
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {checklist[item.id] && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                      {item.category}
                    </span>
                    <span className={`text-xs font-semibold ${checklist[item.id] ? 'text-white' : 'text-slate-400'}`}>
                      {item.title}
                    </span>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Checklist Summary Footer */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-4 h-4 ${
                  checklistProgress === 100 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              />
              <span className="text-slate-300">
                {checklistProgress === 100
                  ? '모든 현장 검수 12개 항목이 정상 완료되었습니다. 도로교통공단 준공 승인 준비 완료.'
                  : `현재 12개 중 ${completedCheckCount}개 완료 (${12 - completedCheckCount}개 항목 미체크 상태)`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const allTrue = Object.keys(checklist).reduce((acc, k) => ({ ...acc, [k]: true }), {});
                  setChecklist(allTrue);
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
              >
                전체 항목 체크
              </button>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('monitor')}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[11px] font-bold transition cursor-pointer"
                >
                  시뮬레이터로 이동
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
