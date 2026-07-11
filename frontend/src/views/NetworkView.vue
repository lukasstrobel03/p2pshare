<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import useFilesStore from '@/stores/files'
import useTransfersStore from '@/stores/transfers'
import useNetworkStore from '@/stores/network'
import type { Transfer } from '@/api/types'

const filesStore = useFilesStore()
const transfersStore = useTransfersStore()
const networkStore = useNetworkStore()

onMounted(() => {
  filesStore.fetchFiles()
  transfersStore.fetchTransfers()
  networkStore.fetchNetwork()
})

function refreshAll() {
  filesStore.fetchFiles()
  transfersStore.fetchTransfers()
  networkStore.fetchNetwork()
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// Summiert Geschwindigkeiten wie "860 KB/s" / "1.2 MB/s" für eine Transfer-Richtung.
function totalSpeed(transfers: Transfer[], direction: Transfer['direction']): string {
  const totalKb = transfers
    .filter(t => t.direction === direction && t.status === 'active' && t.speed)
    .reduce((sum, t) => {
      const match = t.speed!.match(/([\d.]+)\s*(KB|MB)\/s/)
      if (!match) return sum
      const value = parseFloat(match[1] ?? '0')
      return sum + (match[2] === 'MB' ? value * 1024 : value)
    }, 0)

  if (totalKb === 0) return '0 KB/s'
  return totalKb >= 1024 ? `${(totalKb / 1024).toFixed(1)} MB/s` : `${totalKb.toFixed(0)} KB/s`
}

const downloadSpeed = computed(() => totalSpeed(transfersStore.transfers, 'download'))
const uploadSpeed = computed(() => totalSpeed(transfersStore.transfers, 'upload'))
const activeDownloads = computed(() =>
  transfersStore.transfers.filter(t => t.direction === 'download' && t.status !== 'completed'),
)

const anyError = computed(
  () => filesStore.error || transfersStore.error || networkStore.error,
)

const bootstrapForm = ref()
const peerId = ref('')
const peerAddr = ref('')
const requiredRule = [(v: string) => !!v || 'Pflichtfeld']

async function onAddPeer() {
  const { valid } = await bootstrapForm.value.validate()
  if (!valid) return
  await networkStore.addPeer({ id: peerId.value, addr: peerAddr.value })
  if (!networkStore.addPeerError) {
    peerId.value = ''
    peerAddr.value = ''
  }
}
</script>

<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-4">
      <h2 class="text-h5">Netzwerk</h2>
      <v-btn icon="mdi-refresh" variant="text" @click="refreshAll" />
    </div>

    <v-alert v-if="anyError" type="error" class="mb-4">
      {{ anyError }}
    </v-alert>

    <v-row class="mb-2">
      <v-col cols="12" sm="4">
        <v-card class="pa-4">
          <div class="text-caption text-medium-emphasis">Peers im Netzwerk</div>
          <div class="text-h5 d-flex align-center">
            <v-icon icon="mdi-lan" class="mr-2" color="primary" />
            {{ networkStore.status?.peers ?? networkStore.peers.length }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card class="pa-4">
          <div class="text-caption text-medium-emphasis">Download-Geschwindigkeit</div>
          <div class="text-h5 d-flex align-center">
            <v-icon icon="mdi-download" class="mr-2" color="primary" />
            {{ downloadSpeed }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card class="pa-4">
          <div class="text-caption text-medium-emphasis">Upload-Geschwindigkeit</div>
          <div class="text-h5 d-flex align-center">
            <v-icon icon="mdi-upload" class="mr-2" color="success" />
            {{ uploadSpeed }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mb-4">
      <v-card-title>Verbundene Peers</v-card-title>
      <v-list :loading="networkStore.loading">
        <v-list-item v-if="networkStore.peers.length === 0" title="Keine Peers verbunden" />
        <v-list-item
          v-for="peer in networkStore.peers"
          :key="peer.id"
          :title="peer.addr"
          :subtitle="peer.id"
        >
          <template #prepend>
            <v-icon icon="mdi-server-network" />
          </template>
        </v-list-item>
      </v-list>

      <v-divider />

      <v-card-text>
        <v-form ref="bootstrapForm" @submit.prevent="onAddPeer">
          <v-row dense>
            <v-col cols="12" sm="5">
              <v-text-field
                v-model="peerId"
                label="Peer-ID"
                placeholder="06ba16f807e192bc0cc9b000aa7ea51c37a01c01b01e228806f468b525488393"
                :rules="requiredRule"
                :disabled="networkStore.addingPeer"
              />
            </v-col>
            <v-col cols="12" sm="5">
              <v-text-field
                v-model="peerAddr"
                label="Adresse (IP:Port)"
                placeholder="1.1.1.1:2222"
                :rules="requiredRule"
                :disabled="networkStore.addingPeer"
              />
            </v-col>
            <v-col cols="12" sm="2" class="d-flex align-center">
              <v-btn type="submit" color="primary" :loading="networkStore.addingPeer" block>
                Peer hinzufügen
              </v-btn>
            </v-col>
          </v-row>
        </v-form>

        <v-alert v-if="networkStore.addPeerError" type="error" class="mt-2">
          {{ networkStore.addPeerError }}
        </v-alert>
        <v-alert v-if="networkStore.addPeerSuccess" type="success" class="mt-2">
          Peer erfolgreich hinzugefügt.
        </v-alert>
      </v-card-text>
    </v-card>

    <v-card class="mb-4">
      <v-card-title>Aktive Downloads</v-card-title>
      <v-card-text v-if="activeDownloads.length === 0" class="text-medium-emphasis">
        Keine aktiven Downloads.
      </v-card-text>
      <v-card-text v-else>
        <div v-for="t in activeDownloads" :key="t.id" class="mb-4">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="font-weight-medium">{{ t.name }}</span>
            <span v-if="t.status !== 'stopped'">{{ t.progress }}%</span>
            <span v-else class="text-warning">gestoppt</span>
          </div>
          <v-progress-linear
            :model-value="t.progress"
            :color="t.status === 'stopped' ? 'grey' : 'primary'"
            height="6"
            rounded
          />
          <span class="text-caption text-medium-emphasis">
            <template v-if="t.errorMessage">{{ t.errorMessage }}</template>
            <template v-else>{{ t.speed }} · {{ t.eta }} · {{ t.peers }} Peers</template>
          </span>
        </div>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-title>Meine geteilten Dateien</v-card-title>
      <v-list :loading="filesStore.loading">
        <v-list-item v-if="filesStore.files.length === 0" title="Keine Dateien veröffentlicht" />
        <v-list-item
          v-for="file in filesStore.files"
          :key="file.id"
          :title="file.name"
          :subtitle="`${formatSize(file.size)} · ${file.chunks} Chunks`"
        >
          <template #prepend>
            <v-icon icon="mdi-file-upload-outline" />
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>
