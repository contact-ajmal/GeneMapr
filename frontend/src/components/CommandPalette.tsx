import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  LayoutDashboard,
  Dna,
  Pill,
  GitCompareArrows,
  FileText,
  Upload,
  Clock,
  ArrowRight,
  X,
  Hash,
} from 'lucide-react'
import apiClient from '../api/client'
import type { Variant } from '../types/variant'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onVariantSelect?: (variant: Variant) => void
}

interface SearchResult {
  type: 'page' | 'variant' | 'recent'
  label: string
  description?: string
  path?: string
  variant?: Variant
  icon: React.ElementType
}

const pageResults: SearchResult[] = [
  { type: 'page', label: 'Dashboard', description: 'Variant analysis overview', path: '/dashboard', icon: LayoutDashboard },
  { type: 'page', label: 'Genome View', description: 'Interactive chromosome ideogram', path: '/genome-view', icon: Dna },
  { type: 'page', label: 'Genome Analytics', description: 'Statistics & visualizations', path: '/analytics', icon: LayoutDashboard },
  { type: 'page', label: 'Pharmacogenomics', description: 'Drug-gene interactions', path: '/pharmacogenomics', icon: Pill },
  { type: 'page', label: 'Sample Comparison', description: 'Multi-sample analysis', path: '/compare', icon: GitCompareArrows },
  { type: 'page', label: 'Reports', description: 'Generate reports', path: '/reports', icon: FileText },
  { type: 'page', label: 'Upload', description: 'Upload VCF files', path: '/', icon: Upload },
]

const MAX_RECENT = 5

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem('genemaprcmd_recent')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveRecentSearch(query: string) {
  const recent = getRecentSearches().filter((s) => s !== query)
  recent.unshift(query)
  localStorage.setItem('genemaprcmd_recent', JSON.stringify(recent.slice(0, MAX_RECENT)))
}

