import { Job, Profile } from './index'

export interface AllJobsResponse {
    jobs: Job[]
    success: boolean
}

export interface ScanResponse {
    success: boolean
    found: number
    saved: number
    error?: string
}

export interface RescoreResponse {
    success: boolean
    rescored: number
    message?: string
    error?: string
}

export interface ProfileResponse {
    profile: Profile
    success: boolean
}

export interface FeedbackResponse {
    success: boolean
    error?: string
}

export interface UpdateJobResponse {
    success: boolean
    error?: string
}
