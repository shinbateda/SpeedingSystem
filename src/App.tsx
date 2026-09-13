/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { MonitoringTab } from './components/MonitoringTab';
import { BomTab } from './components/BomTab';
import { CameraSpecsTab } from './components/CameraSpecsTab';
import { SmartphoneTab } from './components/SmartphoneTab';
import { DurabilityTab } from './components/DurabilityTab';
import { OpenSourceTab } from './components/OpenSourceTab';
import { SnapshotModal } from './components/SnapshotModal';
import { TabType, Vehicle, SnapshotRecord } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('monitor');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [speedLimit, setSpeedLimit] = useState<number>(30);
  const [totalCarsCount, setTotalCarsCount] = useState<number>(0);
  const [overspeedCount, setOverspeedCount] = useState<number>(0);
  const [sdSavedCount, setSdSavedCount] = useState<number>(0);
  const [recentSnapshots, setRecentSnapshots] = useState<SnapshotRecord[]>([]);
  const [activeModalRecord, setActiveModalRecord] = useState<SnapshotRecord | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

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
      const record: SnapshotRecord = {
        id: vehicle.id || Date.now(),
        time: timeStr,
        plate: vehicle.plate || '12가 3456',
        speed: vehicle.speed || 40,
        isOverspeed: !!vehicle.isOverspeed,
      };

      setTotalCarsCount((prev) => prev + 1);

      if (record.isOverspeed) {
        playWarningSound();
        setOverspeedCount((prev) => prev + 1);
        setSdSavedCount((prev) => prev + 1);
        setRecentSnapshots((prev) => [record, ...prev.slice(0, 7)]);
      }
    },
    [playWarningSound]
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

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 flex-grow w-full space-y-4">
        {activeTab === 'monitor' && (
          <MonitoringTab
            totalCarsCount={totalCarsCount}
            overspeedCount={overspeedCount}
            sdSavedCount={sdSavedCount}
            recentSnapshots={recentSnapshots}
            onTriggerShutter={handleTriggerShutter}
            onOpenSnapshotModal={(rec) => setActiveModalRecord(rec)}
            soundEnabled={soundEnabled}
            speedLimit={speedLimit}
          />
        )}

        {activeTab === 'bom' && <BomTab />}

        {activeTab === 'specs' && <CameraSpecsTab />}

        {activeTab === 'smartphone' && (
          <SmartphoneTab
            speedLimit={speedLimit}
            onUpdateSpeedLimit={setSpeedLimit}
            recentSnapshots={recentSnapshots}
            onOpenSnapshotModal={(rec) => setActiveModalRecord(rec)}
          />
        )}

        {activeTab === 'durability' && <DurabilityTab />}

        {activeTab === 'opensource' && <OpenSourceTab />}
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
      />
    </div>
  );
}
