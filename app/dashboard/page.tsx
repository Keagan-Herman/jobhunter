'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Job = {
    id: string
    title: string
    company: string
    location: string
    description: string
    salary_min: number | null
    salary_max: number | null
    url: string
    stack: string[]
    score: number
    score_reason: string
    status: 'pending' | 'applied' | 'skipped' | 'interviewing'
    fetched_at: string
    cover_letter?: string
    cover_letter_id?: string
    notes?: string
    interview_date?: string
    contact_name?: string
    contact_email?: string
    offer_amount?: number
    follow_up_date?: string
    seniority?: string
    work_style?: string
    stack_overlap?: number
}

function ScoreBadge({ score }: { score: number }) {
    const color = score >= 85 ? '#00ff87' : score >= 70 ? '#ffd60a' : '#ff6b6b'
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: `${color}18`, border: `1px solid ${color}40`,
            borderRadius: '6px', padding: '3px 10px', fontSize: '12px',
            fontWeight: '700', color, fontFamily: "'DM Mono', monospace"
        }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, display: 'inline-block' }} />
            {score}%
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { color: string, label: string }> = {
        pending: { color: '#ffd60a', label: 'PENDING' },
        applied: { color: '#00ff87', label: 'APPLIED' },
        skipped: { color: '#444', label: 'SKIPPED' },
        interviewing: { color: '#00d4ff', label: 'INTERVIEW' },
    }
    const { color, label } = map[status] || map.pending
    return (
        <span style={{
            fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px',
            color, fontFamily: "'DM Mono', monospace"
        }}>{label}</span>
    )
}

