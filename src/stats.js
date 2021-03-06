import axios from 'axios';
import {machineIdSync} from 'node-machine-id';

const deviceId = machineIdSync()
let appVersion = 'unknown'

export default {
  namespaced: true,
  actions: {
    async initStats({dispatch}, version) {
      console.log('Stats init')
      appVersion = version
      dispatch('sendStats', 'init')
      setInterval(() => dispatch('sendStats', 'stats'), 10000)
    },
    async sendStats(store, type) {
      const {loading, started, error, streamingDestinations} = store.rootState
      const stats = {
        type,
        loading,
        started,
        error,
        destinationsCount: streamingDestinations.length,
        deviceId,
        appVersion,
      }
      await axios.post('https://stats.evitaly.me/api/stats', stats)
    }
  }
}