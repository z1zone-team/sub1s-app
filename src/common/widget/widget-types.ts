export interface WidgetNextTrain {
  line: string;
  stationName: string;
  remainingSec: number;
  direction: string;
}

export interface WidgetRecentRoute {
  origin: string;
  destination: string;
}

export interface WidgetSnapshot {
  nextTrain?: WidgetNextTrain;
  recentRoutes?: WidgetRecentRoute[];
  updatedAt: string;
}
