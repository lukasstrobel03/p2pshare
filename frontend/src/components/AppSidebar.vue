<script setup lang="ts">
  import router from '@/router/index.ts'

  const routes = router.getRoutes()
  console.log(routes)

  const sidebarItems = routes.filter(route => route.name)
</script>

<template>
  <v-navigation-drawer>
    <v-list nav>
      <v-list-item class="center"
        v-for="item in sidebarItems"
        :key="item.path"
        :to="item.path"
        :title="(item.name as string)" />
    </v-list>
  </v-navigation-drawer>
</template>

<style>
  .center {
    text-align: center;
  }
</style>