/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { MonitoringTab } from './components/MonitoringTab';
import { BomTab } from './components/BomTab';
import { PowerTab } from './components/PowerTab';
import { CameraSpecsTab } from './components/CameraSpecsTab';
import { CameraInterfaceTab } from './components/CameraInterfaceTab';
import { SmartphoneTab } from './components/SmartphoneTab';
import { CentralServerTab } from './components/CentralServerTab';
import { DurabilityTab } from './components/DurabilityTab';
import { InstallationTab } from './components/InstallationTab';
import { OpenSourceTab } from './components/OpenSourceTab';
import { YouTubeTab } from './components/YouTubeTab';
import { SnapshotModal } from './components/SnapshotModal';
import { TabType, Vehicle, SnapshotRecord } from './types';
import { Camera, Smartphone, Server, RotateCcw, Square } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('monitor');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [speedLimit, setSpeedLimit] = useState<number>(30);
  const [totalCarsCount, setTotalCarsCount] = useState<number>(0);
  const [overspeedCount, setOverspeedCount] = useState<number>(0);
  const [sdSavedCount, setSdSavedCount] = useState<number>(0);
  const [recentSnapshots, setRecentSnapshots] = useState<SnapshotRecord[]>([
    {
      id: 1726298100000,
      time: '14:32:15',
      date: '2026-09-14',
      plate: '서울34가 8291',
      speed: 48,
      isOverspeed: true,
      memo: '스쿨존 시속 48km 주행 (+18km/h 초과) - 1차 계도장 발송 완료',
      memoUpdatedAt: '2026-09-14 14:35:10',
    },
    {
      id: 1726297800000,
      time: '11:15:40',
      date: '2026-09-14',
      plate: '경기88나 2390',
      speed: 36,
      isOverspeed: true,
      memo: '어린이 등하교 시간대 경미 과속 - 현장 주의 관찰 대상',
      memoUpdatedAt: '2026-09-14 11:20:02',
    },
    {
      id: 1726297200000,
      time: '08:42:19',
      date: '2026-09-14',
      plate: '인천12다 7721',
      speed: 64,
      isOverspeed: true,
      memo: '시속 64km 위험 과속 (+34km/h) - 관할 경찰서 과태료 고지 요청',
      memoUpdatedAt: '2026-09-14 09:00:15',
    },
    {
      id: 1726211400000,
      time: '18:20:05',
      date: '2026-09-13',
      plate: '부산55라 1094',
      speed: 42,
      isOverspeed: true,
    },
    {
      id: 1726207800000,
      time: '15:08:32',
      date: '2026-09-13',
      plate: '대구29마 4481',
      speed: 57,
      isOverspeed: true,
      memo: '번호판 조명 약함 - 야간 적외선 보조 조명 각도 조정 필요',
      memoUpdatedAt: '2026-09-13 15:30:20',
    },
    {
      id: 1726121400000,
      time: '20:12:44',
      date: '2026-09-12',
      plate: '대전77거 6112',
      speed: 73,
      isOverspeed: true,
      memo: '야간 73km/h 폭주 위반 - 즉시 고발 대상',
      memoUpdatedAt: '2026-09-12 20:30:11',
    },
    {
      id: 1726040800000,
      time: '17:45:12',
      date: '2026-09-11',
      plate: '울산18하 3450',
      speed: 46,
      isOverspeed: true,
    },
    {
      id: 1726027200000,
      time: '08:14:28',
      date: '2026-09-11',
      plate: '경기42로 9012',
      speed: 52,
      isOverspeed: true,
      memo: '스쿨존 등교시간대 단속 - 1차 계도장 통보',
      memoUpdatedAt: '2026-09-11 08:30:00',
    },
    {
      id: 1725945600000,
      time: '14:20:10',
      date: '2026-09-10',
      plate: '서울59바 8819',
      speed: 68,
      isOverspeed: true,
      memo: '경찰청 교통안전과 이첩 완료',
      memoUpdatedAt: '2026-09-10 15:10:00',
    },
    {
      id: 1725859200000,
      time: '11:32:05',
      date: '2026-09-09',
      plate: '강원33조 5512',
      speed: 54,
      isOverspeed: true,
    },
    {
      id: 1725772800000,
      time: '09:05:40',
      date: '2026-09-08',
      plate: '충남62머 7193',
      speed: 49,
      isOverspeed: true,
    },
  ]);
  const [activeModalRecord, setActiveModalRecord] = useState<SnapshotRecord | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  // 자동 탭 전환 설정: 사진이 찍혔을 때 'smartphone' | 'server' | 'alternate' | 'off'
  const [autoTabSwitchTarget, setAutoTabSwitchTarget] = useState<'smartphone' | 'server' | 'alternate' | 'off'>('smartphone');
  const [lastSwitchTarget, setLastSwitchTarget] = useState<'smartphone' | 'server'>('server');
  const [autoSwitchToast, setAutoSwitchToast] = useState<{
    plate: string;
    speed: number;
    targetTab: 'smartphone' | 'server';
    time: string;
  } | null>(null);

  // 시뮬레이터 구동 상태 (전체 탭 연동 및 백그라운드 구동)
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  useEffect(() => {
    if (!autoSwitchToast) return;
    const timer = setTimeout(() => {
      setAutoSwitchToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [autoSwitchToast]);

  // 관리자 메모 갱신 핸들러
  const handleUpdateMemo = useCallback((recordId: number, memo: string) => {
    const now = new Date();
    const timeStr = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;
    const trimmed = memo.trim();

    setRecentSnapshots((prev) =>
      prev.map((rec) => {
        if (rec.id === recordId) {
          return {
            ...rec,
            memo: trimmed ? trimmed : undefined,
            memoUpdatedAt: trimmed ? timeStr : undefined,
          };
        }
        return rec;
      })
    );

    setActiveModalRecord((prev) => {
      if (prev && prev.id === recordId) {
        return {
          ...prev,
          memo: trimmed ? trimmed : undefined,
          memoUpdatedAt: trimmed ? timeStr : undefined,
        };
      }
      return prev;
    });
  }, []);

  // Audio Context Ref for Synthesizer Alarm
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playWarningSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio context may be restricted by browser policy before first user interaction
    }
  }, [soundEnabled]);

  const handleTriggerShutter = useCallback(
    (vehicle: Partial<Vehicle>) => {
      // Shutter Flash visual effect
      setIsFlashing(true);
      setTimeout(() => {
        setIsFlashing(false);
      }, 350);

      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const dateStr = now.toISOString().split('T')[0];
      const record: SnapshotRecord = {
        id: vehicle.id || Date.now(),
        time: timeStr,
        date: dateStr,
        plate: vehicle.plate || '12가 3456',
        speed: vehicle.speed || 40,
        isOverspeed: !!vehicle.isOverspeed,
      };

      setTotalCarsCount((prev) => prev + 1);

      if (record.isOverspeed) {
        playWarningSound();
        setOverspeedCount((prev) => prev + 1);
        setSdSavedCount((prev) => prev + 1);
        setRecentSnapshots((prev) => [record, ...prev.slice(0, 49)]);

        // 과속 사진이 찍혔을 때 스마트폰 과속 모니터링 및 관제서버 탭으로 자동 변경
        if (autoTabSwitchTarget !== 'off') {
          let nextTab: 'smartphone' | 'server' = 'smartphone';
          if (autoTabSwitchTarget === 'smartphone') {
            nextTab = 'smartphone';
          } else if (autoTabSwitchTarget === 'server') {
            nextTab = 'server';
          } else if (autoTabSwitchTarget === 'alternate') {
            nextTab = lastSwitchTarget === 'smartphone' ? 'server' : 'smartphone';
            setLastSwitchTarget(nextTab);
          }

          setActiveTab(nextTab);
          setAutoSwitchToast({
            plate: record.plate,
            speed: record.speed,
            targetTab: nextTab,
            time: record.time,
          });
        }
      }
    },
    [playWarningSound, autoTabSwitchTarget, lastSwitchTarget]
  );

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Shutter Camera Flash Overlay */}
      <div
        id="flashOverlay"
        className={`fixed inset-0 pointer-events-none z-50 transition-opacity ${
          isFlashing ? 'shutter-flash' : 'opacity-0'
        }`}
      />

      {/* Top Header */}
      <Header
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />

      {/* Navigation Tabs */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 과속 단속 사진 촬영 시 자동 화면 이동 안내 배너 */}
      {autoSwitchToast && (
        <div
          id="autoSwitchNotification"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] bg-slate-900/95 border border-amber-500/80 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 ring-2 ring-amber-500/30"
        >
          <div className="flex items-center gap-3 text-xs min-w-0">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 border border-amber-500/30">
              <Camera className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-white">과속 단속 사진 촬영 연동</span>
                <span className="bg-red-950 text-red-300 border border-red-800 px-1.5 py-0.5 rounded font-mono font-black text-[11px]">
                  {autoSwitchToast.plate}
                </span>
                <span className="text-red-400 font-mono font-bold text-[11px]">
                  {autoSwitchToast.speed} km/h
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 truncate">
                [{autoSwitchToast.targetTab === 'smartphone' ? '2. 스마트폰 과속 모니터링' : '3. 관제 서버'}] 탭으로 자동 화면 전환되었습니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setActiveTab('monitor');
                setAutoSwitchToast(null);
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shadow"
              title="1. 시뮬레이터 탭으로 즉시 복귀"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>시뮬레이터 복귀</span>
            </button>
            <button
              onClick={() => setAutoSwitchToast(null)}
              className="text-slate-400 hover:text-white text-sm p-1 cursor-pointer"
              title="닫기"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 flex-grow w-full space-y-4">
        {/* 시뮬레이터 탭: 탭 전환 후에도 백그라운드 시뮬레이션 연속성을 위해 유지 */}
        <div className={activeTab === 'monitor' ? 'block' : 'hidden'}>
          <MonitoringTab
            totalCarsCount={totalCarsCount}
            overspeedCount={overspeedCount}
            sdSavedCount={sdSavedCount}
            recentSnapshots={recentSnapshots}
            onTriggerShutter={handleTriggerShutter}
            onOpenSnapshotModal={(rec) => setActiveModalRecord(rec)}
            onUpdateMemo={handleUpdateMemo}
            soundEnabled={soundEnabled}
            speedLimit={speedLimit}
            onNavigateTab={setActiveTab}
            isSimulating={isSimulating}
            onToggleSimulating={() => setIsSimulating((prev) => !prev)}
            autoTabSwitchTarget={autoTabSwitchTarget}
            onChangeAutoTabSwitchTarget={setAutoTabSwitchTarget}
          />
        </div>

        {activeTab === 'opensource' && <OpenSourceTab />}

        {activeTab === 'youtube' && <YouTubeTab />}

        {activeTab === 'bom' && <BomTab />}

        {activeTab === 'power' && <PowerTab />}

        {activeTab === 'specs' && <CameraSpecsTab />}

        {activeTab === 'interface' && <CameraInterfaceTab />}

        {activeTab === 'smartphone' && (
          <SmartphoneTab
            speedLimit={speedLimit}
            onUpdateSpeedLimit={setSpeedLimit}
            recentSnapshots={recentSnapshots}
            onOpenSnapshotModal={(rec) => setActiveModalRecord(rec)}
            onTriggerShutter={handleTriggerShutter}
            soundEnabled={soundEnabled}
            onNavigateTab={setActiveTab}
            isSimulating={isSimulating}
            onToggleSimulating={() => setIsSimulating((prev) => !prev)}
            autoTabSwitchTarget={autoTabSwitchTarget}
            onChangeAutoTabSwitchTarget={setAutoTabSwitchTarget}
          />
        )}

        {activeTab === 'server' && (
          <CentralServerTab
            recentSnapshots={recentSnapshots}
            speedLimit={speedLimit}
            onOpenSnapshotModal={(rec) => setActiveModalRecord(rec)}
            onNavigateTab={setActiveTab}
            isSimulating={isSimulating}
            onToggleSimulating={() => setIsSimulating((prev) => !prev)}
            onTriggerShutter={handleTriggerShutter}
            autoTabSwitchTarget={autoTabSwitchTarget}
            onChangeAutoTabSwitchTarget={setAutoTabSwitchTarget}
          />
        )}

        {activeTab === 'durability' && <DurabilityTab />}

        {activeTab === 'installation' && <InstallationTab onNavigateTab={setActiveTab} />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          ESP32 & 라즈베리파이 기반 지능형 과속 단속 및 셔터 카메라 관제 시스템 대화형 분석 보고서
        </div>
      </footer>

      {/* Snapshot Modal */}
      <SnapshotModal
        record={activeModalRecord}
        onClose={() => setActiveModalRecord(null)}
        onUpdateMemo={handleUpdateMemo}
      />
    </div>
  );
}
