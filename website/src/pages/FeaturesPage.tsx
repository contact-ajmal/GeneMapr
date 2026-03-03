import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import {
    Upload, Database, ShieldAlert, Brain,
    FlaskConical, Dna, GitCompare, FileText,
    Search, BarChart3, Lock, Zap
} from 'lucide-react'

const features = [
    {
        icon: Upload,
        title: 'VCF Upload & Parsing',
        description: 'Robust parsing using pysam with comprehensive format validation. Supports both .vcf and .vcf.gz files with intuitive drag-and-drop upload interface.',
        details: ['Handles multi-sample VCF files', 'Real-time upload progress', 'Automatic format detection', 'Sample metadata extraction'],
        color: '#00d4ff',
    },
    {
        icon: Database,
        title: 'Multi-Source Annotation',
        description: 'Seamlessly integrates with ClinVar, gnomAD, and Ensembl REST APIs to enrich every variant with comprehensive clinical and population data.',
        details: ['ClinVar clinical significance', 'gnomAD population frequencies', 'Ensembl gene annotations', 'Redis-cached for speed'],
        color: '#10b981',
    },
    {
        icon: ShieldAlert,
        title: 'Risk Scoring Engine',
        description: 'Automated, configurable risk scoring algorithm that weighs clinical significance, population frequency, and functional consequence severity.',
        details: ['0-100 risk score scale', 'Clinical significance weighting', 'Allele frequency thresholds', 'Consequence-type modifiers'],
        color: '#f59e0b',
    },
    {
        icon: Brain,
        title: 'AI Clinical Summaries',
        description: 'LLM-powered clinical interpretation summaries using configurable model selection. Generates context-aware analysis for each variant.',
        details: ['Multi-model support', 'Configurable from settings', 'Per-variant summaries', 'Clinical context awareness'],
        color: '#8b5cf6',
    },
    {
        icon: FlaskConical,
        title: 'Pharmacogenomics',
        description: 'Detailed metabolizer status for 7 key pharmacogenes with comprehensive drug interaction analysis and clinical-impact ratings.',
        details: ['DPYD, TPMT, CYP2C19', 'CYP2C9, SLCO1B1, VKORC1, CYP2D6', 'Drug interaction tables', 'Allele star nomenclature'],
        color: '#ff3366',
    },
    {
        icon: Dna,
        title: 'Genome Visualization',
        description: 'Interactive cytogenetic ideogram mapping variant positions across all 22 autosomes plus X/Y chromosomes with clinical significance overlays.',
        details: ['GRCh38 reference', 'Overlay & histogram modes', 'Color-coded significance', 'Zoom & pan navigation'],
        color: '#06b6d4',
    },
    {
        icon: GitCompare,
        title: 'Sample Comparison',
        description: 'Multi-sample and family-based cohort analysis for comparing genomic profiles, identifying shared variants, and tracking inheritance patterns.',
        details: ['Trio analysis support', 'Proband labeling', 'Shared variant detection', 'De novo flagging'],
        color: '#ec4899',
    },
    {
        icon: FileText,
        title: 'PDF Reports',
        description: 'Generate professional PDF reports in clinical, research, and patient-friendly formats with variant details and risk assessments.',
        details: ['Clinical report format', 'Research summary format', 'Patient-friendly format', 'Custom branding support'],
        color: '#14b8a6',
    },
    {
        icon: Search,
        title: 'Advanced Filtering',
        description: 'Real-time variant filtering across multiple dimensions — gene symbol, consequence, allele frequency, clinical significance, and risk score.',
        details: ['Multi-field search', 'Range-based filters', 'Instant results', 'Bookmark filter presets'],
        color: '#3b82f6',
    },
    {
        icon: BarChart3,
        title: 'Genomic Analytics',
        description: 'Visual breakdown of variant distributions by clinical significance, consequence type, and chromosome with interactive charts and statistics.',
        details: ['Pie & bar charts', 'Consequence distribution', 'Chromosome breakdown', 'Clinical impact overview'],
        color: '#a855f7',
    },
    {
        icon: Lock,
        title: 'User Management',
        description: 'Built-in user authentication and role-based access control with admin panel for managing users, settings, and application configuration.',
        details: ['Role-based access', 'Admin dashboard', 'User profiles', 'Session management'],
        color: '#64748b',
    },
    {
        icon: Zap,
        title: 'Real-time Processing',
        description: 'Efficient pipeline architecture with asynchronous variant processing, live progress tracking, and Redis-backed intelligent caching.',
        details: ['Async processing', 'Live progress bars', '24hr API cache TTL', 'Background job queue'],
        color: '#eab308',
    },
]

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-60px' })

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.06 }}
            className="glass-card"
            style={{ padding: 32, position: 'relative', overflow: 'hidden' }}
        >
            {/* Glow */}
            <div style={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${feature.color}12 0%, transparent 70%)`,
                pointerEvents: 'none',
            }} />

            <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${feature.color}15`,
                border: `1px solid ${feature.color}28`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
            }}>
                <feature.icon size={22} color={feature.color} />
            </div>

            <h3 style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                marginBottom: 10,
                color: '#e2e8f0',
            }}>
                {feature.title}
            </h3>

            <p style={{
                fontSize: '0.9rem',
                color: '#94a3b8',
                lineHeight: 1.65,
                marginBottom: 18,
            }}>
                {feature.description}
            </p>

            {/* Detail bullets */}
            <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
            }}>
                {feature.details.map(detail => (
                    <li
                        key={detail}
                        style={{
                            fontSize: '0.8rem',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <span style={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            background: feature.color,
                            flexShrink: 0,
                            opacity: 0.7,
                        }} />
                        {detail}
                    </li>
                ))}
            </ul>
        </motion.div>
    )
}

export function FeaturesPage() {
    const headerRef = useRef(null)
    const headerInView = useInView(headerRef, { once: true, margin: '-50px' })

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
                    <span className="section-label">✦ Core Features</span>
                    <h1 className="section-title" style={{ margin: '0 auto 20px' }}>
                        Everything You Need for{' '}
                        <span className="gradient-text">Variant Analysis</span>
                    </h1>
                    <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: 700 }}>
                        A complete, production-ready toolkit for genomic variant interpretation — from raw VCF file parsing
                        through multi-source annotation to AI-powered clinical insights, pharmacogenomic profiling, and professional reporting.
                    </p>
                </motion.div>

                {/* Stats bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={headerInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: 16,
                        marginBottom: 64,
                        maxWidth: 800,
                        margin: '0 auto 64px',
                    }}
                >
                    {[
                        { label: 'Features', value: '12+' },
                        { label: 'External APIs', value: '3' },
                        { label: 'Pharmacogenes', value: '7' },
                        { label: 'Report Formats', value: '3' },
                    ].map(stat => (
                        <div
                            key={stat.label}
                            className="glass-card"
                            style={{
                                padding: '20px 24px',
                                textAlign: 'center',
                            }}
                        >
                            <div style={{
                                fontSize: '1.8rem',
                                fontWeight: 800,
                                fontFamily: "'Outfit', sans-serif",
                                background: 'linear-gradient(135deg, #00d4ff, #ff3366)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>
                                {stat.value}
                            </div>
                            <div style={{
                                fontSize: '0.78rem',
                                color: '#64748b',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                                marginTop: 4,
                            }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </motion.div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 24,
                }}>
                    {features.map((feature, i) => (
                        <FeatureCard key={feature.title} feature={feature} index={i} />
                    ))}
                </div>
            </div>
        </div>
    )
}
