<template>
  <v-container fluid>
    <v-card outlined class="pa-2">
      <v-row dense no-gutters class="pa-2 pb-4" align="baseline">
        <div class="title">
          <v-icon class="pb-1">mdi-import</v-icon>
          Stream Input
        </div>
        <v-spacer />
        <v-switch
          v-model="useLan"
          dense
          class="pa-0 ma-0"
          label="Use LAN" />
      </v-row>
      <v-text-field
        readonly
        outlined
        hide-details
        class="ma-2"
        label="URL for input video stream"
        :value="rtmpUrl || 'Available when service is started'">
        <div slot="append" class="pb-4">
          <v-btn :disabled="!rtmpUrl"
                 icon
                 @click="copy(rtmpUrl)">
            <v-icon>mdi-content-copy</v-icon>
          </v-btn>
        </div>
      </v-text-field>
    </v-card>
  </v-container>
</template>

<script>
import copy from 'copy-to-clipboard';
import ip from 'ip';

export default {
  name: 'StreamInput',
  methods: { copy },
  data: () => ({useLan: false}),
  computed: {
    rtmpUrl() {
      const port = this.$store.state.rtmpPort
      if (!port) return null
      if (this.useLan) {
        return `rtmp://${ip.address()}:${port}/live`
      }
      return `rtmp://127.0.0.1:${port}/live`
    }
  }
};
</script>

<style lang="sass">
.v-input__append-inner
  margin: 0
</style>