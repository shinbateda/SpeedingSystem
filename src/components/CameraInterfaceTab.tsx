import React, { useState, useEffect, useRef } from 'react';
import {
  Cable,
  Cpu,
  Zap,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Layers,
  ArrowRight,
  HelpCircle,
  Clock,
  Gauge,
  Info,
} from 'lucide-react';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type InterfaceType = 'gmsl2' | 'mipi' | 'usb';

interface InterfaceDetail {
  id: InterfaceType;
  name: string;
  subName: string;
  badge: string;
  badgeColor: string;
  summary: string;
  bandwidth: string;
  latency: string;
  maxDistance: string;
  cableType: string;
  connector: string;
  powerDelivery: string;
  cpuLoad: string;
  moduleCost: string;
  receiverCost: string;
  totalCostEstimate: string;
  emiImmunity: string;
  driverEase: string;
  pros: string[];
  cons: string[];
  idealFor: string;
  diagramSteps: { label: string; desc: string; isCable?: boolean }[];
}

export const CameraInterfaceTab: React.FC = () => {
  const [selectedInterface, setSelectedInterface] = useState<InterfaceType>('gmsl2');
  const [simulatedDistance, setSimulatedDistance] = useState<number>(8); // meters
  const [installationEnv, setInstallationEnv] = useState<'separated_pole' | 'compact_allinone' | 'mid_pole'>('separated_pole');

  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const interfaces: Record<InterfaceType, InterfaceDetail> = {
    gmsl2: {
      id: 'gmsl2',
      name: 'GMSL2 (Gigabit Multimedia Serial Link 2)',
      subName: 'Analog Devices(구 Maxim) 오토모티브 SerDes 고속 직렬 전송 규격',
      badge: '원거리 폴대 분리 설치 최적',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      summary:
        '단일 50Ω 동축 케이블(Coax) 1선으로 비압축 6Gbps 비디오 데이터, 양방향 I2C/UART 제어 신호 및 PoC(Power over Coax) 전원 공급을 최대 15m 이상 무손실 전송하는 오토모티브 표준 인터페이스입니다.',
      bandwidth: '최대 6.0 Gbps (RAW12 비압축 4K@30fps / 1080p@90fps 지원)',
      latency: '< 1.5 ms (SerDes 전용 하드웨어 파이프라인, 프레임 버퍼 지연 제로)',
      maxDistance: '최대 15m ~ 20m (규격 보증 15m, 리피터 없이 고속 전송)',
      cableType: 'RG174 / RTK031 싱글 코액셜(Coaxial) 동축 케이블 (외경 2.8~3.2mm)',
      connector: 'FAKRA / Mini-FAKRA (AEC-Q100 전장용 IP67/IP69K 방수·방진 원터치 락킹)',
      powerDelivery: 'PoC (Power over Coax): 동축 신호선 1선으로 12V/24V 센서 전원 일체형 공급',
      cpuLoad: '극저 부하 (수신단 역직렬화기가 MIPI CSI-2로 직접 변환하여 SoC DMA 직결)',
      moduleCost: '약 110,000원 ~ 180,000원 (AR0234 센서 + MAX9295 Serializer IC 탑재)',
      receiverCost: '약 150,000원 ~ 290,000원 (라즈베리파이 4B/5용 MAX9296 Deserializer HAT 보드)',
      totalCostEstimate: '약 290,000원 ~ 490,000원 (센서 모듈 + FAKRA 케이블 10m + Deserializer HAT)',
      emiImmunity: '최상 (차량용 AEC-Q100 인증, 50Ω 완전 밀폐 차폐로 도로변 서지·노이즈 완벽 차단)',
      driverEase: '보통~난이도 있음 (Device Tree 오버레이 및 I2C 직렬화기/역직렬화기 V4L2 드라이버 설정)',
      pros: [
        '가로등 상단 카메라(6m)와 하단 제어함(1.5m) 간 10~15m 단일 케이블로 배선 종결',
        'PoC 전원 중첩으로 별도의 전원 어댑터 배선 없이 얇은 동축 케이블 1가닥만 포설 가능',
        '원터치 FAKRA 방수 커넥터로 옥외 비바람, 진동, 결로 환경에서 접촉 불량 제로',
        '비압축 고속 RAW 데이터 전송으로 번호판 OCR 인식률 및 모션 블러 방지 극대화',
      ],
      cons: [
        '수신단(라즈베리파이/임베디드 보드)에 고가의 전용 Deserializer 보드/HAT 추가 장착 필수',
        '초기 자재 비용(BOM)이 MIPI나 USB 대비 3~5배 높음',
        '드라이버 세팅 시 I2C 포워딩 주소 및 SerDes 링크 주파수 설정 필요',
      ],
      idealFor: '가로등·신호등 기둥 상단 분리 거치형 과속 단속 카메라, 상용 스마트 스쿨존 과속 제어기',
      diagramSteps: [
        { label: 'AR0234 센서', desc: 'MIPI CSI-2 출력' },
        { label: 'MAX9295 직렬화기', desc: 'SerDes 6Gbps 변환' },
        { label: 'FAKRA 동축 케이블 (15m)', desc: '비디오 + I2C + 12V PoC 전원', isCable: true },
        { label: 'MAX9296 역직렬화기', desc: 'MIPI CSI-2 복원 HAT' },
        { label: '라즈베리파이 4B/5', desc: 'ISP 하드웨어 파이프라인' },
      ],
    },
    mipi: {
      id: 'mipi',
      name: 'MIPI CSI-2 (Mobile Industry Processor Interface)',
      subName: '모바일 및 임베디드 SoC 네이티브 다이렉트 차동 버스 인터페이스',
      badge: '일체형 초저단가 구축 최적',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      summary:
        '라즈베리파이, Jetson 등 임베디드 SBC의 브로드컴/엔비디아 SoC 내부 하드웨어 ISP와 이미지 센서를 직결하는 표준 고속 차동 시그널링(D-PHY) 버스입니다.',
      bandwidth: '2-lane 기준 3.0~4.0 Gbps / 4-lane 기준 최대 10 Gbps (네이티브 RAW 스트리밍)',
      latency: '< 0.5 ms (물리적 제로 지연시간, 프레임 버퍼링이나 프로토콜 변환 없음)',
      maxDistance: '최대 15cm ~ 30cm (차동 고주파 신호 감쇄로 인해 30cm 초과 시 인식 불가)',
      cableType: '15핀 / 22핀 0.5mm 피치 FPC/FFC 플랫 리본 필름 케이블',
      connector: 'ZIF (Zero Insertion Force) 슬라이드/클램프 커넥터 (비방수, PCB 실장형)',
      powerDelivery: 'FPC 핀을 통해 보드 3.3V/GND 직접 전원 인가',
      cpuLoad: '최저 (SoC 내부 DMA 및 하드웨어 ISP로 직접 메모리 로드, CPU 소모율 < 1%)',
      moduleCost: '약 35,000원 ~ 55,000원 (Arducam AR0234 MIPI 카메라 모듈 단품)',
      receiverCost: '0원 (라즈베리파이 온보드 CAM 포트에 직결하므로 추가 보드 불필요)',
      totalCostEstimate: '약 35,000원 ~ 60,000원 (센서 모듈 + 기본 15cm FPC 케이블)',
      emiImmunity: '최하 (FPC 리본 케이블 차폐 전무, 도로변 모터·서지·인버터 노이즈에 매우 취약)',
      driverEase: '우수 (라즈베리파이 공식 OS의 libcamera / V4L2 드라이버 기본 지원)',
      pros: [
        '최소 비용(BOM): 수신 확장 보드 없이 RPi 보드 슬롯에 직결하므로 예산 대폭 절감',
        '하드웨어 DMA 직결로 레이턴시가 0.5ms 미만이며 CPU 오버헤드가 거의 없음',
        '초소형/초경량 설계로 소형 하우징 내부 패키징 최적화',
        '공식 Raspberry Pi OS 커널에서 libcamera를 통해 표준 설정 지원',
      ],
      cons: [
        '전송 거리가 20~30cm로 극단적으로 제한되어 카메라와 메인보드가 반드시 한 상자에 공존해야 함',
        'FPC 리본 케이블이 꺾이거나 접히면 신호선 단선 위험 및 노이즈 유입 심각',
        'ZIF 커넥터는 비방수 규격이므로 외함 내부에서만 완벽히 밀폐 보호되어야 함',
      ],
      idealFor: '카메라 센서와 RPi가 단일 방수 외함에 내장된 일체형(All-in-One) 과속 계측기',
      diagramSteps: [
        { label: 'AR0234 센서', desc: 'D-PHY 차동 신호 생성' },
        { label: 'FPC 리본 케이블 (15cm)', desc: '비차폐 15/22핀 플랫', isCable: true },
        { label: 'RPi 온보드 CAM 슬롯', desc: 'ZIF 0.5mm 피치' },
        { label: 'BCM2711 VideoCore ISP', desc: '하드웨어 DMA 직접 수신' },
      ],
    },
    usb: {
      id: 'usb',
      name: 'USB 3.0 / USB3 Vision (UVC)',
      subName: '머신비전 및 PC 범용 플러그 앤 플레이 산업용 표준 인터페이스',
      badge: '빠른 프로토타이핑 & 범용성 우수',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      summary:
        'Cypress FX3 또는 전용 UVC 브리지 IC를 통해 범용 USB 3.0 포트에 플러그 앤 플레이로 연결되는 산업용 머신비전 표준 인터페이스입니다.',
      bandwidth: '5.0 Gbps (USB 3.1 Gen1 기준, 실효 데이터 전송 대역폭 약 3.2~3.8 Gbps)',
      latency: '15 ms ~ 35 ms (UVC 호스트 드라이버 스케줄링, USB 패킷 버퍼링 및 인터럽트 지연)',
      maxDistance: '표준 3m ~ 5m (신호 무결성 유지 권장 3m 이내, 액티브 리피터 사용 시 8m)',
      cableType: '차폐 트위스트 페어(STP) + 차폐 브레이드 외장 케이블 (외경 5.5~6.5mm)',
      connector: 'USB 3.0 Type-A/C 또는 산업용 IP67 스크루 락(Screw Lock) 결속 커넥터',
      powerDelivery: 'USB VBUS 5V 900mA (센서 및 브리지 칩셋에 충분한 전력 공급)',
      cpuLoad: '중간~다소 높음 (USB 패킷 파싱, 인터럽트 핸들링으로 60fps 수신 시 CPU 12~25% 소모)',
      moduleCost: '약 75,000원 ~ 120,000원 (AR0234 센서 + USB3.0 UVC 브리지 컨트롤러 보드 일체형)',
      receiverCost: '0원 (라즈베리파이 4B의 USB 3.0 파란색 포트에 바로 삽입)',
      totalCostEstimate: '약 90,000원 ~ 140,000원 (센서 모듈 + 3m 산업용 스크루 락 케이블)',
      emiImmunity: '보통 (차폐 케이블 품질에 따라 상이, USB 3.0의 2.4GHz Wi-Fi 대역 간섭 방사 주의)',
      driverEase: '최상 (UVC 표준 준수로 드라이버 설치 없이 OpenCV / V4L2에서 즉시 디바이스 인식)',
      pros: [
        '소프트웨어 드라이버 설치가 필요 없는 표준 UVC(USB Video Class) 플러그 앤 플레이',
        'PC, 노트북, 라즈베리파이, 엔비디아 젯슨 등 모든 컴퓨팅 플랫폼에서 즉각 호환',
        '산업용 스크루 락 케이블 적용 시 진동에 의한 이탈 방지 가능',
        '3m 내외의 유연한 배치 거리로 소형 폴대나 브라켓 장착 용이',
      ],
      cons: [
        'UVC 프로토콜 스택과 USB 호스트 인터럽트로 인해 15~35ms 수준의 반응 지연 발생',
        '5m를 초과할 경우 신호 감쇄 및 USB 연결 끊김(드롭아웃) 현상 빈발',
        'USB 3.0 통신 시 2.4GHz 대역 고주파 노이즈 방출로 RPi 내장 Wi-Fi/블루투스 감도 저하 가능',
      ],
      idealFor: '시제품 연구개발, 실험실 벤치마크, 2~3m 이내 단거리 브라켓 장착 과속 단속기',
      diagramSteps: [
        { label: 'AR0234 센서', desc: 'Raw 픽셀 스트림' },
        { label: 'FX3 / UVC 브리지', desc: 'USB 패킷화 & 프레임 버퍼' },
        { label: 'USB 3.0 차폐 케이블 (3m)', desc: '5V VBUS + 고속 차동 데이터', isCable: true },
        { label: 'RPi USB 3.0 포트', desc: 'xHCI 호스트 컨트롤러' },
        { label: 'V4L2 / UVC 드라이버', desc: 'OpenCV 비디오 캡처' },
      ],
    },
  };

  // Chart setup
  useEffect(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['최대 전송 거리 (m)', '반응 지연시간 (ms)', '전송 대역폭 (Gbps)', '예상 총비용 (만원)'],
        datasets: [
          {
            label: 'GMSL2 (오토모티브 동축)',
            data: [15, 1.5, 6.0, 39],
            backgroundColor: 'rgba(16, 185, 129, 0.85)', // emerald
            borderRadius: 6,
          },
          {
            label: 'MIPI CSI-2 (네이티브 버스)',
            data: [0.3, 0.5, 8.0, 4.5],
            backgroundColor: 'rgba(59, 130, 246, 0.85)', // blue
            borderRadius: 6,
          },
          {
            label: 'USB 3.0 (UVC 머신비전)',
            data: [3.5, 25, 3.5, 11],
            backgroundColor: 'rgba(245, 158, 11, 0.85)', // amber
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#cbd5e1',
              font: { size: 11, weight: 'bold' },
              boxWidth: 14,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const val = context.raw;
                const metricIndex = context.dataIndex;
                const units = ['m (미터)', 'ms (밀리초, 낮을수록 우수)', 'Gbps (대역폭)', '만원 (BOM 원가)'];
                return `${label}: ${val} ${units[metricIndex]}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8', font: { size: 11 } },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#94a3b8', font: { size: 10 } },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  // Distance evaluation helpers
  const getSuitability = (iface: InterfaceType, dist: number) => {
    if (iface === 'gmsl2') {
      if (dist <= 15) return { status: 'optimal', text: '최적 적합 (신호 감쇄 제로, PoC 전원 공급 안정)' };
      if (dist <= 20) return { status: 'warning', text: '양호 (고품질 RG174 케이블 권장)' };
      return { status: 'error', text: '전송 한계 초과 (15m 이내 사용 권장)' };
    }
    if (iface === 'mipi') {
      if (dist <= 0.3) return { status: 'optimal', text: '최적 적합 (단일 함체 내 센서-RPi 직결)' };
      if (dist <= 0.5) return { status: 'warning', text: '위험 (고주파 차동 신호 감쇄 및 노이즈 왜곡 발생)' };
      return { status: 'error', text: '연결 불가능 (MIPI FPC 케이블은 30cm 이내만 지원)' };
    }
    // usb
    if (dist <= 3) return { status: 'optimal', text: '최적 적합 (안정적인 UVC 5Gbps 전송)' };
    if (dist <= 5) return { status: 'warning', text: '주의 (산업용 고급 차폐 케이블 필수, 신호 지연 증가)' };
    return { status: 'error', text: '연결 불안정 (5m 초과 시 프레임 드랍 및 패킷 에러 발생)' };
  };

  const currentDetail = interfaces[selectedInterface];

  return (
    <div id="camera-interface-tab" className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Hero Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Cable className="w-3.5 h-3.5" />
                카메라 전송 인터페이스 규격 종합 기술 보고서
              </span>
              <span className="text-[11px] text-slate-500 font-mono">GMSL2 vs MIPI CSI-2 vs USB 3.0</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              차량 과속 단속 카메라 인터페이스 정밀 비교 및 현장 설계 가이드
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              글로벌 셔터 센서(AR0234 등)의 고속 프레임을 라즈베리파이·임베디드 제어기로 무손실 전송하기 위한
              <strong> 기술적 성능(대역폭/지연시간/노이즈)</strong>, <strong>경제적 이득(BOM 단가/TCO)</strong>,
              <strong> 현장 설치성(배선 거리/방수 커넥터/PoC)</strong>을 체계적으로 비교 분석합니다.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-center min-w-[100px]">
              <div className="text-[10px] text-slate-400">장거리 원탑</div>
              <div className="text-sm font-black text-emerald-400">GMSL2 (15m)</div>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-center min-w-[100px]">
              <div className="text-[10px] text-slate-400">최저가·최저지연</div>
              <div className="text-sm font-black text-blue-400">MIPI (&lt;0.5ms)</div>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-center min-w-[100px]">
              <div className="text-[10px] text-slate-400">플러그앤플레이</div>
              <div className="text-sm font-black text-amber-400">USB 3.0 UVC</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Interface Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['gmsl2', 'mipi', 'usb'] as InterfaceType[]).map((key) => {
          const item = interfaces[key];
          const isSelected = selectedInterface === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedInterface(key)}
              className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${item.badgeColor}`}>
                  {item.badge}
                </span>
                {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
              </div>
              <div className="font-bold text-sm text-white">{item.name.split(' (')[0]}</div>
              <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.subName}</div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-400">
                <span>최대 거리: <strong className="text-slate-200">{item.maxDistance.split(' (')[0]}</strong></span>
                <span>지연: <strong className="text-slate-200">{item.latency.split(' (')[0]}</strong></span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Deep Dive Detailed Card for Selected Interface */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-white">{currentDetail.name}</h3>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold ${currentDetail.badgeColor}`}>
                {currentDetail.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-4xl">{currentDetail.summary}</p>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl shrink-0">
            <span className="text-[10px] text-slate-400 block">시스템 권장 총비용 (1세트 기준)</span>
            <span className="text-sm font-black text-amber-400">{currentDetail.totalCostEstimate.split(' (')[0]}</span>
          </div>
        </div>

        {/* Signal Flow Block Diagram */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            하드웨어 신호 전송 흐름도 (Hardware Signal Pipeline)
          </h4>
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[650px] gap-2">
              {currentDetail.diagramSteps.map((step, idx) => (
                <React.Fragment key={idx}>
                  <div
                    className={`flex-1 p-2.5 rounded-lg border text-center transition ${
                      step.isCable
                        ? 'bg-amber-950/30 border-amber-500/50 text-amber-300'
                        : 'bg-slate-900 border-slate-700/80 text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{step.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{step.desc}</div>
                  </div>
                  {idx < currentDetail.diagramSteps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* 3 Major Evaluation Pillars: Technical, Economic, Installability */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar 1: Technical Performance */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm border-b border-slate-800/80 pb-2">
              <Gauge className="w-4 h-4" />
              <span>1. 기술적 성능 (Performance)</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">최대 전송 대역폭:</span>
                <span className="text-slate-200 font-medium font-mono">{currentDetail.bandwidth}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">반응 지연시간 (Latency):</span>
                <span className="text-slate-200 font-medium font-mono">{currentDetail.latency}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">호스트 CPU 점유율:</span>
                <span className="text-slate-200 font-medium">{currentDetail.cpuLoad}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">EMC / 서지 노이즈 내성:</span>
                <span className="text-slate-200 font-medium">{currentDetail.emiImmunity}</span>
              </div>
            </div>
          </div>

          {/* Pillar 2: Economic Advantage (Cost) */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm border-b border-slate-800/80 pb-2">
              <DollarSign className="w-4 h-4" />
              <span>2. 경제적 이득 (Cost & TCO)</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">센서 모듈 단가 (AR0234 기준):</span>
                <span className="text-slate-200 font-medium font-mono">{currentDetail.moduleCost}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">수신 인터페이스 보드 (RPi HAT):</span>
                <span className="text-slate-200 font-medium font-mono">{currentDetail.receiverCost}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">1대 기준 하드웨어 총비용:</span>
                <span className="text-amber-400 font-bold font-mono">{currentDetail.totalCostEstimate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">드라이버 개발 및 유지보수성:</span>
                <span className="text-slate-200 font-medium">{currentDetail.driverEase}</span>
              </div>
            </div>
          </div>

          {/* Pillar 3: Installability */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm border-b border-slate-800/80 pb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>3. 현장 설치성 (Installability)</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">최대 전송 거리:</span>
                <span className="text-slate-200 font-medium font-mono">{currentDetail.maxDistance}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">케이블 종류 및 외경:</span>
                <span className="text-slate-200 font-medium">{currentDetail.cableType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">체결 커넥터 및 방수 등급:</span>
                <span className="text-slate-200 font-medium">{currentDetail.connector}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">전원 공급 일체화 (Power):</span>
                <span className="text-slate-200 font-medium">{currentDetail.powerDelivery}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pros & Cons Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/40 rounded-xl space-y-2">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>핵심 장점 및 실무 메리트</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {currentDetail.pros.map((pro, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold shrink-0">•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 bg-red-950/20 border border-red-900/40 rounded-xl space-y-2">
            <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>한계점 및 현장 고려사항</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {currentDetail.cons.map((con, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-red-400 font-bold shrink-0">•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Ideal Application Box */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2.5 text-xs">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-400">
            <strong>최적 적용 분야:</strong>{' '}
            <span className="text-slate-200 font-medium">{currentDetail.idealFor}</span>
          </span>
        </div>
      </div>

      {/* 4. Chart & Metric Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <span>3대 인터페이스 핵심 사양 벤치마크 지표 비교</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">전송 거리, 반응 지연시간, 데이터 대역폭, 하드웨어 비용 한눈에 보기</p>
            </div>
          </div>
          <div className="w-full h-64">
            <canvas ref={chartCanvasRef} />
          </div>
        </div>

        {/* 5. Interactive Field Installation Simulator */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>현장 배선 거리 & 환경 시뮬레이터</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">설치 거리 변경 시 규격별 적합도 실시간 판정</p>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                <span>카메라 - 제어함 배선 거리:</span>
                <span className="text-amber-400 font-bold font-mono text-sm">{simulatedDistance} 미터 (m)</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="20"
                step="0.1"
                value={simulatedDistance}
                onChange={(e) => setSimulatedDistance(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0.1m (일체형)</span>
                <span>3m (단거리)</span>
                <span>8m (가로등)</span>
                <span>15m (대형폴대)</span>
                <span>20m</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex gap-1.5 text-[10px]">
              <button
                onClick={() => { setSimulatedDistance(0.2); setInstallationEnv('compact_allinone'); }}
                className={`px-2 py-1 rounded border transition cursor-pointer ${
                  simulatedDistance <= 0.3 ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                일체형 (0.2m)
              </button>
              <button
                onClick={() => { setSimulatedDistance(3); setInstallationEnv('mid_pole'); }}
                className={`px-2 py-1 rounded border transition cursor-pointer ${
                  simulatedDistance === 3 ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                단거리 거치 (3m)
              </button>
              <button
                onClick={() => { setSimulatedDistance(12); setInstallationEnv('separated_pole'); }}
                className={`px-2 py-1 rounded border transition cursor-pointer ${
                  simulatedDistance >= 10 ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                가로등 폴대 (12m)
              </button>
            </div>

            {/* Live Verdict for all 3 */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              {(['gmsl2', 'mipi', 'usb'] as InterfaceType[]).map((key) => {
                const verdict = getSuitability(key, simulatedDistance);
                const colors = {
                  optimal: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300',
                  warning: 'bg-amber-950/40 border-amber-800/60 text-amber-300',
                  error: 'bg-red-950/40 border-red-800/60 text-red-300',
                }[verdict.status];

                return (
                  <div key={key} className={`p-2.5 rounded-lg border text-xs ${colors}`}>
                    <div className="flex justify-between items-center font-bold">
                      <span>{key.toUpperCase()}</span>
                      <span className="text-[10px] uppercase tracking-wider font-mono">
                        {verdict.status === 'optimal' ? '권장 (PASS)' : verdict.status === 'warning' ? '주의 (WARN)' : '사용 불가 (FAIL)'}
                      </span>
                    </div>
                    <div className="text-[11px] opacity-90 mt-0.5">{verdict.text}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Comprehensive Comparison Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Cable className="w-4 h-4 text-amber-400" />
              <span>GMSL2 vs MIPI CSI-2 vs USB 3.0 사양 비교 총괄 매트릭스</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">도로변 과속 단속 및 스쿨존 ALPR 시스템 구축을 위한 항목별 정밀 스펙 비교</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400">
                <th className="p-3 font-semibold w-40">비교 항목</th>
                <th className="p-3 font-semibold text-emerald-400 border-l border-slate-800/60">
                  GMSL2 (오토모티브 동축)
                </th>
                <th className="p-3 font-semibold text-blue-400 border-l border-slate-800/60">
                  MIPI CSI-2 (네이티브 버스)
                </th>
                <th className="p-3 font-semibold text-amber-400 border-l border-slate-800/60">
                  USB 3.0 (UVC 머신비전)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-sans text-slate-300">
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-slate-200">1. 물리 계층 & 신호 방식</td>
                <td className="p-3 border-l border-slate-800/60">단일 50Ω 동축 케이블 (고속 직렬 SerDes)</td>
                <td className="p-3 border-l border-slate-800/60">D-PHY 차동 차동선 (2-lane / 4-lane 리본)</td>
                <td className="p-3 border-l border-slate-800/60">차폐 트위스트 페어 (STP) + 차폐 브레이드</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-slate-200">2. 최대 실효 대역폭</td>
                <td className="p-3 border-l border-slate-800/60 font-mono text-emerald-400 font-bold">최대 6.0 Gbps (비압축 RAW)</td>
                <td className="p-3 border-l border-slate-800/60 font-mono text-blue-400 font-bold">3~10 Gbps (네이티브 버스 직결)</td>
                <td className="p-3 border-l border-slate-800/60 font-mono text-amber-400 font-bold">5.0 Gbps (실효 3.2~3.8 Gbps)</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-slate-200">3. 전송 지연시간 (Latency)</td>
                <td className="p-3 border-l border-slate-800/60 font-mono text-emerald-400 font-bold">&lt; 1.5 ms (극초저지연)</td>
                <td className="p-3 border-l border-slate-800/60 font-mono text-blue-400 font-bold">&lt; 0.5 ms (물리적 제로 지연)</td>
                <td className="p-3 border-l border-slate-800/60 font-mono text-slate-400">15 ~ 35 ms (UVC 버퍼링 발생)</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-slate-200">4. 최대 유효 전송 거리</td>
                <td className="p-3 border-l border-slate-800/60 font-mono text-emerald-400 font-bold">15m ~ 20m (원거리 가능)</td>
                <td className="p-3 border-l border-slate-800/60 font-mono text-red-400 font-bold">0.15m ~ 0.3m (극단거리 한정)</td>
                <td className="p-3 border-l border-slate-800/60 font-mono text-amber-400 font-bold">3m ~ 5m (단거리 권장)</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-slate-200">5. 전원 공급 방식 (Power)</td>
                <td className="p-3 border-l border-slate-800/60">PoC (Power over Coax): 동축 1선 12V 공급</td>
                <td className="p-3 border-l border-slate-800/60">FPC 핀을 통한 보드 3.3V 전원 직접 공급</td>
                <td className="p-3 border-l border-slate-800/60">USB VBUS 5V 900mA 직류 전원 공급</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-slate-200">6. 체결 커넥터 & 방수 등급</td>
                <td className="p-3 border-l border-slate-800/60 font-medium text-emerald-400">
                  FAKRA / Mini-FAKRA (IP67/IP69K 락킹)
                </td>
                <td className="p-3 border-l border-slate-800/60 text-slate-400">
                  ZIF 0.5mm 피치 커넥터 (비방수)
                </td>
                <td className="p-3 border-l border-slate-800/60">
                  Type-A/C 또는 산업용 스크루 락 (IP67 옵션)
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-slate-200">7. EMI/EMC 노이즈 및 서지 내성</td>
                <td className="p-3 border-l border-slate-800/60 font-medium text-emerald-400">
                  최상 (AEC-Q100 전장 인증, 완전 차폐)
                </td>
                <td className="p-3 border-l border-slate-800/60 text-red-400">
                  취약 (FPC 비차폐, 외부 모터·서지에 민감)
                </td>
                <td className="p-3 border-l border-slate-800/60">
                  보통 (2.4GHz 무선 간섭 방사 발생 주의)
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-slate-200">8. 호스트 CPU 오버헤드</td>
                <td className="p-3 border-l border-slate-800/60">극저 (역직렬화기 출력 SoC DMA 수신)</td>
                <td className="p-3 border-l border-slate-800/60">최저 (하드웨어 ISP DMA 직결, &lt; 1%)</td>
                <td className="p-3 border-l border-slate-800/60 text-amber-400">중간~높음 (USB 패킷 파싱으로 10~25%)</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-slate-200">9. 하드웨어 BOM 단가 (1세트)</td>
                <td className="p-3 border-l border-slate-800/60 font-mono text-red-400">
                  약 29만 ~ 49만원 (고가)
                </td>
                <td className="p-3 border-l border-slate-800/60 font-mono text-emerald-400 font-bold">
                  약 3.5만 ~ 6만원 (초저가)
                </td>
                <td className="p-3 border-l border-slate-800/60 font-mono text-amber-400">
                  약 9만 ~ 14만원 (가성비)
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-slate-200">10. 드라이버 개발 난이도</td>
                <td className="p-3 border-l border-slate-800/60">다소 복잡 (I2C 직렬화/역직렬화 V4L2 드라이버)</td>
                <td className="p-3 border-l border-slate-800/60">양호 (공식 OS libcamera 지원)</td>
                <td className="p-3 border-l border-slate-800/60 font-medium text-emerald-400">
                  최상 (드라이버 설치 불필요 UVC 플러그앤플레이)
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-slate-200">11. 최적 추천 설치 시나리오</td>
                <td className="p-3 border-l border-slate-800/60 font-bold text-emerald-300">
                  가로등·신호등 상단 분리형 단속 시스템 (6~15m 배선)
                </td>
                <td className="p-3 border-l border-slate-800/60 font-bold text-blue-300">
                  카메라-RPi 동일 방수함 내 일체형 단속 장치 (&lt;0.3m)
                </td>
                <td className="p-3 border-l border-slate-800/60 font-bold text-amber-300">
                  실험실 프로토타입 개발, 2~3m 지지대 브라켓 단속 장비
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Strategic Engineering Deployment Recommendations */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>실무 엔지니어링 최종 의사결정 가이드 (Engineering Decision Guideline)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>케이스 1: 상용 지자체 표준 가로등 단속</span>
            </div>
            <div className="text-sm font-black text-white">GMSL2 선택 필수</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              카메라를 6m 지상 고지대에 설치하고 제어함 및 배터리를 지상 1.5m 유지보수함에 둘 경우,
              <strong> GMSL2 외에는 대안이 없습니다.</strong> FAKRA 동축 1선으로 12V PoC 전원과 비압축 60fps RAW 영상을
              안정적으로 전송하며, 낙뢰 및 서지 환경에서 최고의 신뢰성을 보장합니다.
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>케이스 2: 저비용 보급형 일체형 스쿨존 기기</span>
            </div>
            <div className="text-sm font-black text-white">MIPI CSI-2 선택 권장</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              카메라, 라즈베리파이 4B, ESP32 및 188 LED 전광판을 단일 IP67 외함에 집적하는 일체형 구조라면,
              <strong> MIPI CSI-2가 3.5만원대의 압도적 가성비</strong>와 제로 지연시간(&lt;0.5ms)을 제공합니다.
              비용을 80% 이상 절감하면서도 최고 화질의 번호판 인식을 구현할 수 있습니다.
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>케이스 3: 연구실 R&D 및 2~3m 단거리 현장</span>
            </div>
            <div className="text-sm font-black text-white">USB 3.0 UVC 선택 적합</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              드라이버 빌드 없이 Windows, 리눅스, macOS에서 즉시 인식되므로 알고리즘(YOLOv8 + PaddleOCR) 검증
              및 필드 테스트 속도가 가장 빠릅니다. 3m 이내의 소형 지지대나 이동형 단속 차량 구축 시 최선의 선택입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
