import { YouTubeChannelItem } from '../types';

export const YOUTUBE_CHANNELS: YouTubeChannelItem[] = [
  // 1. Radar & FMCW
  {
    id: 'andreas-spiess-radar',
    name: 'Andreas Spiess ("The Guy With The Swiss Accent")',
    handle: '@AndreasSpiess',
    category: 'radar',
    categoryLabel: '24GHz FMCW / 도플러 레이더',
    channelUrl: 'https://www.youtube.com/@AndreasSpiess',
    subscribers: '470K+',
    description:
      'ESP32 및 밀리미터파(mmWave) 24GHz 레이더, 저전력 IoT 센서 벤치마크 분야에서 전 세계에서 가장 정밀한 분석을 제공하는 스위스 엔지니어 채널입니다.',
    coreTech: ['24GHz mmWave', 'HLK Radar', 'Doppler vs FMCW', 'ESP32 Low Power', 'Nordic PPK2'],
    keyTopics: [
      {
        title: '#464 mmWave Presence Detection (HLK Radar Deep Dive)',
        description: 'HLK 시리즈 24GHz 레이더의 FMCW 탐지 원리, 안테나 빔폭, UART 파싱 및 감도 튜닝',
        searchQuery: 'Andreas Spiess mmWave radar HLK LD2410 LD2450',
        url: 'https://www.youtube.com/results?search_query=Andreas+Spiess+mmWave+radar+HLK',
      },
      {
        title: '#398 Radar vs. PIR vs. Ultrasonic for Distance and Velocity',
        description: '도플러 주파수 편이($\\Delta f = 2v f_0 / c$)와 FMCW 첩 신호 비교 분석',
        searchQuery: 'Andreas Spiess Radar vs PIR Ultrasonic speed distance',
        url: 'https://www.youtube.com/results?search_query=Andreas+Spiess+Radar+speed+distance',
      },
      {
        title: '#479 Ultra-Low Power ESP32 with mmWave Radar Integration',
        description: '레이더 센서의 상시 대기 전력(107mA)과 ESP32 딥슬립/웨이크업 연동 기법',
        searchQuery: 'Andreas Spiess ESP32 deep sleep mmWave radar power',
        url: 'https://www.youtube.com/results?search_query=Andreas+Spiess+ESP32+mmWave+power',
      },
    ],
    projectApplicationTip:
      'HLK-LD2451의 UART 115200bps 출력 데이터는 초당 수십 회의 타깃 프레임을 전달하므로, ESP32의 FreeRTOS 전용 테스크와 원형 링버퍼(Ring Buffer)를 구성하여 시리얼 패킷 손실을 방지해야 합니다.',
    featured: true,
  },
  {
    id: 'dronebot-workshop',
    name: 'DroneBot Workshop',
    handle: '@Dronebotworkshop',
    category: 'radar',
    categoryLabel: '24GHz FMCW / 도플러 레이더',
    channelUrl: 'https://www.youtube.com/@Dronebotworkshop',
    subscribers: '650K+',
    description:
      '마이크로컨트롤러(ESP32/Arduino)와 도플러 레이더, 모션 센서 인터페이싱을 가장 쉽고 체계적인 회로도와 코드로 설명하는 전문 하드웨어 채널입니다.',
    coreTech: ['Doppler Radar', 'RCWL-0516', 'Speed Measurement', 'ESP32 Interfacing', 'Signal Conditioning'],
    keyTopics: [
      {
        title: 'Microwave Radar Sensors with Arduino & ESP32',
        description: '24GHz 대역 마이크로웨이브 모듈의 도플러 펄스 카운팅 및 이동 물체 속도 환산 공식',
        searchQuery: 'DroneBot Workshop Microwave Radar Sensors Arduino ESP32',
        url: 'https://www.youtube.com/results?search_query=DroneBot+Workshop+Microwave+Radar+Sensors',
      },
      {
        title: 'Measuring Speed with Doppler Radar & Microcontrollers',
        description: '차량 접근 시 발생하는 도플러 주파수를 주파수-전압 변환기 또는 펄스 타이머로 측정하는 기법',
        searchQuery: 'DroneBot Workshop Measuring Speed Doppler Radar',
        url: 'https://www.youtube.com/results?search_query=DroneBot+Workshop+Measuring+Speed+Doppler+Radar',
      },
    ],
    projectApplicationTip:
      '레이더 모듈 전원단에 인접한 100μF 탄탈/전해 커패시터 및 0.1μF 세라믹 디커플링 커패시터를 배치하면 24GHz 고주파 송수신 시 발생하는 전압 리플 및 오탐지를 90% 이상 억제할 수 있습니다.',
    featured: false,
  },
  {
    id: 'hilink-radar-community',
    name: 'Hi-Link Radar Makers & Tech Lab',
    handle: '@HiLinkRadarLab',
    category: 'radar',
    categoryLabel: '24GHz FMCW / 도플러 레이더',
    channelUrl: 'https://www.youtube.com/results?search_query=HLK-LD2451+vehicle+radar',
    subscribers: '150K+ 커뮤니티',
    description:
      'Hi-Link 사의 24GHz FMCW 레이더 시리즈(HLK-LD2451, LD2450, LD2410) 실물 언박싱, BLE 전용 앱(HLKRadarTool) 캘리브레이션 및 차량 속도 계측 실전 튜토리얼입니다.',
    coreTech: ['HLK-LD2451', 'HLKRadarTool', 'BLE Configuration', 'UART Protocol', 'Target Speed 120km/h'],
    keyTopics: [
      {
        title: 'HLK-LD2451 24GHz FMCW Vehicle Radar Field Test & Review',
        description: '도로 위 최대 100m 차량 탐지 거리, ±20° 화각 3개 차선 커버리지 및 실측 소비전력(0.56W) 검증',
        searchQuery: 'HLK-LD2451 vehicle detection radar review 24GHz',
        url: 'https://www.youtube.com/results?search_query=HLK-LD2451+vehicle+detection+radar',
      },
      {
        title: 'HLKRadarTool Mobile App BLE Tuning Guide',
        description: '스마트폰 BLE로 현장에서 감지 거리(0~100m), 방향(접근/이탈), 감도 임계값(SNR) 무선 세팅',
        searchQuery: 'HLKRadarTool app LD2451 LD2450 configuration',
        url: 'https://www.youtube.com/results?search_query=HLKRadarTool+app+configuration',
      },
      {
        title: 'Decoding Hi-Link 24GHz Radar Serial Protocol (115200 Baud)',
        description: '헤더(0xFD 0xFC...), 타깃 ID, X/Y 좌표, 시선 속도(Radial Speed) 프레임 바이트 구조 해독',
        searchQuery: 'Hi-Link radar serial protocol parser ESP32',
        url: 'https://www.youtube.com/results?search_query=Hi-Link+radar+serial+protocol+parser',
      },
    ],
    projectApplicationTip:
      'HLK-LD2451 후면 방사 억제를 위해 모듈 뒷면에 1mm 이상의 알루미늄/구리 차폐판(Metal Backing)을 두면 배면 물체 진동으로 인한 허위 과속 트래픽 감지를 원천 차단할 수 있습니다.',
    featured: true,
  },

  // 2. Camera & ALPR
  {
    id: 'murtazas-workshop',
    name: "Murtaza's Workshop - Robotics & AI",
    handle: '@murtazasworkshop',
    category: 'camera',
    categoryLabel: '글로벌 셔터 & ALPR 번호판 인식',
    channelUrl: 'https://www.youtube.com/@murtazasworkshop',
    subscribers: '580K+',
    description:
      'OpenCV, Python, 딥러닝 기반 실시간 컴퓨터 비전 및 차량 번호판 인식(ANPR/ALPR), 이동체 속도 추정 프로젝트를 가장 완성도 높은 코드로 공개하는 채널입니다.',
    coreTech: ['Automatic License Plate Recognition (ALPR)', 'OpenCV', 'YOLOv8', 'PaddleOCR', 'Vehicle Speed Tracking'],
    keyTopics: [
      {
        title: 'Automatic License Plate Recognition (ANPR) with OpenCV and Python',
        description: '주행 차량 영상에서 번호판 영역 검출, 원근 왜곡 보정, 문자 분할 및 OCR 인식 파이프라인',
        searchQuery: 'Murtaza Workshop Automatic License Plate Recognition OpenCV',
        url: 'https://www.youtube.com/results?search_query=Murtaza+Workshop+Automatic+License+Plate+Recognition',
      },
      {
        title: 'Car Speed Estimation using OpenCV & Object Tracking',
        description: '도로 픽셀 좌표계와 실제 지상 거리 캘리브레이션을 결합한 프레임 기반 차량 주행 속도 추정',
        searchQuery: 'Murtaza Workshop Car Speed Estimation OpenCV',
        url: 'https://www.youtube.com/results?search_query=Murtaza+Workshop+Car+Speed+Estimation',
      },
    ],
    projectApplicationTip:
      '야간 차량 번호판은 헤드라이트 빛 번짐과 역광이 심하므로, 카메라 노출(Shutter Speed)을 1/1000초 이하로 고정하고 850nm 적외선(IR) 조명 및 IR Bandpass 필터를 병용해야 인식률 99%를 달성합니다.',
    featured: true,
  },
  {
    id: 'jeff-geerling',
    name: 'Jeff Geerling',
    handle: '@JeffGeerling',
    category: 'camera',
    categoryLabel: '글로벌 셔터 & ALPR 번호판 인식',
    channelUrl: 'https://www.youtube.com/@JeffGeerling',
    subscribers: '620K+',
    description:
      '라즈베리파이 재단 공식 하드웨어 및 글로벌 셔터 카메라, 고속 촬영 벤치마크 분야의 최고 권위자입니다. 롤링 셔터와의 왜곡 비교를 정밀 시각화합니다.',
    coreTech: ['Global Shutter', 'Raspberry Pi Camera', 'Jello Effect Removal', 'CSI-2 Hardware Trigger', 'Industrial Vision'],
    keyTopics: [
      {
        title: 'Raspberry Pi Global Shutter Camera Review & Jello Effect Test',
        description: '고속 회전 팬과 주행 물체 촬영 시 롤링 셔터의 기울어짐(Jello)과 글로벌 셔터의 완벽한 멈춤 비교',
        searchQuery: 'Jeff Geerling Raspberry Pi Global Shutter Camera',
        url: 'https://www.youtube.com/results?search_query=Jeff+Geerling+Raspberry+Pi+Global+Shutter+Camera',
      },
      {
        title: 'High-speed 120fps video capture and hardware sync triggers',
        description: '외부 센서(도플러 레이더) 펄스 발생 즉시 밀리초 단위로 프레임을 캡처하는 하드웨어 트리거 기법',
        searchQuery: 'Jeff Geerling high speed camera capture trigger',
        url: 'https://www.youtube.com/results?search_query=Jeff+Geerling+high+speed+camera+trigger',
      },
    ],
    projectApplicationTip:
      '일반 롤링 셔터(IMX219/IMX708 등)는 60km/h 이상 주행 차량 번호판이 대각선으로 찌그러져 OCR 실패율이 급증하므로, 본 시스템의 AR0234 글로벌 셔터 채택이 필수적임을 실증합니다.',
    featured: true,
  },
  {
    id: 'arducam-official',
    name: 'Arducam Official',
    handle: '@Arducam',
    category: 'camera',
    categoryLabel: '글로벌 셔터 & ALPR 번호판 인식',
    channelUrl: 'https://www.youtube.com/@Arducam',
    subscribers: '45K+',
    description:
      '임베디드 임팩트 카메라 제조사 ArduCam의 공식 채널로, AR0234 2.3MP 글로벌 셔터 카메라 모듈, 스트로브 플래시 동기화 신호, MIPI 드라이버 구성을 다룹니다.',
    coreTech: ['AR0234 Sensor', 'MIPI CSI-2', 'Strobe Output', 'External Hardware Trigger', 'UVC High-Speed'],
    keyTopics: [
      {
        title: 'AR0234 Global Shutter Camera with Raspberry Pi & Jetson',
        description: 'AR0234 센서의 MIPI CSI-2 2-lane 1080p 60fps 무손실 전송 및 libcamera 드라이버 연동',
        searchQuery: 'Arducam AR0234 Global Shutter camera tutorial',
        url: 'https://www.youtube.com/results?search_query=Arducam+AR0234+Global+Shutter',
      },
      {
        title: 'Hardware External Triggering for Fast Moving Objects',
        description: '레이더의 GPIO OT1 신호를 카메라 Strobe In 핀에 직결하여 0.1ms 지연으로 동기 촬영하는 배선법',
        searchQuery: 'Arducam external trigger synchronization high speed',
        url: 'https://www.youtube.com/results?search_query=Arducam+external+trigger+synchronization',
      },
    ],
    projectApplicationTip:
      'AR0234의 Strobe Pin을 활용하면 셔터가 열리는 정확한 수 마이크로초 동안만 야간 고휘도 IR LED를 펄스 점등할 수 있어 전력 소모를 95% 절감할 수 있습니다.',
    featured: false,
  },
  {
    id: 'nicolai-nielsen',
    name: 'Nicolai Nielsen - Computer Vision & AI',
    handle: '@NicolaiNielsen',
    category: 'camera',
    categoryLabel: '글로벌 셔터 & ALPR 번호판 인식',
    channelUrl: 'https://www.youtube.com/@NicolaiNielsen',
    subscribers: '120K+',
    description:
      '최신 YOLOv8, OCR 모델, 임베디드 엣지 디바이스(RPi/Jetson) 상에서 차량 추적 및 번호판 문자 인식 모델 경량화 기법을 다룹니다.',
    coreTech: ['YOLOv8', 'License Plate Detection', 'DeepSORT', 'Edge AI', 'Model Quantization'],
    keyTopics: [
      {
        title: 'YOLOv8 License Plate Detection and OCR Text Recognition',
        description: '라즈베리파이 NCNN 및 ONNX 런타임 최적화를 통해 번호판 인식 연산 시간을 150ms 이내로 단축',
        searchQuery: 'Nicolai Nielsen YOLOv8 license plate detection OCR',
        url: 'https://www.youtube.com/results?search_query=Nicolai+Nielsen+YOLOv8+license+plate',
      },
    ],
    projectApplicationTip:
      '라즈베리파이 4B에서 PyTorch 모델을 그대로 돌리면 CPU 100%로 발열 스로틀링이 발생하므로, TFLite 또는 NCNN INT8 양자화 모델을 적용해 연산 전력을 3W 미만으로 유지해야 합니다.',
    featured: false,
  },

  // 3. LED Display
  {
    id: 'greatscott-led',
    name: 'GreatScott!',
    handle: '@greatscottlab',
    category: 'led',
    categoryLabel: '1단 1열 188 LED 전광판 구동',
    channelUrl: 'https://www.youtube.com/@greatscottlab',
    subscribers: '1.95M+',
    description:
      '독일 전기전자 엔지니어가 운영하는 최고의 DIY 전자공학 채널. 대형 7세그먼트 LED 디스플레이, 정전류 드라이버(Constant Current Driver), 12V 승압/구동 회로를 심층 분석합니다.',
    coreTech: ['7-Segment LED', 'Constant Current Driver', 'High-Power LEDs', 'MAX7219 / TM1637', 'Thermal Management'],
    keyTopics: [
      {
        title: 'Make your own Giant 7-Segment Display (with Driver Circuit)',
        description: '옥외 직사광선 아래에서도 선명한 고휘도 LED 직렬 어레이와 12V 구동 회로 설계',
        searchQuery: 'GreatScott Make your own Giant 7-Segment Display',
        url: 'https://www.youtube.com/results?search_query=GreatScott+Giant+7-Segment+Display',
      },
      {
        title: 'Constant Current vs Constant Voltage LED Drivers',
        description: '온도 변화에 따른 LED 순방향 전압(Vf) 변동 및 열폭주(Thermal Runaway)를 막는 정전류 제어 원리',
        searchQuery: 'GreatScott Constant Current vs Constant Voltage LED',
        url: 'https://www.youtube.com/results?search_query=GreatScott+Constant+Current+LED+driver',
      },
    ],
    projectApplicationTip:
      '188 세그먼트 전광판은 12V 구동 시 세그먼트당 복수의 LED가 직렬 연결되어 있으므로, 5V MCU 로직 레벨 변환(Logic Level Shifter)과 ULN2803/TPIC6B595 같은 고내압 싱크 드라이버 IC를 필수 배치해야 합니다.',
    featured: true,
  },
  {
    id: 'bitluni-lab',
    name: "Bitluni's Lab",
    handle: '@bitluni',
    category: 'led',
    categoryLabel: '1단 1열 188 LED 전광판 구동',
    channelUrl: 'https://www.youtube.com/@bitluni',
    subscribers: '180K+',
    description:
      'ESP32의 초고속 I2S, RMT, 하드웨어 타이머를 활용하여 LED 매트릭스 및 다중 세그먼트를 깜빡임(Flicker) 없이 고속 리프레시하는 하드웨어 해킹 전문 채널입니다.',
    coreTech: ['ESP32 RMT Peripheral', 'Multiplexing', 'High Refresh Rate', 'Outdoor Signage', 'Shift Registers'],
    keyTopics: [
      {
        title: 'Ultra High Refresh Rate LED Driving with ESP32 Hardware Timers',
        description: 'CPU 부하 없이 DMA(Direct Memory Access)를 통해 세그먼트 전광판 데이터를 갱신하는 펌웨어 기술',
        searchQuery: 'Bitluni ESP32 LED multiplexing timer DMA',
        url: 'https://www.youtube.com/results?search_query=Bitluni+ESP32+LED+multiplexing',
      },
    ],
    projectApplicationTip:
      '차량 속도 표시 전광판은 도로 위 운전자 시야각에서 플리커(Flicker)가 없어야 하므로, 리프레시 주파수를 최소 200Hz 이상으로 유지하도록 ESP32 하드웨어 인터럽트를 세팅해야 합니다.',
    featured: false,
  },

  // 4. Solar & Battery
  {
    id: 'will-prowse-solar',
    name: 'Will Prowse (DIY Solar Power)',
    handle: '@WillProwse',
    category: 'solar',
    categoryLabel: '태양광·LiFePO4 배터리 & MPPT',
    channelUrl: 'https://www.youtube.com/@WillProwse',
    subscribers: '1.1M+',
    description:
      '글로벌 독립형 태양광 및 인산철(LiFePO4) 배터리 분야 최고 권위자. 12V 35Ah~100Ah 배터리 팩 분해 검증, 저온 충전 차단 BMS, MPPT 충전 효율 비교를 가장 명쾌하게 다룹니다.',
    coreTech: ['LiFePO4 12V Batteries', 'Low-Temp Cutoff BMS', 'MPPT Charge Controllers', 'Solar Sizing Calculator', 'Off-Grid Autonomy'],
    keyTopics: [
      {
        title: 'LiFePO4 Cold Temperature Charging: Why You Need Low-Temp Protection',
        description: '영하 0°C 이하에서 인산철 배터리 급속 충전 시 발생하는 리튬 덴드라이트(Dendrite) 단락 현상과 보호 BMS',
        searchQuery: 'Will Prowse LiFePO4 cold weather low temp protection',
        url: 'https://www.youtube.com/results?search_query=Will+Prowse+LiFePO4+cold+weather',
      },
      {
        title: 'Small 50W - 100W Solar Panel & MPPT Controller Test',
        description: '소형 독립형 옥외 설비에서 PWM 대비 MPPT 충전기가 흐린 날(무일조 전후) 25~30% 더 많은 에너지를 회수하는 원리',
        searchQuery: 'Will Prowse small solar panel MPPT controller 12V',
        url: 'https://www.youtube.com/results?search_query=Will+Prowse+small+solar+panel+MPPT',
      },
      {
        title: 'How to Size Solar Panels and Battery Banks for 24/7 Off-Grid Gear',
        description: '일일 소비전력량(Wh) × 무일조 일수(3일) ÷ 방전심도(DoD 70%)를 적용한 배터리 용량 수학적 산출법',
        searchQuery: 'Will Prowse calculate battery bank size solar off grid',
        url: 'https://www.youtube.com/results?search_query=Will+Prowse+calculate+battery+bank+size',
      },
    ],
    projectApplicationTip:
      '국내 겨울철 영하 -10°C 혹한기 도로변 환경에서는 반드시 "저온 충전 차단(Low-temperature charge disconnect)" 기능이 내장된 LiFePO4 BMS를 채택하거나 12V 실리콘 히팅 패드를 연동해야 배터리 영구 파손을 방지할 수 있습니다.',
    featured: true,
  },
  {
    id: 'julian-ilett-solar',
    name: 'Julian Ilett',
    handle: '@JulianIlett',
    category: 'solar',
    categoryLabel: '태양광·LiFePO4 배터리 & MPPT',
    channelUrl: 'https://www.youtube.com/@JulianIlett',
    subscribers: '160K+',
    description:
      '영국 엔지니어가 수년간 옥외 태양광 패널의 일일 발전 곡선, 겨울철 눈 쌓임 및 일조 부족 상태에서의 마이크로 파워 충방전 데이터를 정밀 기록하고 공개하는 채널입니다.',
    coreTech: ['Small Solar PV', 'Winter Solar Insolation', 'Battery Self-Discharge', 'Coulombic Efficiency', 'Solar Logger'],
    keyTopics: [
      {
        title: 'Winter Solar Performance: Can a 50W Panel Keep Equipment Alive?',
        description: '흐린 날과 겨울철 평균 일조시간 2.5시간 미만 극한 조건에서의 장기 배터리 잔존율(SOC) 실측 데이터',
        searchQuery: 'Julian Ilett winter solar performance small panel',
        url: 'https://www.youtube.com/results?search_query=Julian+Ilett+winter+solar+performance',
      },
    ],
    projectApplicationTip:
      '태양광 패널의 경사각(Tilt Angle)을 여름철 최적각(30°)이 아닌 국내 위도+15°인 50°로 고정 설치하면 겨울철 낮은 태양 고도 각도에서 발전량을 20% 이상 향상시킬 수 있습니다.',
    featured: false,
  },

  // 5. Embedded & Hardware
  {
    id: 'phils-lab-pcb',
    name: "Phil's Lab",
    handle: '@PhilsLab',
    category: 'esp32',
    categoryLabel: 'ESP32-S3 초저전력 & 임베디드 회로',
    channelUrl: 'https://www.youtube.com/@PhilsLab',
    subscribers: '210K+',
    description:
      '산업용 임베디드 하드웨어 설계 엔지니어. 마이크로컨트롤러(STM32/ESP32) 회로도 설계, 4계층 PCB 아트웍, EMC/EMI 도로변 서지 보호 및 전원 노이즈 필터링의 바이블입니다.',
    coreTech: ['Industrial Hardware Design', 'PCB Layout (KiCAD/Altium)', 'EMC/EMI Shielding', 'TVS Surge Protection', 'Automotive Power Filter'],
    keyTopics: [
      {
        title: 'Microcontroller Hardware Design (ESP32 / STM32): Schematics and PCB',
        description: '차량 도로변 전원 서지(Surge) 방지를 위한 TVS 다이오드, 페라이트 비드, 역전압 방지 쇼트키 다이오드 설계',
        searchQuery: 'Phils Lab Microcontroller Hardware Design Schematic PCB',
        url: 'https://www.youtube.com/results?search_query=Phils+Lab+Microcontroller+Hardware+Design',
      },
      {
        title: 'Switching Regulator Design (12V to 5V Step-Down Buck Converter)',
        description: '92% 이상 고효율 벅 컨버터 회로 설계로 발열을 억제하고 24시간 연속 운용 안전성 확보',
        searchQuery: 'Phils Lab Switching Regulator Buck Converter Design',
        url: 'https://www.youtube.com/results?search_query=Phils+Lab+Buck+Converter+Design',
      },
    ],
    projectApplicationTip:
      '도로변 환경은 자동차 점화 플러그 및 트럭 모터의 강력한 전자기 유도 노이즈가 유입되므로, 12V 입력단에 1500W급 TVS 다이오드(SMCJ15CA)와 공통 모드 초크(Common Mode Choke)를 필수 장착해야 합니다.',
    featured: true,
  },
  {
    id: 'the-hook-up-iot',
    name: 'The Hook Up',
    handle: '@TheHookUp',
    category: 'esp32',
    categoryLabel: 'ESP32-S3 초저전력 & 임베디드 회로',
    channelUrl: 'https://www.youtube.com/@TheHookUp',
    subscribers: '510K+',
    description:
      '옥외 IoT 장비 방수 하우징(IP65/IP67), 결로 방지 고어텍스 벤트 플러그(Vent Plug), 태양광 배터리 시스템의 열 배출 및 야외 내구성 튜닝 전문 채널입니다.',
    coreTech: ['IP67 Enclosure', 'Thermal Management', 'Waterproof Glands', 'Gore Vent Plug', 'Outdoor Antenna'],
    keyTopics: [
      {
        title: 'Building Outdoor Solar Powered Weatherproof Enclosures',
        description: '밀폐형 하우징 내부 직사광선 온실 효과 방지 차양막(Solar Shield)과 방수 케이블 그랜드 배선법',
        searchQuery: 'The Hook Up Outdoor Solar Weatherproof Enclosures',
        url: 'https://www.youtube.com/results?search_query=The+Hook+Up+Outdoor+Weatherproof+Enclosures',
      },
    ],
    projectApplicationTip:
      '카메라와 레이더가 들어가는 외함(Enclosure)은 완전 밀폐 시 내부 수분이 렌즈에 응결되므로, 반드시 방수 투습 벤트(ePTFE Gore-Tex Membrane Vent)를 설치해 내외부 압력과 습도를 평형으로 유지해야 합니다.',
    featured: false,
  },
];

