import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'

const screenshots = [
    {
        src: '/screenshots/01_upload.png',
        title: 'Upload Page',
        description: 'Drag-and-drop VCF file upload with format validation. Supports .vcf and .vcf.gz formats. Real-time sample tracking shows uploaded samples with variant counts and file details. Multi-sample upload workflow for batch processing.',
    },
    {
        src: '/screenshots/02_dashboard.png',
        title: 'Variant Dashboard',
        description: 'The central hub for variant analysis. Interactive sortable table with columns for chromosome, position, REF/ALT alleles, gene symbol, consequence type, ClinVar significance, allele frequency, and risk score. Summary cards at the top provide instant counts of pathogenic, likely pathogenic, VUS, and high-risk variants.',
    },
    {
        src: '/screenshots/03_sample_workspace.png',
        title: 'Sample Workspace',
        description: 'Manage all uploaded samples in one organized workspace. View variant counts, file details, upload timestamps, and proband designations. Supports multi-sample workflows with easy sample switching and comparison setup.',
    },
    {
        src: '/screenshots/04_genome_view.png',
        title: 'Genome View',
        description: 'Interactive cytogenetic ideogram displaying variant positions across all 22 autosomes and sex chromosomes. Switch between overlay and histogram view modes. Variants are color-coded by clinical significance — pathogenic (red), likely pathogenic (orange), VUS (yellow), benign (green). Built on the GRCh38 reference genome.',
    },
    {
        src: '/screenshots/05_genome_analytics.png',
        title: 'Genome Analytics',
        description: 'Comprehensive visual analytics dashboard with interactive charts. Pie charts and bar graphs break down variant distributions by clinical significance and consequence type. Per-chromosome variant density analysis helps identify hotspot regions.',
    },
    {
        src: '/screenshots/06_pharmacogenomics.png',
        title: 'Pharmacogenomics',
        description: 'Detailed metabolizer status panels for 7 key pharmacogenes: DPYD, TPMT, CYP2C19, CYP2C9, SLCO1B1, VKORC1, and CYP2D6. Each panel shows metabolizer classification (Poor/Intermediate/Normal/Rapid), star-allele nomenclature, allele counts, and affected drug counts. Searchable drug interaction table below with clinical impact ratings.',
    },
    {
        src: '/screenshots/07_sample_comparison.png',
        title: 'Sample Comparison',
        description: 'Multi-sample and family-based cohort analysis interface. Compare genomic profiles across related samples with visual difference highlighting. Supports trio (proband + parents) analysis for identifying de novo, inherited, and shared variants.',
    },
    {
        src: '/screenshots/08_reports.png',
        title: 'Reports',
        description: 'Generate and manage professional PDF reports. Choose from clinical, research, or patient-friendly report templates. Each report includes variant summaries, risk assessments, pharmacogenomic profiles, and AI-generated clinical interpretations tailored to the target audience.',
    },
    {
        src: '/screenshots/09_settings.png',
        title: 'Settings',
        description: 'Application configuration panel including user management, admin controls, and LLM model selection. Configure API keys, set default filters, manage users and roles, and select which AI model powers the clinical summary engine.',
    },
]

function ScreenshotModal({ screenshot, onClose }: { screenshot: typeof screenshots[0]; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 200,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
                cursor: 'zoom-out',
            }}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: 1200, width: '100%', cursor: 'default' }}
            >
                <div className="screenshot-frame" style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
                    <img src={screenshot.src} alt={screenshot.title} />
                </div>
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
                        {screenshot.title}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', maxWidth: 600, margin: '0 auto' }}>
                        {screenshot.description}
                    </p>
                </div>
            </motion.div>
        </motion.div>
    )
}

