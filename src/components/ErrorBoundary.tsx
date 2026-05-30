import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) { return { error } }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center px-6">
          <div className="mb-4 text-5xl">💥</div>
          <h2 className="mb-2 text-lg font-semibold text-red-600">出错了</h2>
          <p className="mb-4 max-w-xs break-all text-center text-sm text-slate-500">
            {this.state.error.message}
          </p>
          <pre className="mb-4 max-w-full overflow-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
            {this.state.error.stack?.slice(0, 500)}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload() }}
            className="rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-medium text-white active:scale-95"
          >
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
