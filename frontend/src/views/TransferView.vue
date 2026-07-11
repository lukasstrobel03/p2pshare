<script setup lang="ts">
import { onMounted, ref } from 'vue'
import useTransfersStore from '@/stores/transfers'

const store = useTransfersStore()
onMounted(() => store.fetchTransfers())

const tab = ref('active')

const downloadForm = ref()
const downloadId = ref('')
const downloadOutdir = ref('')
const requiredRule = [(v: string) => !!v || 'Pflichtfeld']

async function onDownload() {
  const { valid } = await downloadForm.value.validate()
  if (!valid) return
  await store.startDownload(downloadId.value, downloadOutdir.value)
  if (!store.downloadError) {
    downloadId.value = ''
    downloadOutdir.value = ''
  }
}
</script>

<template>
  <v-container>
    <v-card class="mb-4">
      <v-card-title>Download starten</v-card-title>
      <v-card-text>
        <v-form ref="downloadForm" @submit.prevent="onDownload">
          <v-text-field
            v-model="downloadId"
            label="File-ID"
            placeholder="06ba16f807e192bc0cc9b000aa7ea51c37a01c01b01e228806f468b525488393"
            :rules="requiredRule"
            :disabled="store.downloading"
          />
          <v-text-field
            v-model="downloadOutdir"
            label="Zielordner"
            placeholder="./data"
            :rules="requiredRule"
            :disabled="store.downloading"
          />
          <v-btn type="submit" color="primary" :loading="store.downloading">
            Download starten
          </v-btn>
        </v-form>

        <v-alert v-if="store.downloadError" type="error" class="mt-4">
          {{ store.downloadError }}
        </v-alert>

        <v-alert v-if="store.downloadResult" type="success" class="mt-4">
          Download gestartet — Ziel: {{ store.downloadResult.output }}
        </v-alert>
      </v-card-text>
    </v-card>

    <v-alert v-if="store.error" type="error" class="mb-4">
      {{ store.error }}
    </v-alert>

    <v-tabs v-model="tab">
      <v-tab value="active">Aktiv ({{ store.active.length }})</v-tab>
      <v-tab value="completed">Abgeschlossen ({{ store.completed.length }})</v-tab>
    </v-tabs>

    <v-window v-model="tab" class="mt-4">
      <v-window-item value="active">
        <v-card
          v-for="t in store.active"
          :key="t.id"
          class="mb-3 pa-4"
        >
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="d-flex align-center">
              <v-icon
                :icon="t.direction === 'download' ? 'mdi-download' : 'mdi-upload'"
                :color="t.status === 'stopped' ? 'warning' : (t.direction === 'download' ? 'primary' : 'success')"
                class="mr-2"
              />
              <span class="font-weight-medium">{{ t.name }}</span>
            </div>
            <span v-if="t.status !== 'stopped'">{{ t.progress }}%</span>
            <span v-else class="text-warning">gestoppt</span>
          </div>

          <v-progress-linear
            :model-value="t.progress"
            :color="t.status === 'stopped' ? 'grey' : (t.direction === 'download' ? 'primary' : 'success')"
            height="6"
            rounded
          />

          <div class="d-flex align-center justify-space-between mt-2">
            <span class="text-caption text-medium-emphasis">
              <template v-if="t.errorMessage">{{ t.errorMessage }}</template>
              <template v-else>{{ t.speed }} · {{ t.eta }} · {{ t.peers }} Peers</template>
            </span>
            <div>
              <v-btn :icon="t.status === 'stopped' ? 'mdi-play' : 'mdi-pause'" variant="text" size="small" />
              <v-btn icon="mdi-close" variant="text" size="small" />
            </div>
          </div>
        </v-card>
      </v-window-item>

      <v-window-item value="completed">
        <p class="text-medium-emphasis">Noch keine abgeschlossenen Transfers (Mock).</p>
      </v-window-item>
    </v-window>
  </v-container>
</template>