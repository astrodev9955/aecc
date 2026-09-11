import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './Auth'
import type { Project, Receipt } from '../types'
import {
  createProject as apiCreateProject,
  createReceipt,
  deleteProject as apiDeleteProject,
  deleteReceipt,
  listProjects,
  revokeProjectShare,
  shareProject,
  updateProject as apiUpdateProject,
  updateReceipt as apiUpdateReceipt,
} from '../lib/api'

const ACTIVE_KEY = 'circular.activeProjectId'

interface WorkspaceValue {
  ready: boolean
  error: string | null
  project: Project | null
  projects: Project[]
  refresh: () => Promise<void>
  switchProject: (id: string) => void
  createProject: (input: Omit<Project, 'id' | 'receipts' | 'createdAt'>) => Promise<Project>
  updateProject: (patch: Partial<Omit<Project, 'id' | 'receipts'>>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  addReceipt: (receipt: Receipt) => Promise<void>
  updateReceipt: (receipt: Receipt) => Promise<void>
  removeReceipt: (id: string) => Promise<void>
  sharePassport: (rotate?: boolean) => Promise<{ url: string }>
  revokeShare: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { refresh: refreshUser } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [activeId, setActiveId] = useState<string | null>(() => localStorage.getItem(ACTIVE_KEY))
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await listProjects()
      setProjects(data.projects)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load projects')
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const project = projects.find((item) => item.id === activeId) ?? projects[0] ?? null

  useEffect(() => {
    if (project) localStorage.setItem(ACTIVE_KEY, project.id)
  }, [project])

  const value: WorkspaceValue = {
    ready,
    error,
    project,
    projects,
    refresh,
    switchProject: (id) => setActiveId(id),
    createProject: async (input) => {
      const data = await apiCreateProject(input)
      setProjects((current) => [data.project, ...current.filter((item) => item.id !== data.project.id)])
      setActiveId(data.project.id)
      void refreshUser()
      return data.project
    },
    updateProject: async (patch) => {
      if (!project) return
      const data = await apiUpdateProject(project.id, patch)
      setProjects((current) => current.map((item) => (item.id === data.project.id ? data.project : item)))
    },
    deleteProject: async (id) => {
      await apiDeleteProject(id)
      const next = projects.filter((item) => item.id !== id)
      setProjects(next)
      if (activeId === id) setActiveId(next[0]?.id ?? null)
      void refreshUser()
    },
    addReceipt: async (receipt) => {
      if (!project) return
      const data = await createReceipt(project.id, receipt)
      setProjects((current) => current.map((item) => (item.id === data.project.id ? data.project : item)))
      void refreshUser()
    },
    updateReceipt: async (receipt) => {
      const data = await apiUpdateReceipt(receipt.id, receipt)
      setProjects((current) => current.map((item) => (item.id === data.project.id ? data.project : item)))
    },
    removeReceipt: async (id) => {
      const data = await deleteReceipt(id)
      setProjects((current) => current.map((item) => (item.id === data.project.id ? data.project : item)))
      void refreshUser()
    },
    sharePassport: async (rotate = false) => {
      if (!project) return { url: '' }
      const data = await shareProject(project.id, rotate)
      setProjects((current) => current.map((item) => (item.id === data.project.id ? data.project : item)))
      return { url: data.url }
    },
    revokeShare: async () => {
      if (!project) return
      const data = await revokeProjectShare(project.id)
      setProjects((current) => current.map((item) => (item.id === data.project.id ? data.project : item)))
    },
  }

  return <WorkspaceContext value={value}>{children}</WorkspaceContext>
}

export function useWorkspace(): WorkspaceValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return ctx
}
