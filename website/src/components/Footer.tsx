import { Dna, Github, Heart, Linkedin } from 'lucide-react'
import { Link } from 'react-router-dom'

const footerLinks = [
    {
        title: 'Product',
        links: [
            { label: 'Features', to: '/features' },
            { label: 'Screenshots', to: '/screenshots' },
            { label: 'Architecture', to: '/architecture' },
            { label: 'Tech Stack', to: '/tech-stack' },
            { label: 'Get Started', to: '/get-started' },
        ],
    },
    {
        title: 'Resources',
        links: [
            { label: 'GitHub Repository', href: 'https://github.com/contact-ajmal/GeneMapr' },
            { label: 'Documentation', href: 'https://github.com/contact-ajmal/GeneMapr#readme' },
            { label: 'API Reference', href: 'https://github.com/contact-ajmal/GeneMapr#api-documentation' },
            { label: 'Issues', href: 'https://github.com/contact-ajmal/GeneMapr/issues' },
        ],
    },
    {
        title: 'Connect',
        links: [
            { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ajmalnazirbaba/', icon: Linkedin },
            { label: 'GitHub Profile', href: 'https://github.com/contact-ajmal', icon: Github },
            { label: 'Contributing', href: 'https://github.com/contact-ajmal/GeneMapr#contributing' },
            { label: 'License (MIT)', href: 'https://github.com/contact-ajmal/GeneMapr/blob/main/LICENSE' },
        ],
    },
]

export function Footer() {
    return (
        <footer style={{
            background: 'linear-gradient(180deg, rgba(10, 14, 26, 0) 0%, #060a14 100%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: 80,
            paddingBottom: 32,
        }}>
            <div className="container">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr repeat(3, 1fr)',
                    gap: 48,
                    marginBottom: 64,
                }} className="footer-grid">
                    {/* Brand column */}
                    <div>
                        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 8,
                                background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Dna size={20} color="#0a0e1a" strokeWidth={2.5} />
                            </div>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: '#e2e8f0' }}>
                                Gene<span style={{ color: '#00d4ff' }}>Mapr</span>
                            </span>
                        </Link>

                        <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.7, marginBottom: 20, maxWidth: 280 }}>
                            A production-ready platform for parsing, annotating, and interpreting genomic variants from VCF files.
                        </p>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <a href="https://github.com/contact-ajmal/GeneMapr" target="_blank" rel="noopener noreferrer"
                                className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <Github size={16} /> Star on GitHub
                            </a>
                            <a href="https://www.linkedin.com/in/ajmalnazirbaba/" target="_blank" rel="noopener noreferrer"
                                style={{
                                    padding: '8px 14px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(0, 119, 181, 0.15)', border: '1px solid rgba(0, 119, 181, 0.3)',
                                    color: '#0077b5', transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0, 119, 181, 0.25)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0, 119, 181, 0.15)' }}
                            >
                                <Linkedin size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Link columns */}
                    {footerLinks.map(group => (
                        <div key={group.title}>
                            <h4 style={{
                                fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2,
                                color: '#94a3b8', marginBottom: 20, fontFamily: "'JetBrains Mono', monospace",
                            }}>
                                {group.title}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {group.links.map((link: any) => {
                                    const content = (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {link.icon && <link.icon size={14} />}
                                            {link.label}
                                        </span>
                                    )

                                    if (link.to) {
                                        return (
                                            <Link key={link.label} to={link.to}
                                                style={{ fontSize: '0.88rem', color: '#64748b', transition: 'color 0.2s' }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#00d4ff'}
                                                onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                                            >{content}</Link>
                                        )
                                    }

                                    return (
                                        <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                                            style={{ fontSize: '0.88rem', color: '#64748b', transition: 'color 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.color = '#00d4ff'}
                                            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                                        >{content}</a>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.15), transparent)', marginBottom: 24 }} />

                {/* Bottom row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{
                            padding: '3px 10px', background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.2)',
                            borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", color: '#00d4ff', fontSize: '0.72rem', fontWeight: 600,
                        }}>v1.0</span>
                        <span>GeneMapr | For Research Use Only</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Made with <Heart size={12} color="#ff3366" fill="#ff3366" /> by{' '}
                        <a href="https://www.linkedin.com/in/ajmalnazirbaba/" target="_blank" rel="noopener noreferrer"
                            style={{ color: '#94a3b8', marginLeft: 4 }}
                            onMouseEnter={e => e.currentTarget.style.color = '#00d4ff'}
                            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                        >Ajmal Nazir Baba</a>
                    </div>
                </div>
            </div>

            <style>{`@media (max-width: 768px) { .footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; } }`}</style>
        </footer>
    )
}
