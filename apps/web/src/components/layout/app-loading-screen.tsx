import Image from "next/image"

type AppLoadingScreenProps = {
  label?: string
}

export function AppLoadingScreen({ label = "Loading your community" }: AppLoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="ks-app-shell fixed inset-0 z-[200] flex flex-col items-center justify-center gap-7 px-6"
    >
      <div className="relative h-36 w-36">
        <div className="absolute inset-0 rounded-full border-[5px] border-primary/10" />
        <div className="ks-loader-ring absolute inset-0 rounded-full" />
        <div className="ks-loader-ring ks-loader-ring--reverse absolute inset-[9px] rounded-full opacity-60" />
        <div className="ks-loader-pulse absolute inset-[16px] overflow-hidden rounded-full bg-[#38b6ff] shadow-lg shadow-primary/25 ring-2 ring-background">
          {/* Crops the square "K" emblem out of the wide logo image. */}
          <Image
            src="/logo.png"
            alt="Ksocial"
            width={1001}
            height={811}
            priority
            className="absolute max-w-none"
            style={{ width: "238%", height: "auto", left: "-70.7%", top: "-15.5%" }}
          />
        </div>
      </div>

      <div className="text-center">
        <p className="ks-brand-text text-3xl">Ksocial</p>
        <p className="mt-2 flex items-end justify-center gap-1 text-sm text-muted-foreground">
          {label}
          <span className="ks-loader-dots mb-[5px]" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </p>
      </div>
    </div>
  )
}
