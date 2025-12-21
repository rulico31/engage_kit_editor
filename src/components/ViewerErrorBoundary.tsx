import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { logAnalyticsEvent } from '../lib/analytics';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * 閲覧者 (Viewer) 用のランタイムエラー境界
 * アプリケーションがクラッシュする代わりに、やさしいエラーメッセージを表示します。
 */
export class ViewerErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        // 次回のレンダリングでフォールバックUIを表示するための状態を更新
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // エラーログを送信
        console.error("Viewer Runtime Error caught by boundary:", error, errorInfo);

        logAnalyticsEvent('error', {
            metadata: {
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack
            }
        });
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // デフォルトのフォールバックUI
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    width: '100%',
                    padding: '20px',
                    color: '#666',
                    textAlign: 'center',
                    fontFamily: 'sans-serif',
                    backgroundColor: 'rgba(255,255,255,0.9)' // 背景色から浮かないように
                }}>
                    <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚠️</div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>
                        一時的なエラーが発生しました
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>
                        再読み込みを行っても解消しない場合は、管理者にお問い合わせください。
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}
