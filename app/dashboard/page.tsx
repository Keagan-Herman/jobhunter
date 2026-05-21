'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { JobCard } from '@/components/dashboard/JobCard'
import { SkeletonRow } from '@/components/dashboard/Skeleton'
import { DetailPanel } from '@/components/dashboard/DetailPanel'
import { SkipModal } from '@/components/dashboard/SkipModal'

import { Job, Profile } from '@/types'
import { User } from '@supabase/supabase-js'

export default function DashboardPage() {
    // ── State ────────────────────────────────────────────────────────
    const [jobs, setJobs] = useState<Job[]>([])
    const [selected, setSelected] = useState<Job | null>(null)
    const [loading, setLoading] = useState(true)
    const [scanning, setScanning] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [activeTab, setActiveTab] = useState<'pending' | 'applied' | 'interviewing' | 'skipped'>('pending')
    const [scanResult, setScanResult] = useState('')
    const [profile, setProfile] = useState<Profile | null>(null)
    const [error, setError] = useState('')
    const [firstTime, setFirstTime] = useState(false)

    // Skip modal
    const [showSkipModal, setShowSkipModal] = useState(false)
    const [skipJobId, setSkipJobId] = useState<string | null>(null)

    // Rescore
    const [rescoring, setRescoring] = useState(false)
    const [rescoreResult, setRescoreResult] = useState('')

    // Pagination
    const [page, setPage] = useState(1)
    const PAGE_SIZE = 15

    const supabase = useMemo(() => createClient(), [])
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
        } catch {
            setError('Failed to load jobs. Please refresh.')
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.search.includes('firstTime=true')) {
            setFirstTime(true)
        }
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) router.push('/login')
            else {
                supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
                    if (data) setProfile(data as Profile)
                })
            }
        })
        fetchJobs()
    }, [supabase, router, fetchJobs])

    // Auto-dismiss results
    useEffect(() => {
        if (scanResult) {
            const timer = setTimeout(() => setScanResult(''), 5000)
            return () => clearTimeout(timer)
        }
    }, [scanResult])

    useEffect(() => {
        if (rescoreResult) {
            const timer = setTimeout(() => setRescoreResult(''), 5000)
            return () => clearTimeout(timer)
        }
    }, [rescoreResult])

    // ── Handlers ──────────────────────────────────────────────────────
    const handleScan = async () => {
        setScanning(true)
        setScanResult('')
        try {
            const res = await fetch('/api/jobs')
            const data = await res.json()
            if (res.ok && data.success) {
                setScanResult(`✓ Found ${data.found} jobs, saved ${data.saved} new`)
                await fetchJobs()
            } else {
                setScanResult(`✗ ${data.error || 'Scan failed'}`)
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
                setRescoreResult(data.message || `✗ ${data.error || 'Rescore failed'}`)
            }
        } catch {
            setRescoreResult('✗ Rescore failed')
        }
        setRescoring(false)
    }

    const handleGenerateCoverLetter = async () => {
        if (!selected) return
        setGenerating(true)
        try {
            const res = await fetch('/api/cover-letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: selected.id })
            })
            const data = await res.json()
            if (data.success) {
                const updatedJob: Job = {
                    ...selected,
                    cover_letter: data.coverLetter.content,
                    cover_letter_id: data.coverLetter.id
                }
                setJobs(prev => prev.map(j => j.id === selected.id ? updatedJob : j))
                setSelected(updatedJob)
            }
        } catch {
            setError('Failed to generate cover letter.')
        }
        setGenerating(false)
    }

    const handleStatusUpdate = async (jobId: string, status: Job['status'], reason?: string) => {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j))
        if (selected?.id === jobId) setSelected(prev => prev ? { ...prev, status } : null)

        try {
            await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, action: status === 'skipped' ? 'skipped' : 'applied', reason })
            })
        } catch {
            await fetchJobs()
        }
    }

    const handleSaveTracking = async (trackingData: Partial<Job>) => {
        if (!selected) return
        const { error } = await supabase
            .from('jobs')
            .update({
                notes: trackingData.notes ?? null,
                interview_date: trackingData.interview_date ?? null,
                contact_name: trackingData.contact_name ?? null,
                contact_email: trackingData.contact_email ?? null,
                offer_amount: trackingData.offer_amount ?? null,
                follow_up_date: trackingData.follow_up_date ?? null,
            })
            .eq('id', selected.id)

        if (error) throw error

        setJobs(prev => prev.map(j => j.id === selected.id ? { ...j, ...trackingData } : j))
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
                ? { ...j, status: outcome === 'offer' ? 'interviewing' : 'skipped' } as Job
                : j
        ))
        setSelected(null)
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    // ── Derived state ─────────────────────────────────────────────────
    const filteredJobs = useMemo(() => jobs.filter(j => j.status === activeTab), [jobs, activeTab])
    const jobsToShow = useMemo(() => filteredJobs.slice(0, page * PAGE_SIZE), [filteredJobs, page])
    const hasMore = filteredJobs.length > page * PAGE_SIZE

    const stats = useMemo(() => ({
        pending: jobs.filter(j => j.status === 'pending').length,
        applied: jobs.filter(j => j.status === 'applied').length,
        interviewing: jobs.filter(j => j.status === 'interviewing').length,
        total: jobs.length
    }), [jobs])

    // ── Render ────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#080812] text-[#e0e0f0] font-sans selection:bg-[#00ff8720] selection:text-[#00ff87]">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-20"
                 style={{ backgroundImage: 'linear-gradient(#00ff8715 1px, transparent 1px), linear-gradient(90deg, #00ff8715 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="fixed -top-80 -right-80 w-[800px] h-[800px] rounded-full bg-radial-gradient from-[#00ff8708] to-transparent z-0 pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:px-8 space-y-10">

                {/* ── Header ── */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <h1 className="font-syne text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                            Job<span className="text-[#00ff87]">Hunter</span>
                        </h1>
                        <div className="flex items-center gap-2 bg-[#0d0d20] border border-[#1e1e38] rounded-full px-3 py-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse" />
                            <span className="text-[10px] text-[#00ff87] font-mono font-bold tracking-widest uppercase">Live</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <button onClick={handleScan} disabled={scanning}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-[11px] font-bold tracking-widest uppercase transition-all duration-200 shadow-[0_0_20px_-5px_#00ff8740]
                                ${scanning ? 'bg-[#0d0d20] border border-[#2a2a4a] text-[#00ff87] cursor-not-allowed' : 'bg-[#00ff87] text-[#0a0a1a] hover:brightness-110 active:translate-y-px'}`}>
                            {scanning ? (
                                <><span className="w-3 h-3 border-2 border-[#00ff87] border-t-transparent rounded-full animate-spin" /> Scanning...</>
                            ) : '▶ Scan Jobs'}
                        </button>

                        <button onClick={handleRescore} disabled={rescoring}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1e1e38] text-[#444] font-mono text-[11px] font-bold tracking-widest uppercase hover:bg-[#1a1a3a] hover:text-white transition-all disabled:opacity-50">
                            {rescoring ? (
                                <><span className="w-3 h-3 border-2 border-[#00ff87] border-t-transparent rounded-full animate-spin" /> Rescoring...</>
                            ) : '↻ Rescore'}
                        </button>

                        <button onClick={() => router.push('/profile')} className="px-4 py-2.5 rounded-xl border border-[#1e1e38] text-[#444] font-mono text-[11px] font-bold hover:bg-[#1a1a3a] hover:text-white transition-all">Profile</button>
                        <button onClick={handleSignOut} className="px-4 py-2.5 rounded-xl border border-[#1e1e38] text-[#444] font-mono text-[11px] font-bold hover:bg-[#1a1a3a] hover:text-white transition-all">Sign Out</button>
                    </div>
                </header>

                {/* Toasts & Alerts */}
                <div className="space-y-4">
                    {error && (
                        <div className="bg-[#ff6b6b10] border border-[#ff6b6b30] rounded-xl p-4 flex justify-between items-center animate-in slide-in-from-top-2">
                            <span className="text-[#ff6b6b] text-sm font-mono">{error}</span>
                            <button onClick={() => { setError(''); fetchJobs() }} className="text-[#ff6b6b] text-sm font-mono hover:underline">Retry &rarr;</button>
                        </div>
                    )}
                    {scanResult && (
                        <div className={`rounded-xl p-4 text-sm font-mono animate-in slide-in-from-top-2 ${scanResult.startsWith('✓') ? 'bg-[#00ff8710] border border-[#00ff8730] text-[#00ff87]' : 'bg-[#ff6b6b10] border border-[#ff6b6b30] text-[#ff6b6b]'}`}>
                            {scanResult}
                        </div>
                    )}
                    {rescoreResult && (
                        <div className={`rounded-xl p-4 text-sm font-mono animate-in slide-in-from-top-2 ${rescoreResult.startsWith('✓') ? 'bg-[#00ff8710] border border-[#00ff8730] text-[#00ff87]' : 'bg-[#ff6b6b10] border border-[#ff6b6b30] text-[#ff6b6b]'}`}>
                            {rescoreResult}
                        </div>
                    )}
                </div>

                {/* ── First time banner ── */}
                {firstTime && (
                    <div className="bg-[#00ff8710] border border-[#00ff8730] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_-10px_#00ff8720]">
                        <div>
                            <div className="font-syne font-bold text-lg text-[#00ff87] mb-1">🎉 You&apos;re all set!</div>
                            <div className="text-sm text-[#888]">Run your first scan to find jobs matching your profile</div>
                        </div>
                        <button onClick={() => { setFirstTime(false); handleScan() }}
                                className="bg-[#00ff87] text-[#0a0a1a] px-6 py-3 rounded-xl font-mono text-xs font-bold tracking-widest uppercase hover:brightness-110 transition-all shadow-lg shadow-[#00ff8730]">▶ Run First Scan</button>
                    </div>
                )}

                <StatsGrid stats={stats} />

                {/* ── Tabs & Content ── */}
                <div className="space-y-6">
                    <div className="flex gap-1 border-b border-[#1a1a32]">
                        {(['pending', 'applied', 'interviewing', 'skipped'] as const).map(tab => (
                            <button key={tab}
                                    onClick={() => { setActiveTab(tab); setPage(1) }}
                                    className={`px-6 py-4 font-mono text-[11px] font-bold tracking-[2px] uppercase transition-all relative
                                    ${activeTab === tab ? 'text-[#00ff87]' : 'text-[#444] hover:text-[#777]'}`}>
                                {tab} ({jobs.filter(j => j.status === tab).length})
                                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00ff87] shadow-[0_0_10px_#00ff87]" />}
                            </button>
                        ))}
                    </div>

                    <div className={`grid gap-8 ${selected ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>

                        {/* Job list container */}
                        <div className="bg-[#0d0d20] border border-[#1a1a32] rounded-2xl overflow-hidden h-fit shadow-2xl">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : filteredJobs.length === 0 ? (
                                <div className="py-24 text-center">
                                    <div className="text-5xl mb-6 opacity-20 filter grayscale">{activeTab === 'pending' ? '🔍' : activeTab === 'applied' ? '📨' : activeTab === 'interviewing' ? '🎯' : '🗑️'}</div>
                                    <div className="text-xs text-[#444] font-mono uppercase tracking-[3px]">
                                        {activeTab === 'pending' ? 'No pending jobs — run a scan!' : `No ${activeTab} jobs yet`}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="divide-y divide-[#0f0f22]">
                                        {jobsToShow.map((job, i) => (
                                            <JobCard
                                                key={job.id}
                                                job={job}
                                                isSelected={selected?.id === job.id}
                                                index={i}
                                                onClick={() => setSelected(job)}
                                            />
                                        ))}
                                    </div>

                                    {hasMore && (
                                        <div className="p-8 text-center border-t border-[#1a1a32] bg-[#0a0a1a]/50">
                                            <button onClick={() => setPage(p => p + 1)}
                                                    className="px-8 py-3 border border-[#2a2a4a] rounded-xl text-[#555] font-mono text-[11px] font-bold tracking-widest uppercase hover:bg-[#1a1a3a] hover:text-white transition-all">
                                                Load more ({filteredJobs.length - page * PAGE_SIZE} remaining)
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Detail Panel */}
                        {selected && (
                            <div className="relative">
                                <DetailPanel
                                    job={selected}
                                    country={profile?.country ?? undefined}
                                    generating={generating}
                                    onClose={() => setSelected(null)}
                                    onGenerateCoverLetter={handleGenerateCoverLetter}
                                    onStatusUpdate={(id, status) => {
                                        if (status === 'skipped') {
                                            setSkipJobId(id)
                                            setShowSkipModal(true)
                                        } else {
                                            handleStatusUpdate(id, status)
                                        }
                                    }}
                                    onInterviewOutcome={handleInterviewOutcome}
                                    onSaveTracking={handleSaveTracking}
                                    onCoverLetterOutcome={handleCoverLetterOutcome}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Skip Modal */}
            {showSkipModal && (
                <SkipModal
                    onClose={() => { setShowSkipModal(false); setSkipJobId(null) }}
                    onSkip={(reason) => {
                        if (skipJobId) handleStatusUpdate(skipJobId, 'skipped', reason)
                        setShowSkipModal(false)
                        setSkipJobId(null)
                    }}
                />
            )}
        </div>
    )
}
