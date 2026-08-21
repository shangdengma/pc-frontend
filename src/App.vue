<template>
  <router-view />
  <Toaster
    v-if="route.name !== 'reportDetail'"
    position="top-right"
    :visible-toasts="4"
    :duration="3600"
    close-button
    rich-colors
  />
  <ConfirmHost v-if="route.name !== 'reportDetail'" />
</template>

<script setup>
import { useRoute } from 'vue-router'
import { Toaster } from 'vue-sonner'
import ConfirmHost from './components/ConfirmHost.vue'
import 'vue-sonner/style.css'

const route = useRoute()
</script>
