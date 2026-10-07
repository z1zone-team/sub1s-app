import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 전역 렌더링 에러 바운더리
 * 자식 컴포넌트에서 발생하는 렌더링 예외를 캡처하여 앱 강제 종료(크래시)를 방지하고
 * 사용자에게 복구 가능한 대체 화면을 제공합니다.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    // 콘솔 로깅
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>문제가 발생했습니다</Text>
          <Text style={styles.description}>
            일시적인 오류가 발생했습니다. 아래 버튼을 눌러 다시 시도해 주세요.
          </Text>
          {__DEV__ && (
            <Text style={styles.errorText}>
              {this.state.error.message}
            </Text>
          )}
          <TouchableOpacity
            style={styles.button}
            onPress={this.resetError}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F19",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    backgroundColor: "#1E293B",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: "100%",
  },
  button: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
