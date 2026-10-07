import { useToastStore } from "./toast-store";

describe("Toast Store", () => {
  beforeEach(() => {
    useToastStore.getState().actions.clearToasts();
  });

  it("should show, hide, and clear toast notifications", () => {
    const id = useToastStore.getState().actions.showToast({
      type: "success",
      message: "경로 저장이 완료되었습니다.",
    });

    expect(useToastStore.getState().toasts).toHaveLength(1);
    expect(useToastStore.getState().toasts[0].message).toBe("경로 저장이 완료되었습니다.");

    useToastStore.getState().actions.hideToast(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);

    useToastStore.getState().actions.showToast({
      type: "error",
      message: "오류 발생",
    });
    useToastStore.getState().actions.clearToasts();
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
