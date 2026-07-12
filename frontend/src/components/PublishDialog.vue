<script setup lang="ts">
import { ref } from 'vue'
import { useFilesStore } from '@/stores/files'

const open = defineModel<boolean>('open', { required: true })

const filesStore = useFilesStore()
const path = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)

async function submit() {
  if (!path.value.trim()) return
  submitting.value = true
  error.value = null
  try {
    await filesStore.publish(path.value.trim())
    path.value = ''
    open.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <v-dialog v-model="open" max-width="480">
    <v-card title="Publish a file">
      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Enter the path of a file on the machine your node is running on -
          this isn't a browser upload, the node reads the file directly from
          disk.
        </p>
        <v-text-field
          v-model="path"
          label="File path"
          placeholder="/home/user/documents/report.pdf"
          autofocus
          :error-messages="error ?? undefined"
          @keydown.enter="submit"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="open = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :loading="submitting" @click="submit">Publish</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
