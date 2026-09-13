import React, { useEffect, useRef } from 'react';
import { ShieldAlert, X, HardDrive, Clock, Gauge, Tag } from 'lucide-react';
import { SnapshotRecord } from '../types';

interface SnapshotModalProps {
  record: SnapshotRecord | null;
  onClose: () => void;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({ record, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!record) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 320;
    canvas.height = 150;

    // Background road / vehicle scene
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 320, 150);

    // Car bumper/grille simulation
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(15, 20, 290, 110, 12);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Korean License Plate Graphic
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(40, 45, 240, 60);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 45, 240, 60);

    // Hologram strip simulation
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.fillRect(42, 47, 16, 56);

    // Plate Characters
    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 26px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(record.plate, 165, 75);

    // Corner bolts
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(52, 55, 3, 0, Math.PI * 2);
    ctx.arc(268, 55, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [record]);

  if (!record) return null;

  return (
    <div
      id="snapshotModal"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>과속 단속 증거 이미지 (SD 카드 & 서버 전송)</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="w-full h-44 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative shadow-inner">
            <canvas ref={canvasRef} id="modalCanvas" className="max-w-full max-h-full" />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-red-400 font-mono flex items-center gap-1 border border-red-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              GLOBAL SHUTTER RAW CAPTURE
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 flex items-center gap-1 mb-0.5">
                <Tag className="w-3 h-3 text-slate-500" />
                인식 번호판:
              </span>
              <strong id="modalPlate" className="text-amber-400 text-sm font-bold font-mono">
                {record.plate}
              </strong>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 flex items-center gap-1 mb-0.5">
                <Gauge className="w-3 h-3 text-slate-500" />
                측정 속도:
              </span>
              <strong id="modalSpeed" className="text-red-400 text-sm font-bold font-digital">
                {record.speed} km/h (위반)
              </strong>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 flex items-center gap-1 mb-0.5">
                <Clock className="w-3 h-3 text-slate-500" />
                촬영 시각:
              </span>
              <span id="modalTime" className="text-slate-300 font-mono font-medium">
                {record.time}
              </span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 flex items-center gap-1 mb-0.5">
                <HardDrive className="w-3 h-3 text-slate-500" />
                저장 매체:
              </span>
              <span className="text-emerald-400 font-semibold">SD 카드 / AP 서버</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
