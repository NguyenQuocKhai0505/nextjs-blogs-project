"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { cn } from "@/lib/utils"

type ToastKind = "success" | "error" | "info"

type ToastItem = {
  id: number
  kind: ToastKind
  message: string
}

type ConfirmOptions = {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type PromptOptions = {
  title: string
  description?: string
  defaultValue?: string
  confirmLabel?: string
  cancelLabel?: string
  placeholder?: string
}

type FeedbackApi = {
  toast: {
    success: (message: string) => void
    error: (message: string) => void
    info: (message: string) => void
  }
  confirm: (opts: ConfirmOptions) => Promise<boolean>
  prompt: (opts: PromptOptions) => Promise<string | null>
}

const FeedbackContext = createContext<FeedbackApi | null>(null)

export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext)
  if (!ctx) {
    throw new Error("useFeedback must be used within FeedbackProvider")
  }
  return ctx
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toastId = useRef(0)

  const [confirmState, setConfirmState] = useState<
    (ConfirmOptions & { resolve: (v: boolean) => void }) | null
  >(null)

  const [promptState, setPromptState] = useState<
    (PromptOptions & { resolve: (v: string | null) => void }) | null
  >(null)
  const [promptValue, setPromptValue] = useState("")

  const pushToast = useCallback((kind: ToastKind, message: string) => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, kind, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4200)
  }, [])

  const toast = useMemo(
    () => ({
      success: (message: string) => pushToast("success", message),
      error: (message: string) => pushToast("error", message),
      info: (message: string) => pushToast("info", message),
    }),
    [pushToast]
  )

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...opts, resolve })
    })
  }, [])

  const prompt = useCallback((opts: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setPromptValue(opts.defaultValue ?? "")
      setPromptState({ ...opts, resolve })
    })
  }, [])

  const api = useMemo(
    () => ({ toast, confirm, prompt }),
    [toast, confirm, prompt]
  )

  return (
    <FeedbackContext.Provider value={api}>
      {children}

      {/* Toasts */}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(100vw-2rem,22rem)] flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-xl shadow-black/40 backdrop-blur-sm",
              "animate-[admin-toast-in_0.28s_ease-out]",
              t.kind === "success" &&
                "border-emerald-500/40 bg-emerald-950/90 text-emerald-100",
              t.kind === "error" &&
                "border-red-500/40 bg-red-950/90 text-red-100",
              t.kind === "info" &&
                "border-sky-500/40 bg-sky-950/90 text-sky-100"
            )}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Confirm dialog */}
      {confirmState ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            aria-label="Close"
            onClick={() => {
              confirmState.resolve(false)
              setConfirmState(null)
            }}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
            className="relative w-full max-w-md rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-6 shadow-2xl"
          >
            <h3
              id="admin-confirm-title"
              className="admin-brand text-lg font-semibold text-[var(--admin-text)]"
            >
              {confirmState.title}
            </h3>
            {confirmState.description ? (
              <p className="mt-2 text-sm text-[var(--admin-muted)]">
                {confirmState.description}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-[var(--admin-border)] px-4 py-2 text-sm hover:bg-[var(--admin-hover)]"
                onClick={() => {
                  confirmState.resolve(false)
                  setConfirmState(null)
                }}
              >
                {confirmState.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold",
                  confirmState.danger
                    ? "bg-red-500 text-white hover:bg-red-400"
                    : "bg-sky-500 text-slate-950 hover:bg-sky-400"
                )}
                onClick={() => {
                  confirmState.resolve(true)
                  setConfirmState(null)
                }}
              >
                {confirmState.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Prompt dialog */}
      {promptState ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            aria-label="Close"
            onClick={() => {
              promptState.resolve(null)
              setPromptState(null)
            }}
          />
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-prompt-title"
            className="relative w-full max-w-md rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-6 shadow-2xl"
            onSubmit={(e) => {
              e.preventDefault()
              promptState.resolve(promptValue)
              setPromptState(null)
            }}
          >
            <h3
              id="admin-prompt-title"
              className="admin-brand text-lg font-semibold text-[var(--admin-text)]"
            >
              {promptState.title}
            </h3>
            {promptState.description ? (
              <p className="mt-2 text-sm text-[var(--admin-muted)]">
                {promptState.description}
              </p>
            ) : null}
            <textarea
              autoFocus
              rows={4}
              value={promptValue}
              placeholder={promptState.placeholder}
              onChange={(e) => setPromptValue(e.target.value)}
              className="mt-4 w-full resize-y rounded-xl border border-[var(--admin-border)] bg-[var(--admin-soft)] px-3 py-2 text-sm outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-[var(--admin-border)] px-4 py-2 text-sm hover:bg-[var(--admin-hover)]"
                onClick={() => {
                  promptState.resolve(null)
                  setPromptState(null)
                }}
              >
                {promptState.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="submit"
                className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
              >
                {promptState.confirmLabel ?? "Send"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </FeedbackContext.Provider>
  )
}
