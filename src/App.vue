<template>
  <v-app dark>
    <v-app-bar app color="primary" dark>
      <v-icon class="pr-2">mdi-video-box</v-icon>

      <v-toolbar-title class="font-weight-bold">
        RTMP Restreamer
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <span class="pr-4 caption" style="max-width: 250px">
        <v-progress-circular v-if="$store.state.loading && !$store.state.error"
                             size="12" width="1" class="mb-1 mr-1" indeterminate />
        <span v-if="$store.state.error" class="error--text">{{$store.state.error}}</span>
        <span v-else>{{$store.state.log[$store.state.log.length - 1]}}</span>
      </span>

      <ControlPanel />

      <Menu />
    </v-app-bar>

    <v-content>
      <StreamDestinations class="pb-0" />
      <StreamInput />
      <SystemLog v-if="$store.state.logVisible" />
    </v-content>

    <v-footer app>
      <v-spacer></v-spacer>
      <div class="caption">&copy; Vitaly Emelyanov, {{ new Date().getFullYear() }}</div>
    </v-footer>
  </v-app>
</template>

<script>
import StreamInput from './components/StreamInput';
import StreamDestinations from './components/StreamDestinations';
import SystemLog from './components/SystemLog';
import Menu from './components/Menu';
import ControlPanel from './components/ControlPanel';

export default {
  name: 'App',

  components: {
    ControlPanel,
    StreamInput,
    Menu,
    SystemLog,
    StreamDestinations,
  },

  created() {
    this.$store.dispatch('init')
  },

  data: () => ({
    //
  })
};
</script>
