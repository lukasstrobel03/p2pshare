import { defineStore } from 'pinia'
import { ref } from 'vue'
import { rpcCall } from '@/api/rpc.ts'
import { waitForJob } from './jobPolling.ts'
import type {
  DownloadAsyncResult,
  DownloadResult,
  ListFilesResult,
  ListFilesResultEntry,
  PublishAsyncResult,
  PublishResult,
} from '@/api/types.ts'

export type TaskKind = 'publish' | 'download'
export type TaskStatus = 'running' | 'done' | 'error'

export interface Task {
  id: string
  kind: TaskKind
  label: string
  done: number
  total: number
  status: TaskStatus
  error?: string
}

export const useFilesStore = defineStore('files', () => {
  const files = ref<ListFilesResultEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  // Ongoing/finished publish+download operations, newest first. Shown as a
  // small progress panel, similar to Flood's active-transfer list.
  const tasks = ref<Task[]>([])

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      files.value = await rpcCall<ListFilesResult>('listFiles')
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  function addTask(kind: TaskKind, label: string): Task {
    const task: Task = { id: crypto.randomUUID(), kind, label, done: 0, total: 0, status: 'running' }
    tasks.value.unshift(task)
    return task
  }

  function dismissTask(id: string) {
    tasks.value = tasks.value.filter((t) => t.id !== id)
  }

  /** path is a filesystem path on the machine the node process runs on. */
  async function publish(path: string): Promise<PublishResult> {
    const label = path.split(/[/\\]/).pop() || path
    const task = addTask('publish', label)
    try {
      const start = await rpcCall<PublishAsyncResult>('publish', { path })
      const result = await waitForJob<PublishResult>(start.job_id, (p) => {
        task.done = p.done
        task.total = p.total
      })
      task.status = 'done'
      await refresh()
      return result
    } catch (e) {
      task.status = 'error'
      task.error = e instanceof Error ? e.message : String(e)
      throw e
    }
  }

  async function download(id: string, outdir: string): Promise<DownloadResult> {
    const task = addTask('download', `${id.slice(0, 12)}…`)
    try {
      const start = await rpcCall<DownloadAsyncResult>('downloadAsync', { id, outdir })
      const result = await waitForJob<DownloadResult>(start.job_id, (p) => {
        task.done = p.done
        task.total = p.total
      })
      task.status = 'done'
      await refresh()
      return result
    } catch (e) {
      task.status = 'error'
      task.error = e instanceof Error ? e.message : String(e)
      throw e
    }
  }

  return { files, loading, error, tasks, refresh, publish, download, dismissTask }
})
