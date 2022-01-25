// /* global d3 $ */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-extra-semi */
import DrawAudio from './drawAudio.js'
// import * as d3Lasso from 'd3-lasso/build/d3-lasso.min.js';
import * as d3 from "d3";
// import dataService from '../../service/dataService.js'
// import pipeService from '../../service/pipeService'

export default {
    name: 'AudioView',
    components: {
    },
    props: {
        videoId: String,
        videoData: Object,
        nodes:{}
    },
    data() {
        return {
            containerId: 'audioGraph',
            audioData: {},
            interval: 5,
            sliding: 1
        }
    },
    watch: {

    },
    mounted: function () {
        this.drawAudio = new DrawAudio(this.containerId)

        // dataService.audioData('e271af20-cc49-4b8d-b034-bc8448529c67', this.interval, this.sliding, (data) => {
        //     this.audioData = data['data']
        //     pipeService.emitAudioData(this.audioData)
        //     this.drawAudio.layout(this.audioData)
        // })
    },
    methods:{
        fetchArcData: function() {

            // var numItem = 5
            // var svg = d3.select('#arcData_svg')
            // // let width = svg.attr('width')
            // // let height = svg.attr('height')
            //
            // let innerRadius = 20
            // let varianceOuterRadius = 30
            // // accOuterRadious
            // let arcDataset = data.slice(0, numItem)
            // // console.log('arcData: ', arcDataset)
            // let varancePart = svg.append('g')
            //     .attr('transform', 'translate(100,100)')
            // // arc of varance
            // let arcVarance = d3.arc()
            //     .innerRadius(innerRadius)
            //     .outerRadius(varianceOuterRadius)
            //     .startAngle(function(d, i) {
            //         return Math.PI * 2 / 6 * i - (Math.PI * 2 / (numItem + 1))
            //     })
            //     .endAngle(function(d, i) {
            //         return Math.PI * 2 / 6 * (i + 1) - (Math.PI * 2 / (numItem + 1))
            //     })
            // //  descending order
            // // dataset.sort(function(x, y) {
            // //     return d3.descending(x.acc, y.acc)
            // // })
            //
            // varancePart.selectAll('path')
            //     .data(arcDataset)
            //     .enter()
            //     .append('path')
            //     .attr('d', arcVarance)
            //     .attr('class', varancePart)
            //     .style('fill', function(d, i) {
            //         // console.log(i)
            //         // console.log('dataset::acc: ', d.acc)
            //         if (i === 0) {
            //             return '#fbb4ae' // red
            //         } else if (i === 1) {
            //             return '#b3cde3' // blue
            //         } else if (i === 2) {
            //             return '#ccebc5' // green
            //         } else if (i === 3) {
            //             return '#decbe4' // purple
            //         } else {
            //             return 'yellow'
            //         }
            //     })
            // // arc of acc
            // var accPart = svg.append('g')
            //     .attr('transform', 'translate(100,100)')
            //     .attr('class', 'accPart')
            // var accOuterRadious = d3.scaleLinear()
            //     .domain([0, 1.0])
            //     .range([30, 150])
            //
            // var arcAcc = d3.arc()
            //     .innerRadius(varianceOuterRadius)
            //     .outerRadius(function(d, i) {
            //         // console.log('d:', accOuterRadious(d.acc))
            //         return accOuterRadious(d.acc)
            //     })
            //     .startAngle(function(d, i) {
            //         return Math.PI * 2 / 6 * i - (Math.PI * 2 / (numItem + 1))
            //     })
            //     .endAngle(function(d, i) {
            //         return Math.PI * 2 / 6 * (i + 1) - (Math.PI * 2 / (numItem + 1))
            //     })
            // accPart.selectAll('path')
            //     .data(arcDataset)
            //     .enter()
            //     .append('path')
            //     .attr('class', 'myArc')
            //     .style('stroke', '#fff')
            //     .style('stroke-width', 3)
            //     .attr('d', arcAcc)
            //     .style('fill', function(d, i) {
            //         if (i === 1) {
            //             return '#fbb4ae' // red
            //         } else if (i === 0) {
            //             return '#b3cde3' // blue
            //         } else if (i === 3) {
            //             return '#ccebc5' // green
            //         } else if (i === 2) {
            //             return 'red' // purple
            //         } else {
            //             return 'gray'
            //         }
            //     })
            // // draw the violin chart
            // let violinDataset = data.slice(numItem, data.length)
            // var histoChart = d3.histogram()
            // var yScale = d3.scaleLinear()
            //     .domain([0, 0.55])
            //     .range([0, 50])
            // // var yAxis = d3.axisRight().scale(yScale)
            //
            // svg.append('g')
            //     .attr('class', 'yAxis')
            //
            // // .attr('transform', 'translate(0,10)')
            //
            // histoChart.domain(yScale.domain())
            //     .thresholds(5)
            //     .value(d => d.acc)
            // var xScale = d3.scaleLinear()
            //     .domain([0, 6])
            //     .range([0, 25])
            //
            // var area = d3.area()
            //     // .x0(d => -d.length)
            //     // .x1(d => d.length)
            //     .x0(function(d) {
            //         return -xScale(d.length)
            //     })
            //     .x1(function(d) {
            //         return xScale(d.length)
            //     })
            //     .y(d => yScale(d.x0))
            //     .curve(d3.curveCatmullRom)
            //
            // svg.selectAll('g.violin')
            //     .data([violinDataset]).enter()
            //     .append('g')
            //     // .attr('transform', (d, i) => `translate(${150 + i * 100}, 10)`).append('path')
            //     .attr('transform', (d, i) => 'translate(' + 30 + ',' + 100 + ')').append('path')
            //     .attr('transform', 'rotate(-90)')
            //     .style('stroke', 'black')
            //     .style('stroke-width', 2)
            //     .style('fill', 'blue')
            //     // .attr('d', d => area(histoChart(d)))
            //     .attr('d', function(d, i) {
            //         // console.log('begin d: ', d)
            //         return area(histoChart(d))
            //     })
        }
    }
}
