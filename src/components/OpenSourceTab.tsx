import React from 'react';
import { Github, ExternalLink, Code2 } from 'lucide-react';
import { OpenSourceRepo } from '../types';

export const OpenSourceTab: React.FC = () => {
  const openSourceDirectory: OpenSourceRepo[] = [
    {
      name: 'pageauc/speed-camera',
      type: 'GITHUB',
      desc: '라즈베리파이 최적화 Python/OpenCV 차량 추적 및 VASCAR 속도 산출 마스터 오픈소스. SD카드 파일 저장 지원.',
      tags: ['Speed Estimation', 'OpenCV', 'RPi Optimization'],
      link: 'https://github.com/pageauc/speed-camera',
    },
    {
      name: 'jamal022/automatic-number-plate-recognition',
      type: 'GITHUB',
      desc: 'YOLOv8 + SORT 딥러닝 객체 추적 알고리즘을 결합하여 속도 추정과 번호판 인식을 동시 수행하는 파이프라인.',
      tags: ['YOLOv8', 'SORT Tracker', 'ANPR Pipeline'],
      link: 'https://github.com/jamal022/automatic-number-plate-recognition-Speed-Estimation',
    },
    {
      name: 'gyupro/EasyKoreanLpDetector',
      type: 'GITHUB',
      desc: 'AIHUB 데이터셋 학습 가중치 포함. 라즈베리 파이 환경에 맞춘 파이썬 YOLO 한국어 차번 탐지기.',
      tags: ['YOLOv8', 'Korean Plate', 'Python'],
      link: 'https://github.com/gyupro/EasyKoreanLpDetector',
    },
    {
      name: 'espressif/esp-who',
      type: 'GITHUB',
      desc: 'ESP32-S3 기반 카메라 영상 처리, 하드웨어 JPEG 인코딩 및 Wi-Fi AP 웹서버 이미지 스트리밍 공식 프레임워크.',
      tags: ['ESP32-S3', 'Wi-Fi AP', 'Camera Driver'],
      link: 'https://github.com/espressif/esp-who',
    },
    {
      name: 'alexandreblanco/radar-speed-sensor',
      type: 'GITHUB',
      desc: '24GHz 도플러 레이더 IF 펄스 주파수를 속도로 변환하는 인터럽트 기반 ESP32 타이머 카운터 펌웨어.',
      tags: ['Doppler Radar', 'Pulse Frequency', 'ESP32 Interrupt'],
      link: 'https://github.com',
    },
    {
      name: 'antmicro/fast-camera-trigger',
      type: 'GITHUB',
      desc: 'AR0234 머신비전 카메라의 외부 GPIO 펄스 셔터링 연동 및 리눅스 V4L2 스트리밍 최적화 오픈소스.',
      tags: ['AR0234', 'Hardware Trigger', 'V4L2'],
      link: 'https://github.com',
    },
  ];

  return (
    <section id="tab-opensource" className="space-y-4">
      <div className="bg-purple-950/40 border border-purple-800/60 rounded-2xl p-4 sm:p-5">
        <h2 className="text-base font-bold text-purple-300 flex items-center space-x-2">
          <Github className="w-5 h-5" />
          <span>ESP32 & 라즈베리파이 오픈소스 (GitHub / YouTube) 레퍼런스 Hub</span>
        </h2>
        <p className="text-xs sm:text-sm text-purple-200 mt-1.5 leading-relaxed">
          OpenCV 기반 속도 산출, AR0234 V4L2 노출 제어 및 한국어 번호판 인식(ALPR) 오픈소스 저장소 리스트입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="repoGrid">
        {openSourceDirectory.map((item) => (
          <div
            key={item.name}
            className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3 hover:border-purple-500/50 transition"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-xs text-slate-100 truncate pr-2 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>{item.name}</span>
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono border bg-purple-950 text-purple-300 border-purple-800 shrink-0">
                  {item.type}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>

            <div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-slate-950 text-slate-400 border border-slate-800 text-[10px] px-2 py-0.5 rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs font-semibold py-2 bg-purple-950/80 hover:bg-purple-900 text-purple-300 rounded-xl border border-purple-800/80 transition flex items-center justify-center gap-1.5"
              >
                <span>GitHub 저장소 방문</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
