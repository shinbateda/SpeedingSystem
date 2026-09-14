import React, { useState, useMemo } from 'react';
import {
  Youtube,
  Play,
  ExternalLink,
  Search,
  Sparkles,
  Radio,
  Camera,
  Zap,
  Cpu,
  Layers,
  CheckCircle2,
  Bookmark,
  Sun,
  ShieldCheck,
  Video,
  Flame,
  Lightbulb,
} from 'lucide-react';
import { YOUTUBE_CHANNELS, QUICK_SEARCH_QUERIES } from '../data/youtubeData';
import { YouTubeChannelItem } from '../types';

type CategoryFilter = 'all' | 'radar' | 'camera' | 'led' | 'solar' | 'esp32';

export const YouTubeTab: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  const categories = [
    { id: 'all' as CategoryFilter, label: '전체 보기', icon: Layers, count: YOUTUBE_CHANNELS.length },
    {
      id: 'radar' as CategoryFilter,
      label: '24GHz 레이더 (HLK-LD2451)',
      icon: Radio,
      count: YOUTUBE_CHANNELS.filter((c) => c.category === 'radar').length,
    },
    {
      id: 'camera' as CategoryFilter,
      label: '셔터 카메라 & ALPR',
      icon: Camera,
      count: YOUTUBE_CHANNELS.filter((c) => c.category === 'camera').length,
    },
    {
      id: 'led' as CategoryFilter,
      label: '1단1열 188 LED 전광판',
      icon: Zap,
      count: YOUTUBE_CHANNELS.filter((c) => c.category === 'led').length,
    },
    {
      id: 'solar' as CategoryFilter,
      label: '태양광 & LiFePO4 배터리',
      icon: Sun,
      count: YOUTUBE_CHANNELS.filter((c) => c.category === 'solar').length,
    },
    {
      id: 'esp32' as CategoryFilter,
      label: 'ESP32 & 회로/방수 하우징',
      icon: Cpu,
      count: YOUTUBE_CHANNELS.filter((c) => c.category === 'esp32').length,
    },
  ];

  const filteredChannels = useMemo(() => {
    return YOUTUBE_CHANNELS.filter((channel) => {
      const matchCategory = selectedCategory === 'all' || channel.category === selectedCategory;
      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const matchName = channel.name.toLowerCase().includes(query);
      const matchHandle = channel.handle.toLowerCase().includes(query);
      const matchDesc = channel.description.toLowerCase().includes(query);
      const matchTech = channel.coreTech.some((t) => t.toLowerCase().includes(query));
      const matchTopics = channel.keyTopics.some(
        (top) => top.title.toLowerCase().includes(query) || top.description.toLowerCase().includes(query)
      );
      const matchTip = channel.projectApplicationTip.toLowerCase().includes(query);

      return matchName || matchHandle || matchDesc || matchTech || matchTopics || matchTip;
    });
  }, [selectedCategory, searchQuery]);

  const handleCopyQuery = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(text);
    setTimeout(() => {
      setCopiedQuery(null);
    }, 2000);
  };

  return (
    <section id="tab-youtube" className="space-y-4">
      {/* Title Header */}
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                <Youtube className="w-5 h-5" />
              </span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>하드웨어 & 소프트웨어 솔루션 기술 유튜브 레퍼런스 허브</span>
                <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded font-mono">
                  실무 채널 & 튜토리얼 연동
                </span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
              <strong>Hi-Link HLK-LD2451 24GHz FMCW 레이더</strong> 통신 패킷 분석, 
              <strong> AR0234 글로벌 셔터 카메라</strong> 기반 고속 번호판 인식(ALPR), 
              <strong> 1단 1열 188 LED 전광판</strong> 정전류 구동, 
              <strong> 무일조 3일 LiFePO4 배터리 및 태양광 MPPT</strong> 실측 검증까지 각 도메인별 전 세계 최고 엔지니어 채널 및 핵심 강좌 URL을 총망라했습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://www.youtube.com/results?search_query=HLK-LD2451+24GHz+radar"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              <span>HLK-LD2451 영상 검색 ↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* Top 4 Domain Highlights / Key Solvers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Radio className="w-4 h-4" />
              <span>24GHz FMCW 레이더</span>
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">HLK-LD2451</span>
          </div>
          <p className="text-xs text-slate-300">
            Hi-Link 레이더 UART 데이터 파싱, 감지 거리 100m 튜닝, 스마트폰 BLE 앱(HLKRadarTool) 캘리브레이션.
          </p>
          <a
            href="https://www.youtube.com/results?search_query=Andreas+Spiess+mmWave+radar+HLK"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 mt-1"
          >
            <span>추천: Andreas Spiess #464 ↗</span>
          </a>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Camera className="w-4 h-4" />
              <span>글로벌 셔터 & ALPR</span>
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">AR0234 / OpenCV</span>
          </div>
          <p className="text-xs text-slate-300">
            고속 주행 차량의 롤링 셔터 젤로 왜곡 제거, MIPI CSI-2 60fps 캡처, YOLOv8 & PaddleOCR 실시간 번호판 추출.
          </p>
          <a
            href="https://www.youtube.com/results?search_query=Jeff+Geerling+Raspberry+Pi+Global+Shutter+Camera"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 mt-1"
          >
            <span>추천: Jeff Geerling 셔터 테스트 ↗</span>
          </a>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>188 LED 전광판 구동</span>
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">7-Segment 12V</span>
          </div>
          <p className="text-xs text-slate-300">
            옥외 직사광선 10,000cd 고휘도 LED 정전류 구동, 12V 세그먼트 스위칭, 플리커 방지 ESP32 하드웨어 타이머.
          </p>
          <a
            href="https://www.youtube.com/results?search_query=GreatScott+Giant+7-Segment+Display"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 mt-1"
          >
            <span>추천: GreatScott! 고휘도 드라이버 ↗</span>
          </a>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
              <Sun className="w-4 h-4" />
              <span>무일조 3일 태양광</span>
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">35Ah LiFePO4</span>
          </div>
          <p className="text-xs text-slate-300">
            50W 패널 + 35Ah 인산철 배터리 무일조 3일 계산, 영하 0°C 저온 충전 보호 BMS, MPPT 효율 극대화.
          </p>
          <a
            href="https://www.youtube.com/results?search_query=Will+Prowse+calculate+battery+bank+size"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-1 mt-1"
          >
            <span>추천: Will Prowse 배터리 산출 공식 ↗</span>
          </a>
        </div>
      </div>

      {/* Quick Search Launchers (Pill Buttons) */}
      <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>핵심 기술별 유튜브 원클릭 검색 바로가기</span>
          </span>
          <span className="text-[11px] text-slate-400">클릭 시 유튜브 검색 결과가 새 탭에서 열립니다</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_SEARCH_QUERIES.map((q, idx) => (
            <a
              key={idx}
              href={q.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-xl text-xs text-slate-300 hover:text-white transition flex items-center space-x-1.5 cursor-pointer"
            >
              <span className="text-[10px] text-amber-400 font-mono">[{q.category}]</span>
              <span>{q.label}</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="채널명, 기술 키워드 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Channel Cards Grid */}
      <div className="space-y-4">
        {filteredChannels.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            검색 결과가 없습니다. 다른 검색어를 입력하시거나 카테고리를 변경해 보세요.
          </div>
        ) : (
          filteredChannels.map((ch) => (
            <div
              key={ch.id}
              id={`channel-${ch.id}`}
              className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-4 hover:border-slate-700 transition"
            >
              {/* Channel Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-start sm:items-center space-x-3">
                  <div className="p-2.5 bg-red-600/10 text-red-400 rounded-xl border border-red-500/20 shrink-0">
                    <Youtube className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white">{ch.name}</h3>
                      <span className="text-xs text-slate-400 font-mono">{ch.handle}</span>
                      {ch.featured && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          추천 핵심 채널
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="text-amber-400 font-medium">{ch.categoryLabel}</span>
                      <span>·</span>
                      <span>구독자 {ch.subscribers}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={ch.channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>유튜브 채널 바로가기</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Description & Tags */}
              <div className="space-y-2 text-xs">
                <p className="text-slate-300 leading-relaxed">{ch.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {ch.coreTech.map((tech, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-lg font-mono"
                    >
                      #{tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Topics / Recommended Video Solutions */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                    <span>추천 기술 강좌 & 솔루션 영상 리스트</span>
                  </span>
                  <span className="text-[10px] text-slate-400">제목 클릭 시 유튜브 검색/영상으로 직결됩니다</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {ch.keyTopics.map((topic, tidx) => (
                    <div
                      key={tidx}
                      className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-1.5"
                    >
                      <div>
                        <a
                          href={topic.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-amber-400 hover:text-amber-300 flex items-start justify-between gap-1 group"
                        >
                          <span className="group-hover:underline">{topic.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:text-amber-300 mt-0.5" />
                        </a>
                        <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">{topic.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                        <span className="text-slate-400 truncate max-w-[200px]">검색: {topic.searchQuery}</span>
                        <button
                          onClick={() => handleCopyQuery(topic.searchQuery)}
                          className="text-slate-400 hover:text-white cursor-pointer"
                          title="검색어 복사"
                        >
                          {copiedQuery === topic.searchQuery ? '복사됨!' : '검색어 복사'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Practical Engineering Application Tip */}
              <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs text-amber-200/90 flex items-start space-x-2">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-amber-400 font-bold block mb-0.5">
                    💡 본 프로젝트(과속 단속 및 셔터 카메라) 실무 적용 팁:
                  </strong>
                  <p className="text-slate-300 text-[11px]">{ch.projectApplicationTip}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
