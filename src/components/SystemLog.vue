<template>
  <v-container fluid>
    <v-card outlined class="pa-2">
      <v-row dense no-gutters class="pa-2 pb-4">
        <div class="title">
          <v-icon class="pb-1">mdi-import</v-icon>
          System Log
        </div>
      </v-row>
      <v-textarea
        readonly
        outlined
        hide-details
        class="ma-2"
        :value="$store.state.log.join('\n')">
      </v-textarea>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: 'SystemLog'
};
</script>

<style scoped>

</style>