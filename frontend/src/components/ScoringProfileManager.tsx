import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Trash2, Save, RotateCcw,
  Sliders, FlaskConical, Heart, Pill, Search, Dna,
} from 'lucide-react'
import AnimatedButton from './ui/AnimatedButton'
import { useToast } from './ui/Toast'
import {
  getScoringProfiles,
  createScoringProfile,
  updateScoringProfile,
  deleteScoringProfile,
} from '../api/scoringProfiles'
import type { ScoringProfile, ScoringWeights } from '../types/variant'

const DEFAULT_WEIGHTS: ScoringWeights = {
  pathogenic: 5,
  likely_pathogenic: 4,
  vus: 1,
  rare_af_threshold: 0.01,
  rare_bonus: 3,
  ultra_rare_af_threshold: 0.001,
  ultra_rare_bonus: 1,
  lof_bonus: 4,
  missense_bonus: 2,
  synonymous_bonus: 0,
  splice_site_bonus: 3,
  inframe_indel_bonus: 1,
  custom_gene_weights: {},
}

const WEIGHT_CATEGORIES = [
  {
    label: 'Clinical Significance',
    color: '#ff3366',
    fields: [
      { key: 'pathogenic' as const, label: 'Pathogenic', max: 20 },
      { key: 'likely_pathogenic' as const, label: 'Likely Pathogenic', max: 20 },
      { key: 'vus' as const, label: 'VUS', max: 20 },
    ],
  },
  {
    label: 'Allele Frequency',
    color: '#00d4ff',
    fields: [
      { key: 'rare_bonus' as const, label: 'Rare Variant Bonus', max: 20 },
      { key: 'ultra_rare_bonus' as const, label: 'Ultra-Rare Bonus', max: 20 },
    ],
  },
  {
    label: 'Functional Consequence',
    color: '#00ff88',
    fields: [
      { key: 'lof_bonus' as const, label: 'Loss-of-Function', max: 20 },
      { key: 'missense_bonus' as const, label: 'Missense', max: 20 },
      { key: 'splice_site_bonus' as const, label: 'Splice Site', max: 20 },
      { key: 'inframe_indel_bonus' as const, label: 'Inframe Indel', max: 20 },
      { key: 'synonymous_bonus' as const, label: 'Synonymous', max: 20 },
    ],
  },
]

const PROFILE_ICONS: Record<string, typeof Sliders> = {
  'General Screening': Sliders,
  'Oncology Panel': FlaskConical,
  'Cardiac Screen': Heart,
  'Pharmacogenomics': Pill,
  'Rare Disease': Search,
}

interface ScoringProfileManagerProps {
  isOpen: boolean
  onClose: () => void
  onProfileApplied: () => void
}

