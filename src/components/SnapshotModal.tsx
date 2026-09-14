import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldAlert,
  X,
  HardDrive,
  Clock,
  Gauge,
  Tag,
  FileText,
  Save,
  Check,
  Trash2,
  Bookmark,
} from 'lucide-react';
import { SnapshotRecord } from '../types';

interface SnapshotModalProps {
  record: SnapshotRecord | null;
  onClose: () => void;
  onUpdateMemo?: (recordId: number, memo: string) => void;
}

const PRESET_MEMOS = [
  '과태료 고지서 발송',
  '경찰청 교통안전과 이첩',
  '스쿨존 상습위반 관찰',
  '번호판 오염/식별 점검',
  '현장 계도 조치 완료',
];

export const SnapshotModal: React.FC<SnapshotModalProps> = ({ record, onClose, onUpdateMemo }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [memoText, setMemoText] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (record) {
      setMemoText(record.memo || '');
      setIsSaved(false);
    }
  }, [record]);

  const handleSave = () => {
    if (!record || !onUpdateMemo) return;
    onUpdateMemo(record.id, memoText);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const handleClear = () => {
    if (!record || !onUpdateMemo) return;
    setMemoText('');
    onUpdateMemo(record.id, '');
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const handleAddPreset = (preset: string) => {
    setMemoText((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return preset;
      if (trimmed.includes(preset)) return trimmed;
      return `${trimmed} / ${preset}`;
    });
  };

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
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>과속 단속 증거 및 관리 상세 정보</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shutter Canvas & Plate Details */}
        <div className="space-y-3">
          <div className="w-full h-40 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative shadow-inner">
            <canvas ref={canvasRef} id="modalCanvas" className="max-w-full max-h-full" />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-red-400 font-mono flex items-center gap-1 border border-red-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              GLOBAL SHUTTER RAW CAPTURE
            </div>
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-emerald-400 font-mono">
              OCR 99.4%
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
                촬영 일시:
              </span>
              <span id="modalTime" className="text-slate-300 font-mono font-medium">
                {record.date ? `${record.date} ` : ''}
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

        {/* Admin Memo Section */}
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>단속 사례 관리자 메모 (Admin Memo)</span>
            </label>
            {record.memoUpdatedAt && (
              <span className="text-[10px] text-slate-500 font-mono">
                최종 수정: {record.memoUpdatedAt}
              </span>
            )}
          </div>

          <textarea
            id="adminMemoTextarea"
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            rows={3}
            placeholder="특이사항, 단속 통지서 발송 여부, 계도 조치, 차종 정보 등 관리자 코멘트를 입력하세요..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 resize-none transition"
          />

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-slate-500 flex items-center gap-0.5 mr-0.5">
              <Bookmark className="w-2.5 h-2.5" /> 빠른 추가:
            </span>
            {PRESET_MEMOS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleAddPreset(preset)}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 px-2 py-0.5 rounded-md transition cursor-pointer"
              >
                + {preset}
              </button>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-[10px] text-slate-500">
              {memoText.trim().length > 0 ? (
                <span className="text-slate-400 font-mono">{memoText.length}자 입력됨</span>
              ) : (
                <span>작성된 메모 없음</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {record.memo && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-lg text-xs font-medium border border-slate-800 hover:border-red-800/40 transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>메모 삭제</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSave}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  isSaved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                }`}
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>저장 완료</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>메모 저장</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="pt-1">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            창 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
