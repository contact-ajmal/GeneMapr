import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CHROMOSOMES, CHROM_ORDER } from '../data/cytobands'
import type { Stain } from '../data/cytobands'
import type { GenomeAnnotation, ChromosomeSummary } from '../types/variant'

// ─── Color helpers ───────────────────────────────────────────────────
const DARK_BAND_COLORS: Record<Stain, string> = {
  gneg: '#1e293b',
  gpos25: '#334155',
  gpos50: '#475569',
  gpos75: '#64748b',
  gpos100: '#94a3b8',
  acen: '#ff3366',
  gvar: '#2d3748',
  stalk: '#4a5568',
}

function getSignificanceColor(sig: string | null): string {
  if (!sig) return '#94a3b8'
  const s = sig.toLowerCase()
  if (s.includes('pathogenic') && !s.includes('likely')) return '#ff3366'
  if (s.includes('likely pathogenic') || s.includes('likely_pathogenic')) return '#ff8c00'
  if (s.includes('uncertain') || s.includes('vus')) return '#ffaa00'
  if (s.includes('likely benign') || s.includes('likely_benign')) return '#4a9eff'
  if (s.includes('benign')) return '#00ff88'
  return '#94a3b8'
}

function getSignificanceLabel(sig: string | null): string {
  if (!sig) return 'Unknown'
  const s = sig.toLowerCase()
  if (s.includes('pathogenic') && !s.includes('likely')) return 'Pathogenic'
  if (s.includes('likely pathogenic') || s.includes('likely_pathogenic')) return 'Likely Path.'
  if (s.includes('uncertain') || s.includes('vus')) return 'VUS'
  if (s.includes('likely benign') || s.includes('likely_benign')) return 'Likely Benign'
  if (s.includes('benign')) return 'Benign'
  return 'Unknown'
}

// ─── Legend items ────────────────────────────────────────────────────
const LEGEND_ITEMS = [
  { label: 'Pathogenic', color: '#ff3366' },
  { label: 'Likely Path.', color: '#ff8c00' },
  { label: 'VUS', color: '#ffaa00' },
  { label: 'Likely Benign', color: '#4a9eff' },
  { label: 'Benign', color: '#00ff88' },
  { label: 'Unknown', color: '#94a3b8' },
]

// ─── Tooltip ─────────────────────────────────────────────────────────
interface TooltipData {
  x: number
  y: number
  content: React.ReactNode
}

// ─── Props ───────────────────────────────────────────────────────────
interface GenomeVisualizationProps {
  annotations: GenomeAnnotation[]
  chromosomeSummary: Record<string, ChromosomeSummary>
  onVariantClick?: (variantId: string) => void
}

