import { get, type RequestOptions } from "@/apis/client";

export interface ExitFacility {
  name: string;
  address: string | null;
}

export interface StationExit {
  /** "1", "2", 가지 출구는 "2-1" */
  exitNo: string;
  facilities: ExitFacility[];
}

export interface StationFacilities {
  stationId: string;
  stationName: string;
  lineId: string;
  /** false면 이 역의 자료가 아직 없다. 아래 값은 모두 비어 있다 */
  available: boolean;
  /** 엘리베이터 인접 문이 있으면 true, 자료가 없으면 null */
  hasElevator: boolean | null;
  /** 엘리베이터와 가까운 문. "칸-문" 번호이며 경로의 recommendedDoors와 같은 형식 */
  elevatorDoors: string[];
  exits: StationExit[];
}

/**
 * 역의 편의시설 (출구, 엘리베이터 인접 문)
 * GET /api/v1/stations/:stationId/facilities
 */
export const getStationFacilities = (
  stationId: string,
  options?: RequestOptions
): Promise<StationFacilities> => {
  return get<StationFacilities>(
    `/stations/${encodeURIComponent(stationId)}/facilities`,
    undefined,
    options
  );
};
