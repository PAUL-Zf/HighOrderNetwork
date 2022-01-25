// /* global d3 $ */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// import pipeService from '../../service/pipeService'
// import DrawText from './drawText.js';
// import fetchLassoedDataPost from "../../service/dataService.js"
import * as d3Lasso from 'd3-lasso/build/d3-lasso.min.js';
import * as d3 from "d3";
import dataService from "@/service/dataService";
export default {
    name: 'TextView',
    components: {

    },
    props: ['user', 'date'],
    data() {
        return {
            content: [],
        }
    },

    watch: {
        // new project
        user(val) {
            dataService.display(this.user, this.date, response => {
                console.log(response.data);
                this.content = response.data;
            })
        },

        date(val) {
            dataService.display(this.user, this.date, response => {
                console.log(response.data);
                this.content = response.data;
            })
        },

        // textData: function (textData) {
        //     this.drawText.layout(textData)
        // }
        // coords(newValue){
        //     this.drawMDSLasso(newValue);
        // },

        // lassoedData(newValue){
        //     dataService.fetchLassoedDataPost(newValue, (returnedData) => {
        //         console.log('selectview::fetchProductViewLassoedDataPost: ', returnedData)
        //         this.returnData = returnedData
        //
        //     });
        // },
        // returnData(newValue){
        //     console.log(this.returnData)
        //     this.$emit('change', this.returnData)
        // }

    },
    mounted: function () {
        // this.drawText = new DrawText(this.containerId)
        // console.log(this.coords);
        // console.log("this.coordsaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");


        // dataService.textData('e271af20-cc49-4b8d-b034-bc8448529c67', (data) => {
        //     this.textData = data['data']
        //     pipeService.emitTextData(this.textData)
        //   })
        // console.log(this.coords);
    },
    methods:{
        // drawMDSLasso: function(data) {
        //     var myThis = this
        //     var svg = d3.select('#MDSLasso_svg')
        //     // var width = svg.attr('width')
        //     let height = svg.attr('height')
        //
        //     let dataset = data
        //     // let dataset = data.map((d) => d['data'])
        //     // console.log('SimilarityView dataset successful')
        //     // console.log('SimilarityView dataset::', dataset)
        //
        //     // .append('svg')
        //
        //     let margin = { top: 20, bottom: 20, left: 20, right: 20 }
        //
        //     var xScale = d3.scaleLinear()
        //         .domain([d3.min(dataset.map((d) => d['data']), (d) => d[0]), d3.max(dataset.map((d) => d['data']), (d) => d[0])])
        //         // .domain([-7, 7])
        //         .range([0, height - 2 * margin.left])
        //
        //     var yScale = d3.scaleLinear()
        //         .domain([d3.max(dataset.map((d) => d['data']), (d) => d[1]), d3.min(dataset.map((d) => d['data']), (d) => d[1])])
        //         // .domain([-7, 7])
        //         .range([0, height - 2 * margin.left])
        //
        //     var scatterMDS = svg.append('g')
        //         .attr('transform', 'translate(' + margin.top + ',' + margin.left + ')')
        //
        //     // var circles = svg.selectAll('circle')
        //     //     .data(data)
        //     //     .enter()
        //     //     .append('circle')
        //     //     .attr('cx', d => d[0] * w)
        //     //     .attr('cy', d => d[1] * h)
        //     //     .attr('r', r)
        //     var dots = scatterMDS.selectAll('circle')
        //         .data(dataset)
        //         .enter()
        //         .append('circle')
        //         .attr('cx', function(d, i) {
        //             // let coordsData = (d) => d['data']
        //             // console.log('coordsData::', coordsData)
        //             return xScale(d['data'][0])
        //         })
        //         .attr('cy', function(d, i) {
        //             // let coordsData = (d) => d['data']
        //             return yScale(d['data'][1])
        //         })
        //         .attr('r', 1.5)
        //         .attr('fill', function(d, i) {
        //             // console.log('fill::data', d)
        //
        //                 return '#fb8072'
        //
        //         })
        //
        //     // var xAxis = d3.axisBottom()
        //     //     .scale(xScale)
        //     //     .ticks(7)
        //
        //     // var yAxis = d3.axisLeft()
        //     //     .scale(yScale)
        //     //     .ticks(7)
        //     // scatterMDS.append('g')
        //     //     .attr('class', 'axis')
        //     //     .attr('transform', 'translate(' + 0 + ',' + (height - 2 * margin.top) + ')')
        //     //     .call(xAxis)
        //
        //     // scatterMDS.append('g')
        //     //     .attr('class', 'axis')
        //     //     .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
        //     //     .call(yAxis)
        //     // Lasso functions
        //     var lassoStart = function() {
        //         lasso.items()
        //             .attr('r', 1.5) // reset size
        //             .classed('not_possible', true)
        //             .classed('selected', false)
        //     }
        //     var lassoDraw = function() {
        //         // Style the possible dots
        //         lasso.possibleItems()
        //             .classed('not_possible', false)
        //             .classed('possible', true)
        //
        //         // Style the not possible dot
        //         lasso.notPossibleItems()
        //             .classed('not_possible', true)
        //             .classed('possible', false)
        //     }
        //     var lassoEnd = function() {
        //         // let lassoedData = []
        //         // Reset the color of all dots
        //         lasso.items()
        //             .classed('not_possible', false)
        //             .classed('possible', false)
        //
        //         // Style the selected dots
        //         lasso.selectedItems()
        //             .classed('selected', true)
        //             .attr('r', 1.5)
        //             // .attr('fill', 'blue')
        //             .style('opacity', 1.0)
        //         // console.log(d3.classed('selected', true).node().value)
        //         myThis.lassoedData = lasso.selectedItems().data()
        //         // Reset the style of the not selected dots
        //         lasso.notSelectedItems()
        //             .attr('r', 1.5)
        //             .style('opacity', 0.4)
        //         // var selected = lasso.selectedItems().filter(function(d) { return d.selected === true })
        //         // console.log('bbb:', lasso.selectedItems()._groups[0][1])
        //         // console.log('bbb:', lasso.selectedItems().data())
        //
        //     }
        //     var lasso = d3Lasso.lasso()
        //         .closePathSelect(true)
        //         .closePathDistance(100)
        //         .items(dots)
        //         .targetArea(svg)
        //         .on('start', lassoStart)
        //         .on('draw', lassoDraw)
        //         .on('end', lassoEnd)
        //
        //     svg.call(lasso)
        // }
    }

}
