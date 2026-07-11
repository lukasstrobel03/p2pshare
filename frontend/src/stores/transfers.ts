import { defineStore } from "pinia";

import { computed, ref } from 'vue'
import { rpc } from '@/api/rpc'
import type { Transfer } from '@/api/types'

const useTransfersStore = defineStore('transfers', () => {
  const transfers = ref<Transfer[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const active = computed(() => transfers.value.filter(t => t.status !== 'completed'))
  const completed = computed(() => transfers.value.filter(t => t.status === 'completed'))

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

  return { transfers, active, completed, loading, error, fetchTransfers }
})

export default useTransfersStore
    
