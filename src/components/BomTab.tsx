import React, { useState } from 'react';
import { Calculator, Check, Lightbulb } from 'lucide-react';
import { BOMItem } from '../types';

export const BomTab: React.FC = () => {
  const mandatoryItems: BOMItem[] = [
    {
      id: 'radar',
      category: '필수',
      name: '24GHz FMCW 레이더 (HLK-LD2451)',
      spec: 'Hi-Link HLK-LD2451 (5V 107mA, 최대 100m, UART/BLE/GPIO)',
      price: 50000,
    },
    {
      id: 'led-pcba',
      category: '필수',
      name: 'LED 안내판 PCBA',
      spec: '1단 1열 188 LED 전용 제어 PCB',
      price: 70000,
    },
    {
      id: 'led-enclosure',
      category: '필수',
      name: 'LED 안내판 함체',
      spec: '방수 전광판 인클로저',
      price: 300000,
    },
    {
      id: 'camera',
      category: '필수',
      name: '셔터링 카메라 모듈',
      spec: 'AR0234 / 머신비전 재료비 기준',
      price: 50000,
    },
    {
      id: 'mainboard',
      category: '필수',
      name: '메인 제어보드',
      spec: '라즈베리파이4 / ESP32 산업용 메인 PCB',
      price: 300000,
    },
    {
      id: 'steel-enclosure',
      category: '필수',
      name: '산업용 쇠함체',
      spec: '옥외용 IP65 잠금식 방수 함체',
      price: 200000,
    },
    {
      id: 'solar-panel',
      category: '필수',
      name: '50W 태양광 패널',
      spec: '독립형 태양광 전원 구조',
      price: 100000,
    },
    {
      id: 'solar-controller',
      category: '필수',
      name: '태양광 충전 컨트롤러',
      spec: 'PWM/MPPT 12V 10A 컨트롤러',
      price: 50000,
    },
    {
      id: 'battery-35ah',
      category: '필수',
      name: '배터리 (35Ah)',
      spec: '독립형 전원용 축전 배터리 (35Ah)',
      price: 70000,
    },
  ];

  const [optServer, setOptServer] = useState<boolean>(false);
  const [optAP, setOptAP] = useState<boolean>(true);
  const [unitCount, setUnitCount] = useState<number>(1);

  const basePricePerUnit = mandatoryItems.reduce((sum, item) => sum + item.price, 0); // 1,190,000
  const serverPrice = optServer ? 1000000 : 0;
  const apPrice = optAP ? 100000 : 0;
  const optionPricePerUnit = serverPrice + apPrice;
  const grandTotalPerUnit = basePricePerUnit + optionPricePerUnit;
  const totalCost = grandTotalPerUnit * unitCount;

  return (
    <section id="tab-bom" className="space-y-4">
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800">
        <h2 className="text-base font-bold text-amber-400 flex items-center space-x-2 mb-2">
          <Calculator className="w-5 h-5" />
          <span>현장 시스템 하드웨어 구성 및 BOM 단가 산출서</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          요구사항 기준 필수 하드웨어 요소(배터리 35Ah 포함)와 옵션 항목(로컬 서버, AP)을 통합 관리하는 산출 단가표입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Interactive BOM Checklist & Option Selector */}
        <div className="lg:col-span-2 bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xs font-bold text-slate-200">하드웨어 단가 명세표 (필수 + 옵션 선택)</h3>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400">도입 수량:</span>
              <input
                type="number"
                min="1"
                max="100"
                value={unitCount}
                onChange={(e) => setUnitCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 bg-slate-950 border border-slate-700 text-amber-400 text-center font-bold rounded-lg px-1 py-0.5"
              />
              <span className="text-slate-400">대</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-2.5">구분</th>
                  <th className="p-2.5">구성 품목</th>
                  <th className="p-2.5">사양 및 비고</th>
                  <th className="p-2.5 text-right">단가 (원)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {mandatoryItems.map((item) => (
                  <tr
                    key={item.id}
                    className={item.id === 'battery-35ah' ? 'bg-amber-950/20' : 'hover:bg-slate-800/30'}
                  >
                    <td className="p-2.5 font-bold text-amber-400">{item.category}</td>
                    <td className={`p-2.5 font-semibold ${item.id === 'battery-35ah' ? 'text-amber-200' : ''}`}>
                      {item.name}
                    </td>
                    <td className="p-2.5 text-slate-400">{item.spec}</td>
                    <td
                      className={`p-2.5 text-right font-mono ${
                        item.id === 'battery-35ah' ? 'text-amber-300 font-bold' : ''
                      }`}
                    >
                      {item.price.toLocaleString()}
                    </td>
                  </tr>
                ))}

                {/* Optional items toggles */}
                <tr className="bg-slate-950/40 hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-purple-400">옵션</td>
                  <td className="p-2.5 font-semibold">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        id="optServerCheck"
                        checked={optServer}
                        onChange={(e) => setOptServer(e.target.checked)}
                        className="rounded accent-purple-500 cursor-pointer"
                      />
                      <span>사업장 로컬 서버</span>
                    </label>
                  </td>
                  <td className="p-2.5 text-slate-400">사업장 내 이미지 중앙DB 로컬 저장기</td>
                  <td className="p-2.5 text-right font-mono text-purple-300">1,000,000</td>
                </tr>

                <tr className="bg-slate-950/40 hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-purple-400">옵션</td>
                  <td className="p-2.5 font-semibold">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        id="optAPCheck"
                        checked={optAP}
                        onChange={(e) => setOptAP(e.target.checked)}
                        className="rounded accent-purple-500 cursor-pointer"
                      />
                      <span>무선 AP 연동 모듈</span>
                    </label>
                  </td>
                  <td className="p-2.5 text-slate-400">현장 스마트폰 직접 접속 / 서버 무선 전송</td>
                  <td className="p-2.5 text-right font-mono text-purple-300">100,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* BOM Summary Card */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 mb-3">최종 시스템 단가 합계</h3>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between text-xs text-slate-400">
                <span>필수 기본 구성비 (배터리 35Ah 포함):</span>
                <span className="font-mono text-white">{basePricePerUnit.toLocaleString()} 원</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>선택 옵션 구성비:</span>
                <span id="bomOptionTotal" className="font-mono text-purple-400">
                  {optionPricePerUnit.toLocaleString()} 원
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs sm:text-sm font-bold text-slate-200">단가 (1대 기준):</span>
                <span id="bomGrandTotal" className="text-lg sm:text-xl font-bold font-digital text-amber-400">
                  {grandTotalPerUnit.toLocaleString()} 원
                </span>
              </div>
              {unitCount > 1 && (
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-semibold text-emerald-400">총 도입금액 ({unitCount}대):</span>
                  <span className="text-base font-bold font-digital text-emerald-400">
                    {totalCost.toLocaleString()} 원
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-slate-400 leading-relaxed space-y-2">
              <p className="flex items-start gap-1.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>태양광 50W + 35Ah 배터리 시스템</strong> 적용으로 별도 220V 인입 공사 없이 24시간 연속 독립 구동이 가능합니다.
                </span>
              </p>
              <p className="flex items-start gap-1.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>무선 AP</strong> 적용 시 현장 작업자가 스마트폰으로 옥외 함체를 열지 않고 SD카드 내 캡처 이미지를 즉각 모니터링할 수 있습니다.
                </span>
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-950/40 rounded-xl border border-amber-800/60 text-xs text-amber-200 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>양산 단가 절감 팁:</strong> 100대 이상 수량 발주 시 쇠함체, 배터리 및 전광판 PCB 제작 단가가 약 35~40% 절감됩니다.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
