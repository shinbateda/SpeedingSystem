import React from 'react';
import { Gauge, Volume2, VolumeX, Play, Square } from 'lucide-react';

interface HeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  isSimulating?: boolean;
  onToggleSimulating?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  soundEnabled,
  onToggleSound,
  isSimulating = false,
  onToggleSimulating,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 flex items-center justify-center">
          <Gauge className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white leading-tight flex items-center gap-2">
            <span>스피드 관제 & 카메라 연동 시스템</span>
            <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
              Ver 2.6
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            도플러 레이더 · 1단1열 188 LED 전광판 · SD저장/AP서버 전송 · 독립 태양광+35Ah 배터리
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Simulation Quick Control Button (Global Header) */}
        {onToggleSimulating && (
          <button
            id="headerSimToggleBtn"
            onClick={onToggleSimulating}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow ${
              isSimulating
                ? 'bg-red-600 hover:bg-red-500 text-white ring-2 ring-red-400/50 animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-600 text-emerald-100 border border-emerald-500/50'
            }`}
            title={isSimulating ? '실시간 주행 시뮬레이션을 즉시 중지합니다' : '실시간 주행 시뮬레이션을 시작합니다'}
          >
            {isSimulating ? (
              <>
                <Square className="w-3.5 h-3.5 fill-white text-white" />
                <span className="font-extrabold">시뮬레이션 중지</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span>시뮬레이션 시작</span>
              </>
            )}
          </button>
        )}

        <button
          id="soundToggleBtn"
          onClick={onToggleSound}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center space-x-1.5 border border-slate-700 transition cursor-pointer"
          title="경보음 토글"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline font-medium text-emerald-400">경보음 ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline font-medium text-slate-500">경보음 OFF</span>
            </>
          )}
        </button>
        <div className="flex items-center space-x-1.5 bg-emerald-950/80 text-emerald-400 text-xs px-3 py-1.5 rounded-full border border-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold hidden sm:inline">시스템 정상 작동</span>
        </div>
      </div>
    </header>
  );
};
