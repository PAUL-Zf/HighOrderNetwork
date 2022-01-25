<template>
  <div id="app" style="width: 1400px">
    <nav class="navbar sticky-top navbar-dark bg-dark"
         style="padding-top: 1px; padding-bottom: 1px; margin-bottom: 5px;">
      <div style="margin-top:5px; margin-left: 5px;">
        <span style="color:white; font-size:1.25rem; font-weight:500; user-select: none">OD Diagram</span>
      </div>
    </nav>
    <div class="container-fluid" style="padding-left: 0px; padding-right: 0px">
      <div class="row" style="margin-left: 0px; margin-right: 0px">
        <div class="col-2 content" style="padding-left: 3px; padding-right: 3px">
          <VideoView v-on:conveyData="updateData" :videoList="videoList" :videoId="videoId" :videoData="videoData" :w="width" :h="height"
                     @changemap='changemap'></VideoView>
        </div>
        <div class="col-8 content" style="padding-left: 3px; padding-right: 3px">
          <FaceView  v-bind:date="info.date" v-bind:user="info.user_id" :videoId="videoId" :videoData="videoData" :dir="dir" v-bind:type="type"
                    @changeData='initdraw'></FaceView>
          <div class="row" style="padding-left: 12px; padding-right: 3px">
            <div class="col-6 content" style="padding-left: 3px; padding-right: 3px">
              <TextView v-bind:date="info.date" v-bind:user="info.user_id" :videoId="videoId" :videoData="videoData" v-bind:coords="coords"
                        @change="change"></TextView>
            </div>
            <div class="col-6 content" style="padding-left: 10px; padding-right: 12px">
              <AudioView :videoId="videoId" :videoData="videoData" v-bind:nodes="nodes"></AudioView>
            </div>
          </div>
        </div>
        <div class="col-2 content" style="padding-left: 3px; padding-right: 3px">
          <FifthView :w="width" :h="height"></FifthView>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import dataService from './service/dataService.js'
/* global d3 $ _ */

import VideoView from './components/VideoView/VideoView.vue'
import TextView from './components/TextView/TextView.vue'
import AudioView from './components/AudioView/AudioView.vue'
import FaceView from './components/FaceView/FaceView.vue'
import FifthView from './components/FifthView/FifthView.vue'

export default {
  name: 'app',
  components: {
    VideoView,
    TextView,
    AudioView,
    FaceView,
    FifthView
  },
  data() {
    return {
      // new project
      info: {
        user_id: 0,
        date: 2000-1-22
      },

      // old project
      dir:[],
      width:0,
      height:0,
      radius: 0,
      type: ['球墨铸铁管'],
      videoList: [],
      videoId: 'simon_sinek_why_good_leaders_make_you_feel_safe',
      videoData: {},
      coords: [],
      peak: {},
      nodes: {}
    }
  },
  methods: {
    // new project
    updateData(user_id, date){
      this.info.user_id = user_id;
      this.info.date = date;
      console.log(this.info.user_id)
      console.log(this.info.date)
    },

    // old project
    changemap(a) {

      // for (let i = 0; i < a.length; i++) {
      //
      // }
      // this.dir = a;
    },
    change(nodes){
      this.nodes = nodes;
    },
    initdraw(w,h) {
      // this.coords = coords;
      // this.peak = peak;
      this.width = w;
      this.height = h;
      // console.log(coords);
    },
    receiveFather(radius, type) {
      this.radius = radius;
      this.type = type;
    }
  },
  mounted: function () {
    console.log('d3: ', d3) /* eslint-disable-line */
    console.log('$: ', $) /* eslint-disable-line */
    console.log('_', _.partition([1, 2, 3, 4], n => n % 2)) /* eslint-disable-line */

    this.$nextTick(() => {
      dataService.initialization(this.videoId, (data) => {
        console.log('testing: ', data['data']) /* eslint-disable-line */
      })
    })
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  width: 100%;
  margin: 0 auto;
}

.container {
  width: 100%;
  padding: 5px 5px 5px 5px;
}

.content {
  padding: 2px 2px 2px 2px;
}

footer {
  margin-left: 5px;
}
</style>