export function ScreenshotsPage() {
    const headerRef = useRef(null)
    const headerInView = useInView(headerRef, { once: true, margin: '-50px' })
    const [selected, setSelected] = useState<typeof screenshots[0] | null>(null)
    const [activeIdx, setActiveIdx] = useState(0)

    return (
        <div className="section" style={{ paddingTop: 60 }}>
            <div className="container">
                <motion.div
                    ref={headerRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={headerInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    style={{ textAlign: 'center', marginBottom: 64 }}
                >
                    <span className="section-label">◈ Screenshots</span>
                    <h1 className="section-title" style={{ margin: '0 auto 20px' }}>
                        See <span className="gradient-text">GeneMapr</span> in Action
                    </h1>
                    <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: 700 }}>
                        Explore every screen of the platform — from file upload through variant analysis
                        to pharmacogenomic profiling and report generation.
                    </p>
                </motion.div>

                {/* Featured screenshot carousel */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={headerInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ marginBottom: 80 }}
                >
                    <div style={{ position: 'relative' }}>
                        <div className="screenshot-frame" style={{ maxWidth: 1000, margin: '0 auto', cursor: 'zoom-in' }}
                            onClick={() => setSelected(screenshots[activeIdx])}
                        >
                            <img src={screenshots[activeIdx].src} alt={screenshots[activeIdx].title} />
                        </div>

                        {/* Nav arrows */}
                        <button
                            onClick={() => setActiveIdx(prev => (prev - 1 + screenshots.length) % screenshots.length)}
                            style={{
                                position: 'absolute',
                                left: -20,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                background: 'rgba(10, 14, 26, 0.8)',
                                border: '1px solid rgba(0, 212, 255, 0.2)',
                                color: '#e2e8f0',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => setActiveIdx(prev => (prev + 1) % screenshots.length)}
                            style={{
                                position: 'absolute',
                                right: -20,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                background: 'rgba(10, 14, 26, 0.8)',
                                border: '1px solid rgba(0, 212, 255, 0.2)',
                                color: '#e2e8f0',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
                            {screenshots[activeIdx].title}
                        </h3>
                        <p style={{ fontSize: '0.95rem', color: '#94a3b8', maxWidth: 700, margin: '0 auto', lineHeight: 1.7 }}>
                            {screenshots[activeIdx].description}
                        </p>
                    </div>

                    {/* Dots */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                        {screenshots.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveIdx(i)}
                                style={{
                                    width: i === activeIdx ? 32 : 8,
                                    height: 8,
                                    borderRadius: 4,
                                    border: 'none',
                                    background: i === activeIdx ? '#00d4ff' : 'rgba(148, 163, 184, 0.3)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: i === activeIdx ? '0 0 12px rgba(0, 212, 255, 0.4)' : 'none',
                                }}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Thumbnail grid */}
                <div>
                    <h2 style={{
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: '#e2e8f0',
                        marginBottom: 32,
                        textAlign: 'center',
                    }}>
                        All Screens
                    </h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: 24,
                    }}>
                        {screenshots.map((shot, i) => {
                            const ref = useRef(null)
                            const inView = useInView(ref, { once: true, margin: '-50px' })
                            return (
                                <motion.div
                                    key={shot.title}
                                    ref={ref}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={inView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                    className="glass-card"
                                    style={{ overflow: 'hidden', cursor: 'pointer' }}
                                    onClick={() => { setActiveIdx(i); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                                >
                                    <div style={{ position: 'relative' }}>
                                        <img
                                            src={shot.src}
                                            alt={shot.title}
                                            style={{ width: '100%', display: 'block' }}
                                            loading="lazy"
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'linear-gradient(transparent 60%, rgba(10, 14, 26, 0.9) 100%)',
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            justifyContent: 'space-between',
                                            padding: '16px',
                                        }}>
                                            <span style={{
                                                fontWeight: 600,
                                                color: '#e2e8f0',
                                                fontSize: '0.95rem',
                                            }}>
                                                {shot.title}
                                            </span>
                                            <Maximize2 size={16} color="#64748b" />
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {selected && <ScreenshotModal screenshot={selected} onClose={() => setSelected(null)} />}
        </div>
    )
}
