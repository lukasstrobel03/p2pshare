import { defineStore } from 'pinia'
import { ref } from 'vue'
import { rpc } from '@/api/rpc'
import type { FileInfo } from '@/api/types'

const useFilesStore = defineStore('files', () => {
  const files = ref<FileInfo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

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

  return { files, loading, error, fetchFiles }
})

export default useFilesStore