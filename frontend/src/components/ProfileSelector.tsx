import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, Sliders, FlaskConical, Heart, Pill, Search, Dna, Settings, RefreshCw,
} from 'lucide-react'
import { useToast } from './ui/Toast'
import { getScoringProfiles, rescoreVariants } from '../api/scoringProfiles'
import type { ScoringProfile } from '../types/variant'

const PROFILE_ICONS: Record<string, typeof Sliders> = {
  'General Screening': Sliders,
  'Oncology Panel': FlaskConical,
  'Cardiac Screen': Heart,
  'Pharmacogenomics': Pill,
  'Rare Disease': Search,
}

interface ProfileSelectorProps {
  onManageProfiles: () => void
  onRescored: () => void
}

export default function ProfileSelector({
  onManageProfiles,
  onRescored,
}: ProfileSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rescoreConfirm, setRescoreConfirm] = useState<ScoringProfile | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: profiles = [] } = useQuery({
    queryKey: ['scoringProfiles'],
    queryFn: getScoringProfiles,
  })

  const rescoreMutation = useMutation({
    mutationFn: rescoreVariants,
    onSuccess: (data) => {
      toast(`Rescored ${data.variants_rescored} variants with "${data.profile_name}"`, 'success')
      setRescoreConfirm(null)
      queryClient.invalidateQueries({ queryKey: ['variants'] })
      queryClient.invalidateQueries({ queryKey: ['variantStats'] })
      queryClient.invalidateQueries({ queryKey: ['genomeView'] })
      onRescored()
    },
    onError: (err: Error) => {
      toast(err.message, 'error')
      setRescoreConfirm(null)
    },
  })

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Auto-select first profile
  useEffect(() => {
    if (profiles.length > 0 && !selectedId) {
      setSelectedId(profiles[0].id)
    }
  }, [profiles, selectedId])

  const selected = profiles.find((p) => p.id === selectedId) || profiles[0]
  const SelectedIcon = selected ? (PROFILE_ICONS[selected.name] || Dna) : Sliders

  const handleProfileSelect = (profile: ScoringProfile) => {
    setSelectedId(profile.id)
    setIsOpen(false)
    setRescoreConfirm(profile)
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg glass-panel hover:glass-panel-interactive border border-white/10 hover:border-dna-cyan/30 transition-all duration-200 group"
        >
          <SelectedIcon className="w-4 h-4 text-dna-cyan" />
          <span className="text-sm text-slate-200 font-body max-w-[120px] truncate">
            {selected?.name || 'Select Profile'}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/10 bg-[#141b2d]/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <div className="p-1.5 max-h-64 overflow-y-auto">
                {profiles.map((profile) => {
                  const Icon = PROFILE_ICONS[profile.name] || Dna
                  const isSelected = profile.id === selectedId
                  return (
                    <button
                      key={profile.id}
                      onClick={() => handleProfileSelect(profile)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-dna-cyan/10 text-dna-cyan'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? 'text-dna-cyan' : 'text-slate-500'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{profile.name}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {profile.description || (profile.is_default ? 'Default profile' : 'Custom profile')}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="border-t border-white/5 p-1.5">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onManageProfiles()
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2 text-slate-400 hover:text-slate-200"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-body">Manage Profiles</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rescore Confirmation Modal */}
      <AnimatePresence>
        {rescoreConfirm && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setRescoreConfirm(null)}
            />
            <motion.div
              className="relative rounded-2xl border border-white/10 bg-[#141b2d]/95 backdrop-blur-xl p-6 max-w-md mx-4 shadow-[0_0_40px_rgba(0,212,255,0.1)]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-dna-cyan/10 flex items-center justify-center border border-dna-cyan/20">
                  <RefreshCw className="w-5 h-5 text-dna-cyan" />
                </div>
                <div>
                  <h3 className="text-sm font-headline font-bold text-slate-100">
                    Rescore Variants?
                  </h3>
                  <p className="text-xs text-slate-400 font-body">
                    Apply "{rescoreConfirm.name}" scoring profile
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-300 font-body mb-6 leading-relaxed">
                This will recalculate risk scores for all annotated variants using the selected scoring profile. Dashboard statistics and charts will update automatically.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setRescoreConfirm(null)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors font-body"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={() => rescoreMutation.mutate(rescoreConfirm.id)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-dna-cyan to-blue-600 text-white shadow-glow-cyan hover:shadow-glow-cyan-lg transition-shadow flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={rescoreMutation.isPending}
                >
                  {rescoreMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Rescoring...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Rescore
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
