<script setup lang="ts">
  import AppSidebar from '@/components/AppSidebar.vue';
</script>

<template>
  <v-app>
    <AppSidebar /> 
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>


<style>

</style>