export default function ScoringProfileManager({
  isOpen,
  onClose,
}: ScoringProfileManagerProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [editingProfile, setEditingProfile] = useState<ScoringProfile | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formWeights, setFormWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS)
  const [newGene, setNewGene] = useState('')
  const [newGeneWeight, setNewGeneWeight] = useState(1.5)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['scoringProfiles'],
    queryFn: getScoringProfiles,
    enabled: isOpen,
  })

  const createMutation = useMutation({
    mutationFn: createScoringProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoringProfiles'] })
      toast('Profile created successfully', 'success')
      resetForm()
    },
    onError: (err: Error) => toast(err.message, 'error'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; weights?: ScoringWeights } }) =>
      updateScoringProfile(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoringProfiles'] })
      toast('Profile updated successfully', 'success')
      resetForm()
    },
    onError: (err: Error) => toast(err.message, 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteScoringProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoringProfiles'] })
      toast('Profile deleted', 'success')
      setDeleteConfirmId(null)
    },
    onError: (err: Error) => toast(err.message, 'error'),
  })

  const resetForm = () => {
    setEditingProfile(null)
    setIsCreating(false)
    setFormName('')
    setFormDescription('')
    setFormWeights(DEFAULT_WEIGHTS)
    setNewGene('')
    setNewGeneWeight(1.5)
  }

  const startCreate = () => {
    resetForm()
    setIsCreating(true)
    setFormWeights({ ...DEFAULT_WEIGHTS })
  }

  const startEdit = (profile: ScoringProfile) => {
    setIsCreating(false)
    setEditingProfile(profile)
    setFormName(profile.name)
    setFormDescription(profile.description || '')
    setFormWeights({ ...DEFAULT_WEIGHTS, ...profile.weights })
  }

  const handleSave = () => {
    if (!formName.trim()) {
      toast('Profile name is required', 'error')
      return
    }
    if (isCreating) {
      createMutation.mutate({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        weights: formWeights,
      })
    } else if (editingProfile) {
      updateMutation.mutate({
        id: editingProfile.id,
        data: {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          weights: formWeights,
        },
      })
    }
  }

  const updateWeight = (key: keyof ScoringWeights, value: number) => {
    setFormWeights((prev) => ({ ...prev, [key]: value }))
  }

  const addGeneWeight = () => {
    const gene = newGene.trim().toUpperCase()
    if (!gene) return
    setFormWeights((prev) => ({
      ...prev,
      custom_gene_weights: { ...prev.custom_gene_weights, [gene]: newGeneWeight },
    }))
    setNewGene('')
    setNewGeneWeight(1.5)
  }

  const removeGeneWeight = (gene: string) => {
    setFormWeights((prev) => {
      const updated = { ...prev.custom_gene_weights }
      delete updated[gene]
      return { ...prev, custom_gene_weights: updated }
    })
  }

  const isEditing = isCreating || editingProfile !== null
  const isSaving = createMutation.isPending || updateMutation.isPending

  // Compute score diff preview for a hypothetical variant
  const scorePreview = useMemo(() => {
    const scenarios = [
      { label: 'Pathogenic + Rare + LoF', clinvar: 'pathogenic', af: 0.0005, consequence: 'lof', gene: null as string | null },
      { label: 'Likely Path. + Missense', clinvar: 'likely_pathogenic', af: 0.005, consequence: 'missense', gene: null },
      { label: 'VUS + Ultra-Rare + Splice', clinvar: 'vus', af: 0.00005, consequence: 'splice', gene: null },
      { label: 'Benign + Common', clinvar: 'benign', af: 0.15, consequence: 'synonymous', gene: null },
    ]

    return scenarios.map((s) => {
      const calc = (w: ScoringWeights) => {
        let score = 0
        if (s.clinvar === 'pathogenic') score += w.pathogenic
        else if (s.clinvar === 'likely_pathogenic') score += w.likely_pathogenic
        else if (s.clinvar === 'vus') score += w.vus

        if (s.af < w.ultra_rare_af_threshold) score += w.rare_bonus + w.ultra_rare_bonus
        else if (s.af < w.rare_af_threshold) score += w.rare_bonus

        if (s.consequence === 'lof') score += w.lof_bonus
        else if (s.consequence === 'missense') score += w.missense_bonus
        else if (s.consequence === 'splice') score += w.splice_site_bonus
        else if (s.consequence === 'synonymous') score += w.synonymous_bonus

        return Math.round(score)
      }

      return {
        label: s.label,
        defaultScore: calc(DEFAULT_WEIGHTS),
        newScore: calc(formWeights),
      }
    })
  }, [formWeights])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
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
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-5xl max-h-[90vh] mx-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0f1628]/95 backdrop-blur-xl shadow-[0_0_60px_rgba(0,212,255,0.1)]"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-dna-cyan/10 flex items-center justify-center border border-dna-cyan/20">
                <Sliders className="w-5 h-5 text-dna-cyan" />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-slate-100">
                  Scoring Profiles
                </h2>
                <p className="text-xs text-slate-400 font-body">
                  Customize variant risk scoring for different clinical contexts
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex overflow-hidden" style={{ height: 'calc(90vh - 80px)' }}>
            {/* Left: Profile List */}
            <div className="w-72 border-r border-white/10 overflow-y-auto p-4 space-y-2 flex-shrink-0">
              <AnimatedButton
                onClick={startCreate}
                variant="ghost"
                className="w-full flex items-center justify-center gap-2 py-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Profile</span>
              </AnimatedButton>

              {isLoading ? (
                <div className="space-y-2 mt-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {profiles.map((profile) => {
                    const Icon = PROFILE_ICONS[profile.name] || Dna
                    const isActive = editingProfile?.id === profile.id
                    return (
                      <motion.button
                        key={profile.id}
                        onClick={() => startEdit(profile)}
                        className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
                          isActive
                            ? 'bg-dna-cyan/10 border border-dna-cyan/30'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                        whileHover={{ x: 2 }}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isActive ? 'bg-dna-cyan/20' : 'bg-white/5 group-hover:bg-white/10'
                          }`}>
                            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-dna-cyan' : 'text-slate-400'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-medium truncate ${isActive ? 'text-dna-cyan' : 'text-slate-200'}`}>
                              {profile.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {profile.is_default ? 'Default' : 'Custom'}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right: Editor or empty state */}
            <div className="flex-1 overflow-y-auto p-6">
              {isEditing ? (
                <div className="space-y-6">
                  {/* Name & Description */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-body text-slate-400 mb-1.5">Profile Name</label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="My Custom Profile"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-dna-cyan/50 focus:shadow-[0_0_10px_rgba(0,212,255,0.1)] transition-all font-body"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-body text-slate-400 mb-1.5">Description</label>
                      <input
                        type="text"
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Describe the clinical context..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-dna-cyan/50 focus:shadow-[0_0_10px_rgba(0,212,255,0.1)] transition-all font-body"
                      />
                    </div>
                  </div>

                  {/* Weight Sliders + Preview side by side */}
                  <div className="grid grid-cols-3 gap-6">
                    {/* Sliders (2 cols) */}
                    <div className="col-span-2 space-y-5">
                      {WEIGHT_CATEGORIES.map((category) => (
                        <div key={category.label}>
                          <h4
                            className="text-xs font-headline font-semibold uppercase tracking-wider mb-3"
                            style={{ color: category.color }}
                          >
                            {category.label}
                          </h4>
                          <div className="space-y-3">
                            {category.fields.map((field) => {
                              const value = formWeights[field.key] as number
                              return (
                                <div key={field.key} className="flex items-center gap-3">
                                  <span className="w-32 text-xs text-slate-400 font-body flex-shrink-0">
                                    {field.label}
                                  </span>
                                  <input
                                    type="range"
                                    min={0}
                                    max={field.max}
                                    step={0.5}
                                    value={value}
                                    onChange={(e) => updateWeight(field.key, parseFloat(e.target.value))}
                                    className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                                    style={{
                                      background: `linear-gradient(to right, ${category.color} ${(value / field.max) * 100}%, rgba(255,255,255,0.1) ${(value / field.max) * 100}%)`,
                                    }}
                                  />
                                  <input
                                    type="number"
                                    min={0}
                                    max={field.max}
                                    step={0.5}
                                    value={value}
                                    onChange={(e) => updateWeight(field.key, parseFloat(e.target.value) || 0)}
                                    className="w-14 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-center text-slate-200 font-mono-variant focus:outline-none focus:border-dna-cyan/50 transition-colors"
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}

                      {/* AF Thresholds */}
                      <div>
                        <h4 className="text-xs font-headline font-semibold uppercase tracking-wider mb-3 text-dna-amber">
                          AF Thresholds
                        </h4>
                        <div className="space-y-3">
                          {[
                            { key: 'rare_af_threshold' as const, label: 'Rare AF Threshold' },
                            { key: 'ultra_rare_af_threshold' as const, label: 'Ultra-Rare AF Threshold' },
                          ].map((field) => (
                            <div key={field.key} className="flex items-center gap-3">
                              <span className="w-32 text-xs text-slate-400 font-body flex-shrink-0">
                                {field.label}
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={1}
                                step={0.001}
                                value={formWeights[field.key]}
                                onChange={(e) => updateWeight(field.key, parseFloat(e.target.value) || 0)}
                                className="w-28 bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-200 font-mono-variant focus:outline-none focus:border-dna-cyan/50 transition-colors"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Gene Weights */}
                      <div>
                        <h4 className="text-xs font-headline font-semibold uppercase tracking-wider mb-3 text-purple-400">
                          Custom Gene Weights
                        </h4>
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            type="text"
                            value={newGene}
                            onChange={(e) => setNewGene(e.target.value)}
                            placeholder="Gene symbol (e.g. BRCA1)"
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-dna-cyan/50 transition-all font-mono-variant"
                            onKeyDown={(e) => e.key === 'Enter' && addGeneWeight()}
                          />
                          <input
                            type="number"
                            min={0.1}
                            max={5}
                            step={0.1}
                            value={newGeneWeight}
                            onChange={(e) => setNewGeneWeight(parseFloat(e.target.value) || 1)}
                            className="w-16 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-center text-slate-200 font-mono-variant focus:outline-none focus:border-dna-cyan/50 transition-colors"
                          />
                          <button
                            onClick={addGeneWeight}
                            className="w-8 h-8 rounded-lg bg-dna-cyan/10 border border-dna-cyan/20 flex items-center justify-center text-dna-cyan hover:bg-dna-cyan/20 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {Object.keys(formWeights.custom_gene_weights).length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(formWeights.custom_gene_weights).map(([gene, weight]) => (
                              <span
                                key={gene}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-mono-variant"
                              >
                                <span className="text-purple-300">{gene}</span>
                                <span className="text-purple-400/70">{weight}x</span>
                                <button
                                  onClick={() => removeGeneWeight(gene)}
                                  className="text-purple-400/50 hover:text-dna-magenta transition-colors ml-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600 font-body">
                            No custom gene weights. Genes default to 1.0x multiplier.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Live Preview (1 col) */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-headline font-semibold uppercase tracking-wider text-slate-400">
                        Score Preview
                      </h4>
                      <div className="space-y-2">
                        {scorePreview.map((s) => {
                          const diff = s.newScore - s.defaultScore
                          return (
                            <div
                              key={s.label}
                              className="p-3 rounded-xl bg-white/[0.03] border border-white/5"
                            >
                              <p className="text-xs text-slate-400 font-body mb-2">{s.label}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-lg font-mono-variant font-bold text-slate-200">
                                    {s.newScore}
                                  </span>
                                  {diff !== 0 && (
                                    <span className={`text-xs font-mono-variant ${diff > 0 ? 'text-dna-magenta' : 'text-[#00ff88]'}`}>
                                      {diff > 0 ? '+' : ''}{diff}
                                    </span>
                                  )}
                                </div>
                                <div className="w-20 h-2 rounded-full bg-white/5 overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                      background: s.newScore >= 8
                                        ? '#ff3366'
                                        : s.newScore >= 5
                                          ? '#ffaa00'
                                          : '#00ff88',
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (s.newScore / 16) * 100)}%` }}
                                    transition={{ duration: 0.3 }}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="mt-4 p-3 rounded-xl bg-dna-cyan/5 border border-dna-cyan/10">
                        <p className="text-xs text-slate-500 font-body leading-relaxed">
                          Preview shows hypothetical scores using current weights vs. default profile.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      {editingProfile && !editingProfile.is_default && (
                        <>
                          {deleteConfirmId === editingProfile.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-dna-magenta font-body">Delete this profile?</span>
                              <AnimatedButton
                                onClick={() => deleteMutation.mutate(editingProfile.id)}
                                variant="danger"
                                className="py-1.5 px-3 text-xs"
                                loading={deleteMutation.isPending}
                              >
                                Confirm
                              </AnimatedButton>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(editingProfile.id)}
                              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-dna-magenta transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <AnimatedButton
                        onClick={() => setFormWeights({ ...DEFAULT_WEIGHTS })}
                        variant="ghost"
                        className="py-2 px-4 text-sm flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset to Defaults
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={resetForm}
                        variant="secondary"
                        className="py-2 px-4 text-sm"
                      >
                        Cancel
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={handleSave}
                        variant="primary"
                        loading={isSaving}
                        className="py-2 px-4 text-sm flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isCreating ? 'Create Profile' : 'Save Changes'}
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty state - no profile selected */
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                    <Sliders className="w-8 h-8 text-slate-600" />
                  </div>
                  <h3 className="text-sm font-headline font-semibold text-slate-300 mb-1">
                    Select a Profile
                  </h3>
                  <p className="text-xs text-slate-500 font-body max-w-sm">
                    Choose a scoring profile from the list to view and edit its weights, or create a new custom profile.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
