// /* global d3 $ */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// import pipeService from '../../service/pipeService'
// import DrawText from './drawText.js';
// import fetchLassoedDataPost from "../../service/dataService.js"
// import * as d3 from "d3";
import dataService from "@/service/dataService";
import * as d3Color from "d3-scale-chromatic";

export default {
    name: 'TextView',
    components: {},
    // props: ['user', 'date'],

    props: ['region', 'date', 'number'],
    data() {
        return {
            index: 0,
            width: 280,
            height: 400,
            exist: 0,
            content: [],
            data: [],
            startTime: 0,
            timeLength: 0,
            svg: null,
        }
    },

    computed: {
        information() {
            const {date, region} = this;
            return {date, region};
        }
    },

    watch: {
        // new project
        information(val) {
            dataService.getRegionInOut(this.date, this.region, response => {
                if (this.region !== -1) {
                    if (this.number === 1) {
                        this.updateSvg();
                        this.drawTimeSlot(response.data[0], response.data[1], this.width, this.height, 0, 0, 0);
                        this.drawLegend();
                    } else if (this.number === 2) {
                        if (this.exist === 0 | this.exist === 2) {
                            this.updateSvg();
                            this.exist = 0;
                        }
                        this.drawTimeSlot(response.data[0], response.data[1],
                            this.width / 2, this.height, this.exist * this.width / 2, 0, this.exist);
                        this.exist++;
                    } else if (this.number === 3){
                        if (this.exist === 0 | this.exist === 3) {
                            this.updateSvg();
                            this.exist = 0;
                        }
                        this.drawTimeSlot(response.data[0], response.data[1],
                            this.width / 2, this.height / 2, (this.exist % 2) * this.width / 2,
                            Math.floor(this.exist / 2) * this.height / 2, this.exist);
                        this.exist++;
                    } else if(this.number === 4){
                        if (this.exist === 0 | this.exist === 4) {
                            this.updateSvg();
                            this.exist = 0;
                        }
                        this.drawTimeSlot(response.data[0], response.data[1],
                            this.width / 2, this.height / 2, (this.exist % 2) * this.width / 2,
                            Math.floor(this.exist / 2) * this.height / 2, this.exist);
                        this.exist++;
                    }

                }
            })
        },
    },

    mounted: function () {
        const width = 280;
        const height = 400;
        const svg = d3.select("#timeView")
            .attr("width", width)
            .attr("height", height);
        this.svg = svg;
    },

    methods: {
        updateSvg: function () {
            d3.select('#timeView').remove();
            const svg = d3.select("#textContainer")
                .append('svg')
                .attr("id", "timeView")
                .attr("width", this.width)
                .attr("height", this.height);

            this.svg = svg;
        },

        drawLegend: function () {
            let svg = this.svg;
            // create a list of keys
            let keys = ['Food', 'Shop & Service', 'Outdoors & Recreation',
                'Professional Places', 'Travel & Transport', 'Nightlife Spot',
                'Arts & Entertainment', 'College & University', 'Residence', 'Event', 'Else']

            // Usually you have a color scale in your chart already
            // let color = d3.scaleOrdinal(['#9c755f', '#ff9da7', '#af7aa1', '#edc949', '#59a14f',
            //     '#76b7b2', '#e15759', '#f28e2c', '#4e79a7', '#085E7D', '#bab0ab'])
            //     .domain(keys);

            let color = d3.scaleOrdinal(['#99CCCC', '#FFCC99', '#FFCCCC', '#0099CC', '#CC9999',
                '#FF6666', '#e3e309', '#CCCCFF', '#CC9966', '#CCCCCC', '#bab0ab'])
                .domain(keys)

            // Add one dot in the legend for each name.
            svg.selectAll("mydots")
                .data(keys)
                .enter()
                .append("circle")
                .attr("cx", 185)
                .attr("cy", function (d, i) {
                    return 10 + i * 10
                }) // 100 is where the first dot appears. 25 is the distance between dots
                .attr("r", 2)
                .style("fill", function (d) {
                    return color(d)
                })

            // Add one dot in the legend for each name.
            svg.selectAll("mylabels")
                .data(keys)
                .enter()
                .append("text")
                .attr("x", 195)
                .attr("y", function (d, i) {
                    return 10 + i * 10
                }) // 100 is where the first dot appears. 25 is the distance between dots
                .style("fill", function (d) {
                    return color(d)
                })
                .text(function (d) {
                    return d
                })
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
                .style("font-size", 8)
        },

        drawTimeSlot: function (inData, outData, width, height, cx, cy, index) {
            this.$emit("conveyIndex", index);

            let svg = this.svg;
            const margin = (this.number === 1 ? 20 : 10);
            const axisMargin = 10;
            const axisLength = height - margin * 2 - axisMargin;
            const maxHeight = width / 2 - (this.number === 1 ? 40 : 10);
            const slotNum = 24;

            const slotWidth = (axisLength - 2 * axisMargin) / slotNum;
            const windowHeight = maxHeight * 2 + (this.number === 1 ? 40 : 10);
            const windowSlotsNum = 4;

            let maxValue;
            maxValue = this.findMax(outData);
            maxValue = this.findMax(inData);
            let scale = maxHeight / maxValue;

            // compute positions
            let positions = this.computePosition(inData, outData, scale, width / 2);

            // draw rects
            let rects = svg.append("g")
                .classed("rects", true)
                .selectAll("rect")
                .data(positions)
                .enter()
                .append("rect")
                .classed("rect", true)
                .attr("x", d => cx + d[1])
                .attr("y", d => cy + margin + axisMargin + d[0] * slotWidth)
                .attr("width", d => d[2])
                .attr("height", slotWidth)
                .attr("fill", d => d[3])
                .attr("opacity", 1);

            // draw time axis
            let line = svg.append('line')
                .style("Stroke", "black")
                .style("opacity", 0.5)
                .attr("x1", cx + width / 2)
                .attr("y1", cy + margin)
                .attr("x2", cx + width / 2)
                .attr("y2", cy + margin + axisLength)

            // Slide Window
            this.startTime = (slotNum - windowSlotsNum) / 2
            this.timeLength = windowSlotsNum;
            this.$emit("passTime", this.startTime, this.timeLength, index);

            let g = svg.selectAll('.draggableSquare' + index)
                .data([{
                    x: cx + (width - windowHeight) / 2,
                    y: cy + margin + axisMargin + (slotNum - windowSlotsNum) / 2 * slotWidth,
                    width: windowHeight,
                    height: slotWidth * 4
                }])
                .enter()
                .append('g')
                .attr('class', 'draggableSquare' + index);

            g.append('svg:rect')
                .attr('class', 'resizingSquare' + index)
                .attr("width", function (d) {
                    return d.width + 12;
                })
                .attr("height", function (d) {
                    return d.height + 12;
                })
                .attr("x", function (d) {
                    return d.x - 6;
                })
                .attr("y", function (d) {
                    return d.y - 6;
                })
                .attr("rx", 6)
                .attr("ry", 6)
                .attr("opacity", 0)
                .style("fill", 'white')
                .style("cursor", 's-resize')

            g.append('svg:rect')
                .attr('class', 'square' + index)
                .attr("width", function (d) {
                    return d.width;
                })
                .attr("height", function (d) {
                    return d.height;
                })
                .attr("x", function (d) {
                    return d.x;
                })
                .attr("y", function (d) {
                    return d.y;
                })
                .style("fill", "black")
                .style("cursor", "move")
                .attr("opacity", 0.1)

            // Drag and resize
            d3.select(".square" + index).call(this.drag(margin, axisMargin, slotWidth, index));
            d3.select(".resizingSquare" + index).call(this.resize(margin, axisMargin, slotWidth, index));
        },

        resize: function (margin, axisMargin, slotWidth, index) {
            let self = this;
            let x, y, w, h;
            let c = d3.select('.resizingSquare' + index);
            let s = d3.select(".square" + index);

            function resizeStarted() {
                s.attr("opacity", 0.5);
            }

            function resized() {
                x = Number(d3.select(this).attr("x"));
                y = Number(d3.select(this).attr("y"));
                w = Number(d3.select(this).attr("width"));
                h = Number(d3.select(this).attr("height"));

                let c3 = {x: x + w, y: y + h};

                c.attr('height', function () {
                    return h + (d3.event.sourceEvent.offsetY - c3.y) + 12;
                })
                s.attr('height', function () {
                    return h + (d3.event.sourceEvent.offsetY - c3.y);
                })
            }

            function resizeEnded() {
                // resize discretely
                let correction = Math.round(s.attr("height") / slotWidth);
                correction = (correction < 0) ? 1 : correction;
                c.attr("height", correction * slotWidth + 12);
                s.attr("height", correction * slotWidth);

                // Pass data to the state transition view
                self.startTime = Math.round((s.attr("y") - margin - axisMargin) / slotWidth);
                self.timeLength = s.attr("height") / slotWidth;
                let str = d3.select(this).attr("class")
                let index = Number(str.charAt(str.length - 1));
                self.$emit("passTime", self.startTime, self.timeLength, index);

                s.attr("opacity", 0.1);
            }

            return d3.drag()
                .on("start", resizeStarted)
                .on("drag", resized)
                .on("end", resizeEnded);
        },

        drag: function (margin, axisMargin, slotWidth, index) {
            // let self be the vue instance, this variable will change
            let self = this;
            let dy, dy2;
            let g = d3.select(".draggableSquare" + index);
            let bigRect = d3.select(".resizingSquare" + index);
            let smallRect = d3.select(".square" + index)

            function dragstarted() {
                smallRect.attr("opacity", 0.5);
                // calculate the x_distance between mouse and the origin rect
                // to avoid jump move of rect
                dy = d3.event.y - smallRect.attr("y");
                dy2 = d3.event.y - bigRect.attr("y");
            }

            function dragged() {
                g.select(".square" + index).attr("y", d3.event.y - dy);
                g.select(".resizingSquare" + index).attr("y", d3.event.y - dy2);
            }

            function dragended() {
                // drag discretely
                let slotIndex = Math.round((smallRect.attr("y") - margin - axisMargin) / slotWidth);
                let correction = smallRect.attr("y") - slotIndex * slotWidth - margin - axisMargin;
                smallRect.attr("y", smallRect.attr("y") - correction);
                bigRect.attr("y", bigRect.attr("y") - correction);
                d3.select(this).attr("opacity", 0.1);

                // Pass data to the state transition view
                self.startTime = slotIndex;
                self.timeLength = smallRect.attr("height") / slotWidth;
                let str = d3.select(this).attr("class")
                let index = Number(str.charAt(str.length - 1));
                self.$emit("passTime", self.startTime, self.timeLength, index);
            }

            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        },

        findMax: function (a) {
            let max = 0;
            for (let i = 0; i < a.length; i++) {
                let slot = a[i];
                let sum = 0;
                for (let j = 0; j < slot.length; j++) {
                    sum += slot[j];
                }
                max = sum > max ? sum : max;
            }
            return max;
        },

        // only need to compute x and width, y is fixed
        computePosition: function (inData, outData, scale, zero) {
            let data = [];
            for (let i = 0; i < inData.length; i++) {
                let slotIn = inData[i];
                let slotOut = outData[i];
                let inX = zero;
                let outX = zero;
                let colors = ['#bab0ab', '#99CCCC', '#FFCC99', '#FFCCCC', '#0099CC', '#CC9999',
                    '#FF6666', '#e3e309', '#CCCCFF', '#CC9966', '#CCCCCC']
                // let colors = ['#bab0ab', '#9c755f', '#ff9da7', '#af7aa1', '#edc949', '#59a14f',
                //     '#76b7b2', '#e15759', '#f28e2c', '#4e79a7', '#085E7D']
                // let colors = ['#D1D1D1', '#99CCCC', '#FFCC99', '#FFCCCC', '#0099CC', '#CC9999', '#FF6666', '#FFFF99', '#CCCCFF', '#CC9966', '#CCCCCC'];
                // let rect = {id: 0, y: 0, height: 0, color: "black"};

                // compute inData
                for (let j = 0; j < slotIn.length; j++) {
                    let rect = [];
                    inX = inX - slotIn[j] * scale;
                    rect.push(i);
                    rect.push(inX);
                    rect.push(slotIn[j] * scale);
                    rect.push(colors[j]);
                    data.push(rect);
                }

                // compute outData
                for (let j = 0; j < slotOut.length; j++) {
                    let rect = [];
                    rect.push(i);
                    rect.push(outX);
                    outX = outX + slotOut[j] * scale;
                    rect.push(slotOut[j] * scale);
                    rect.push(colors[j]);
                    data.push(rect);
                }
            }
            return data;
        },

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
