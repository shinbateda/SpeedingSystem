import React, { useState } from 'react';
import { Smartphone, ShieldCheck, Download, Wifi, Check, Cpu } from 'lucide-react';
import { SnapshotRecord } from '../types';

interface SmartphoneTabProps {
  speedLimit: number;
  onUpdateSpeedLimit: (newLimit: number) => void;
  recentSnapshots: SnapshotRecord[];
  onOpenSnapshotModal: (record: SnapshotRecord) => void;
}

export const SmartphoneTab: React.FC<SmartphoneTabProps> = ({
  speedLimit,
  onUpdateSpeedLimit,
  recentSnapshots,
  onOpenSnapshotModal,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const handleDownloadClick = () => {
    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 2500);
  };

  return (
    <section id="tab-smartphone" className="space-y-4">
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800">
        <h2 className="text-base font-bold text-amber-400 flex items-center space-x-2 mb-2">
          <Smartphone className="w-5 h-5" />
          <span>스마트폰 AP 직결 모니터링 & 광절연 셔터 회로</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          현장 관리자가 스마트폰 Wi-Fi로 AP 모듈에 직접 접속하여 옥외 함체를 열지 않고 SD카드 저장 이미지를 확인하고 단속 기준 속도({speedLimit}km/h)를 즉시 변경하는 스마트 관제 모드입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Smartphone App UI Simulator */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col items-center">
          <h3 className="text-xs font-bold text-slate-200 mb-3 w-full text-left">
            스마트폰 웹 AP 접속 화면 모의 뷰어
          </h3>

          {/* Smartphone Phone Frame */}
          <div className="w-72 bg-slate-950 border-4 border-slate-800 rounded-[32px] p-3.5 shadow-2xl space-y-3 font-sans">
            {/* Top Status Bar */}
            <div className="bg-slate-900 rounded-t-2xl p-2 text-center text-[10px] text-slate-400 border-b border-slate-800 flex justify-between items-center px-3">
              <span className="flex items-center gap-1 font-mono text-emerald-400">
                <Wifi className="w-3 h-3" /> Speed_AP_192.168.4.1
              </span>
              <span>100% 🔋</span>
            </div>

            {/* Config Box */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-amber-400 block">📱 현장 설정 및 SD 갤러리</span>
              <div className="text-[11px] space-y-2 text-slate-300">
                <div className="flex justify-between items-center">
                  <span>단속 제한속도:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={speedLimit}
                      onChange={(e) => onUpdateSpeedLimit(Math.max(10, parseInt(e.target.value) || 30))}
                      className="w-14 bg-slate-950 text-amber-400 border border-slate-700 rounded text-center py-1 font-bold text-xs"
                    />
                    <span className="text-[10px] text-slate-400">km/h</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>SD 저장소 사용량:</span>
                  <span className="text-emerald-400 font-mono font-semibold">14.2 GB / 32 GB</span>
                </div>
              </div>
            </div>

            {/* Mini Captured List in Mobile */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 block font-medium">최근 SD 저장 과속 캡처</span>
              {recentSnapshots.length > 0 ? (
                recentSnapshots.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onOpenSnapshotModal(item)}
                    className="p-2 bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-800 text-[10px] flex flex-col gap-1 cursor-pointer transition"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-red-400">{item.speed} km/h (위반)</span>
                      <span className="text-slate-400 font-mono">{item.time}</span>
                    </div>
                    {item.memo && (
                      <div className="text-[9px] text-amber-300/90 truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span className="truncate">{item.memo}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-[10px] flex justify-between items-center">
                    <span className="font-bold text-red-400">42 km/h (위반)</span>
                    <span className="text-slate-400 font-mono">14:02:11.jpg</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-[10px] flex justify-between items-center">
                    <span className="font-bold text-red-400">36 km/h (위반)</span>
                    <span className="text-slate-400 font-mono">14:05:44.jpg</span>
                  </div>
                </>
              )}
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadClick}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-950" />
                  <span>다운로드 준비 완료 (ZIP 생성)</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>SD카드 이미지 전체 다운로드</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Optocoupler Schematic & Code */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>하드웨어 포토커플러(PC817) 광절연 트리거 아키텍처</span>
          </h3>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 font-mono text-xs text-slate-300">
            <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
              <span className="text-amber-400">[HLK-LD2451 24GHz FMCW]</span>
              <span>→ UART RX/TX (115200) & GPIO OT1 (0~100m, BLE 앱 연동)</span>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
              <span className="text-emerald-400">[1단1열 188 LED PCB]</span>
              <span>← UART RX/TX (속도 실시간 출력)</span>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
              <span className="text-red-400">[Optocoupler PC817]</span>
              <span>← GPIO 25 (속도 ≥ {speedLimit}km/h 50ms 펄스)</span>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
              <span className="text-purple-400">[SD & AP 모듈]</span>
              <span>↔ SPI / Local Web Server 전송</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>전기적 서지 차단 보증:</strong> 카메라 셔터 단자는 PC817 광절연 방식을 적용하여 태양광 충전 인버터 및 레이더 펄스 역기전력 서지 전압으로부터 메인 제어보드를 완벽히 보호합니다.
            </div>
          </div>

          <div className="p-3 bg-blue-950/30 rounded-xl border border-blue-800/40 text-xs text-blue-200">
            <strong>💡 AP 다이렉트 웹 서버 동작:</strong> ESP32/라즈베리파이가 독립 <code>SoftAP (192.168.4.1)</code>를 항시 브로드캐스트하여 현장 유지보수 기사가 LTE 망 연결 없이 스마트폰 브라우저로 설정 변경 및 펌웨어 OTA 업데이트를 수행할 수 있습니다.
          </div>
        </div>
      </div>
    </section>
  );
};
