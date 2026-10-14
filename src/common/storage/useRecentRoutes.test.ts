import { appStorage } from "./storage";
import { MAX_RECENT_ROUTES, RECENT_ROUTES_STORAGE_KEY, useRecentRoutesStore } from "./useRecentRoutes";

let stored: string | null = null;
jest.mock("./storage", () => ({
  appStorage: {
    getItem: jest.fn(async () => stored),
    setItem: jest.fn(async (_key: string, value: string) => { stored = value; }),
    removeItem: jest.fn(async () => { stored = null; }),
  },
}));

const destination = (name: string, stationId: string = name) => ({
  origin: "", destination: name, destStationId: stationId,
});
const state = () => useRecentRoutesStore.getState();

beforeEach(() => {
  stored = null;
  jest.clearAllMocks();
  useRecentRoutesStore.setState({ routes: [], isLoading: true, error: null });
});

it("keeps stored history when a selection is saved before screen hydration", async () => {
  await state().addRoute(destination("강남"));
  useRecentRoutesStore.setState({ routes: [], isLoading: true });
  await state().addRoute(destination("가양"));
  expect(state().routes.map((route) => route.destination)).toEqual(["가양", "강남"]);
  expect(JSON.parse(stored!)).toEqual(state().routes);
});

it("serializes simultaneous saves and a reload from different screens", async () => {
  await Promise.all([
    state().addRoute(destination("강남")),
    state().reload(),
    state().addRoute(destination("가양")),
  ]);
  expect(state().routes.map((route) => route.destination)).toEqual(["가양", "강남"]);
  expect(appStorage.setItem).toHaveBeenCalledTimes(2);
});

it("does not depend on a mounted screen to finish persistence", async () => {
  let release!: () => void;
  const write = new Promise<void>((resolve) => { release = resolve; });
  jest.mocked(appStorage.setItem).mockImplementationOnce(async (_key, value) => {
    await write;
    stored = value;
  });
  const save = state().addRoute(destination("강남"));
  await Promise.resolve();
  await Promise.resolve();
  expect(state().routes).toEqual([]);
  release();
  await save;
  expect(state().routes[0].destination).toBe("강남");
  expect(appStorage.setItem).toHaveBeenCalledWith(RECENT_ROUTES_STORAGE_KEY, stored);
});

it("removes several entries without restoring an earlier snapshot", async () => {
  await state().addRoute(destination("강남"));
  await state().addRoute(destination("가양"));
  const ids = state().routes.map((route) => route.id);
  await Promise.all(ids.map((id) => state().removeRoute(id)));
  expect(JSON.parse(stored!)).toEqual([]);
  await state().clearRoutes();
  expect(stored).toBeNull();
});

it("keeps the last saved list on a write failure and allows the next save", async () => {
  await state().addRoute(destination("강남"));
  jest.mocked(appStorage.setItem).mockRejectedValueOnce(new Error("disk full"));
  await state().addRoute(destination("가양"));
  expect(state().routes.map((route) => route.destination)).toEqual(["강남"]);
  expect(state().error).not.toBeNull();
  await state().addRoute(destination("서울역"));
  expect(state().routes.map((route) => route.destination)).toEqual(["서울역", "강남"]);
  expect(state().error).toBeNull();
});

it("deduplicates by endpoint identity, preserves same-name stations and limits history", async () => {
  await state().addRoute(destination("서울역", "01_133"));
  await state().addRoute(destination("서울역", "04_426"));
  await state().addRoute(destination("서울역", "01_133"));
  expect(state().routes.map((route) => route.destStationId)).toEqual(["01_133", "04_426"]);
  await Promise.all(Array.from({ length: 12 }, (_, i) => state().addRoute(destination(`역${i}`))));
  expect(state().routes).toHaveLength(MAX_RECENT_ROUTES);
  expect(state().routes[0].destination).toBe("역11");
});
