<script setup lang="ts">
import { onMounted, ref } from 'vue'
import useFilesStore from '@/stores/files'

const filesStore = useFilesStore()
onMounted(() => filesStore.fetchFiles())

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Größe', key: 'size' },
  { title: 'Chunks', key: 'chunks' },
  { title: 'ID', key: 'id' },
]

const publishForm = ref()
const publishPath = ref('')
const pathRules = [(v: string) => !!v || 'Bitte einen Dateipfad angeben']

async function onPublish() {
  const { valid } = await publishForm.value.validate()
  if (!valid) return
  await filesStore.publishFile(publishPath.value)
  if (!filesStore.publishError) publishPath.value = ''
}
</script>

<template>
  <v-container>
    <v-card class="mb-4">
      <v-card-title>Datei veröffentlichen</v-card-title>
      <v-card-text>
        <v-form ref="publishForm" @submit.prevent="onPublish">
          <v-text-field
            v-model="publishPath"
            label="Lokaler Dateipfad"
            placeholder="../file"
            :rules="pathRules"
            :disabled="filesStore.publishing"
          />
          <v-btn
            type="submit"
            color="primary"
            :loading="filesStore.publishing"
          >
            Datei veröffentlichen
          </v-btn>
        </v-form>

        <v-alert v-if="filesStore.publishError" type="error" class="mt-4">
          {{ filesStore.publishError }}
        </v-alert>

        <v-alert v-if="filesStore.publishResult" type="success" class="mt-4">
          Datei veröffentlicht — ID: {{ filesStore.publishResult.id.slice(0, 16) }}…,
          {{ filesStore.publishResult.manifest.chunks.length }} Chunks
        </v-alert>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        Meine Dateien
        <v-btn icon="mdi-refresh" variant="text" @click="filesStore.fetchFiles" />
      </v-card-title>

      <v-alert v-if="filesStore.error" type="error" class="ma-4">
        {{ filesStore.error }}
      </v-alert>

      <v-data-table
        :headers="headers"
        :items="filesStore.files"
        :loading="filesStore.loading"
        item-value="id"
      >
        <template #item.size="{ item }">
          {{ formatSize(item.size) }}
        </template>
        <template #item.id="{ item }">
          <span class="text-caption text-medium-emphasis">
            {{ item.id.slice(0, 12) }}…
          </span>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>
