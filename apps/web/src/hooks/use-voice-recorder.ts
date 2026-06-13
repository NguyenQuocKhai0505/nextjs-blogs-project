"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const MAX_RECORDING_SEC = 120

const PREFERRED_MIME = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg",
]

function pickMimeType(): string {
  return PREFERRED_MIME.find((m) => MediaRecorder.isTypeSupported(m)) ?? ""
}

function extForMime(mime: string): string {
  if (mime.includes("webm")) return "webm"
  if (mime.includes("mp4")) return "m4a"
  if (mime.includes("ogg")) return "ogg"
  return "webm"
}

export type VoiceRecordingResult = {
  blob: Blob
  durationSec: number
  filename: string
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [durationSec, setDurationSec] = useState(0)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef(0)
  const mimeRef = useRef("")
  const stopResolverRef = useRef<((value: VoiceRecordingResult | null) => void) | null>(
    null
  )

  const cleanupStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    recorderRef.current = null
    chunksRef.current = []
  }, [])

  const finalizeRecording = useCallback(() => {
    const mime = mimeRef.current || "audio/webm"
    const blob = new Blob(chunksRef.current, { type: mime })
    const duration = Math.max(
      1,
      Math.min(
        MAX_RECORDING_SEC,
        Math.round((Date.now() - startedAtRef.current) / 1000)
      )
    )
    const filename = `voice-${Date.now()}.${extForMime(mime)}`
    cleanupStream()
    setIsRecording(false)
    setDurationSec(0)
    return { blob, durationSec: duration, filename }
  }, [cleanupStream])

  useEffect(() => {
    return () => {
      stopResolverRef.current?.(null)
      stopResolverRef.current = null
      cleanupStream()
    }
  }, [cleanupStream])

  const cancel = useCallback(() => {
    stopResolverRef.current?.(null)
    stopResolverRef.current = null
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.onstop = null
      recorderRef.current.stop()
    }
    cleanupStream()
    setIsRecording(false)
    setDurationSec(0)
  }, [cleanupStream])

  const start = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return false
    }
    const mime = pickMimeType()
    if (!mime) return false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      mimeRef.current = mime
      chunksRef.current = []

      const recorder = new MediaRecorder(stream, { mimeType: mime })
      recorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const result = finalizeRecording()
        stopResolverRef.current?.(result)
        stopResolverRef.current = null
      }

      recorder.start(200)
      startedAtRef.current = Date.now()
      setDurationSec(0)
      setIsRecording(true)

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000)
        setDurationSec(elapsed)
        if (elapsed >= MAX_RECORDING_SEC && recorderRef.current?.state === "recording") {
          recorderRef.current.stop()
        }
      }, 250)

      return true
    } catch {
      cleanupStream()
      return false
    }
  }, [cleanupStream, finalizeRecording])

  const stop = useCallback((): Promise<VoiceRecordingResult | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current
      if (!recorder || recorder.state !== "recording") {
        cleanupStream()
        setIsRecording(false)
        resolve(null)
        return
      }
      stopResolverRef.current = resolve
      recorder.stop()
    })
  }, [cleanupStream])

  return {
    isRecording,
    durationSec,
    maxDurationSec: MAX_RECORDING_SEC,
    start,
    stop,
    cancel,
  }
}
