<template>
  <div>
    <v-btn
      @click="$store.dispatch('start')"
      :disabled="$store.getters.controlsDisabled || $store.state.started || !canStart"
      color="success"
      class="mr-2">
      <v-icon>mdi-play</v-icon>
      <span>Start</span>
    </v-btn>
    <v-btn
      @click="$store.dispatch('stop')"
      :disabled="$store.getters.controlsDisabled"
      color="error">
      <v-icon>mdi-stop</v-icon>
      <span>Stop</span>
    </v-btn>
  </div>
</template>

<script>
export default {
  name: 'ControlPanel',
  computed: {
    canStart() {
      return this.$store.state.streamingDestinations.every(d => String(d.url).trim().replace(/\/+$/, ''))
    }
  }
};
</script>

<style scoped>

</style>