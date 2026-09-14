import React from 'react';
import { BatteryCharging, Disc } from 'lucide-react';

interface SchoolZoneSpeedSignProps {
  speed: number;
  speedLimit: number;
  isOverspeed: boolean;
  sdStatus: string;
  batteryVoltage?: number;
}

// 7-Segment activation map
const SEGMENTS: Record<string, string[]> = {
  ' ': [],
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'e', 'd', 'c', 'g'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
};

// Realistic Dot Matrix Digit Renderer
interface DigitProps {
  digit: string;
  activeColor: string;
  unlitColor: string;
  glow: boolean;
  isHundreds?: boolean;
}

const LedDigit: React.FC<DigitProps> = ({
  digit,
  activeColor,
  unlitColor,
  glow,
  isHundreds = false,
}) => {
  const activeSegs = SEGMENTS[digit] || [];

  // Helper to render a dot with unlit vs active state
  const renderDot = (cx: number, cy: number, seg: string, key: string) => {
    const isLit = activeSegs.includes(seg);
    return (
      <circle
        key={key}
        cx={cx}
        cy={cy}
        r={2.2}
        fill={isLit ? activeColor : unlitColor}
        className={isLit && glow ? 'transition-all duration-150' : 'transition-colors duration-200'}
        style={{
          filter: isLit && glow ? 'drop-shadow(0 0 3.5px currentColor)' : undefined,
          opacity: isLit ? 1 : 0.35,
        }}
      />
    );
  };

  if (isHundreds) {
    // 1st digit (hundreds): only segments 'b' and 'c' (the vertical '1')
    const isLit = digit === '1';
    const dots: React.ReactNode[] = [];
    // Top vertical column (seg b)
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 2; col++) {
        dots.push(renderDot(10 + col * 6, 12 + row * 6, 'b', `h_b_${row}_${col}`));
      }
    }
    // Bottom vertical column (seg c)
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 2; col++) {
        dots.push(renderDot(10 + col * 6, 60 + row * 6, 'c', `h_c_${row}_${col}`));
      }
    }

    return (
      <svg width="32" height="114" viewBox="0 0 28 114" className="overflow-visible select-none">
        {dots}
      </svg>
    );
  }

  // Full 7-segment digit (Tens or Units)
  const dots: React.ReactNode[] = [];

  // Seg a (top horizontal: 2 rows of 6 dots)
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 6; col++) {
      dots.push(renderDot(13 + col * 6, 8 + row * 6, 'a', `a_${row}_${col}`));
    }
  }

  // Seg b (top-right vertical: 6 rows of 2 dots)
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 2; col++) {
      dots.push(renderDot(46 + col * 6, 18 + row * 6, 'b', `b_${row}_${col}`));
    }
  }

  // Seg g (middle horizontal: 2 rows of 6 dots)
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 6; col++) {
      dots.push(renderDot(13 + col * 6, 52 + row * 6, 'g', `g_${row}_${col}`));
    }
  }

  // Seg c (bottom-right vertical: 6 rows of 2 dots)
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 2; col++) {
      dots.push(renderDot(46 + col * 6, 62 + row * 6, 'c', `c_${row}_${col}`));
    }
  }

  // Seg d (bottom horizontal: 2 rows of 6 dots)
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 6; col++) {
      dots.push(renderDot(13 + col * 6, 96 + row * 6, 'd', `d_${row}_${col}`));
    }
  }

  // Seg e (bottom-left vertical: 6 rows of 2 dots)
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 2; col++) {
      dots.push(renderDot(4 + col * 6, 62 + row * 6, 'e', `e_${row}_${col}`));
    }
  }

  // Seg f (top-left vertical: 6 rows of 2 dots)
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 2; col++) {
      dots.push(renderDot(4 + col * 6, 18 + row * 6, 'f', `f_${row}_${col}`));
    }
  }

  return (
    <svg width="64" height="114" viewBox="0 0 58 114" className="overflow-visible select-none">
      {dots}
    </svg>
  );
};

