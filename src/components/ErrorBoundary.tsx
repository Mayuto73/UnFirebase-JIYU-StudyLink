import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message || '不明なエラーが発生しました。';
      let isFirestoreError = false;
      
      try {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error) {
          errorMessage = parsedError.error;
          isFirestoreError = true;
        }
      } catch (e) {
        // Not a JSON error string, keep original message
      }

      return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
            <p className="text-stone-700 mb-4">
              申し訳ありませんが、アプリケーションで予期せぬエラーが発生しました。
            </p>
            <div className="bg-red-50 p-4 rounded-md border border-red-200 overflow-auto max-h-60 mb-6">
              <p className="text-sm text-red-800 font-mono whitespace-pre-wrap">
                {errorMessage}
              </p>
            </div>
            {isFirestoreError && errorMessage.includes('permission') && (
              <p className="text-sm text-stone-600 mb-6">
                データベースのアクセス権限（セキュリティルール）に問題がある可能性があります。
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
