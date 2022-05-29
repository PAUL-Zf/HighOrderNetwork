<template>
  <div id="app" style="width: 1500px">
        <nav class="navbar sticky-top navbar-dark bg-dark"
             style="padding-top: 1px; padding-bottom: 1px; margin-bottom: 0px;">
          <div style="margin-top:5px; margin-left: 0px;">
            <span style="color:white; font-size:1.25rem; font-weight:500; user-select: none">HoLens</span>
          </div>
        </nav>
    <div class="container-fluid" style="padding-left: 0px; padding-right: 0px">
      <div class="row" style="margin-left: 0px; margin-right: 0px">
        <div class="col-3 content" style="padding-left: 0px; padding-right: 0px">
          <ControlView v-on:conveyData="updateData" v-on:highlightRegion="highlightRegion"
                       v-on:conveyLoad="conveyLoad" v-on:conveyStart="conveyStart"
                       v-on:passTime="updateTime" v-on:conveyTimeInterval="conveyTimeInterval"
                       v-on:conveyOverviewPattern="conveyOverviewPattern"
                       v-on:conveyPatternId="conveyPatternId" v-on:conveyHeatmap="conveyHeatmap"
                       v-bind:generate="generate" v-bind:selects="selects"
                       :videoList="videoList" :videoId="videoId" :videoData="videoData"
                       :w="width" :h="height"
                       @changemap='changemap'></ControlView>
<!--          <Overview v-on:conveyTimeInterval="conveyTimeInterval" v-bind:date="date" v-bind:region="region"-->
<!--                    v-bind:load="load"-->
<!--                    v-on:conveyPattern="conveyPattern" v-on:conveyPatternId="conveyPatternId"-->
<!--                    v-on:conveyOverviewPattern="conveyOverviewPattern"-->
<!--          ></Overview>-->
        </div>
        <div class="col-9 content" style="padding-left: 0px; padding-right: 0px">
<!--          <TemporalView v-on:passTime="updateTime" v-on:conveyIndex="updateIndex" v-on:conveyType="updateType"-->
<!--                        v-on:conveyStart="conveyStart"-->
<!--                        v-bind:region="region" v-bind:date="date" v-bind:number="number" v-bind:generate="generate"-->
<!--                        v-bind:load="load" v-bind:selects="selects"-->
<!--                        v-bind:coords="coords" v-bind:time="time" v-bind:halfInterval="halfInterval" @change="change">-->
<!--          </TemporalView>-->
          <div class="row" style="margin-left: 0px; margin-right: 0px">
            <div class="col-9 content" style="padding-left: 0px; padding-right: 0px">
              <MapView v-on:conveyRegion="updateRegion"
                       v-on:conveyHighOrder="updateHighOrder"
                       v-on:conveyNumber="updateNumber"
                       v-on:conveyRegionFlow="updateRegionFlow"
                       v-on:conveyGenerate="conveyGenerate"
                       v-on:conveyFinish="conveyFinish"
                       v-on:conveySelects="conveySelects"
                       v-on:conveyPatternId="conveyPatternId"
                       v-on:conveyMapviewPatternId="conveyMapviewPatternId"
                       v-bind:date="date" v-bind:startTime="startTime" v-bind:timeLength="timeLength"
                       v-bind:highlight="highlight" v-bind:select="select" v-bind:selectedData="selectedData"
                       v-bind:level="level" v-bind:pattern="pattern" v-bind:patternId="patternId" v-bind:load="load"
                       v-bind:start="start"
                       :videoId="videoId" :videoData="videoData"
                       :dir="dir" v-bind:type="type"
                       @changeData='initdraw'></MapView>
            </div>
            <div class="col-3 content" style="padding-left: 0px; padding-right: 0px">
              <StatisticView v-bind:date="date" v-bind:region="region" v-bind:selects="selects"
                             v-bind:startTime="startTime" v-bind:timeLength="timeLength"
                             v-bind:generate="generate"></StatisticView>
            </div>
          </div>
          <StateView v-on:conveySelected="conveySelected"
                     v-bind:startTime="startTime" v-bind:timeLength="timeLength" v-bind:heatMap="heatMap"
                     v-bind:categoryDistribution="categoryDistribution" v-bind:flowCounts="flowCounts"
                     v-bind:overviewStart="overviewStart" v-bind:overviewLength="overviewLength"
                     v-bind:drawSignal="drawSignal" v-bind:overviewPattern="overviewPattern"
                     v-bind:patternType="patternType" v-bind:glyphIndex="glyphIndex"
                     v-bind:mapviewPatternId="mapviewPatternId" v-bind:drawMapviewSignal="drawMapviewSignal"
                     v-bind:content="content" v-bind:region="region" v-bind:number="number" v-bind:index="index"
                     v-bind:finish="finish" v-bind:glyphs="glyphs" v-bind:links="links" v-bind:destLinks="destLinks"
                     :videoId="videoId" :videoData="videoData" v-bind:nodes="nodes"></StateView>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import dataService from './service/dataService.js'