export default function DashboardPage() {
    // ── State ────────────────────────────────────────────────────────
    const [jobs, setJobs] = useState<Job[]>([])
    const [selected, setSelected] = useState<Job | null>(null)
    const [loading, setLoading] = useState(true)
    const [scanning, setScanning] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [coverLetter, setCoverLetter] = useState('')
    const [activeTab, setActiveTab] = useState<'pending' | 'applied' | 'interviewing' | 'skipped'>('pending')
    const [scanResult, setScanResult] = useState('')
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [error, setError] = useState('')
    const [firstTime, setFirstTime] = useState(false)

    // Tracking
    const [notes, setNotes] = useState('')
    const [interviewDate, setInterviewDate] = useState('')
    const [contactName, setContactName] = useState('')
    const [contactEmail, setContactEmail] = useState('')
    const [offerAmount, setOfferAmount] = useState('')
    const [followUpDate, setFollowUpDate] = useState('')
    const [savingTracking, setSavingTracking] = useState(false)
    const [trackingSaved, setTrackingSaved] = useState(false)

    // Skip modal
    const [showSkipModal, setShowSkipModal] = useState(false)
    const [skipJobId, setSkipJobId] = useState<string | null>(null)
    const [skipReason, setSkipReason] = useState('')

    // Rescore
    const [rescoring, setRescoring] = useState(false)
    const [rescoreResult, setRescoreResult] = useState('')

    // Pagination
    const [page, setPage] = useState(1)
    const PAGE_SIZE = 15

    // Copy cover letter
    const [copied, setCopied] = useState(false)

    const supabase = createClient()
    const router = useRouter()

    // ── Data fetching ─────────────────────────────────────────────────
    const fetchJobs = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('jobs_with_cover')
                .select('*')
                .order('score', { ascending: false })

            if (error) throw error
            if (data) setJobs(data as Job[])
        } catch (err: any) {
            setError('Failed to load jobs. Please refresh.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.search.includes('firstTime=true')) {
            setFirstTime(true)
        }
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) router.push('/login')
            else setUser(user)
        })
        fetchJobs()
    }, [])

    // ── Handlers ──────────────────────────────────────────────────────
    const handleScan = async () => {
        setScanning(true)
        setScanResult('')
        try {
            const res = await fetch('/api/jobs')
            const data = await res.json()
            if (data.success) {
                setScanResult(`✓ Found ${data.found} jobs, saved ${data.saved} new`)
                await fetchJobs()
            } else {
                setScanResult(`✗ ${data.error}`)
            }
        } catch {
            setScanResult('✗ Scan failed')
        }
        setScanning(false)
    }

    const handleRescore = async () => {
        setRescoring(true)
        setRescoreResult('')
        try {
            const res = await fetch('/api/rescore', { method: 'POST' })
            const data = await res.json()
            if (data.success) {
                setRescoreResult(`✓ Rescored ${data.rescored} jobs`)
                await fetchJobs()
            } else {
                setRescoreResult(data.message || `✗ ${data.error}`)
            }
        } catch {
            setRescoreResult('✗ Rescore failed')
        }
        setRescoring(false)
    }

    const handleGenerateCoverLetter = async () => {
        if (!selected) return
        setGenerating(true)
        setCoverLetter('')
        try {
            const res = await fetch('/api/cover-letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: selected.id })
            })
            const data = await res.json()
            if (data.success) {
                setCoverLetter(data.coverLetter.content)
                setJobs(prev => prev.map(j =>
                    j.id === selected.id ? { ...j, cover_letter: data.coverLetter.content } : j
                ))
            }
        } catch {
            setCoverLetter('Failed to generate cover letter.')
        }
        setGenerating(false)
    }

    const handleCopyLetter = async () => {
        if (!coverLetter) return
        await navigator.clipboard.writeText(coverLetter)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleStatusUpdate = async (jobId: string, status: Job['status']) => {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j))
        if (selected?.id === jobId) setSelected(prev => prev ? { ...prev, status } : null)
        try {
            await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, action: status, reason: null })
            })
        } catch {
            await fetchJobs()
        }
    }

    const handleSelectJob = (job: Job) => {
        setSelected(job)
        setCoverLetter(job.cover_letter || '')
        setNotes(job.notes || '')
        setInterviewDate(job.interview_date ? job.interview_date.slice(0, 16) : '')
        setContactName(job.contact_name || '')
        setContactEmail(job.contact_email || '')
        setOfferAmount(job.offer_amount ? String(job.offer_amount) : '')
        setFollowUpDate(job.follow_up_date ? job.follow_up_date.slice(0, 16) : '')
        setTrackingSaved(false)
        setCopied(false)
    }

    const handleSaveTracking = async () => {
        if (!selected) return
        setSavingTracking(true)
        await supabase
            .from('jobs')
            .update({
                notes: notes || null,
                interview_date: interviewDate || null,
                contact_name: contactName || null,
                contact_email: contactEmail || null,
                offer_amount: offerAmount ? parseFloat(offerAmount) : null,
                follow_up_date: followUpDate || null,
            })
            .eq('id', selected.id)
        setSavingTracking(false)
        setTrackingSaved(true)
        setTimeout(() => setTrackingSaved(false), 3000)
    }

    const handleCoverLetterOutcome = async (outcome: string) => {
        if (!selected?.cover_letter_id) return
        await fetch('/api/cover-letter/outcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                coverLetterId: selected.cover_letter_id,
                jobId: selected.id,
                outcome
            })
        })
    }

    const handleInterviewOutcome = async (outcome: string) => {
        if (!selected) return
        await fetch('/api/interview-outcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: selected.id, outcome, interviewRound: 1 })
        })
        setJobs(prev => prev.map(j =>
            j.id === selected.id
                ? { ...j, status: outcome === 'offer' ? 'interviewing' : 'skipped' }
                : j
        ))
        setSelected(null)
        setCoverLetter('')
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    // ── Derived state ─────────────────────────────────────────────────
    const filteredJobs = jobs
        .filter(j => j.status === activeTab)
        .slice(0, page * PAGE_SIZE)

    const hasMore = jobs.filter(j => j.status === activeTab).length > page * PAGE_SIZE

    const stats = {
        pending: jobs.filter(j => j.status === 'pending').length,
        applied: jobs.filter(j => j.status === 'applied').length,
        interviewing: jobs.filter(j => j.status === 'interviewing').length,
        total: jobs.length
    }

    // ── Render ────────────────────────────────────────────────────────
    return (
        <div style={{
            minHeight: '100vh', background: '#080812',
            fontFamily: "'DM Sans', sans-serif", color: '#e0e0f0'
        }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 4px; }
        .job-row:hover { background: #111128 !important; cursor: pointer; }
        .btn-primary { transition: all 0.2s ease !important; }
        .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .btn-ghost:hover { background: #1a1a3a !important; }
        .tab-btn:hover { color: #888 !important; }
        .stat-card:hover { border-color: #2a2a4a !important; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        .spinning { animation: spin 1s linear infinite; }
        @media (max-width: 768px) {
          .main-grid { grid-template-columns: 1fr !important; }
          .detail-panel { display: none !important; }
          .detail-panel.mobile-show { display: flex !important; position: fixed !important; inset: 0 !important; z-index: 100 !important; margin: 0 !important; border-radius: 0 !important; overflow-y: auto !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .header-row { flex-direction: column !important; gap: 12px !important; align-items: flex-start !important; }
          .header-buttons { flex-wrap: wrap !important; }
        }
      `}</style>

            {/* Background */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
                backgroundImage: 'linear-gradient(#00ff870a 1px, transparent 1px), linear-gradient(90deg, #00ff870a 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                maskImage: 'radial-gradient(ellipse at 50% 0%, black 30%, transparent 70%)'
            }} />
            <div style={{
                position: 'fixed', top: '-300px', right: '-300px', width: '700px', height: '700px',
                borderRadius: '50%', background: 'radial-gradient(circle, #00ff8710 0%, transparent 70%)',
                zIndex: 0, pointerEvents: 'none'
            }} />

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>

                {/* ── Header ── */}
                <div className="header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h1 style={{
                            fontFamily: "'Syne', sans-serif", fontSize: 'clamp(22px, 4vw, 32px)',
                            fontWeight: '800', color: '#fff', letterSpacing: '-0.5px'
                        }}>
                            Job<span style={{ color: '#00ff87' }}>Hunter</span>
                        </h1>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: '#0d0d20', border: '1px solid #1e1e38',
                            borderRadius: '20px', padding: '4px 12px'
                        }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff87', animation: 'pulse 2s infinite' }} />
                            <span style={{ fontSize: '11px', color: '#00ff87', fontFamily: "'DM Mono', monospace" }}>LIVE</span>
                        </div>
                    </div>

                    <div className="header-buttons" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button onClick={handleScan} disabled={scanning} className="btn-primary"
                            style={{
                                background: scanning ? '#0d0d20' : '#00ff87',
                                border: scanning ? '1px solid #2a2a4a' : 'none',
                                color: scanning ? '#00ff87' : '#0a0a1a',
                                padding: '9px 18px', borderRadius: '8px',
                                fontFamily: "'DM Mono', monospace", fontSize: '11px',
                                fontWeight: '700', letterSpacing: '1px',
                                cursor: scanning ? 'not-allowed' : 'pointer',
                                textTransform: 'uppercase' as const,
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            {scanning ? (
                                <>
                                    <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid #00ff87', borderTopColor: 'transparent', borderRadius: '50%' }} className="spinning" />
                                    Scanning...
                                </>
                            ) : '▶ Scan Jobs'}
                        </button>

                        <button onClick={handleRescore} disabled={rescoring} className="btn-ghost"
                            style={{
                                background: 'transparent', border: '1px solid #1e1e38',
                                color: rescoring ? '#00ff87' : '#444',
                                padding: '9px 14px', borderRadius: '8px',
                                fontFamily: "'DM Mono', monospace", fontSize: '11px',
                                fontWeight: '700', letterSpacing: '1px',
                                cursor: rescoring ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s', textTransform: 'uppercase' as const,
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            {rescoring ? (
                                <>
                                    <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid #00ff87', borderTopColor: 'transparent', borderRadius: '50%' }} className="spinning" />
                                    Rescoring...
                                </>
                            ) : '↻ Rescore'}
                        </button>

                        <button onClick={() => router.push('/profile')} className="btn-ghost"
                            style={{
                                background: 'transparent', border: '1px solid #1e1e38',
                                color: '#444', padding: '9px 14px', borderRadius: '8px',
                                fontFamily: "'DM Mono', monospace", fontSize: '11px',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            Profile
                        </button>

                        <button onClick={handleSignOut} className="btn-ghost"
                            style={{
                                background: 'transparent', border: '1px solid #1e1e38',
                                color: '#444', padding: '9px 14px', borderRadius: '8px',
                                fontFamily: "'DM Mono', monospace", fontSize: '11px',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* ── Error banner ── */}
                {error && (
                    <div style={{
                        background: '#ff6b6b15', border: '1px solid #ff6b6b30',
                        borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <span style={{ color: '#ff6b6b', fontSize: '13px', fontFamily: "'DM Mono', monospace" }}>{error}</span>
                        <button onClick={() => { setError(''); fetchJobs() }}
                            style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '13px', fontFamily: "'DM Mono', monospace" }}>
                            Retry →
                        </button>
                    </div>
                )}

                {/* ── Toasts ── */}
                {scanResult && (
                    <div style={{
                        background: scanResult.startsWith('✓') ? '#00ff8715' : '#ff6b6b15',
                        border: `1px solid ${scanResult.startsWith('✓') ? '#00ff8730' : '#ff6b6b30'}`,
                        borderRadius: '8px', padding: '10px 16px', marginBottom: '16px',
                        fontSize: '13px', color: scanResult.startsWith('✓') ? '#00ff87' : '#ff6b6b',
                        fontFamily: "'DM Mono', monospace"
                    }}>{scanResult}</div>
                )}

                {rescoreResult && (
                    <div style={{
                        background: rescoreResult.startsWith('✓') ? '#00ff8715' : '#ff6b6b15',
                        border: `1px solid ${rescoreResult.startsWith('✓') ? '#00ff8730' : '#ff6b6b30'}`,
                        borderRadius: '8px', padding: '10px 16px', marginBottom: '16px',
                        fontSize: '13px', color: rescoreResult.startsWith('✓') ? '#00ff87' : '#ff6b6b',
                        fontFamily: "'DM Mono', monospace"
                    }}>{rescoreResult}</div>
                )}

                {/* ── First time banner ── */}
                {firstTime && (
                    <div style={{
                        background: '#00ff8712', border: '1px solid #00ff8730',
                        borderRadius: '10px', padding: '16px 20px', marginBottom: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: '12px'
                    }}>
                        <div>
                            <div style={{ fontWeight: '600', fontSize: '14px', color: '#00ff87', marginBottom: '2px' }}>🎉 You're all set!</div>
                            <div style={{ fontSize: '12px', color: '#555' }}>Run your first scan to find jobs matching your profile</div>
                        </div>
                        <button onClick={() => { setFirstTime(false); handleScan() }}
                            style={{
                                background: '#00ff87', border: 'none', color: '#0a0a1a',
                                padding: '9px 18px', borderRadius: '8px',
                                fontFamily: "'DM Mono', monospace", fontSize: '11px',
                                fontWeight: '700', letterSpacing: '1px',
                                cursor: 'pointer', textTransform: 'uppercase' as const
                            }}
                        >▶ Run First Scan</button>
                    </div>
                )}

                {/* ── Stats ── */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    {[
                        { label: 'Total Jobs', value: stats.total, color: '#e0e0f0' },
                        { label: 'Pending', value: stats.pending, color: '#ffd60a' },
                        { label: 'Applied', value: stats.applied, color: '#00ff87' },
                        { label: 'Interviews', value: stats.interviewing, color: '#00d4ff' },
                    ].map(s => (
                        <div key={s.label} className="stat-card" style={{
                            background: '#0d0d20', border: '1px solid #1a1a32',
                            borderRadius: '10px', padding: '14px 16px', transition: 'border-color 0.2s'
                        }}>
                            <div style={{ fontSize: '10px', color: '#444', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", marginBottom: '6px' }}>{s.label}</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: s.color, fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* ── Tabs ── */}
                <div style={{ display: 'flex', gap: '2px', marginBottom: '16px', borderBottom: '1px solid #1a1a32' }}>
                    {(['pending', 'applied', 'interviewing', 'skipped'] as const).map(tab => (
                        <button key={tab} className="tab-btn"
                            onClick={() => { setActiveTab(tab); setPage(1) }}
                            style={{
                                background: 'none', border: 'none',
                                color: activeTab === tab ? '#00ff87' : '#444',
                                fontFamily: "'DM Mono', monospace", fontSize: '11px',
                                fontWeight: '600', letterSpacing: '1px', padding: '10px 16px',
                                cursor: 'pointer', textTransform: 'uppercase' as const,
                                borderBottom: activeTab === tab ? '2px solid #00ff87' : '2px solid transparent',
                                marginBottom: '-1px', transition: 'color 0.2s'
                            }}
                        >
                            {tab} ({jobs.filter(j => j.status === tab).length})
                        </button>
                    ))}
                </div>

                {/* ── Main grid ── */}
                <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '14px' }}>

                    {/* Job list */}
                    <div style={{ background: '#0d0d20', border: '1px solid #1a1a32', borderRadius: '12px', overflow: 'hidden' }}>
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#333', fontFamily: "'DM Mono', monospace", fontSize: '13px' }}>
                                Loading jobs...
                            </div>
                        ) : filteredJobs.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                                    {activeTab === 'pending' ? '🔍' : activeTab === 'applied' ? '📨' : activeTab === 'interviewing' ? '🎯' : '🗑️'}
                                </div>
                                <div style={{ color: '#333', fontFamily: "'DM Mono', monospace", fontSize: '12px' }}>
                                    {activeTab === 'pending' ? 'No pending jobs — run a scan!' : `No ${activeTab} jobs yet`}
                                </div>
                            </div>
                        ) : (
                            <>
                                {filteredJobs.map((job, i) => (
                                    <div key={job.id} className="job-row fade-in" onClick={() => handleSelectJob(job)}
                                        style={{
                                            padding: '14px 16px',
                                            borderBottom: i < filteredJobs.length - 1 ? '1px solid #0f0f22' : 'none',
                                            background: selected?.id === job.id ? '#111128' : 'transparent',
                                            borderLeft: selected?.id === job.id ? '3px solid #00ff87' : '3px solid transparent',
                                            transition: 'all 0.15s ease',
                                            animationDelay: `${i * 0.05}s`, opacity: 0,
                                            animationFillMode: 'forwards'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                            <div style={{ flex: 1, marginRight: '10px' }}>
                                                <div style={{ fontWeight: '600', fontSize: '14px', color: '#e0e0f0', marginBottom: '2px' }}>{job.title}</div>
                                                <div style={{ fontSize: '12px', color: '#555' }}>{job.company} · {job.location}</div>
                                            </div>
                                            <ScoreBadge score={job.score} />
                                        </div>

                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '8px' }}>
                                            {(job.stack || []).slice(0, 3).map(s => (
                                                <span key={s} style={{
                                                    fontSize: '10px', padding: '2px 7px', borderRadius: '4px',
                                                    background: '#1a1a3a', color: '#7b61ff', fontFamily: "'DM Mono', monospace"
                                                }}>{s}</span>
                                            ))}
                                        </div>

                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '6px' }}>
                                            {job.seniority && (
                                                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: '#1a2a1a', color: '#00ff87', fontFamily: "'DM Mono', monospace" }}>
                                                    {job.seniority}
                                                </span>
                                            )}
                                            {job.work_style && job.work_style !== 'unspecified' && (
                                                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: '#1a1a2a', color: '#00d4ff', fontFamily: "'DM Mono', monospace" }}>
                                                    {job.work_style}
                                                </span>
                                            )}
                                            {job.stack_overlap !== undefined && job.stack_overlap > 0 && (
                                                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: '#2a1a1a', color: '#ffd60a', fontFamily: "'DM Mono', monospace" }}>
                                                    {job.stack_overlap}% stack match
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                            {job.score_reason && (
                                                <div style={{ fontSize: '11px', color: '#444', fontStyle: 'italic', flex: 1, marginRight: '8px' }}>
                                                    {job.score_reason}
                                                </div>
                                            )}
                                            <StatusBadge status={job.status} />
                                        </div>
                                    </div>
                                ))}

                                {hasMore && (
                                    <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid #1a1a32' }}>
                                        <button onClick={() => setPage(p => p + 1)}
                                            style={{
                                                background: 'transparent', border: '1px solid #2a2a4a',
                                                color: '#555', padding: '8px 24px', borderRadius: '8px',
                                                fontFamily: "'DM Mono', monospace", fontSize: '11px',
                                                cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            Load more ({jobs.filter(j => j.status === activeTab).length - page * PAGE_SIZE} remaining)
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* ── Detail panel ── */}
                    {selected && (
                        <div className="detail-panel fade-in mobile-show"
                            style={{
                                background: '#0d0d20', border: '1px solid #1a1a32',
                                borderRadius: '12px', overflow: 'hidden',
                                display: 'flex', flexDirection: 'column', maxHeight: '80vh'
                            }}
                        >
                            {/* Job header */}
                            <div style={{ padding: '16px', borderBottom: '1px solid #1a1a32', flexShrink: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontWeight: '700', fontSize: '15px', color: '#fff', marginBottom: '3px' }}>{selected.title}</h3>
                                        <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px' }}>{selected.company} · {selected.location}</div>
                                        {(selected.salary_min || selected.salary_max) && (
                                            <div style={{ fontSize: '12px', color: '#00ff87', fontFamily: "'DM Mono', monospace" }}>
                                                R{selected.salary_min?.toLocaleString()} – R{selected.salary_max?.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => { setSelected(null); setCoverLetter('') }}
                                        style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 0 0 8px' }}>×</button>
                                </div>
                                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '10px' }}>
                                    {(selected.stack || []).map(s => (
                                        <span key={s} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '5px', background: '#1a1a3a', color: '#7b61ff', fontFamily: "'DM Mono', monospace" }}>{s}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid #1a1a32', flexShrink: 0 }}>
                                <p style={{ fontSize: '12px', color: '#666', lineHeight: 1.7 }}>{selected.description?.slice(0, 300)}...</p>
                                {selected.url && (
                                    <a href={selected.url} target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: '11px', color: '#00ff87', fontFamily: "'DM Mono', monospace", textDecoration: 'none', display: 'inline-block', marginTop: '8px' }}>
                                        View full listing →
                                    </a>
                                )}
                            </div>

                            {/* Cover letter */}
                            <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
                                {!coverLetter && !generating && (
                                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                        <div style={{ fontSize: '24px', marginBottom: '6px' }}>✍️</div>
                                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#333' }}>Generate a tailored cover letter</div>
                                    </div>
                                )}
                                {generating && (
                                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                        <div style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #00ff87', borderTopColor: 'transparent', borderRadius: '50%' }} className="spinning" />
                                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#444', marginTop: '8px' }}>Generating...</div>
                                    </div>
                                )}
                                {coverLetter && !generating && (
                                    <div style={{ fontSize: '13px', lineHeight: 1.8, color: '#bbb', whiteSpace: 'pre-wrap' }}>{coverLetter}</div>
                                )}
                            </div>

                            {/* Cover letter outcome */}
                            {selected.status === 'interviewing' && selected.cover_letter_id && (
                                <div style={{ padding: '12px 16px', borderTop: '1px solid #1a1a32', flexShrink: 0 }}>
                                    <div style={{ fontSize: '10px', color: '#444', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", marginBottom: '10px' }}>
                                        Cover Letter Outcome
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {[
                                            { value: 'interviewed', label: '🎯 Got Interview', color: '#00ff87' },
                                            { value: 'rejected', label: '✗ Rejected', color: '#ff6b6b' },
                                            { value: 'no_response', label: '👻 No Response', color: '#555' },
                                        ].map(opt => (
                                            <button key={opt.value} onClick={() => handleCoverLetterOutcome(opt.value)}
                                                style={{
                                                    flex: 1, padding: '8px 4px', borderRadius: '8px', cursor: 'pointer',
                                                    fontSize: '10px', background: `${opt.color}18`, border: `1px solid ${opt.color}40`,
                                                    color: opt.color, fontFamily: "'DM Mono', monospace",
                                                    transition: 'all 0.2s', textAlign: 'center' as const
                                                }}
                                            >{opt.label}</button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tracking */}
                            {['applied', 'interviewing'].includes(selected.status) && (
                                <div style={{ padding: '14px 16px', borderTop: '1px solid #1a1a32', flexShrink: 0 }}>
                                    <div style={{ fontSize: '10px', color: '#444', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", marginBottom: '12px' }}>
                                        Application Tracking
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                        <div>
                                            <div style={{ fontSize: '10px', color: '#444', fontFamily: "'DM Mono', monospace", marginBottom: '4px' }}>Contact Name</div>
                                            <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Jane Smith"
                                                style={{ width: '100%', background: '#0a0a1a', border: '1px solid #1e1e38', borderRadius: '6px', padding: '8px 10px', color: '#e0e0f0', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', color: '#444', fontFamily: "'DM Mono', monospace", marginBottom: '4px' }}>Contact Email</div>
                                            <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="jane@company.com"
                                                style={{ width: '100%', background: '#0a0a1a', border: '1px solid #1e1e38', borderRadius: '6px', padding: '8px 10px', color: '#e0e0f0', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                        <div>
                                            <div style={{ fontSize: '10px', color: '#444', fontFamily: "'DM Mono', monospace", marginBottom: '4px' }}>Interview Date</div>
                                            <input type="datetime-local" value={interviewDate} onChange={e => setInterviewDate(e.target.value)}
                                                style={{ width: '100%', background: '#0a0a1a', border: '1px solid #1e1e38', borderRadius: '6px', padding: '8px 10px', color: '#e0e0f0', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", outline: 'none', colorScheme: 'dark' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', color: '#444', fontFamily: "'DM Mono', monospace", marginBottom: '4px' }}>Follow Up Date</div>
                                            <input type="datetime-local" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                                                style={{ width: '100%', background: '#0a0a1a', border: '1px solid #1e1e38', borderRadius: '6px', padding: '8px 10px', color: '#e0e0f0', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", outline: 'none', colorScheme: 'dark' }} />
                                        </div>
                                    </div>

                                    {selected.status === 'interviewing' && (
                                        <>
                                            <div style={{ marginBottom: '8px' }}>
                                                <div style={{ fontSize: '10px', color: '#444', fontFamily: "'DM Mono', monospace", marginBottom: '4px' }}>Offer Amount</div>
                                                <input type="number" value={offerAmount} onChange={e => setOfferAmount(e.target.value)} placeholder="e.g. 35000"
                                                    style={{ width: '100%', background: '#0a0a1a', border: '1px solid #1e1e38', borderRadius: '6px', padding: '8px 10px', color: '#e0e0f0', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
                                            </div>

                                            <div style={{ marginBottom: '12px' }}>
                                                <div style={{ fontSize: '10px', color: '#444', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", marginBottom: '10px' }}>
                                                    Interview Result
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {[
                                                        { value: 'offer', label: '🎉 Got an Offer!', color: '#00ff87' },
                                                        { value: 'rejected_after_interview', label: '✗ Rejected After Interview', color: '#ff6b6b' },
                                                        { value: 'withdrew', label: '🚪 Withdrew', color: '#ffd60a' },
                                                        { value: 'ghosted', label: '👻 Ghosted', color: '#555' },
                                                    ].map(opt => (
                                                        <button key={opt.value} onClick={() => handleInterviewOutcome(opt.value)}
                                                            style={{
                                                                width: '100%', padding: '10px', borderRadius: '8px', cursor: 'pointer',
                                                                fontSize: '11px', background: `${opt.color}18`, border: `1px solid ${opt.color}40`,
                                                                color: opt.color, fontFamily: "'DM Mono', monospace", fontWeight: '600',
                                                                letterSpacing: '0.5px', transition: 'all 0.2s', textAlign: 'left' as const
                                                            }}
                                                        >{opt.label}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div style={{ marginBottom: '10px' }}>
                                        <div style={{ fontSize: '10px', color: '#444', fontFamily: "'DM Mono', monospace", marginBottom: '4px' }}>Notes</div>
                                        <textarea value={notes} onChange={e => setNotes(e.target.value)}
                                            placeholder="Interview notes, recruiter feedback, things to follow up on..."
                                            rows={3}
                                            style={{ width: '100%', background: '#0a0a1a', border: '1px solid #1e1e38', borderRadius: '6px', padding: '8px 10px', color: '#e0e0f0', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
                                        />
                                    </div>

                                    <button onClick={handleSaveTracking} disabled={savingTracking}
                                        style={{
                                            width: '100%', background: trackingSaved ? '#0d2e1f' : '#12122a',
                                            border: `1px solid ${trackingSaved ? '#00ff8740' : '#2a2a4a'}`,
                                            color: trackingSaved ? '#00ff87' : '#666', padding: '9px', borderRadius: '8px',
                                            fontFamily: "'DM Mono', monospace", fontSize: '11px', fontWeight: '700',
                                            letterSpacing: '1px', cursor: savingTracking ? 'not-allowed' : 'pointer',
                                            textTransform: 'uppercase' as const, transition: 'all 0.3s'
                                        }}
                                    >
                                        {savingTracking ? 'Saving...' : trackingSaved ? '✓ Saved' : 'Save Tracking Info'}
                                    </button>
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ padding: '14px 16px', borderTop: '1px solid #1a1a32', display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                                {!coverLetter && (
                                    <button onClick={handleGenerateCoverLetter} disabled={generating} className="btn-primary"
                                        style={{
                                            flex: 1, background: '#00ff87', border: 'none', color: '#0a0a1a',
                                            padding: '10px', borderRadius: '8px', fontWeight: '700',
                                            fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '1px',
                                            cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.6 : 1,
                                            textTransform: 'uppercase' as const
                                        }}
                                    >⚡ Generate Cover Letter</button>
                                )}

                                {coverLetter && (
                                    <>
                                        <button onClick={handleCopyLetter}
                                            style={{
                                                background: copied ? '#00ff8718' : '#12122a',
                                                border: `1px solid ${copied ? '#00ff8740' : '#2a2a4a'}`,
                                                color: copied ? '#00ff87' : '#666', padding: '10px 14px', borderRadius: '8px',
                                                fontFamily: "'DM Mono', monospace", fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >{copied ? '✓ Copied' : '⎘ Copy'}</button>
                                        <button onClick={handleGenerateCoverLetter} disabled={generating} className="btn-ghost"
                                            style={{
                                                background: '#12122a', border: '1px solid #2a2a4a', color: '#666',
                                                padding: '10px 14px', borderRadius: '8px', fontFamily: "'DM Mono', monospace",
                                                fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >↺ Regenerate</button>
                                    </>
                                )}

                                {selected.status === 'pending' && (
                                    <>
                                        <button onClick={() => handleStatusUpdate(selected.id, 'applied')} disabled={updatingStatus} className="btn-primary"
                                            style={{
                                                flex: 1, background: '#00ff87', border: 'none', color: '#0a0a1a',
                                                padding: '10px', borderRadius: '8px', fontWeight: '700',
                                                fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '1px',
                                                cursor: 'pointer', textTransform: 'uppercase' as const
                                            }}
                                        >✓ Mark Applied</button>

                                        <button
                                            onClick={() => { if (!selected) return; setSkipJobId(selected.id); setShowSkipModal(true) }}
                                            className="btn-ghost"
                                            style={{
                                                background: '#12122a', border: '1px solid #2a2a4a', color: '#555',
                                                padding: '10px 14px', borderRadius: '8px', fontFamily: "'DM Mono', monospace",
                                                fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >Skip</button>
                                    </>
                                )}

                                {selected.status === 'applied' && (
                                    <button onClick={() => handleStatusUpdate(selected.id, 'interviewing')} disabled={updatingStatus} className="btn-primary"
                                        style={{
                                            flex: 1, background: '#00d4ff', border: 'none', color: '#0a0a1a',
                                            padding: '10px', borderRadius: '8px', fontWeight: '700',
                                            fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '1px',
                                            cursor: 'pointer', textTransform: 'uppercase' as const
                                        }}
                                    >🎯 Got Interview!</button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Skip modal ── */}
            {showSkipModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: '#000000aa',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 200, padding: '24px'
                }}>
                    <div style={{
                        background: '#0d0d20', border: '1px solid #1e1e38',
                        borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '400px'
                    }}>
                        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
                            Why are you skipping?
                        </h3>
                        <p style={{ fontSize: '12px', color: '#444', fontFamily: "'DM Mono', monospace", marginBottom: '20px' }}>
                            This helps the AI score future jobs better
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                            {['Wrong stack', 'Too senior', 'Too junior', 'Bad company', 'Wrong location', 'Low salary', 'Not interested', 'Already applied'].map(reason => (
                                <button key={reason} onClick={() => setSkipReason(reason)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                                        background: skipReason === reason ? '#00ff8718' : '#0a0a1a',
                                        border: `1px solid ${skipReason === reason ? '#00ff87' : '#1e1e38'}`,
                                        color: skipReason === reason ? '#00ff87' : '#555',
                                        fontSize: '11px', fontFamily: "'DM Mono', monospace", transition: 'all 0.15s'
                                    }}
                                >{reason}</button>
                            ))}
                        </div>

                        <input value={skipReason} onChange={e => setSkipReason(e.target.value)}
                            placeholder="Or type your own reason..."
                            style={{
                                width: '100%', background: '#0a0a1a', border: '1px solid #1e1e38',
                                borderRadius: '8px', padding: '10px 14px', color: '#e0e0f0',
                                fontSize: '13px', fontFamily: "'DM Sans', sans-serif", outline: 'none', marginBottom: '16px'
                            }}
                        />

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => { setShowSkipModal(false); setSkipReason(''); setSkipJobId(null) }}
                                style={{
                                    flex: 1, background: 'transparent', border: '1px solid #1e1e38',
                                    color: '#444', padding: '10px', borderRadius: '8px',
                                    fontFamily: "'DM Mono', monospace", fontSize: '11px', cursor: 'pointer'
                                }}
                            >Cancel</button>

                            <button
                                onClick={async () => {
                                    if (!skipJobId) return
                                    await fetch('/api/feedback', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ jobId: skipJobId, action: 'skipped', reason: skipReason })
                                    })
                                    setJobs(prev => prev.map(j => j.id === skipJobId ? { ...j, status: 'skipped' } : j))
                                    if (selected?.id === skipJobId) { setSelected(null); setCoverLetter('') }
                                    setShowSkipModal(false)
                                    setSkipReason('')
                                    setSkipJobId(null)
                                }}
                                style={{
                                    flex: 2, background: '#ff6b6b18', border: '1px solid #ff6b6b40',
                                    color: '#ff6b6b', padding: '10px', borderRadius: '8px',
                                    fontFamily: "'DM Mono', monospace", fontSize: '11px', fontWeight: '700',
                                    cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' as const
                                }}
                            >Skip Job</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}