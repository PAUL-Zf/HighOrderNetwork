/* eslint-disable */

import dataService from "@/service/dataService";
import response from "vue-resource/src/http/response";

export default {
    data() {
        return {
            // slider
            svg: null,
            dataset: '',
            datasets: ['NYC', 'Manhattan'],
            value: [0, 6],
            marks: {
                0: {style: "font-size: 8px", label: 'min'},
                1: {style: "font-size: 8px", label: '5'},
                2: {style: "font-size: 8px", label: '10'},
                3: {style: "font-size: 8px", label: '15'},
                5: {style: "font-size: 8px", label: '60'},
                6: {style: "font-size: 8px", label: 'max'}
            },
            users: [],
            dates: ['Weekdays', 'Holidays'],
            valueOfUser: '',
            valueOfDate: '',
            overview: [],
            level: 1,
            load: 0,    // 每次点击load都自增
        }
    },

    watch: {},

    methods: {
        // drawGradient: function (){
        //     let svgSelect = d3.select('.card-header').append('svg').attr('width', 373).attr('height', 36).attr('fill', 'black');
        //
        //     let defs = svgSelect.append('defs');
        //
        //     let lg = defs.append('linearGradient')
        //         .attr('id', 'Gradient2')
        //         .attr('x1', 0)
        //         .attr('x2', 1)
        //         .attr('y1', 0)
        //         .attr('y2', 0);
        //
        //     lg.append('stop')
        //         .attr('offset', '0%')
        //         .attr('stop-color', 'lightsteelblue');
        //
        //     lg.append('stop')
        //         .attr('offset', '100%')
        //         .attr('stop-color', 'white');
        //
        //
        //     svgSelect.append('rect')
        //         .attr('x', 10)
        //         .attr('y', 0)
        //         .attr('width', 373)
        //         .attr('height', 36)
        //         .style("fill", "url(#Gradient2)");
        // },

        // 向父组件传参：user_id and date
        display: function (event) {
            // dataService.getOverview(this.valueOfDate, response => {
            //     this.overview = response.data;
            //     // console.log(this.overview);
            //     // this.drawChord(this.overview[0], this.overview[1], this.overview[2], this.overview[3], this.overview[4]);
            // })
            this.$emit("conveyData", this.valueOfDate, this.level);

            this.load++;
            this.$emit("conveyLoad", this.load);
        },

        drawLegend: function () {
            let svg = this.svg;
            // create a list of keys
            let keys = ['Food', 'Shop & Service', 'Outdoors & Recreation',
                'Professional & Other Places', 'Travel & Transport', 'Nightlife Spot',
                'Arts & Entertainment', 'College & University', 'Residence']

            let color = d3.scaleOrdinal(['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3',
                '#fdb462', '#b3de69', '#fccde5', '#d9d9d9'])
                .domain(keys)

            svg.append("circle")
                .attr("cx", 10)
                .attr("cy", 15)
                .attr("r", 3)
                .style("fill", '#8dd3c7')

            svg.append("text")
                .attr("x", 18)
                .attr("y", 15)
                .style("fill", '#8dd3c7')
                .text('Food')
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
                .style("font-size", 10)

            svg.append("circle")
                .attr("cx", 80)
                .attr("cy", 15)
                .attr("r", 3)
                .style("fill", '#bebada')

            svg.append("text")
                .attr("x", 88)
                .attr("y", 15)
                .style("fill", '#bebada')
                .text('Nightlife Spot')
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
                .style("font-size", 10)

            svg.append("circle")
                .attr("cx", 10)
                .attr("cy", 37)
                .attr("r", 3)
                .style("fill", '#fb8072')

            svg.append("text")
                .attr("x", 18)
                .attr("y", 37)
                .style("fill", '#fb8072')
                .text('Residence')
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
                .style("font-size", 10)

            svg.append("circle")
                .attr("cx", 80)
                .attr("cy", 37)
                .attr("r", 3)
                .style("fill", '#80b1d3')

            svg.append("text")
                .attr("x", 88)
                .attr("y", 37)
                .style("fill", '#80b1d3')
                .text('Shop & Service')
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
                .style("font-size", 10)

            svg.append("circle")
                .attr("cx", 10)
                .attr("cy", 59)
                .attr("r", 3)
                .style("fill", '#fdb462')

            svg.append("text")
                .attr("x", 18)
                .attr("y", 59)
                .style("fill", '#fdb462')
                .text('Professional & Other Places')
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
                .style("font-size", 10)

            svg.append("circle")
                .attr("cx", 10)
                .attr("cy", 81)
                .attr("r", 3)
                .style("fill", '#b3de69')

            svg.append("text")
                .attr("x", 18)
                .attr("y", 81)
                .style("fill", '#b3de69')
                .text('Outdoors & Recreation')
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
                .style("font-size", 10)

            svg.append("circle")
                .attr("cx", 10)
                .attr("cy", 103)
                .attr("r", 3)
                .style("fill", '#fccde5')

            svg.append("text")
                .attr("x", 18)
                .attr("y", 103)
                .style("fill", '#fccde5')
                .text('Arts & Entertainment')
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
                .style("font-size", 10)

            svg.append("circle")
                .attr("cx", 10)
                .attr("cy", 125)
                .attr("r", 3)
                .style("fill", '#d9d9d9')

            svg.append("text")
                .attr("x", 18)
                .attr("y", 125)
                .style("fill", '#d9d9d9')
                .text('College & University')
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
                .style("font-size", 10)

            svg.append("circle")
                .attr("cx", 10)
                .attr("cy", 147)
                .attr("r", 3)
                .style("fill", '#bc80bd')

            svg.append("text")
                .attr("x", 18)
                .attr("y", 147)
                .style("fill", '#bc80bd')
                .text('Travel & Transport')
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
                .style("font-size", 10)

        },

        // drawChord: function (matrix, region_category, extend, variance, maxFlow){
        //     d3.selectAll('.chord').remove();
        //     let self = this;
        //     let svg = d3.select("#my_dataviz")
        //         .append("svg")
        //         .attr("class", "chord")
        //         .attr("width", 280)
        //         .attr("height", 300)
        //         .append("g")
        //         .attr("transform", "translate(140,85)")
        //
        //     let maxExtend = 30;
        //     for(let i = 0; i < extend.length; i++){
        //         extend[i] = extend[i] * maxExtend / maxFlow;
        //     }
        //
        //     let colors = ['#99CCCC', '#FFCC99', '#FFCCCC', '#0099cc', '#CC9999', '#FF6666',
        //         '#FFFF99', '#CCCCFF', '#CC9966', '#CCCCCC', '#666666', '#99CC66', '#CCCC99']
        //
        //     let whiteColor = d3.rgb('#FFFFFF')
        //     let yellowColor = d3.rgb('#f16913') // orange
        //     let computeYellowColor = d3.interpolate(whiteColor, yellowColor)
        //
        //     // computer max and min in variance
        //     let max = variance[0];
        //     let min = variance[0];
        //     for (let i = 0; i < variance.length; i++){
        //         max = max > variance[i] ? max : variance[i];
        //         min = min < variance[i] ? min : variance[i];
        //     }
        //
        //     let linearYellowColor = d3.scaleLinear()
        //         .domain([min, max])
        //         .range([0, 1])
        //
        //     // give this matrix to d3.chord(): it will calculates all the info we need to draw arc and ribbon
        //     let res = d3.chord()
        //         .padAngle(0.05)
        //         .sortSubgroups(d3.descending)
        //         (matrix)
        //
        //     let regionArcs = [];
        //     // 计算代表region category的arc的角度
        //     for (let i = 0; i < res.groups.length; i++){
        //         let arc = res.groups[i];
        //         let start = arc.startAngle;
        //         let end = arc.endAngle;
        //         let angle = end - start;
        //         let category = region_category[i];
        //         for(let j = 0; j < category.length; j++){
        //             if(category[j] > 0){
        //                 let regionArc = {}
        //                 end = start + angle * category[j];
        //                 regionArc['regionId'] = i;
        //                 regionArc['category'] = j;
        //                 regionArc['startAngle'] = start;
        //                 regionArc['endAngle'] = end;
        //                 regionArcs.push(regionArc);
        //
        //                 start = end;
        //             }
        //         }
        //     }
        //
        //     // console.log(regionArcs);
        //
        //     // add the groups on the outer part of the circle
        //     svg
        //         .datum(res)
        //         .append("g")
        //         .selectAll("g")
        //         .data(function (d) {
        //             return d.groups;
        //         })
        //         .enter()
        //         .append("g")
        //         .append("path")
        //         .style("fill", 'grey')
        //         .style("stroke", "black")
        //         .style("stroke-width", 0.1)
        //         .attr("d", d3.arc()
        //             .innerRadius(55)
        //             .outerRadius(60)
        //         )
        //         .on("mouseover", function (d){
        //             d3.select(this).style("fill", "black");
        //             self.$emit("highlightRegion", d.index);
        //         })
        //         .on("mouseout", function (){
        //             d3.select(this).style("fill", "grey");
        //         })
        //
        //     // 最外面一层
        //     svg
        //         .datum(res)
        //         .append("g")
        //         .selectAll("g")
        //         .data(function (d) {
        //             return d.groups;
        //         })
        //         .enter()
        //         .append("g")
        //         .append("path")
        //         .style("fill", function (d, i){
        //             return computeYellowColor(linearYellowColor(variance[i]));
        //         })
        //         .style("stroke", "black")
        //         .style("stroke-width", 0.1)
        //         .attr("d", d3.arc()
        //                     .innerRadius(function (d, i){return 70 + extend[i]})
        //                     .outerRadius(function (d, i){return 75 + extend[i]})
        //         )
        //
        //     svg
        //         .append("g")
        //         .selectAll("g")
        //         .data(regionArcs)
        //         .enter()
        //         .append("g")
        //         .append("path")
        //         .style("fill", function (d, i){
        //             return colors[d.category];
        //         })
        //         .style("stroke", "black")
        //         .style("stroke-width", 0.1)
        //         .attr("d", d3.arc()
        //             .innerRadius(60)
        //             .outerRadius(function (d, i){return 70 + extend[d.regionId]})
        //         )
        //
        //
        //     // Add the links between groups
        //     svg
        //         .datum(res)
        //         .append("g")
        //         .selectAll("path")
        //         .data(function (d) {
        //             return d;
        //         })
        //         .enter()
        //         .append("path")
        //         .attr("d", d3.ribbon()
        //             .radius(55)
        //         )
        //         .style("fill", function (d) {
        //             return (colors[d.source.index])
        //         }) // colors depend on the source group. Change to target otherwise.
        //         .style("stroke", function (d) {
        //             return (colors[d.source.index])
        //         })
        //         .style("stroke-width", 0.1)
        // }
    },

    mounted: function () {
        const width = 280;
        const height = 200;
        const svg = d3.select("#legend")
            .attr("width", width)
            .attr("height", height);
        this.svg = svg;
        this.drawLegend();
    },


    // 初始化所有用户
    // created: function (){
    //     dataService.getAllUsers(response => {
    //         // console.log(response.data)
    //         this.users = response.data
    //     })
    // }
}



