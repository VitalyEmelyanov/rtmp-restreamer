<template>
  <v-container fluid>
    <v-card outlined class="pa-2">
      <v-row dense no-gutters class="pa-2">
        <div class="title">
          <v-icon class="pb-1">mdi-antenna</v-icon>
          Streaming Destinations
        </div>
        <v-spacer />
        <v-btn
          :disabled="$store.state.streamingDestinations.length >= 3 || $store.state.started"
          color="primary"
          @click="$store.commit('addStreamingDestination')">
          <v-icon>mdi-plus</v-icon>
          <span>Add</span>
        </v-btn>
      </v-row>

      <div class="destinations-list">
        <v-card outlined class="ma-2" v-for="(destination, i) of $store.state.streamingDestinations" :key="i">
          <v-list-item>
            <v-row dense align="center">
              <v-col cols="auto">
                <div class="subtitle-2 pr-2">#{{i + 1}}</div>
              </v-col>
              <v-col>
                <v-text-field
                  label="URL"
                  :disabled="$store.state.started"
                  v-model="destination.url"
                  @input="$store.commit('updateStreamingDestination', destination)" />
              </v-col>
              <v-col>
                <v-text-field
                  label="Key"
                  :disabled="$store.state.started"
                  v-model="destination.key"
                  @input="$store.commit('updateStreamingDestination', destination)" />
              </v-col>
              <v-col v-if="$store.state.streamingDestinations.length > 1" cols="auto">
                <v-btn
                  icon
                  color="error darken-2"
                  @click="$store.commit('removeStreamingDestination', destination)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-col>
            </v-row>
          </v-list-item>
        </v-card>
      </div>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: 'StreamDestinations',
  created() {
    if (!this.$store.state.streamingDestinations.length) {
      this.$store.commit('addStreamingDestination')
    }
  }
};
</script>

<style scoped lang="sass">
.destinations-list
  overflow: auto
  max-height: 275px
</style>