export default function CommandPalette({ isOpen, onClose, onVariantSelect }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
      setRecentSearches(getRecentSearches())
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Search variants with debounce
  const searchVariants = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults(filterPages(searchQuery))
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const params: Record<string, string> = {}

      // Detect search type
      if (searchQuery.match(/^rs\d+/i)) {
        params.gene = searchQuery // Backend might support rsID search via gene param
      } else if (searchQuery.match(/^chr/i) || searchQuery.match(/^\d+:\d+/)) {
        // Chromosome position format
        params.gene = searchQuery
      } else {
        params.gene = searchQuery
      }

      const response = await apiClient.get('/variants', {
        params: { ...params, skip: 0, limit: 8 },
      })

      const variants: Variant[] = response.data.variants || response.data.items || []
      const variantResults: SearchResult[] = variants.map((v) => ({
        type: 'variant' as const,
        label: v.gene_symbol || `${v.chrom}:${v.pos}`,
        description: `${v.chrom}:${v.pos.toLocaleString()} ${v.ref}>${v.alt}${v.clinvar_significance ? ` | ${v.clinvar_significance}` : ''}`,
        variant: v,
        icon: Dna,
      }))

      const pages = filterPages(searchQuery)
      setResults([...pages, ...variantResults])
    } catch {
      setResults(filterPages(searchQuery))
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    if (!query.trim()) {
      setResults([])
      return
    }

    // Show page results immediately
    setResults(filterPages(query))

    // Debounce variant search
    searchTimeoutRef.current = setTimeout(() => {
      searchVariants(query)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [query, searchVariants])

  function filterPages(q: string): SearchResult[] {
    if (!q.trim()) return []
    const lower = q.toLowerCase()
    return pageResults.filter(
      (p) => p.label.toLowerCase().includes(lower) || p.description?.toLowerCase().includes(lower)
    )
  }

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'page' && result.path) {
      navigate(result.path)
    } else if (result.type === 'variant' && result.variant) {
      onVariantSelect?.(result.variant)
      saveRecentSearch(query)
    } else if (result.type === 'recent') {
      setQuery(result.label)
      return // Don't close
    }

    if (query.trim()) saveRecentSearch(query)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalResults = results.length + (query ? 0 : recentSearches.length)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % Math.max(totalResults, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 + Math.max(totalResults, 1)) % Math.max(totalResults, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[activeIndex]) {
        handleSelect(results[activeIndex])
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0)
  }, [results.length])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Palette */}
        <motion.div
          className="relative w-full max-w-xl mx-4
            glass-panel-elevated rounded-2xl overflow-hidden
            border border-dna-cyan/20 shadow-glow-cyan-lg"
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          role="dialog"
          aria-label="Command palette"
          aria-modal="true"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-dna-cyan/10">
            <Search className={`w-5 h-5 flex-shrink-0 ${isSearching ? 'text-dna-cyan animate-pulse' : 'text-slate-500'}`} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search variants, genes, rsIDs, or navigate..."
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500
                font-body outline-none"
              autoComplete="off"
              aria-label="Search"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-activedescendant={results[activeIndex] ? `cmd-result-${activeIndex}` : undefined}
            />
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto py-2" role="listbox">
            {/* Recent Searches (when no query) */}
            {!query.trim() && recentSearches.length > 0 && (
              <div className="px-3 py-1">
                <p className="px-2 py-1 text-[10px] font-headline font-semibold text-slate-500 uppercase tracking-wider">
                  Recent Searches
                </p>
                {recentSearches.map((recent, i) => (
                  <motion.button
                    key={recent}
                    id={`cmd-result-${i}`}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg
                      text-left transition-colors
                      ${activeIndex === i ? 'bg-dna-cyan/10 text-dna-cyan' : 'text-slate-400 hover:bg-white/5'}`}
                    onClick={() => {
                      setQuery(recent)
                      inputRef.current?.focus()
                    }}
                    role="option"
                    aria-selected={activeIndex === i}
                  >
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-body">{recent}</span>
                    <ArrowRight className="w-3 h-3 ml-auto opacity-50" />
                  </motion.button>
                ))}
              </div>
            )}

            {/* No query, no recent */}
            {!query.trim() && recentSearches.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Hash className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-body">
                  Type to search variants, genes, or pages
                </p>
                <p className="text-xs text-slate-600 font-body mt-1">
                  Try &quot;BRCA1&quot;, &quot;rs123456&quot;, or &quot;dashboard&quot;
                </p>
              </div>
            )}

            {/* Search Results */}
            {query.trim() && results.length > 0 && (
              <div className="px-3 py-1">
                {/* Pages Section */}
                {results.some((r) => r.type === 'page') && (
                  <>
                    <p className="px-2 py-1 text-[10px] font-headline font-semibold text-slate-500 uppercase tracking-wider">
                      Pages
                    </p>
                    {results
                      .filter((r) => r.type === 'page')
                      .map((result, i) => {
                        const globalIndex = results.indexOf(result)
                        const Icon = result.icon
                        return (
                          <motion.button
                            key={result.path}
                            id={`cmd-result-${globalIndex}`}
                            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg
                              text-left transition-colors
                              ${activeIndex === globalIndex ? 'bg-dna-cyan/10 text-dna-cyan' : 'text-slate-400 hover:bg-white/5'}`}
                            onClick={() => handleSelect(result)}
                            role="option"
                            aria-selected={activeIndex === globalIndex}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-body font-medium truncate">{result.label}</p>
                              {result.description && (
                                <p className="text-xs text-slate-500 truncate">{result.description}</p>
                              )}
                            </div>
                            <ArrowRight className="w-3 h-3 flex-shrink-0 opacity-50" />
                          </motion.button>
                        )
                      })}
                  </>
                )}

                {/* Variants Section */}
                {results.some((r) => r.type === 'variant') && (
                  <>
                    <p className="px-2 py-1 mt-2 text-[10px] font-headline font-semibold text-slate-500 uppercase tracking-wider">
                      Variants
                    </p>
                    {results
                      .filter((r) => r.type === 'variant')
                      .map((result, i) => {
                        const globalIndex = results.indexOf(result)
                        return (
                          <motion.button
                            key={`${result.variant?.chrom}-${result.variant?.pos}-${i}`}
                            id={`cmd-result-${globalIndex}`}
                            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg
                              text-left transition-colors
                              ${activeIndex === globalIndex ? 'bg-dna-cyan/10 text-dna-cyan' : 'text-slate-400 hover:bg-white/5'}`}
                            onClick={() => handleSelect(result)}
                            role="option"
                            aria-selected={activeIndex === globalIndex}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            <Dna className="w-4 h-4 flex-shrink-0 text-dna-cyan" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-mono font-medium truncate">{result.label}</p>
                              <p className="text-xs text-slate-500 font-mono truncate">{result.description}</p>
                            </div>
                            {result.variant?.risk_score != null && (
                              <span className={`text-xs font-mono px-1.5 py-0.5 rounded
                                ${result.variant.risk_score >= 75 ? 'bg-dna-magenta/20 text-dna-magenta' :
                                  result.variant.risk_score >= 50 ? 'bg-dna-amber/20 text-dna-amber' :
                                  'bg-dna-green/20 text-dna-green'}`}>
                                {result.variant.risk_score}
                              </span>
                            )}
                          </motion.button>
                        )
                      })}
                  </>
                )}
              </div>
            )}

            {/* No Results */}
            {query.trim() && results.length === 0 && !isSearching && (
              <div className="px-4 py-8 text-center">
                <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-body">
                  No results for &quot;{query}&quot;
                </p>
              </div>
            )}

            {/* Loading */}
            {isSearching && results.filter(r => r.type === 'variant').length === 0 && (
              <div className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-dna-cyan"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="font-body">Searching variants...</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Hint */}
          <div className="px-4 py-2 border-t border-dna-cyan/10 flex items-center gap-4
            text-[10px] text-slate-600 font-mono">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white/5 border border-slate-700/50">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white/5 border border-slate-700/50">↵</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white/5 border border-slate-700/50">esc</kbd>
              close
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
