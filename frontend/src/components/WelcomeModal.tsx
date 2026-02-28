import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Search,
  FileBarChart,
  Dna,
  ArrowRight,
  X,
} from 'lucide-react'

const STORAGE_KEY = 'genemaprwelcome_dismissed'

const steps = [
  {
    icon: Upload,
    title: 'Upload',
    description: 'Upload VCF files from whole genome, exome, or targeted panel sequencing.',
    color: 'dna-cyan',
  },
  {
    icon: Search,
    title: 'Analyze',
    description: 'Automated annotation with ClinVar, gnomAD, and AI-powered risk scoring.',
    color: 'dna-amber',
  },
  {
    icon: FileBarChart,
    title: 'Interpret',
    description: 'ACMG classification, pharmacogenomics, and exportable clinical reports.',
    color: 'dna-green',
  },
]

export default function WelcomeModal() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [dontShow, setDontShow] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (!dismissed) {
      // Small delay for a smoother initial load
      const timer = setTimeout(() => setIsOpen(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    if (dontShow) {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
    setIsOpen(false)
  }

  const handleUpload = () => {
    if (dontShow) {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
    setIsOpen(false)
    navigate('/')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-lg
              glass-panel-elevated rounded-2xl overflow-hidden
              border border-dna-cyan/20 shadow-glow-cyan-lg"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            role="dialog"
            aria-label="Welcome to GeneMapr"
            aria-modal="true"
          >
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 transition-colors z-10"
              aria-label="Close welcome modal"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>

            {/* Gradient mesh top */}
            <div className="relative h-32 bg-gradient-to-br from-dna-cyan/10 via-transparent to-dna-magenta/10
              flex items-center justify-center overflow-hidden">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-dna-cyan to-blue-600
                  flex items-center justify-center shadow-glow-cyan-lg">
                  <Dna className="w-8 h-8 text-white" />
                </div>
              </motion.div>

              {/* Floating particles decoration */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-dna-cyan/30"
                  style={{
                    left: `${15 + i * 15}%`,
                    top: `${20 + (i % 3) * 25}%`,
                  }}
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2 + i * 0.3,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>

            {/* Content */}
            <div className="px-6 pt-5 pb-6">
              <h2 className="text-xl font-headline font-bold text-slate-100 text-center mb-1">
                Welcome to GeneMapr
              </h2>
              <p className="text-sm text-slate-500 font-body text-center mb-6">
                Premium Genomic Variant Interpretation Platform
              </p>

              {/* Steps */}
              <div className="space-y-3 mb-6">
                {steps.map((step, i) => {
                  const Icon = step.icon
                  return (
                    <motion.div
                      key={step.title}
                      className="flex items-start gap-4 p-3 rounded-xl
                        bg-white/3 border border-slate-700/30 hover:border-dna-cyan/15
                        transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                    >
                      <div className={`w-10 h-10 flex-shrink-0 rounded-xl
                        flex items-center justify-center
                        ${step.color === 'dna-cyan' ? 'bg-dna-cyan/10 text-dna-cyan' :
                          step.color === 'dna-amber' ? 'bg-dna-amber/10 text-dna-amber' :
                          'bg-dna-green/10 text-dna-green'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono text-slate-600">0{i + 1}</span>
                          <h3 className="text-sm font-headline font-semibold text-slate-200">
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 font-body leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* CTA */}
              <motion.button
                onClick={handleUpload}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                  bg-gradient-to-r from-dna-cyan to-blue-600
                  text-white font-body font-semibold text-sm
                  shadow-glow-cyan hover:shadow-glow-cyan-lg
                  transition-shadow"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Upload your first VCF
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              {/* Don't show again */}
              <label className="flex items-center justify-center gap-2 mt-4 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={dontShow}
                  onChange={(e) => setDontShow(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-600 bg-transparent
                    text-dna-cyan focus:ring-dna-cyan/30 focus:ring-offset-0
                    cursor-pointer"
                />
                <span className="text-xs text-slate-500 font-body group-hover:text-slate-400 transition-colors">
                  Don't show this again
                </span>
              </label>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
