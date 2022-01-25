import Vue from 'vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import App from './App.vue'


import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'video.js/dist/video-js.min.css'

import _ from 'lodash'
window._ = _

import * as d3 from 'd3'
window.d3 = d3

import $ from 'jquery'
window.$ = $

Vue.config.productionTip = false
Vue.use(ElementUI);
new Vue({
    render: h => h(App),
}).$mount('#app')
