import { defineStore } from 'pinia'
import { ref } from 'vue'
import { rpc } from '@/api/rpc'
import type { FileInfo, PublishResult } from '@/api/types'

const useFilesStore = defineStore('files', () => {
  const files = ref<FileInfo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const publishing = ref(false)
  const publishError = ref<string | null>(null)
  const publishResult = ref<PublishResult | null>(null)

  async function fetchFiles() {
    loading.value = true
    error.value = null
    try {
      files.value = await rpc.listFiles()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unbekannter Fehler'
    } finally {
      loading.value = false
    }
  }

  async function publishFile(path: string) {
    publishing.value = true
    publishError.value = null
    publishResult.value = null
    try {
      publishResult.value = await rpc.publish(path)
      await fetchFiles()
    } catch (e) {
      publishError.value = e instanceof Error ? e.message : 'Unbekannter Fehler'
    } finally {
      publishing.value = false
    }
  }

  return {
    files, loading, error, fetchFiles,
    publishing, publishError, publishResult, publishFile,
  }
})

export default useFilesStore