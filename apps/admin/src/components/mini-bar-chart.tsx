"use client"

type MiniBarChartProps = {
  title: string
  subtitle?: string
  labels: string[]
  values: number[]
  color?: string
  emptyLabel: string
}

function shortDay(iso: string) {
  try {
    const d = new Date(iso + "T12:00:00.000Z")
    return d.toLocaleDateString(undefined, { weekday: "short" })
  } catch {
    return iso.slice(5)
  }
}

export function MiniBarChart({
  title,
  subtitle,
  labels,
  values,
  color = "#38bdf8",
  emptyLabel,
}: MiniBarChartProps) {
  const max = Math.max(1, ...values)
  const total = values.reduce((a, b) => a + b, 0)
  const w = 280
  const h = 120
  const padX = 8
  const padTop = 12
  const padBottom = 24
  const chartH = h - padTop - padBottom
  const gap = 6
  const barW =
    labels.length > 0
      ? (w - padX * 2 - gap * (labels.length - 1)) / labels.length
      : 0

  return (
    <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--admin-text)]">{title}</p>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-[var(--admin-muted)]">{subtitle}</p>
          ) : null}
        </div>
        <p className="admin-brand text-2xl font-semibold tabular-nums text-sky-500">
          {total}
        </p>
      </div>

      {total === 0 ? (
        <p className="mt-8 text-center text-sm text-[var(--admin-muted)]">
          {emptyLabel}
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="mt-4 h-32 w-full"
          role="img"
          aria-label={title}
        >
          {values.map((v, i) => {
            const barH = (v / max) * chartH
            const x = padX + i * (barW + gap)
            const y = padTop + chartH - barH
            return (
              <g key={labels[i] ?? i}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(barH, v > 0 ? 2 : 0)}
                  rx={4}
                  fill={color}
                  opacity={0.85}
                />
                <text
                  x={x + barW / 2}
                  y={h - 8}
                  textAnchor="middle"
                  className="fill-[var(--admin-muted)]"
                  style={{ fontSize: 10 }}
                >
                  {shortDay(labels[i] ?? "")}
                </text>
                {v > 0 ? (
                  <text
                    x={x + barW / 2}
                    y={y - 4}
                    textAnchor="middle"
                    className="fill-[var(--admin-muted)]"
                    style={{ fontSize: 9 }}
                  >
                    {v}
                  </text>
                ) : null}
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}
