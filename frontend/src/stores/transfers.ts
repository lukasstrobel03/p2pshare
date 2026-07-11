import { defineStore } from "pinia";

import { computed, ref } from 'vue'
import { rpc } from '@/api/rpc'
import type { DownloadResult, Transfer } from '@/api/types'

const useTransfersStore = defineStore('transfers', () => {
  const transfers = ref<Transfer[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const active = computed(() => transfers.value.filter(t => t.status !== 'completed'))
  const completed = computed(() => transfers.value.filter(t => t.status === 'completed'))

  const downloading = ref(false)
  const downloadError = ref<string | null>(null)
  const downloadResult = ref<DownloadResult | null>(null)

  async function fetchTransfers() {
    loading.value = true
    error.value = null
    try {
      transfers.value = await rpc.listTransfers()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unbekannter Fehler'
    } finally {
      loading.value = false
    }
  }

  async function startDownload(id: string, outdir: string) {
    downloading.value = true
    downloadError.value = null
    downloadResult.value = null
    try {
      downloadResult.value = await rpc.download(id, outdir)
      await fetchTransfers()
    } catch (e) {
      downloadError.value = e instanceof Error ? e.message : 'Unbekannter Fehler'
    } finally {
      downloading.value = false
    }
  }

  return {
    transfers, active, completed, loading, error, fetchTransfers,
    downloading, downloadError, downloadResult, startDownload,
  }
})

export default useTransfersStore
    
