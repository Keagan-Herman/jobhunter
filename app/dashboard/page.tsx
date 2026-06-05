'use client'

import { useState, useEffect, useCallback } from 'react'
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

    return (
        <div className="min-h-screen bg-[#f8f8f4] text-[#1a1a1a] font-sans selection:bg-[#c5a05920] selection:text-[#1a1a1a]">
            {/* Background Grid & Organic Accents */}
            <div className="fixed inset-0 z-0 pointer-events-none grid-overlay opacity-30" />
            <div className="fixed top-[-10rem] right-[-10rem] w-[40rem] h-[40rem] rounded-full bg-[#c5a059]/5 blur-[120px] animate-organic z-0 pointer-events-none" />
            <div className="fixed bottom-[-10rem] left-[-10rem] w-[45rem] h-[45rem] rounded-full bg-[#2b6777]/5 blur-[150px] animate-organic z-0 pointer-events-none" style={{ animationDelay: '5s' }} />

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:px-8 space-y-12">
                <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-wrap items-center gap-6">
                        <h1 className="font-syne text-4xl font-bold tracking-tight text-[#1a1a1a] flex items-center gap-1">
                            Job<span className="text-[#c5a059] italic">Hunter</span>
                        </h1>

                        <div className="h-8 w-px bg-[#e2e2d9] hidden md:block" />

                        {activeProcess && (
                            <div className="flex items-center gap-3 matte-surface border-[#d1d1ca] px-4 py-2 rounded-sm shadow-sm animate-in fade-in duration-500">
                                <div className="w-2.5 h-2.5 bg-[#c5a059] animate-pulse" />
                                <span className="text-[10px] text-[#4a4a4a] font-mono font-bold tracking-[2px] uppercase">
                                    {activeProcess === 'scanning' ? 'Scanning Sources' : activeProcess === 'rescoring' ? 'Recalibrating' : 'Processing Content'}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        <button onClick={handleScan} disabled={scanning}
                                className={"group relative px-8 py-3 rounded-sm font-mono text-[11px] font-bold tracking-[2px] uppercase transition-all duration-300 shadow-sm " + (scanning ? 'bg-[#f0f0eb] text-[#888] cursor-not-allowed' : 'bg-[#1a1a1a] text-[#f8f8f4] hover:bg-[#c5a059] active:scale-95')}>
                            {scanning ? 'Processing...' : 'Scan Sources'}
                        </button>

                        <button onClick={handleRescore} disabled={rescoring}
                                className="px-6 py-3 rounded-sm border border-[#e2e2d9] bg-white text-[#4a4a4a] font-mono text-[11px] font-bold tracking-[2px] uppercase hover:bg-[#f8f8f4] transition-all disabled:opacity-50 active:scale-95 tactile-pop">
                            {rescoring ? 'Calibrating...' : 'Recalibrate'}
                        </button>

                        <div className="h-8 w-px bg-[#e2e2d9] mx-2" />

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
                            <div className="font-syne font-bold text-lg text-[#1a1a1a] mb-2 uppercase tracking-tight">Configuration Complete</div>
                            <div className="text-xs text-[#666] font-sans">Initialize your first automated job search to begin.</div>
                        </div>
                        <button onClick={() => { setFirstTime(false); handleScan() }}
                                className="bg-[#1a1a1a] text-[#f8f8f4] px-8 py-4 rounded-sm font-mono text-xs font-bold tracking-[2px] uppercase hover:bg-[#c5a059] transition-all shadow-lg">Begin Analysis</button>
                    </div>
                )}

                <StatsGrid stats={stats} />

                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#e2e2d9] pb-px">
                        <div className="flex flex-wrap gap-8 overflow-x-auto scrollbar-hide">
                        {(['pending', 'applied', 'interviewing', 'skipped'] as const).map(tab => (
                            <button key={tab}
                                    onClick={() => { setActiveTab(tab) }}
                                    className={"pb-5 font-mono text-[10px] font-bold tracking-[3px] uppercase transition-all relative shrink-0 " + (activeTab === tab ? 'text-[#1a1a1a]' : 'text-[#888] hover:text-[#444]')}>
                                {tab} <span className={"ml-2 px-1.5 py-0.5 rounded-sm text-[9px] " + (activeTab === tab ? 'bg-[#1a1a1a] text-[#f8f8f4]' : 'bg-[#e2e2d9] text-[#888]')}>{jobs.filter(j => j.status === tab).length}</span>
                                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#c5a059]" />}
                            </button>
                        ))}
                        </div>

                        <div className="pb-4 w-full md:w-64">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="SEARCH ARCHIVE..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none font-mono text-[10px] font-bold tracking-[2px] text-[#1a1a1a] placeholder:text-[#ccc] uppercase"
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

                    <div className="bg-white border border-[#e2e2d9] rounded-sm overflow-hidden h-[calc(100vh-380px)] shadow-sm flex flex-col relative tactile-pop">
                        {loading ? (
                            <div className="overflow-hidden flex-1">
                                {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                            </div>
                        ) : filteredJobs.length === 0 ? (
                            <div className="py-24 text-center flex-1 flex flex-col items-center justify-center px-12 animate-in fade-in duration-700">
                                <div className="relative mb-8">
                                    <div className="w-20 h-20 bg-[#f0f0eb] border border-[#d1d1ca] flex items-center justify-center text-3xl grayscale opacity-40">
                                        {activeTab === 'pending' ? '🔍' : activeTab === 'applied' ? '✉️' : activeTab === 'interviewing' ? '🤝' : '⏭️'}
                                    </div>
                                </div>
                                <h3 className="font-syne font-bold text-xl text-[#1a1a1a] mb-4 tracking-tight uppercase">No {activeTab} Records</h3>
                                <p className="text-[10px] text-[#888] font-mono uppercase tracking-[3px] mb-12 max-w-xs leading-relaxed font-bold">
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
                            <div className="flex-1">
                                <List
                                    key={`${activeTab}-${filteredJobs.length}`}
                                    rowCount={filteredJobs.length}
                                    rowHeight={240}
                                    className="scrollbar-hide"
                                    style={{ height: listHeight, width: '100%' }}
                                    rowProps={{}}
                                    rowComponent={({ index, style }) => (
                                        <div style={style}>
                                            <JobCard
                                                job={filteredJobs[index]}
                                                isSelected={selected?.id === filteredJobs[index].id}
                                                index={index}
                                                onClick={() => setSelected(filteredJobs[index])}
                                            />
                                        </div>
                                    )}
                                />
                            </div>
                        )}
                    </div>

                    {selected && (
                        <DetailPanel
                            job={selected}
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
                    )}
                </div>
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
