<template>
  <div id="app" style="width: 1400px">
<!--    <nav class="navbar sticky-top navbar-dark bg-dark"-->
<!--         style="padding-top: 1px; padding-bottom: 1px; margin-bottom: 5px;">-->
<!--      <div style="margin-top:5px; margin-left: 5px;">-->
<!--        <span style="color:white; font-size:1.25rem; font-weight:500; user-select: none">OD Diagram</span>-->
<!--      </div>-->
<!--    </nav>-->
    <div class="container-fluid" style="padding-left: 0px; padding-right: 0px">
      <div class="row" style="margin-left: 0px; margin-right: 0px">
        <div class="col-5 content" style="padding-left: 0px; padding-right: 0px">
          <div class="row" style="margin-left: 0px; margin-right: 0px">
            <div class="col-6 content" style="padding-left: 0px; padding-right: 0px">
              <VideoView v-on:conveyData="updateData" v-on:highlightRegion="highlightRegion"
                         :videoList="videoList" :videoId="videoId" :videoData="videoData"
                         :w="width" :h="height"
                         @changemap='changemap'></VideoView>
            </div>
            <div class="col-6 content" style="padding-left: 0px; padding-right: 0px">
              <TextView v-on:passTime="updateTime" v-on:conveyIndex="updateIndex"
                        v-bind:region="region" v-bind:date="date" v-bind:number="number"
                        v-bind:coords="coords" @change="change">
              </TextView>
            </div>
          </div>
          <AudioView v-on:conveySelected="conveySelected"
                     v-bind:content="content" v-bind:region="region" v-bind:number="number" v-bind:index="index"
                     v-bind:regionsFlow="regionsFlow"
                     :videoId="videoId" :videoData="videoData" v-bind:nodes="nodes"></AudioView>
        </div>
        <div class="col-7 content" style="padding-left: 0px; padding-right: 0px">
          <FaceView v-on:conveyRegion="updateRegion"
                    v-on:conveyHighOrder="updateHighOrder"
                    v-on:conveyNumber="updateNumber"
                    v-on:conveyRegionFlow="updateRegionFlow"
                    v-bind:date="date" v-bind:startTime="startTime" v-bind:timeLength="timeLength"
                    v-bind:highlight="highlight" v-bind:select="select" v-bind:selectedData="selectedData"
                    :videoId="videoId" :videoData="videoData"
                    :dir="dir" v-bind:type="type"
                    @changeData='initdraw'></FaceView>
          <!--          <div class="row" style="padding-left: 12px; padding-right: 3px">-->
          <!--            <div class="col-6 content" style="padding-left: 3px; padding-right: 3px">-->
          <!--              <TextView v-bind:date="info.date" v-bind:user="info.user_id" :videoId="videoId" :videoData="videoData" v-bind:coords="coords"-->
          <!--                        @change="change"></TextView>-->
          <!--            </div>-->
          <!--            <div class="col-12 content" style="padding-left: 3px; padding-right: 12px">-->
          <!--              <AudioView :videoId="videoId" :videoData="videoData" v-bind:nodes="nodes"></AudioView>-->
          <!--            </div>-->
          <!--          </div>-->
        </div>
        <!--        <div class="col-2 content" style="padding-left: 3px; padding-right: 3px">-->
        <!--          <FifthView :w="width" :h="height"></FifthView>-->
        <!--        </div>-->
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
      date: '',
      highlight: null,
      region: -1,
      info: {
        user_id: 0,
        date: 2000 - 1 - 22
      },
      startTime: 0,
      timeLength: 0,
      content: null,
      number: 1,
      regionsFlow: null,
      index: 0,    // 标注temporal view中的时间轴的index
      selectedData: null,
      select: null,

      // old project
      dir: [],
      width: 0,
      height: 0,
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
    highlightRegion(highlight){
      this.highlight = highlight;
    },

    conveySelected(select, selectedData){
      this.select = select;
      this.selectedData = selectedData;
      console.log(select);
    },

    updateIndex(index) {
      this.index = index;
    },

    updateData(date) {
      this.date = date;
    },

    updateRegion(region) {
      this.region = region;
    },

    updateRegionFlow(regionsFlow){
      this.regionsFlow = regionsFlow;
    },

    updateHighOrder(content) {
      this.content = content;
    },

    updateNumber(number) {
      this.number = number;
    },

    updateTime(startTime, timeLength, index) {
      this.timeLength = timeLength;
      this.startTime = startTime;
      this.index = index;
      // console.log(this.timeLength + "    " + this.startTime);
    },

    // old project
    changemap(a) {

      // for (let i = 0; i < a.length; i++) {
      //
      // }
      // this.dir = a;
    },
    change(nodes) {
      this.nodes = nodes;
    },
    initdraw(w, h) {
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
  padding: 0px 0px 0px 0px;
}

footer {
  margin-left: 5px;
}
</style>
