export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1440px] items-center justify-center px-3 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
