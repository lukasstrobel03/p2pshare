import { defineStore } from 'pinia'
import { ref } from 'vue'
import { rpc } from '@/api/rpc'
import type { NetworkStatus, Peer } from '@/api/types'

const useNetworkStore = defineStore('network', () => {
  const status = ref<NetworkStatus | null>(null)
  const peers = ref<Peer[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const addingPeer = ref(false)
  const addPeerError = ref<string | null>(null)
  const addPeerSuccess = ref(false)

  async function fetchNetwork() {
    loading.value = true
    error.value = null
    try {
      const [statusResult, peersResult] = await Promise.all([rpc.status(), rpc.peers()])
      status.value = statusResult
      peers.value = peersResult
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unbekannter Fehler'
    } finally {
      loading.value = false
    }
  }

  async function addPeer(peer: Peer) {
    addingPeer.value = true
    addPeerError.value = null
    addPeerSuccess.value = false
    try {
      await rpc.bootstrap(peer)
      addPeerSuccess.value = true
      await fetchNetwork()
    } catch (e) {
      addPeerError.value = e instanceof Error ? e.message : 'Unbekannter Fehler'
    } finally {
      addingPeer.value = false
    }
  }

  return {
    status, peers, loading, error, fetchNetwork,
    addingPeer, addPeerError, addPeerSuccess, addPeer,
  }
})

export default useNetworkStore
