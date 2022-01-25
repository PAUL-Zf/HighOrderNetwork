/* eslint-disable */

import dataService from "@/service/dataService";
import response from "vue-resource/src/http/response";

export default {
    data() {
        return {
            users: [],
            dates: [],
            valueOfUser: '',
            valueOfDate: ''
        }
    },

    methods: {
        // 向父组件传参：user_id and date
        display: function (event) {
            this.$emit("conveyData", this.valueOfUser, this.valueOfDate);
        }
    },


    watch: {
        // 监听valueOfUser实现 user->date
        valueOfUser(val) {
            dataService.getDatesByUser(val, response => {
                console.log(response.data)
                this.dates = response.data
            })
        }
    },

    // 初始化所有用户
    created: function (){
        dataService.getAllUsers(response => {
            // console.log(response.data)
            this.users = response.data
        })
    }
}


// import * as d3 from 'd3';
// const typeOptions = ['钢筋混凝土管', '球墨铸铁管', '钢管', 'PE管', 'NULL'];
//
//
//
// export default {
//     name: 'VideoView',
//     components: {},
//     props: {w:0,h:0},
//
//
//     data() {
//         return {
//             arr:[],
//             div:null,
//             barHeight:60,
//             radius: 0,
//             checkAll: false,
//             checkedTypes: ['钢筋混凝土管', '球墨铸铁管'],
//             types: typeOptions,
//             isIndeterminate: true
//         }
//     },
//     watch: {
//         w(newValue) {
//             this.change(this.w,this.h);
//         }
//     },
//     methods: {
//         change: function (w,h) {
//             console.log(w)
//             console.log(h)
//             d3.select('#mysvg')
//                 .selectAll("g").remove();
//             // console.log(d3.select('#mysvg').getBBox());
//             let ww = d3.select("#mysvg").node().getBoundingClientRect().width
//             let hh = d3.select("#mysvg").node().getBoundingClientRect().height
//             console.log(ww);
//             console.log(hh);
//             // console.log(d3.select('#mysvg').height);
//             this.draw(w*ww,hh-h*hh,this.draw)
//         },
//     draw: function(width,height,aaa) {
//         // console.log("inaaaaaaaaaaaaaaaaa"+aaa)
//         let color = d3.scale.ordinal()
//             .range(["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]);
//
//         var svg = d3.select('#mysvg')
//             .append("g")
//             // .attr("transform", "translate(" + 50 + "," + 50 + ")")
//         let tmp = this;
//         console.log('=====================')
//         console.log(tmp)
//         d3.csv("http://127.0.0.1:8888/static/data.csv", function(error, data) {
//
//             // data.sort(function(a,b) { return b.value - a.value; });
//
//             var extent = d3.extent(data, function(d) { return d.value; });
//             var barScale = d3.scale.linear()
//                 .domain(extent)
//                 .range([0, 60]);
//
//             var keys = data.map(function(d,i) { return d.name; });
//             var numBars = keys.length;
//
//             var x = d3.scale.linear()
//                 .domain(extent)
//                 .range([0, -60]);
//             //
//             // var xAxis = d3.svg.axis()
//             //     .scale(x).orient("left")
//             //     .ticks(3)
//             //     .tickFormat(formatNumber);
//             var div = d3.select("#labelsContainer").append("div")
//                 .attr("class", "tooltip")
//                 .style("opacity", 0);
//             var arc = d3.svg.arc()
//                 .startAngle(function(d,i) { return (i * 2 * Math.PI) / numBars; })
//                 .endAngle(function(d,i) { return ((i + 1) * 2 * Math.PI) / numBars; })
//                 .innerRadius(10)
//
//             ;
//             // let tmp = this;
//             // console.log("tmp"+tmp)
//             var segments = svg.selectAll("path")
//                 .data(data)
//                 .enter().append("path")
//                 .each(function(d) { d.outerRadius = 10+d.value*300; })
//                 .style("fill", function (d) { return color(d.name); })
//                 .attr("d", arc)
//                 .attr("transform", "translate(" + width + "," + height + ")")
//                 .on("mouseover", function(d) {
//                     // console.log("--==============")
//                     div.transition()
//                         .duration(200)
//                         .style("opacity", .9);
//                     div.html(d.name+" " + d.value)
//                         .style("left", (width) + "px")
//                         .style("top", (height - 28) + "px");
//                 })
//                 .on("mouseout", function(d) {
//                     // console.log("--==============")
//                     div.transition()
//                         .duration(500)
//                         .style("opacity", 0);
//                 })
//                 .on('click',function() {
//                     // console.log(aaa)
//                     let num = (Math.random()+1)
//                     let i = Math.floor(Math.random()*7);
//                     let a = []
//                     for (let j = 0; j < num;j++) {
//                         a.push(i);
//                         i = Math.floor((i+Math.random()*2+1)%7);
//                         switch (i) {
//                             case 0:
//                                 aaa(width,height-100,aaa)
//                                 break;
//                             case 1:
//                                 aaa(width-100,height-100,aaa)
//                                 break;
//                             case 2:
//                                 aaa(width-100,height,aaa)
//                                 break;
//                             case 3:
//                                 aaa(width-100,height+100,aaa)
//                                 break;
//                             case 4:
//                                 aaa(width,height+100,aaa)
//                                 break;
//                             case 5:
//                                 aaa(width+100,height+100,aaa)
//                                 break;
//                             case 6:
//                                 aaa(width+100,height+100,aaa)
//                                 break;
//                             case 7:
//                                 aaa(width+100,height-100,aaa)
//                                 break;
//                         }
//                     }
//                     console.log("a"+a)
//                     // aaa(width+100,height,aaa)
//                     tmp.$emit('changemap', a);
//                    // this.draw(width+100,height);
//                 })
//
//             // console.log(segments)
//             // svg.selectAll("path")
//             //     .on("mouseover", function(d) {
//             //         console.log("--==============")
//             //         // div.transition()
//             //         //     .duration(200)
//             //         //     .style("opacity", .9);
//             //         // div.html(d.name+" " + d.value)
//             //         //     .style("left", (width) + "px")
//             //         //     .style("top", (height - 28) + "px");
//             //     })
//             //     .on("mouseout", function(d) {
//             //         console.log("--==============")
//             //         // div.transition()
//             //         //     .duration(500)
//             //         //     .style("opacity", 0);
//             //     })
//             //     .on('click',function() {
//             //         console.log("==========================");
//             //         // this.draw(width+100,height);
//             //     })
//
//
//             // segments.transition().ease("elastic").duration(1000).delay(function(d,i) {return (25-i)*100;})
//             //     .attrTween("d", function(d,index) {
//             //         var i = d3.interpolate(d.outerRadius, barScale(+d.value));
//             //         return function(t) { d.outerRadius = i(t)+20; return arc(d,index); };
//             //     });
//             // var labelRadius = barHeight * 1.025;
//             //
//             // var labels = svg.append("g")
//             //     .classed("labels", true);
//             //
//             // labels.append("def")
//             //     .append("path")
//             //     .attr("id", "label-path")
//             //     .attr("d", "m0 " + -labelRadius + " a" + labelRadius + " " + labelRadius + " 0 1,1 -0.01 0");
//         });
// }
//
//
// },
//     mounted: function () {
//         // this.drawVideo = new DrawVideo('#labelsContainer')
//         // console.log('this.videoId: ', this.videoId)
//         // dataService.visionData(this.videoId, visionData => {
//         //     this.drawVideo.layout('#labelsContainer', visionData['data'], this.videoUrl)
//         //     // console.log('videojs: ', videojs);
//         // console.log(width)
//         var width = 100
//         var height = 100
//         this.div = d3.select("body").append("div")
//             .attr("class", "tooltip")
//             .style("opacity", 0);
//         // console.log(document.getElementById('mysvg').getBoundingClientRect())
//         // console.log("outer: " + this)
//         // console.log(this.draw)
//         // this.draw(100,100,this.draw)
//         // this.draw(300,300)
//         // this.draw(100,200,this.barHeight)
//         // dataService.poseData(this.videoId, poseData => {
//         //     this.poseData = poseData['data']
//         //     console.log('this.poseData: ', this.poseData)
//         // })
//     },
// }
