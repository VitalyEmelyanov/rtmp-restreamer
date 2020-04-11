import Vue from 'vue';
import Vuex from 'vuex';
import Docker from 'dockerode';
import getPort from 'get-port';

Vue.use(Vuex);

export const IMAGE_ID = 'jasonrivers/nginx-rtmp:latest'

export const store = new Vuex.Store({
  plugins: [

  ],
  state: {
    log: [],
    logVisible: false,
    streamingDestinations: [],
    rtmpPort: '',
    loading: false,
    docker: null,
    error: null,
    started: false,
  },
  getters: {
    controlsDisabled: state => state.loading || state.error
  },
  mutations: {
    appendLog: (state, val) => state.log.push(val),
    setDocker: (state, val) => state.docker = val,
    setLoading: (state, val) => state.loading = val,
    setStarted: (state, val) => state.started = val,
    setError: (state, val) => state.error = val,
    setRtmpPort: (state, val) => state.rtmpPort = val,
    toggleLog: state => state.logVisible = !state.logVisible,
    addStreamingDestination: state => state.streamingDestinations.push({url: '', key: ''}),
    removeStreamingDestination: (state, val) => state.streamingDestinations = state.streamingDestinations.filter(s => s !== val),
    updateStreamingDestination(state, val) {
      const destinationIndex = state.streamingDestinations.findIndex(s => s === val)
      state.streamingDestinations.splice(destinationIndex, 1, val)
    },
  },
  actions: {
    log({commit}, message) {
      console.log(message)
      commit('appendLog', message)
    },
    error({commit}, err) {
      console.error(err)
      commit('appendLog', err)
      commit('setError', err)
      commit('setLoading', false)
    },
    async init({dispatch, commit}) {
      commit('setLoading', true)
      dispatch('log', 'Initializing')
      await dispatch('connectDocker')
      await dispatch('pullImage')
      await dispatch('killExistingContainers')
      dispatch('log', 'Ready')
      commit('setLoading', false)
    },
    async stop({dispatch, commit}) {
      commit('setLoading', true)
      dispatch('log', 'Stopping')
      await dispatch('killExistingContainers')
      commit('setRtmpPort', null)
      dispatch('log', 'Ready')
      commit('setStarted', false)
      commit('setLoading', false)
    },
    async start({dispatch, commit, state}) {
      commit('setLoading', true)
      dispatch('log', 'Starting')
      const rtmpPort = await getPort({port: 1935})
      const httpPort = await getPort({port: 8080})
      dispatch('log', `Got RTMP port ${rtmpPort}`)
      dispatch('log', `Got HTTP port ${httpPort}`)

      dispatch('log', 'Creating container')

      const urls = state.streamingDestinations.map(d => {
        const url = String(d.url).trim().replace(/\/+$/, '')
        const key = String(d.key).trim()
        return `${url}/${key}`
      })

      try {
        const container = await state.docker.createContainer({
          Image: IMAGE_ID,
          Env: [`RTMP_PUSH_URLS=${urls.join(',')}`],
          Tty: true,
          PortBindings: {
            '1935/tcp': [{HostPort: String(rtmpPort)}],
            '8080/tcp': [{HostPort: String(httpPort)}],
          },
        })

        dispatch('log', 'Starting container')
        await container.start()

        commit('setRtmpPort', rtmpPort)
      } catch (e) {
        dispatch('error', e)
      }

      dispatch('log', 'Started')
      commit('setStarted', true)
      commit('setLoading', false)
    },
    async connectDocker({dispatch, commit}) {
      dispatch('log', 'Connecting to Docker')
      let dockerUnix = new Docker()
      let dockerWin = new Docker({port: 2375})
      await dockerUnix.version().catch(() => dockerUnix = null);
      await dockerWin.version().catch(() => dockerWin = null);
      const docker = dockerUnix || dockerWin
      if (!docker) {
        dispatch('error', 'Could not connect to Docker!')
      } else {
        dispatch('log', 'Connected to Docker')
        commit('setDocker', docker)
      }
    },
    async killExistingContainers({dispatch, state}) {
      dispatch('log', 'Kill & remove existing containers')
      try {
        const containers = await state.docker.listContainers({
          all: true,
          filters: {ancestor: [IMAGE_ID]}
        })
        for (const container of containers) {
          await state.docker.getContainer(container.Id).remove({force: true})
          dispatch('log', `Removed container ${String(container.Id).substr(0, 8)}`)
        }
      } catch (e) {
        dispatch('error', e)
      }
    },
    async pullImage({dispatch, state}) {
      dispatch('log', 'Checking image')
      try {
        const images = await state.docker.listImages()
        const exists = images.find(i => i.RepoTags.includes(IMAGE_ID))
        if (exists) {
          dispatch('log', 'Image already exists')
        } else {
          dispatch('log', 'Pulling image, please wait')
          await state.docker.pull(IMAGE_ID)
        }
      } catch (e) {
        dispatch('error', e)
      }
    }
  }
});