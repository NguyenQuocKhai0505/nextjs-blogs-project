export default function ReelsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-black text-white selection:bg-sky-500/40">
      {children}
    </div>
  )
}
