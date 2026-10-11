import { useEffect, useState } from "react";

/** 값이 delayMs 동안 바뀌지 않았을 때만 따라간다. 검색어를 입력하는 동안 서버를 부르지 않기 위해 쓴다 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