export const QUICK_SEARCH_QUERIES = [
  {
    label: 'HLK-LD2451 24GHz 차량 감지 레이더',
    query: 'HLK-LD2451 24GHz radar vehicle detection',
    url: 'https://www.youtube.com/results?search_query=HLK-LD2451+24GHz+radar+vehicle+detection',
    category: '레이더',
  },
  {
    label: '라즈베리파이 글로벌 셔터 카메라 주행 테스트',
    query: 'Raspberry Pi Global Shutter camera moving cars test',
    url: 'https://www.youtube.com/results?search_query=Raspberry+Pi+Global+Shutter+camera+moving+cars',
    category: '카메라',
  },
  {
    label: 'AR0234 초고속 셔터 카메라 OpenCV 연동',
    query: 'AR0234 global shutter OpenCV python tutorial',
    url: 'https://www.youtube.com/results?search_query=AR0234+global+shutter+OpenCV+python',
    category: '카메라',
  },
  {
    label: '차량 번호판 인식 ALPR Python OpenCV',
    query: 'Automatic license plate recognition ANPR OpenCV python',
    url: 'https://www.youtube.com/results?search_query=Automatic+license+plate+recognition+ANPR+OpenCV+python',
    category: 'ALPR',
  },
  {
    label: '옥외용 대형 7세그먼트 188 LED 전광판 제작',
    query: 'DIY Giant 7 segment outdoor LED display driver',
    url: 'https://www.youtube.com/results?search_query=DIY+Giant+7+segment+outdoor+LED+display+driver',
    category: '전광판',
  },
  {
    label: '무일조 3일 독립형 태양광 배터리 계산법',
    query: 'Will Prowse sizing off grid solar battery autonomy days',
    url: 'https://www.youtube.com/results?search_query=Will+Prowse+sizing+off+grid+solar+battery',
    category: '태양광',
  },
  {
    label: 'ESP32 도플러 레이더 속도 측정기 DIY',
    query: 'ESP32 Doppler radar speed trap radar gun',
    url: 'https://www.youtube.com/results?search_query=ESP32+Doppler+radar+speed+trap',
    category: '임베디드',
  },
  {
    label: '인산철(LiFePO4) 영하 저온 충전 보호 회로',
    query: 'LiFePO4 battery low temperature charging protection BMS',
    url: 'https://www.youtube.com/results?search_query=LiFePO4+battery+low+temperature+charging+protection',
    category: '배터리',
  },
];