/* global d3 $ _ */

import ControlView from './components/ControlView/ControlView.vue'
import TemporalView from './components/TemporalView/TemporalView.vue'
import StateView from './components/StateView/StateView.vue'
import MapView from './components/MapView/MapView.vue'
import Overview from './components/Overview/Overview.vue'
import StatisticView from './components/StatisticView/StatisticView.vue'

export default {
  name: 'app',
  components: {
    ControlView,
    TemporalView,
    StateView,
    MapView,
    StatisticView,
    Overview
  },
  data() {
    return {
      // new project
      date: '',
      highlight: null,
      region: 0,
      time: null,
      halfInterval: null,
      pattern: null,
      patternId: null,
      mapviewPatternId: null,
      drawSignal: null,
      overviewPattern: null,
      flowCounts: null,
      categoryDistribution: null,
      heatMap: null,
      overviewStart: null,
      overviewLength: null,
      generate: null,
      start: null,
      finish: null,
      drawMapviewSignal: null,
      patternType: null,
      glyphIndex: null,
      load: null,
      info: {
        user_id: 0,
        date: 2000 - 1 - 22
      },
      startTime: 9,
      timeLength: 1,
      content: null,
      glyphs: null,
      links: null,
      destLinks: null,
      number: 1,
      regionsFlow: null,
      selects: null,
      index: 0,    // 标注temporal view中的时间轴的index
      selectedData: null,
      select: null,
      level: 1,
      type: null,

      // old project
      dir: [],
      width: 0,
      height: 0,
      radius: 0,
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
    highlightRegion(highlight) {
      this.highlight = highlight;
    },

    conveyLoad(load){
      this.load = load;
    },

    conveyFinish(finish){
      this.finish = finish;
    },

    conveyStart(start){
      this.start = start;
    },

    conveySelects(selects){
      this.selects = selects;
    },

    conveyHeatmap(heatmap){
      this.heatMap = heatmap;
    },

    conveyTimeInterval(time, halfInterval) {
      this.time = time;
      this.halfInterval = halfInterval;
    },

    conveyOverviewPattern(drawSignal, overviewPattern, flowCounts, heatMap, categoryDistribution, start, length){
      this.drawSignal = drawSignal;
      this.overviewPattern = overviewPattern;
      this.flowCounts = flowCounts;
      this.heatMap = heatMap;
      this.categoryDistribution = categoryDistribution;
      this.overviewStart = start;
      this.overviewLength = length;
    },

    conveyPatternId(patternId){
      this.patternId = patternId;
    },

    conveyMapviewPatternId(drawMapviewSignal, patternType, glyphIndex, mapviewPatternId) {
      this.glyphIndex = glyphIndex;
      this.patternType = patternType;
      this.drawMapviewSignal = drawMapviewSignal;
      this.mapviewPatternId = mapviewPatternId;
    },

    conveySelected(select, selectedData) {
      this.select = select;
      this.selectedData = selectedData;
    },

    conveyGenerate(generate){
      this.generate = generate;
    },

    updateIndex(index) {
      this.index = index;
    },

    updateData(date, level) {
      this.date = date;
      this.level = level;
    },

    updateRegion(region) {
      this.region = region;
    },

    updateType(type) {
      this.type = type;
    },

    updateRegionFlow(regionsFlow) {
      this.regionsFlow = regionsFlow;
    },

    updateHighOrder(content, glyphs, links, destLinks) {
      this.content = content;
      this.glyphs = glyphs;
      this.links = links;
      this.destLinks = destLinks;
    },

    updateNumber(number) {
      this.number = number;
    },

    updateTime(startTime, timeLength) {
      this.timeLength = timeLength;
      this.startTime = startTime;
      console.log(this.timeLength + "    " + this.startTime);
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
