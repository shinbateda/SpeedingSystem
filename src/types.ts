export type TabType = 'monitor' | 'bom' | 'power' | 'specs' | 'smartphone' | 'durability' | 'opensource';

export interface Vehicle {
  id: number;
  x: number;
  y: number;
  speed: number;
  isOverspeed: boolean;
  plate: string;
  color: string;
  triggered: boolean;
}

export interface SnapshotRecord {
  id: number;
  time: string;
  plate: string;
  speed: number;
  isOverspeed: boolean;
}

export interface BOMItem {
  id: string;
  category: '필수' | '옵션';
  name: string;
  spec: string;
  price: number;
  selected?: boolean;
}

export interface ComponentPowerItem {
  name: string;
  category: string;
  voltageV: number;
  currentMa: number;
  peakWatts: number;
  avgWatts: number;
  dailyHours: number;
  dailyWh: number;
  dutyCycleDesc: string;
}

export interface CameraSpec {
  model: string;
  shutterType: string;
  interface: string;
  priceRange: string;
  latencyMs: number;
  isRecommended?: boolean;
}

export interface OpenSourceRepo {
  name: string;
  type: string;
  desc: string;
  tags: string[];
  link: string;
}