export const SchoolZoneSpeedSign: React.FC<SchoolZoneSpeedSignProps> = ({
  speed,
  speedLimit,
  isOverspeed,
  sdStatus,
  batteryVoltage = 13.8,
}) => {
  // Format speed into 3 digits for "188"
  // If speed is 0 or not detected: show dim 88 (or blank hundreds + 00)
  let d1 = ' '; // hundreds: '1' or ' '
  let d2 = '0'; // tens: '0'..'9'
  let d3 = '0'; // units: '0'..'9'

  if (speed > 0) {
    const s = Math.min(199, Math.round(speed));
    if (s >= 100) {
      d1 = '1';
      const remainder = s - 100;
      d2 = String(Math.floor(remainder / 10));
      d3 = String(remainder % 10);
    } else {
      d1 = ' ';
      d2 = String(Math.floor(s / 10));
      d3 = String(s % 10);
    }
  } else {
    d1 = ' ';
    d2 = '0';
    d3 = '0';
  }

  // LED Colors:
  // Overspeed: Vibrant Bright Red/Orange with pulse glow
  // Normal Speed: Vibrant Neon Green with gentle glow
  // Dim Unlit Dots: Olive Green-Grey (matching Image 2)
  const activeColor = isOverspeed ? '#ef4444' : speed > 0 ? '#22c55e' : '#15803d';
  const unlitColor = '#1e3a29'; // Dim olive-green dot appearance

  return (
    <div className="flex flex-col items-center justify-between w-full h-full select-none">
      {/* 1. TOP POLE & CAMERAS FIXTURE (Matching Image 2 Top Section) */}
      <div className="relative w-full flex justify-center items-end pt-1 pb-0">
        {/* Vertical Pole (Upper) */}
        <div className="absolute top-0 bottom-0 w-9 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-500 rounded-sm shadow-inner z-0" />

        {/* Mounting Swivel Clamps & Arms */}
        <div className="relative z-10 w-full max-w-[280px] flex items-center justify-center -mb-2">
          {/* Main Top ALPR/CCTV Bullet Camera with IR Ring */}
          <div className="flex flex-col items-center">
            {/* Camera Sunshield Housing */}
            <div className="relative bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border border-slate-600 rounded-t-xl rounded-b-md px-3 py-1.5 shadow-2xl flex flex-col items-center min-w-[90px]">
              {/* Sun Visor Lip */}
              <div className="w-full h-1.5 bg-slate-600 rounded-t-lg -mt-1 mb-1 border-b border-slate-500" />

              {/* Front Faceplate with Lens & IR Array */}
              <div className="relative w-16 h-12 bg-slate-950 rounded-md border border-slate-700 flex items-center justify-center p-1 shadow-inner">
                {/* 18 IR LEDs circular pattern */}
                <div className="absolute inset-1 grid grid-cols-6 gap-0.5 pointer-events-none opacity-85">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full mx-auto my-auto ${
                        isOverspeed
                          ? 'bg-red-500/80 shadow-[0_0_3px_red]'
                          : 'bg-slate-500 border border-slate-400/50'
                      }`}
                    />
                  ))}
                </div>

                {/* Central Optical Lens */}
                <div className="relative z-10 w-6 h-6 rounded-full bg-gradient-to-br from-slate-900 via-cyan-950 to-black border-2 border-slate-400 shadow-lg flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400/70 shadow-[0_0_5px_#22d3ee]" />
                </div>

                {/* 'IR' label under lens */}
                <span className="absolute bottom-0.5 font-bold font-mono text-[8px] text-slate-400 tracking-tighter">
                  IR
                </span>
              </div>

              {/* Camera Swivel Neck Bracket */}
              <div className="w-4 h-3 bg-slate-700 border-x border-slate-600" />
              <div className="w-8 h-2 bg-slate-600 rounded-sm border border-slate-500 shadow" />
            </div>
          </div>

          {/* Secondary Radar / Shutter Sensor Box (Mounted on Side Bracket) */}
          <div className="absolute right-3 top-6 flex items-center z-10">
            {/* Horizontal Arm */}
            <div className="w-6 h-2.5 bg-gradient-to-b from-slate-300 to-slate-500 border border-slate-600 shadow" />
            {/* Sensor Box */}
            <div className="relative bg-gradient-to-r from-slate-700 to-slate-800 border border-slate-600 rounded-md w-14 h-10 shadow-xl flex items-center justify-center overflow-hidden">
              {/* Heat Sink Cooling Fins */}
              <div className="absolute inset-y-0 right-0 w-4 flex flex-col justify-evenly py-1 border-l border-slate-700/80 bg-slate-900/60">
                <span className="h-0.5 w-full bg-slate-700" />
                <span className="h-0.5 w-full bg-slate-700" />
                <span className="h-0.5 w-full bg-slate-700" />
                <span className="h-0.5 w-full bg-slate-700" />
              </div>
              {/* Radar/Camera Aperture */}
              <div className="w-5 h-5 rounded-full bg-black border border-slate-500 flex items-center justify-center -ml-2 shadow-inner">
                <div className="w-2 h-2 rounded-full bg-amber-400/80 shadow-[0_0_4px_#f59e0b]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN SCHOOL ZONE SIGNBOARD (Yellow Plate with Black Border - Exact match to Image 2) */}
      <div className="relative z-10 w-full max-w-[285px] bg-[#f59e0b] border-[3.5px] border-[#0f172a] rounded-[22px] p-3 shadow-2xl flex flex-col items-center justify-between text-slate-950 font-black">
        {/* Subtle retroreflective texture & inner border line */}
        <div className="absolute inset-1.5 border border-[#0f172a]/20 rounded-[18px] pointer-events-none" />

        {/* TOP SECTION: 30 SPEED LIMIT CIRCLE & FLASHING STROBES */}
        <div className="relative w-full flex items-center justify-between px-1.5 pt-1 pb-1">
          {/* LEFT: RED WARNING STROBE LAMP */}
          <div className="relative flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-full border-2 border-slate-900 shadow-md flex items-center justify-center transition-all duration-100 ${
                isOverspeed
                  ? 'bg-red-600 strobe-red-active'
                  : 'bg-gradient-to-br from-red-700 via-red-800 to-red-950'
              }`}
            >
              {/* Fresnel Lens Texture (Concentric rings) */}
              <div className="w-9 h-9 rounded-full border border-red-500/40 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border border-red-400/50 flex items-center justify-center">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isOverspeed ? 'bg-white shadow-[0_0_10px_white]' : 'bg-red-400/80'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CENTER: SPEED LIMIT CIRCLE (Red Border, White Center, Bold 30) */}
          <div className="w-20 h-20 rounded-full bg-white border-[6px] border-[#dc2626] shadow-lg flex items-center justify-center z-10">
            <span className="font-extrabold text-3xl tracking-tighter text-black font-sans leading-none">
              {speedLimit}
            </span>
          </div>

          {/* RIGHT: BLUE WARNING STROBE LAMP */}
          <div className="relative flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-full border-2 border-slate-900 shadow-md flex items-center justify-center transition-all duration-100 ${
                isOverspeed
                  ? 'bg-blue-600 strobe-blue-active'
                  : 'bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950'
              }`}
            >
              {/* Fresnel Lens Texture (Concentric rings) */}
              <div className="w-9 h-9 rounded-full border border-blue-500/40 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border border-blue-400/50 flex items-center justify-center">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isOverspeed ? 'bg-white shadow-[0_0_10px_white]' : 'bg-blue-400/80'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION TITLE: '당신의 속도' (YOUR SPEED) */}
        <div className="w-full text-center py-1">
          <h2 className="text-[26px] tracking-tight text-[#0f172a] font-extrabold drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
            당신의 속도
          </h2>
        </div>

        {/* CENTER: 188 LED DOT MATRIX RECESSED DISPLAY (Exact match to Image 2) */}
        <div
          id="dfsSpeedDisplay"
          className="w-full bg-[#070b0e] border-[3px] border-[#0f172a] rounded-xl p-2.5 shadow-2xl flex items-center justify-center relative overflow-hidden my-0.5"
        >
          {/* Glass glare overlay */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none" />

          {/* 3 Digits: [Hundreds '1'] + [Tens '8'] + [Units '8'] */}
          <div className="flex items-center justify-center gap-1.5 py-1">
            {/* Hundreds digit (1 or blank) */}
            <LedDigit
              digit={d1}
              activeColor={activeColor}
              unlitColor={unlitColor}
              glow={speed >= 100}
              isHundreds={true}
            />
            {/* Tens digit */}
            <LedDigit
              digit={d2}
              activeColor={activeColor}
              unlitColor={unlitColor}
              glow={speed > 0}
            />
            {/* Units digit */}
            <LedDigit
              digit={d3}
              activeColor={activeColor}
              unlitColor={unlitColor}
              glow={speed > 0}
            />
          </div>

          {/* Small Unit Tag at bottom-right corner */}
          <span className="absolute bottom-1 right-2 font-mono text-[9px] text-slate-500 font-bold">
            km/h
          </span>
        </div>

        {/* BOTTOM TITLE: '과속 단속' (SPEED ENFORCEMENT) */}
        <div className="w-full text-center pt-2 pb-1">
          <h3 className="text-[26px] tracking-widest text-[#0f172a] font-extrabold drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
            과속 단속
          </h3>
        </div>
      </div>

      {/* 3. LOWER POLE & INTEGRATED TELEMETRY DOCK */}
      <div className="relative w-full flex flex-col items-center z-0 pt-0">
        {/* Steel Pole Column */}
        <div className="w-9 h-6 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-500 shadow-md border-x border-slate-400 -mt-0.5" />

        {/* Compact Operational Status Capsule */}
        <div className="w-full max-w-[285px] bg-slate-900/95 border border-slate-800 rounded-xl p-2.5 shadow-lg space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Disc className="w-3 h-3 text-cyan-400" />
              카메라 셔터 연동:
            </span>
            <span
              id="sdStatusText"
              className={`font-semibold ${
                sdStatus === 'saving' ? 'text-red-400 animate-pulse font-bold' : 'text-slate-300'
              }`}
            >
              {sdStatus === 'saving' ? 'SD 저장 중! (OK)' : '대기 중 (Ready)'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
            <span className="text-slate-400 flex items-center gap-1">
              <BatteryCharging className="w-3 h-3 text-emerald-400" />
              태양광 & 배터리(35Ah):
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              {batteryVoltage.toFixed(1)}V (정상 충전)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
