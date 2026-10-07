export type CongestionLevel = "SMOOTH" | "NORMAL" | "CAUTION" | "CONGESTED";

export interface CarCongestionDto {
  carNo: number;
  congestion: number;
  level: CongestionLevel;
  isWeakAirConditioned: boolean;
}

export interface TrainCongestionDto {
  line: string;
  trainNo: string;
  currentStation: string;
  cars: CarCongestionDto[];
  updatedAt: string;
}