export default function GenomeVisualization({
  annotations,
  chromosomeSummary,
  onVariantClick,
}: GenomeVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(900)
  const [zoomedChrom, setZoomedChrom] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [mode, setMode] = useState<'overlay' | 'histogram'>('overlay')

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Group annotations by chromosome
  const annotationsByChrom = useMemo(() => {
    const map: Record<string, GenomeAnnotation[]> = {}
    for (const a of annotations) {
      if (!map[a.chr]) map[a.chr] = []
      map[a.chr].push(a)
    }
    return map
  }, [annotations])

  const hideTooltip = useCallback(() => setTooltip(null), [])

  const showTooltip = useCallback(
    (e: React.MouseEvent, content: React.ReactNode) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        content,
      })
    },
    []
  )

  if (annotations.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500 font-body text-sm">
        No variants to visualize
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {zoomedChrom && (
            <button
              onClick={() => { setZoomedChrom(null); setTooltip(null) }}
              className="px-3 py-1.5 rounded-lg text-xs font-body font-medium
                bg-dna-cyan/10 text-dna-cyan border border-dna-cyan/30
                hover:bg-dna-cyan/20 transition-colors"
            >
              Back to Karyotype
            </button>
          )}
          <span className="text-xs text-slate-500 font-body">
            GRCh38 &middot; {annotations.length} variant{annotations.length !== 1 ? 's' : ''} mapped
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-slate-700 overflow-hidden">
            <button
              onClick={() => setMode('overlay')}
              className={`px-3 py-1 text-[10px] font-body transition-colors ${
                mode === 'overlay'
                  ? 'bg-dna-cyan/15 text-dna-cyan'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Overlay
            </button>
            <button
              onClick={() => setMode('histogram')}
              className={`px-3 py-1 text-[10px] font-body transition-colors border-l border-slate-700 ${
                mode === 'histogram'
                  ? 'bg-dna-cyan/15 text-dna-cyan'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Histogram
            </button>
          </div>

          {/* Legend */}
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color, boxShadow: `0 0 4px ${item.color}40` }}
              />
              <span className="text-[10px] text-slate-400 font-body">{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-[10px] text-slate-400 font-body ml-0.5">Size = Risk</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {zoomedChrom ? (
          <ZoomedChromView
            key={`zoom-${zoomedChrom}`}
            chrom={zoomedChrom}
            annotations={annotationsByChrom[zoomedChrom] || []}
            width={containerWidth}
            onVariantClick={onVariantClick}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
        ) : (
          <KaryotypeView
            key="karyotype"
            annotations={annotationsByChrom}
            summary={chromosomeSummary}
            width={containerWidth}
            mode={mode}
            onChromClick={(c) => { setZoomedChrom(c); setTooltip(null) }}
            onVariantClick={onVariantClick}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 pointer-events-none"
            style={{
              left: Math.min(tooltip.x + 14, containerWidth - 260),
              top: Math.max(tooltip.y - 10, 0),
            }}
          >
            {tooltip.content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Karyotype View ──────────────────────────────────────────────────
interface KaryotypeViewProps {
  annotations: Record<string, GenomeAnnotation[]>
  summary: Record<string, ChromosomeSummary>
  width: number
  mode: 'overlay' | 'histogram'
  onChromClick: (chrom: string) => void
  onVariantClick?: (id: string) => void
  showTooltip: (e: React.MouseEvent, content: React.ReactNode) => void
  hideTooltip: () => void
}

function KaryotypeView({
  annotations,
  summary,
  width,
  mode,
  onChromClick,
  onVariantClick,
  showTooltip,
  hideTooltip,
}: KaryotypeViewProps) {
  const maxLen = useMemo(
    () => Math.max(...CHROM_ORDER.map((c) => CHROMOSOMES[c]?.length || 0)),
    []
  )

  // Layout: single horizontal row
  const CHROM_WIDTH = 14
  const spacing = Math.max(8, Math.min(24, (width - 40) / CHROM_ORDER.length - CHROM_WIDTH))
  const totalW = CHROM_ORDER.length * (CHROM_WIDTH + spacing)
  const offsetX = Math.max(0, (width - totalW) / 2)
  const MAX_HEIGHT = 280
  const LABEL_AREA = 40
  const MARKER_AREA = mode === 'histogram' ? 30 : 16
  const SVG_H = MAX_HEIGHT + LABEL_AREA + MARKER_AREA + 10

  return (
    <motion.svg
      width="100%"
      viewBox={`0 0 ${width} ${SVG_H}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-visible"
    >
      <defs>
        <filter id="varGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {CHROM_ORDER.map((chrom, idx) => {
        const info = CHROMOSOMES[chrom]
        if (!info) return null
        const x = offsetX + idx * (CHROM_WIDTH + spacing)
        const chromH = (info.length / maxLen) * MAX_HEIGHT
        const yStart = MARKER_AREA + (MAX_HEIGHT - chromH)
        const vars = annotations[chrom] || []
        const summ = summary[chrom]
        const hasPathogenic = summ && summ.pathogenic > 0

        return (
          <g key={chrom}>
            {/* Stagger animation */}
            <motion.g
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.025, duration: 0.35 }}
            >
              {/* Chromosome body with banding */}
              <g
                onClick={() => onChromClick(chrom)}
                onMouseEnter={(e) => {
                  if (summ) {
                    showTooltip(e, <ChromTooltip chrom={chrom} summary={summ} />)
                  }
                }}
                onMouseLeave={hideTooltip}
                className="cursor-pointer"
                style={{ filter: hasPathogenic ? 'drop-shadow(0 0 3px rgba(255,51,102,0.25))' : undefined }}
              >
                <ChromosomeSVG
                  x={x}
                  y={yStart}
                  width={CHROM_WIDTH}
                  height={chromH}
                  chrom={chrom}
                />
              </g>

              {/* Variant markers */}
              {mode === 'overlay' &&
                vars.map((v) => {
                  const vy = yStart + (v.start / info.length) * chromH
                  const color = getSignificanceColor(v.clinvar_significance)
                  const r = 2 + ((v.risk_score || 0) / 10) * 3
                  return (
                    <g
                      key={v.variant_id}
                      onMouseEnter={(e) =>
                        showTooltip(e, <VariantTooltip v={v} />)
                      }
                      onMouseLeave={hideTooltip}
                      onClick={(e) => {
                        e.stopPropagation()
                        onVariantClick?.(v.variant_id)
                      }}
                      className="cursor-pointer"
                    >
                      {/* Arrow marker pointing at chromosome */}
                      <polygon
                        points={`${x - r - 2},${vy - r * 0.6} ${x - 1},${vy} ${x - r - 2},${vy + r * 0.6}`}
                        fill={color}
                        opacity={0.9}
                        filter="url(#varGlow)"
                      />
                    </g>
                  )
                })}

              {/* Histogram mode */}
              {mode === 'histogram' && vars.length > 0 && (
                <HistogramTrack
                  x={x}
                  y={yStart}
                  width={CHROM_WIDTH}
                  height={chromH}
                  chromLength={info.length}
                  variants={vars}
                />
              )}

              {/* Label */}
              <text
                x={x + CHROM_WIDTH / 2}
                y={yStart + chromH + 14}
                textAnchor="middle"
                className="fill-slate-400"
                style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {chrom}
              </text>

              {/* Variant count badge */}
              {vars.length > 0 && (
                <>
                  <circle
                    cx={x + CHROM_WIDTH / 2}
                    cy={yStart + chromH + 28}
                    r={4}
                    fill={hasPathogenic ? '#ff3366' : '#00d4ff'}
                    opacity={0.7}
                  />
                  <text
                    x={x + CHROM_WIDTH / 2}
                    y={yStart + chromH + 31}
                    textAnchor="middle"
                    className="fill-white"
                    style={{ fontSize: '5px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}
                  >
                    {vars.length}
                  </text>
                </>
              )}
            </motion.g>
          </g>
        )
      })}
    </motion.svg>
  )
}

// ─── Single Chromosome SVG (banding) ─────────────────────────────────
interface ChromosomeSVGProps {
  x: number
  y: number
  width: number
  height: number
  chrom: string
}

function ChromosomeSVG({ x, y, width, height, chrom }: ChromosomeSVGProps) {
  const info = CHROMOSOMES[chrom]
  if (!info) return null

  const r = width / 2 // Telomere cap radius
  const scale = height / info.length

  // Draw bands as clipped rects
  const cenStart = info.centromereStart * scale
  const cenEnd = info.centromereEnd * scale
  const cenMid = (cenStart + cenEnd) / 2

  // Build chromosome outline path (with centromere pinch and rounded telomeres)
  const pinchW = width * 0.3
  const outlinePath = [
    // Top telomere cap (p-arm)
    `M ${x + r},${y}`,
    `A ${r},${r} 0 0 1 ${x + width - r},${y}`,
    `A ${r},${r} 0 0 1 ${x + width},${y + r}`,
    // Right side down to centromere
    `L ${x + width},${y + cenStart}`,
    // Centromere pinch (right)
    `Q ${x + width - pinchW},${y + cenMid} ${x + width},${y + cenEnd}`,
    // Right side down to bottom
    `L ${x + width},${y + height - r}`,
    // Bottom telomere cap (q-arm)
    `A ${r},${r} 0 0 1 ${x + width - r},${y + height}`,
    `A ${r},${r} 0 0 1 ${x + r},${y + height}`,
    `A ${r},${r} 0 0 1 ${x},${y + height - r}`,
    // Left side up to centromere
    `L ${x},${y + cenEnd}`,
    // Centromere pinch (left)
    `Q ${x + pinchW},${y + cenMid} ${x},${y + cenStart}`,
    // Left side up to top
    `L ${x},${y + r}`,
    `A ${r},${r} 0 0 1 ${x + r},${y}`,
    'Z',
  ].join(' ')

  const clipId = `chromClip-${chrom}`

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={outlinePath} />
        </clipPath>
      </defs>

      {/* Background fill */}
      <rect x={x} y={y} width={width} height={height} fill="#1a2332" clipPath={`url(#${clipId})`} />

      {/* Bands */}
      <g clipPath={`url(#${clipId})`}>
        {info.bands.map((band, i) => {
          const by = y + band.start * scale
          const bh = Math.max(0.5, (band.end - band.start) * scale)
          const color = DARK_BAND_COLORS[band.stain]
          return (
            <rect
              key={i}
              x={x}
              y={by}
              width={width}
              height={bh}
              fill={color}
            />
          )
        })}
      </g>

      {/* Outline */}
      <path
        d={outlinePath}
        fill="none"
        stroke="rgba(0, 212, 255, 0.25)"
        strokeWidth={0.6}
      />
    </g>
  )
}

// ─── Histogram Track ─────────────────────────────────────────────────
interface HistogramTrackProps {
  x: number
  y: number
  width: number
  height: number
  chromLength: number
  variants: GenomeAnnotation[]
}

function HistogramTrack({ x, y, width, height, chromLength, variants }: HistogramTrackProps) {
  const BINS = 30
  const binSize = chromLength / BINS
  const maxBarW = 12

  // Compute bins
  const bins = useMemo(() => {
    const b = Array.from({ length: BINS }, () => ({ count: 0, totalRisk: 0 }))
    for (const v of variants) {
      const idx = Math.min(Math.floor(v.start / binSize), BINS - 1)
      b[idx].count++
      b[idx].totalRisk += v.risk_score || 0
    }
    return b
  }, [variants, binSize])

  const maxCount = Math.max(...bins.map((b) => b.count), 1)

  return (
    <g>
      {bins.map((bin, i) => {
        if (bin.count === 0) return null
        const by = y + (i / BINS) * height
        const bh = Math.max(1, (height / BINS))
        const barW = (bin.count / maxCount) * maxBarW
        const avgRisk = bin.totalRisk / bin.count
        // Color: low risk = cyan, high risk = magenta
        const t = Math.min(avgRisk / 8, 1)
        const r = Math.round(0 + t * 255)
        const g = Math.round(212 - t * 160)
        const b2 = Math.round(255 - t * 155)
        return (
          <rect
            key={i}
            x={x + width + 2}
            y={by}
            width={barW}
            height={bh - 0.5}
            rx={1}
            fill={`rgb(${r},${g},${b2})`}
            opacity={0.8}
          />
        )
      })}
    </g>
  )
}

// ─── Zoomed chromosome view ──────────────────────────────────────────
interface ZoomedChromViewProps {
  chrom: string
  annotations: GenomeAnnotation[]
  width: number
  onVariantClick?: (id: string) => void
  showTooltip: (e: React.MouseEvent, content: React.ReactNode) => void
  hideTooltip: () => void
}

function ZoomedChromView({
  chrom,
  annotations,
  width,
  onVariantClick,
  showTooltip,
  hideTooltip,
}: ZoomedChromViewProps) {
  const info = CHROMOSOMES[chrom]
  if (!info) return null

  const PAD = { left: 70, right: 40, top: 20, bottom: 40 }
  const CHROM_W = 22
  const CHROM_H = 400
  const LOLLIPOP_AREA = width - PAD.left - PAD.right - CHROM_W - 20
  const SVG_W = width
  const SVG_H = CHROM_H + PAD.top + PAD.bottom

  const scale = CHROM_H / info.length
  const chromX = PAD.left
  const chromY = PAD.top

  // Axis ticks (Mb)
  const ticks = useMemo(() => {
    const mbLen = info.length / 1e6
    const step = mbLen > 200 ? 50 : mbLen > 100 ? 25 : mbLen > 50 ? 10 : 5
    const result: number[] = []
    for (let i = 0; i <= mbLen; i += step) result.push(i)
    return result
  }, [info.length])

  // Compute lollipop positions with overlap prevention
  const lollipops = useMemo(() => {
    const sorted = [...annotations].sort((a, b) => a.start - b.start)
    const items: Array<{
      v: GenomeAnnotation
      cy: number
      stemLen: number
    }> = []

    for (const v of sorted) {
      const cy = chromY + v.start * scale
      // Base stem length
      let stemLen = 30 + ((v.risk_score || 0) / 10) * (LOLLIPOP_AREA * 0.4)

      // Avoid overlap: check against previous items
      for (const prev of items) {
        if (Math.abs(prev.cy - cy) < 10) {
          stemLen = Math.max(stemLen, prev.stemLen + 20)
        }
      }
      stemLen = Math.min(stemLen, LOLLIPOP_AREA - 10)
      items.push({ v, cy, stemLen })
    }
    return items
  }, [annotations, scale, chromY, LOLLIPOP_AREA])

  // Band labels for zoomed view
  const bandLabels = useMemo(() => {
    return info.bands
      .filter((b) => b.stain !== 'acen')
      .filter((_, i) => i % 2 === 0) // show every other band to avoid clutter
      .map((b) => ({
        name: b.name,
        y: chromY + ((b.start + b.end) / 2) * scale,
      }))
  }, [info.bands, scale, chromY])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm font-headline font-semibold text-dna-cyan">chr{chrom}</span>
        <span className="text-xs text-slate-500 font-body">
          {(info.length / 1e6).toFixed(1)} Mb &middot; {annotations.length} variant{annotations.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2 ml-2">
          <span className="text-[10px] text-slate-600 font-body">p-arm</span>
          <div className="w-8 h-px bg-slate-600" />
          <span className="text-[10px] text-dna-magenta font-body">cen</span>
          <div className="w-8 h-px bg-slate-600" />
          <span className="text-[10px] text-slate-600 font-body">q-arm</span>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="overflow-visible">
        <defs>
          <filter id="zGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Position axis (left side) */}
        {ticks.map((mb) => {
          const ty = chromY + (mb * 1e6 / info.length) * CHROM_H
          return (
            <g key={mb}>
              <line
                x1={chromX - 5}
                y1={ty}
                x2={chromX - 1}
                y2={ty}
                stroke="#475569"
                strokeWidth={0.5}
              />
              <text
                x={chromX - 8}
                y={ty + 3}
                textAnchor="end"
                className="fill-slate-500"
                style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {mb}Mb
              </text>
            </g>
          )
        })}

        {/* Chromosome body */}
        <ChromosomeSVG
          x={chromX}
          y={chromY}
          width={CHROM_W}
          height={CHROM_H}
          chrom={chrom}
        />

        {/* Band labels (right of chromosome) */}
        {bandLabels.map((bl, i) => (
          <text
            key={i}
            x={chromX + CHROM_W + 4}
            y={bl.y + 3}
            className="fill-slate-600"
            style={{ fontSize: '7px', fontFamily: 'JetBrains Mono, monospace' }}
          >
            {bl.name}
          </text>
        ))}

        {/* Variant lollipops */}
        {lollipops.map(({ v, cy, stemLen }) => {
          const color = getSignificanceColor(v.clinvar_significance)
          const r = 3.5 + ((v.risk_score || 0) / 10) * 4.5
          const stemStartX = chromX + CHROM_W + 1
          const stemEndX = stemStartX + stemLen

          return (
            <g
              key={v.variant_id}
              onMouseEnter={(e) => showTooltip(e, <VariantTooltip v={v} />)}
              onMouseLeave={hideTooltip}
              onClick={(e) => {
                e.stopPropagation()
                onVariantClick?.(v.variant_id)
              }}
              className="cursor-pointer"
            >
              {/* Connection line to chromosome */}
              <line
                x1={stemStartX}
                y1={cy}
                x2={stemEndX - r}
                y2={cy}
                stroke={color}
                strokeWidth={1}
                opacity={0.4}
                strokeDasharray="2,2"
              />
              {/* Head */}
              <circle
                cx={stemEndX}
                cy={cy}
                r={r}
                fill={color}
                opacity={0.85}
                filter="url(#zGlow)"
              />
              {/* Gene label */}
              {v.gene && annotations.length <= 60 && (
                <text
                  x={stemEndX + r + 4}
                  y={cy + 3}
                  className="fill-slate-300"
                  style={{ fontSize: '8px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {v.gene}
                </text>
              )}
            </g>
          )
        })}

        {/* p-arm / q-arm labels */}
        <text
          x={chromX + CHROM_W / 2}
          y={chromY - 6}
          textAnchor="middle"
          className="fill-slate-500"
          style={{ fontSize: '8px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          p
        </text>
        <text
          x={chromX + CHROM_W / 2}
          y={chromY + CHROM_H + 14}
          textAnchor="middle"
          className="fill-slate-500"
          style={{ fontSize: '8px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          q
        </text>
      </svg>
    </motion.div>
  )
}

// ─── Tooltip Components ──────────────────────────────────────────────
function VariantTooltip({ v }: { v: GenomeAnnotation }) {
  return (
    <div className="glass-panel-elevated rounded-lg px-3 py-2.5 border border-slate-600/50 shadow-xl min-w-[210px]">
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: getSignificanceColor(v.clinvar_significance) }}
        />
        <span className="text-xs font-headline font-semibold text-slate-100 truncate">
          {v.name}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
        <div>
          <span className="text-slate-500">Position</span>
          <p className="text-slate-300 font-mono-variant">chr{v.chr}:{v.start.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-slate-500">Consequence</span>
          <p className="text-slate-300">{v.consequence?.replace(/_/g, ' ') || '\u2014'}</p>
        </div>
        <div>
          <span className="text-slate-500">Significance</span>
          <p style={{ color: getSignificanceColor(v.clinvar_significance) }}>
            {getSignificanceLabel(v.clinvar_significance)}
          </p>
        </div>
        <div>
          <span className="text-slate-500">Risk Score</span>
          <p className="text-slate-300 font-mono-variant">{v.risk_score ?? '\u2014'}</p>
        </div>
      </div>
    </div>
  )
}

function ChromTooltip({ chrom, summary }: { chrom: string; summary: ChromosomeSummary }) {
  return (
    <div className="glass-panel-elevated rounded-lg px-3 py-2 border border-slate-600/50 shadow-xl">
      <p className="text-xs font-headline font-semibold text-slate-100 mb-1">
        Chromosome {chrom}
      </p>
      <div className="text-[10px] space-y-0.5">
        <p className="text-slate-300">
          <span className="text-slate-500">Variants:</span> {summary.count}
        </p>
        <p className="text-slate-300">
          <span className="text-slate-500">Pathogenic:</span>{' '}
          <span className={summary.pathogenic > 0 ? 'text-dna-magenta' : ''}>{summary.pathogenic}</span>
        </p>
        <p className="text-slate-300">
          <span className="text-slate-500">Max Risk:</span> {summary.max_risk}
        </p>
      </div>
      <p className="text-[9px] text-slate-600 mt-1">Click to zoom</p>
    </div>
  )
}
