/* global __static */

import fs from 'fs'
import path from 'path'
import Vue from 'vue';
import Vuex from 'vuex';
import Docker from 'dockerode';
import getPort from 'get-port';

Vue.use(Vuex);

export const IMAGE_ID = 'jasonrivers/nginx-rtmp:latest'
export const STUNNEL_IMAGE_ID = 'stunnel-rmtp:latest'

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
    async init({dispatch, commit, state}) {
      commit('setLoading', true)
      dispatch('log', 'Initializing')
      await dispatch('connectDocker')
      if (state.error) return
      await dispatch('pullRtmpImage')
      if (state.error) return
      await dispatch('buildStunnelImage')
      if (state.error) return
      await dispatch('killExistingContainers')
      if (state.error) return
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

      dispatch('log', 'Creating containers')

      try {
        const stunnelContainer = await state.docker.createContainer({
          Image: STUNNEL_IMAGE_ID,
          Hostname: 'stunnel',
          Tty: true,
          "ExposedPorts": {
            "19350/tcp": { }
          },
          HostConfig: {
            PortBindings: {
              '19350/tcp': [{HostPort: '19350'}],
            },
          }
        })

        dispatch('log', 'Starting Stunnel container')
        await stunnelContainer.start()

        stunnelContainer.attach({stream: true, stdout: true, stderr: true}, function (err, stream) {
          stream.pipe(process.stdout);
        });
        
        const stunnelInfo = await stunnelContainer.inspect()
        const stunnelHost = String(stunnelInfo.Name).replace('/', '')

        const urls = state.streamingDestinations.map(d => {
          const url = String(d.url).trim().replace(/\/+$/, '')
          const key = String(d.key).trim()
          if (url.includes('facebook')) {
            return `rtmp://${stunnelHost}:19350/rtmp/${key}`
          }
          return `${url}/${key}`
        })

        const nginxTemplatePath = path.join(__static, '/rtmp/nginx.conf.template')
        const nginxConfigPath = path.join(__static, '/rtmp/nginx.conf')

        let template = fs.readFileSync(nginxTemplatePath, 'utf8')

        template = template.replace('PUSH_URLS', urls.map(url => `push ${url};`).join('\n'))

        fs.writeFileSync(nginxConfigPath, template, 'utf8')
        
        const rtpmContainer = await state.docker.createContainer({
          Image: IMAGE_ID,
          Tty: true,
          PortBindings: {
            '1935/tcp': [{HostPort: String(rtmpPort)}],
            '8080/tcp': [{HostPort: String(httpPort)}],
          },
          HostConfig: {
            Binds: [
              `${nginxConfigPath}:/opt/nginx/conf/nginx.conf`
            ],
            PortBindings: {
              '1935/tcp': [{HostPort: String(rtmpPort)}],
              '8080/tcp': [{HostPort: String(httpPort)}],
            },
            Links: [
              `${stunnelHost}:stunnel`
            ],
          }
        })

        dispatch('log', 'Starting RTMP container')
        await rtpmContainer.start()

        rtpmContainer.attach({stream: true, stdout: true, stderr: true}, function (err, stream) {
          stream.pipe(process.stdout);
        });

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
          filters: {ancestor: [IMAGE_ID, STUNNEL_IMAGE_ID]}
        })
        for (const container of containers) {
          await state.docker.getContainer(container.Id).remove({force: true})
          dispatch('log', `Removed container ${String(container.Id).substr(0, 8)}`)
        }
      } catch (e) {
        dispatch('error', e)
      }
    },
    async pullRtmpImage({dispatch, state}) {
      dispatch('log', 'Checking RTMP')
      try {
        const images = await state.docker.listImages()
        const exists = images.find(i => i.RepoTags.includes(IMAGE_ID))
        if (exists) {
          dispatch('log', 'RTMP already exists')
        } else {
          dispatch('log', 'Pulling RTMP, please wait')
          const stream = await state.docker.pull(IMAGE_ID)
          await new Promise((resolve, reject) => {
            state.docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
          })
        }
      } catch (e) {
        dispatch('error', e)
      }
    },
    async buildStunnelImage({dispatch, state}) {
      dispatch('log', 'Checking Stunnel')
      try {
        const images = await state.docker.listImages()
        const exists = images.find(i => i.RepoTags.includes(STUNNEL_IMAGE_ID))
        if (exists) {
          dispatch('log', 'Stunnel already exists')
        } else {
          dispatch('log', 'Building Stunnel, please wait')
          const stunnelPath = path.join(__static, '/stunnel')
          const stream = await state.docker.buildImage({
            context: stunnelPath,
          }, {t: STUNNEL_IMAGE_ID});
          await new Promise((resolve, reject) => {
            state.docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
          })
        }
      } catch (e) {
        dispatch('error', e)
      }
    }
  }
});