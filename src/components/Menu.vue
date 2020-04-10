<template>
  <v-menu
    left
    bottom
    offset-y
  >
    <template v-slot:activator="{ on }">
      <v-btn icon v-on="on">
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>
    </template>

    <v-list class="pa-0">
      <v-list-item @click="$store.commit('toggleLog')">
        <v-list-item-title>{{$store.state.logVisible ? 'Hide' : 'Show'}} log</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
export default {
  name: 'Menu'
};
</script>

<style scoped>

</style>