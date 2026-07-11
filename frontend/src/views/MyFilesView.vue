<script setup lang="ts">
import { onMounted } from 'vue'
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
</script>

<template>
  <v-container>
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