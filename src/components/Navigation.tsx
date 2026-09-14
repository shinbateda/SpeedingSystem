import React from 'react';
import { Activity, Calculator, Zap, Camera, Smartphone, Cpu, Github, Youtube, Cable, Server } from 'lucide-react';
import { TabType } from '../types';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'monitor' as TabType, label: '1. 시뮬레이터', icon: Activity },
    { id: 'smartphone' as TabType, label: '2. 스마트폰 과속 모니터링', icon: Smartphone },
    { id: 'server' as TabType, label: '3. 관제 서버', icon: Server },
    { id: 'opensource' as TabType, label: '4. GitHub Hub', icon: Github },
    { id: 'youtube' as TabType, label: '5. 솔루션 유튜브 레퍼런스', icon: Youtube },
    { id: 'bom' as TabType, label: '6. BOM 구성 및 단가', icon: Calculator },
    { id: 'power' as TabType, label: '7. 소모전력 & 태양광·배터리', icon: Zap },
    { id: 'specs' as TabType, label: '8. 셔터 카메라 규격', icon: Camera },
    { id: 'interface' as TabType, label: '9. 인터페이스 (GMSL2/MIPI/USB)', icon: Cable },
    { id: 'durability' as TabType, label: '10. RPi 내구성 & 양산 검토', icon: Cpu },
  ];

  return (
    <nav id="top-nav" className="bg-slate-900 border-b border-slate-800 px-4 overflow-x-auto">
      <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 py-2 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center space-x-1.5 cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
