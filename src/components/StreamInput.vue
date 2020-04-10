<template>
  <v-container fluid>
    <v-card outlined class="pa-2">
      <v-row dense no-gutters class="pa-2 pb-4">
        <div class="title">
          <v-icon class="pb-1">mdi-import</v-icon>
          Stream Input
        </div>
      </v-row>
      <v-text-field
        readonly
        outlined
        hide-details
        class="ma-2"
        label="URL for input video stream"
        :value="$store.state.rtmpUrl || 'Available when service is started'">
        <div slot="append" class="pb-4">
          <v-btn :disabled="!$store.state.rtmpUrl"
                 icon
                 @click="copy($store.state.rtmpUrl)">
            <v-icon>mdi-content-copy</v-icon>
          </v-btn>
        </div>
      </v-text-field>
    </v-card>
  </v-container>
</template>

<script>
import copy from 'copy-to-clipboard';
export default {
  name: 'StreamInput',
  methods: { copy }
};
</script>

<style lang="sass">
.v-input__append-inner
  margin: 0
</style>