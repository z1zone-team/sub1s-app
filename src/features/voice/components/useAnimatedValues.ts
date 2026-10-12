import { useRef } from "react";
import { Animated } from "react-native";

/** 같은 초깃값을 가진 Animated.Value를 count개 한 번만 만들어 돌려준다 */
export function useAnimatedValues(count: number, initial: number): Animated.Value[] {
  const ref = useRef<Animated.Value[] | null>(null);
  if (ref.current === null) ref.current = Array.from({ length: count }, () => new Animated.Value(initial));
  return ref.current;
}
