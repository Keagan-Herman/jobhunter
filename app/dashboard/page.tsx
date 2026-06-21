'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { JobCard } from '@/components/dashboard/JobCard'
import { SkeletonRow } from '@/components/dashboard/Skeleton'
import { List } from 'react-window'
import { DetailPanel } from '@/components/dashboard/DetailPanel'
import { SkipModal } from '@/components/dashboard/SkipModal'
import { Notification, NotificationType } from '@/components/dashboard/Notification'

import { Job, Profile } from '@/types'
import { AllJobsResponse, ScanResponse, RescoreResponse, ProfileResponse } from '@/types/api'

export default function DashboardPage() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [selected, setSelected] = useState<Job | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [scanning, setScanning] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [rescoring, setRescoring] = useState(false)
    const [activeProcess, setActiveProcess] = useState<'scanning' | 'rescoring' | 'generating' | null>(null)
    const [activeTab, setActiveTab] = useState<'pending' | 'applied' | 'interviewing' | 'skipped'>('pending')
    const [profile, setProfile] = useState<Profile | null>(null)
    const [firstTime, setFirstTime] = useState(false)

    const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null)

    const handleCloseNotification = useCallback(() => {
        setNotification(null)
    }, [])

    const [showSkipModal, setShowSkipModal] = useState(false)
    const [skipJobId, setSkipJobId] = useState<string | null>(null)

    const [listHeight, setListHeight] = useState(600)
    const [rowHeight, setRowHeight] = useState(240)

    const [focusedJobIndex, setFocusedJobIndex] = useState(-1)
    const focusedJobIndexRef = useRef(-1)
    const filteredJobsRef = useRef<Job[]>([])
    const selectedRef = useRef<Job | null>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    const router = useRouter()

    const fetchJobs = useCallback(async () => {
        try {
            const res = await fetch('/api/jobs/all')
            const data = await res.json() as AllJobsResponse
            if (data.jobs) setJobs(data.jobs)
        } catch {
            setNotification({ message: 'Failed to load jobs. Please refresh.', type: 'error' })
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchProfile = useCallback(async () => {
        try {
            const res = await fetch('/api/profile')
            const data = await res.json() as ProfileResponse
            if (data.profile) setProfile(data.profile)
        } catch {
            console.error('Failed to load profile')
        }
    }, [])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (window.location.search.includes('firstTime=true')) {
                setFirstTime(true)
            }
            const handleResize = () => {
                const offset = window.innerWidth >= 1024 ? 420 : 500
                setListHeight(Math.max(300, window.innerHeight - offset))
                setRowHeight(window.innerWidth < 640 ? 290 : 240)
            }
            handleResize()
            window.addEventListener('resize', handleResize)
            return () => window.removeEventListener('resize', handleResize)
        }
    }, [])

    useEffect(() => {
        fetchProfile()
        fetchJobs()
    }, [fetchProfile, fetchJobs])

    useEffect(() => {
        setFocusedJobIndex(-1)
        focusedJobIndexRef.current = -1
    }, [activeTab, searchQuery])

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA') return

            const list = filteredJobsRef.current
            const idx = focusedJobIndexRef.current

            if (e.key === 'j' || e.key === 'ArrowDown') {
                e.preventDefault()
                const next = Math.min(idx + 1, list.length - 1)
                focusedJobIndexRef.current = next
                setFocusedJobIndex(next)
            } else if (e.key === 'k' || e.key === 'ArrowUp') {
                e.preventDefault()
                const prev = Math.max(idx - 1, 0)
                focusedJobIndexRef.current = prev
                setFocusedJobIndex(prev)
            } else if (e.key === 'Enter' && idx >= 0 && idx < list.length) {
                e.preventDefault()
                setSelected(list[idx])
            } else if (e.key === 'Escape') {
                if (selectedRef.current) {
                    e.preventDefault()
                    setSelected(null)
                }
            } else if (e.key === '/') {
                e.preventDefault()
                searchInputRef.current?.focus()
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleScan = async () => {
        setScanning(true)
        setActiveProcess('scanning')
        setNotification(null)
        try {
            const res = await fetch('/api/jobs')
            const data = await res.json() as ScanResponse
            if (res.ok && data.success) {
                setNotification({
                    message: `Found ${data.found} jobs, saved ${data.saved} new`,
                    type: 'success'
                })
                await fetchJobs()
            } else {
                setNotification({ message: data.error || 'Scan failed', type: 'error' })
            }
        } catch (err) {
            setNotification({ message: err instanceof Error ? err.message : 'Scan failed', type: 'error' })
        } finally {
            setScanning(false)
            setActiveProcess(null)
        }
    }

    const handleRescore = async () => {
        setRescoring(true)
        setActiveProcess('rescoring')
        setNotification(null)
        try {
            const res = await fetch('/api/rescore', { method: 'POST' })
            const data = await res.json() as RescoreResponse
            if (data.success) {
                setNotification({
                    message: `Rescored ${data.rescored} jobs`,
                    type: 'success'
                })
                await fetchJobs()
            } else {
                setNotification({ message: data.message || data.error || 'Rescore failed', type: 'error' })
            }
        } catch (err) {
            setNotification({ message: err instanceof Error ? err.message : 'Rescore failed', type: 'error' })
        } finally {
            setRescoring(false)
            setActiveProcess(null)
        }
    }

    const handleGenerateCoverLetter = async (content: string) => {
        if (!selected) return

        try {
            if (!content) {
                setGenerating(true)
                setActiveProcess('generating')
                return
            }

            const updatedJob: Job = {
                ...selected,
                cover_letter: content
            }
            setJobs(prev => prev.map(j => j.id === selected.id ? updatedJob : j))
            setSelected(updatedJob)
        } catch (err) {
            setNotification({
                message: err instanceof Error ? err.message : 'Failed to update cover letter.',
                type: 'error'
            })
        } finally {
            if (content) {
                setGenerating(false)
                setActiveProcess(null)
            }
        }
    }

    const handleStatusUpdate = async (jobId: string, status: Job['status'], reason?: string) => {
        setJobs((prev: Job[]) => prev.map(j => j.id === jobId ? { ...j, status } : j))
        if (selected?.id === jobId) setSelected((prev: Job | null) => prev ? { ...prev, status } : null)

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, action: status === 'skipped' ? 'skipped' : 'applied', reason })
            })
            if (!res.ok) throw new Error('Failed to update status')
        } catch (err) {
            setNotification({
                message: err instanceof Error ? err.message : 'Failed to update status',
                type: 'error'
            })
            await fetchJobs()
        }
    }

    const handleSaveTracking = async (trackingData: {
        notes: string;
        interview_date: string;
        contact_name: string;
        contact_email: string;
        offer_amount: number;
        follow_up_date: string;
    }) => {
        if (!selected) return

        try {
            const res = await fetch('/api/jobs/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selected.id,
                    notes: trackingData.notes ?? null,
                    interview_date: trackingData.interview_date ?? null,
                    contact_name: trackingData.contact_name ?? null,
                    contact_email: trackingData.contact_email ?? null,
                    offer_amount: trackingData.offer_amount ?? null,
                    follow_up_date: trackingData.follow_up_date ?? null,
                })
            })

            if (!res.ok) throw new Error('Failed to update job')

            setJobs(prev => prev.map(j => j.id === selected.id ? { ...j, ...trackingData } : j))
            setSelected(prev => prev ? { ...prev, ...trackingData } : null)
        } catch (err) {
            throw err
        }
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

    const filteredJobs: Job[] = jobs.filter(j => {
        const matchesTab = j.status === activeTab
        if (!matchesTab) return false

        if (!searchQuery) return true

        const q = searchQuery.toLowerCase()
        return (
            j.title.toLowerCase().includes(q) ||
            j.company.toLowerCase().includes(q) ||
            (j.stack || []).some(s => s.toLowerCase().includes(q))
        )
    })

    const stats: { pending: number; applied: number; interviewing: number; total: number } = {
        pending: jobs.filter(j => j.status === 'pending').length,
        applied: jobs.filter(j => j.status === 'applied').length,
        interviewing: jobs.filter(j => j.status === 'interviewing').length,
        total: jobs.length
    }

    // Keep refs in sync with latest render values so the keyboard handler (stable [] deps) stays current
    filteredJobsRef.current = filteredJobs
    selectedRef.current = selected
    focusedJobIndexRef.current = focusedJobIndex

    return (
        <div className="min-h-screen bg-surface-2 text-ink font-sans selection:bg-[#c5a05920] selection:text-[#1a1a1a]">
            {/* Background Grid & Organic Accents */}
            <div className="fixed inset-0 z-0 pointer-events-none grid-overlay opacity-30" />
            <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 100% 0%, rgba(197,160,89,0.06) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(43,103,119,0.06) 0%, transparent 70%)' }} />

            <div role="status" aria-live="polite" className="sr-only">{notification?.message}</div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:px-8 space-y-12">
                <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-wrap items-center gap-6 min-h-[48px]">
                        <h1 className="font-syne text-4xl font-bold tracking-tight text-[#1a1a1a] flex items-center gap-1">
                            Job<span className="text-[#c5a059] italic">Hunter</span>
                        </h1>

                        <div className="h-8 w-px bg-[#e2e2d9] hidden md:block" />

                        <div className="flex items-center gap-3">
                            {activeProcess && (
                                <div className="flex items-center gap-3 matte-surface border-[#d1d1ca] px-4 py-2 rounded-sm shadow-sm animate-in fade-in duration-500">
                                    <div className="w-2.5 h-2.5 bg-[#c5a059] animate-pulse" />
                                    <span className="text-[10px] text-[#4a4a4a] font-mono font-bold tracking-[2px] uppercase">
                                        {activeProcess === 'scanning' ? 'Scanning Sources' : activeProcess === 'rescoring' ? 'Recalibrating' : 'Processing Content'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-4">
                            <button onClick={handleScan} disabled={scanning}
                                    className={"group relative px-8 py-3 rounded-sm font-mono text-[11px] font-bold tracking-[2px] uppercase transition-all duration-300 shadow-sm " + (scanning ? 'bg-[#f0f0eb] text-[#666] cursor-not-allowed' : 'bg-[#1a1a1a] text-[#f8f8f4] hover:bg-[#c5a059] active:scale-95')}>
                                {scanning ? 'Processing...' : 'Scan Sources'}
                            </button>

                            <button onClick={handleRescore} disabled={rescoring}
                                    className="px-6 py-3 rounded-sm border border-[#e2e2d9] bg-white text-[#4a4a4a] font-mono text-[11px] font-bold tracking-[2px] uppercase hover:bg-[#f8f8f4] transition-all disabled:opacity-50 active:scale-95 tactile-pop">
                                {rescoring ? 'Calibrating...' : 'Recalibrate'}
                            </button>
                        </div>

                        <div className="h-8 w-px bg-[#e2e2d9] hidden sm:block" />

                        <button onClick={() => router.push('/profile')} className="px-6 py-3 rounded-sm bg-[#f0f0eb] border border-[#d1d1ca] text-[#4a4a4a] font-mono text-[11px] font-bold tracking-[1px] hover:bg-[#e2e2d9] transition-all active:scale-95">Settings</button>
                    </div>
                </header>

                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={handleCloseNotification}
                    />
                )}

                {firstTime && (
                    <div className="matte-surface border-[#c5a059]/30 rounded-sm p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-md">
                        <div>
                            <div className="font-syne font-bold text-lg text-[#1a1a1a] mb-2 tracking-tight">Configuration Complete</div>
                            <div className="text-xs text-[#666] font-sans">Initialize your first automated job search to begin.</div>
                        </div>
                        <button onClick={() => { setFirstTime(false); handleScan() }}
                                className="bg-[#1a1a1a] text-[#f8f8f4] px-8 py-4 rounded-sm font-mono text-xs font-bold tracking-[2px] uppercase hover:bg-[#c5a059] transition-all shadow-lg">Begin Analysis</button>
                    </div>
                )}

                <StatsGrid stats={stats} />

                {/* 2-column on desktop when a job is selected; single column otherwise */}
                <div className={selected ? 'lg:flex lg:items-start lg:gap-0' : ''}>

                    {/* Left column: tabs + search + job list */}
                    <div className={`space-y-8 ${selected ? 'lg:w-[400px] lg:shrink-0' : ''}`}>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#e2e2d9] pb-px">
                            <div role="tablist" className="flex flex-wrap gap-6 md:gap-8 overflow-x-auto scrollbar-hide">
                            {(['pending', 'applied', 'interviewing', 'skipped'] as const).map(tab => (
                                <button key={tab}
                                        role="tab"
                                        aria-selected={activeTab === tab}
                                        onClick={() => { setActiveTab(tab) }}
                                        className={"pb-5 min-h-[44px] font-sans text-[12px] font-medium tracking-[0.5px] uppercase transition-all relative shrink-0 " + (activeTab === tab ? 'text-[#1a1a1a]' : 'text-[#666] hover:text-[#444]')}>
                                    {tab} <span className={"ml-2 px-1.5 py-0.5 rounded-sm text-[9px] " + (activeTab === tab ? 'bg-[#1a1a1a] text-[#f8f8f4]' : 'bg-[#e2e2d9] text-[#666]')}>{jobs.filter(j => j.status === tab).length}</span>
                                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#c5a059]" />}
                                </button>
                            ))}
                            </div>

                            <div className="pb-4 w-full md:w-56">
                                <div className="relative">
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        aria-label="Search jobs"
                                        placeholder="Search jobs..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-transparent border-none outline-none font-sans text-[13px] text-[#1a1a1a] placeholder:text-[#555]"
                                    />
                                    <div className="absolute -bottom-1 left-0 right-0 h-px bg-[#e2e2d9]" />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-0 top-0 text-[#ccc] hover:text-[#1a1a1a] transition-colors"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-sm overflow-hidden h-[calc(100vh-380px)] min-h-[300px] max-h-[calc(100vh-8rem)] flex flex-col relative tactile-pop">
                            {loading ? (
                                <div className="overflow-hidden flex-1">
                                    {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                                </div>
                            ) : filteredJobs.length === 0 ? (
                                <div className="py-24 text-center flex-1 flex flex-col items-center justify-center px-12 animate-in fade-in duration-700">
                                    <div className="relative mb-8" aria-hidden="true">
                                        <div className="w-20 h-20 bg-[#f0f0eb] border border-[#d1d1ca] flex items-center justify-center text-3xl grayscale opacity-40">
                                            {activeTab === 'pending' ? '🔍' : activeTab === 'applied' ? '✉️' : activeTab === 'interviewing' ? '🤝' : '⏭️'}
                                        </div>
                                    </div>
                                    <h3 className="font-syne font-bold text-xl text-[#1a1a1a] mb-4 tracking-tight">No {activeTab} records</h3>
                                    <p className="text-sm text-[#666] font-sans mb-12 max-w-xs leading-relaxed">
                                        {activeTab === 'pending'
                                            ? 'Initiate a job search scan to identify matching opportunities.'
                                            : "No items found in " + activeTab + "."}
                                    </p>
                                    {activeTab === 'pending' && (
                                        <button onClick={handleScan} className="bg-[#1a1a1a] text-[#f8f8f4] px-10 py-4 rounded-sm font-mono text-[11px] font-bold uppercase tracking-[3px] hover:bg-[#c5a059] transition-all shadow-md">
                                            Scan Now
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1">
                                        <List
                                            key={`${activeTab}-${filteredJobs.length}`}
                                            rowCount={filteredJobs.length}
                                            rowHeight={rowHeight}
                                            className="scrollbar-hide"
                                            style={{ height: listHeight, width: '100%' }}
                                            rowProps={{}}
                                            rowComponent={({ index, style }) => (
                                                <div style={style}>
                                                    <JobCard
                                                        job={filteredJobs[index]}
                                                        isSelected={selected?.id === filteredJobs[index].id}
                                                        isFocused={focusedJobIndex === index}
                                                        index={index}
                                                        onClick={() => setSelected(filteredJobs[index])}
                                                    />
                                                </div>
                                            )}
                                        />
                                    </div>
                                    <div className="shrink-0 border-t border-[#e2e2d9] px-6 py-3 flex items-center gap-5 bg-[#f8f8f4]" aria-hidden="true">
                                        {[['J/K', 'navigate'], ['↵', 'open'], ['/', 'search'], ['Esc', 'close']].map(([key, label]) => (
                                            <span key={key} className="flex items-center gap-1.5 text-[10px] text-[#666] font-mono">
                                                <kbd className="px-1.5 py-0.5 bg-white border border-[#e2e2d9] text-[10px] font-mono text-[#4a4a4a]">{key}</kbd>
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right column: detail panel sidebar (desktop only) */}
                    {selected && (
                        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:min-h-[400px] lg:overflow-hidden lg:border-l lg:border-[#e2e2d9]">
                            <DetailPanel
                                job={selected}
                                mode="sidebar"
                                country={profile?.country ?? undefined}
                                userSkills={profile?.skills ?? []}
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

                {/* Mobile: bottom sheet (hidden on desktop) */}
                {selected && (
                    <div className="lg:hidden">
                        <DetailPanel
                            job={selected}
                            mode="sheet"
                            country={profile?.country ?? undefined}
                            userSkills={profile?.skills ?? []}
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
