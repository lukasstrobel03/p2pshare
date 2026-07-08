<template>
  <div>
    <v-text-field
      v-model="query"
      placeholder="Netzwerk durchsuchen…"
      prepend-inner-icon="mdi-magnify"
      hide-details
      @keyup.enter="search"
    />
    <!-- Ergebnisliste kommt hier später rein -->
  </div>
</template>

<script setup>
import { ref } from 'vue'

const query = ref('')

function search() {
  console.log('Suche nach:', query.value)
  // später: networkStore.search(query.value)
}
</script>