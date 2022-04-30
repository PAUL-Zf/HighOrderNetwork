// /* global d3 $ */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// import pipeService from '../../service/pipeService'
// import DrawText from './drawText.js';
// import fetchLassoedDataPost from "../../service/dataService.js"
// import * as d3 from "d3";
import dataService from "@/service/dataService";
import * as d3Color from "d3-scale-chromatic";
import attr from "d3-selection/src/selection/attr";
import response from "vue-resource/src/http/response";

export default {
    name: 'TextView',
    components: {},

    props: ['region', 'date', 'number', 'time', 'halfInterval', 'generate', 'load', 'selects'],
    data() {
        return {
            index: 0,
            width: 1130,
            height: 130,
            slotWidth: null,
            margin: null,
            axisMargin: null,
            exist: 0,
            content: [],
            data: [],
            startTime: 0,
            timeLength: 0,
            start: 0,    // work as start algorithm signal
            svg: null,
            checkin: null,
            type: false,    // false: lineChart  true: barchart
            category_map: {
                'Food': 0,
                'Shop & Service': 1,
                'Outdoors & Recreation': 2,
                'Professional & Other Places': 3,
                'Travel & Transport': 4,
                'Nightlife Spot': 5,
                'Arts & Entertainment': 6,
                'College & University': 7,
                'Residence': 8,
            },
            colors: ['#8dd3c7', '#80b1d3', '#b3de69', '#fdb462', '#bc80bd',
                '#bebada', '#fccde5', '#d9d9d9', '#fb8072', 'black']
        }
    },

    computed: {
        information() {
            const {time, halfInterval} = this;
            return {time, halfInterval};
        }
    },

    watch: {
        // new project
        load(val) {
            dataService.getCheckin(this.date, response => {
                this.checkin = response.data;
                this.updateSvg();
                this.drawLineChart();
                this.type = false;
                this.$emit("conveyType", this.type);
            })
        },

        generate(val) {
            let params = {selects: this.selects};
            dataService.getRegionInOut(params, response => {
                // this.updateSvg();
                // this.type = true;
                this.drawTimeSlot(response.data[0], response.data[1], this.width, this.height);
                this.$emit("conveyType", this.type);
            })
        },

        information(val) {
            this.resetSlideWindow();
        }
    },

    mounted: function () {
        const width = 1130;
        const height = 130;
        const svg = d3.select("#timeView")
            .attr("width", width)
            .attr("height", height);
        this.svg = svg;
    },

    methods: {
        startAlgorithm(){
            this.start++;
            this.$emit("conveyStart", this.start);
        },

        updateSvg: function () {
            d3.select('#timeView').remove();
            const svg = d3.select("#textContainer")
                .append('svg')
                .attr("id", "timeView")
                .attr("width", this.width)
                .attr("height", this.height);

            this.svg = svg;
        },

        drawLineChart: function () {
            let svg = this.svg;

            const leftMargin = 60;
            const bottomMargin = 20;
            const axisMargin = 10;
            const axisLength = this.width - leftMargin * 2;
            const maxHeight = this.height / 2 - 20;
            const slotNum = 48;

            const slotWidth = (axisLength - 2 * axisMargin) / slotNum;
            const windowHeight = maxHeight * 2 + 20;
            const windowSlotsNum = 4;

            this.slotWidth = slotWidth;
            this.margin = leftMargin
            this.axisMargin = axisMargin;

            // draw time axis
            let line = svg.append('line')
                .style("Stroke", "black")
                .style("opacity", 1)
                .attr("x1", leftMargin)
                .attr("y1", this.height - bottomMargin)
                .attr("x2", leftMargin + axisLength)
                .attr("y2", this.height - bottomMargin)

            // Initialise a X axis:
            let x = d3.scaleLinear().range([0, axisLength - 2 * axisMargin]);
            x.domain([0, slotNum - 1])
            let y = d3.scaleLinear().range([windowHeight - 20, 0])
            y.domain([0, d3.max(this.checkin)])

            let lineG = svg.append("g")
                .attr("transform", "translate(" + (leftMargin + axisMargin) + "," + bottomMargin + ")")

            // draw line
            lineG.append("path")
                .datum(this.checkin)
                .attr("d", d3.line()
                    .x(function (d, i) {
                        return x(i)
                    })
                    .y(function (d) {
                        return y(d)
                    }))
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2.5)


            // add text
            let startTime = svg.append('text')
                .attr("y", this.height - bottomMargin)
                .attr("x", leftMargin - 15)
                .attr('text-anchor', 'middle')
                .attr("class", 'timeText')
                .text("00:00")
                .style("font-size", 10)
            let endTime = svg.append('text')
                .attr("y", this.height - bottomMargin)
                .attr("x", leftMargin + axisMargin + axisLength + 5)
                .attr('text-anchor', 'middle')
                .attr("class", 'timeText')
                .text("24:00")
                .style("font-size", 10)

            // Add time label
            let timeLabels = ["01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00",
                "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
                "21:00", "22:00", "23:00"]

            let timeLabel = svg.selectAll("whatever")
                .data(timeLabels)
                .enter()
                .append('text')
                .attr("y", this.height - bottomMargin / 2)
                .attr("x", function(d, i) {return leftMargin + axisMargin + slotWidth * 2 * (i + 1)})
                .attr('text-anchor', 'middle')
                .attr("class", 'timeText')
                .text(d => d)
                .style("font-size", 8)

            // Slide Window
            this.startTime = 18
            this.timeLength = 2;
            // this.$emit("passTime", this.startTime, this.timeLength);

            let g = svg.selectAll('.draggableSquare')
                .data([{
                    x: leftMargin + axisMargin + this.startTime * slotWidth,
                    y: (this.height - windowHeight) / 2,
                    width: slotWidth * this.timeLength,
                    height: windowHeight
                }])
                .enter()
                .append('g')
                .attr('class', 'draggableSquare');

            g.append('svg:rect')
                .attr('class', 'resizingSquare')
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
                .style("cursor", 'w-resize')

            g.append('svg:rect')
                .attr('class', 'square')
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
                .attr("stroke", 'black')
                .attr("stroke-width", 1)
                .style("fill", "black")
                .style("cursor", "move")
                .attr("opacity", 0.1)

            // Drag and resize
            d3.select(".square").call(this.drag(leftMargin, axisMargin, slotWidth));
            d3.select(".resizingSquare").call(this.resize(leftMargin, axisMargin, slotWidth));
        },

        drawLegend: function () {
            let svg = this.svg;
            // create a list of keys
            let keys = ['Food', 'Shop & Service', 'Outdoors & Recreation',
                'Professional Places', 'Travel & Transport', 'Nightlife Spot',
                'Arts & Entertainment', 'College & University', 'Residence', 'Event', 'Else']

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

        resetSlideWindow: function () {
            let c = d3.select('.resizingSquare');
            let s = d3.select(".square");

            c.attr("width", 2 * this.halfInterval * this.slotWidth + 12);
            s.attr("width", 2 * this.halfInterval * this.slotWidth);
            s.attr("x", this.margin + this.axisMargin + this.time * 2 * this.slotWidth)
            c.attr("x", this.margin + this.axisMargin + this.time * 2 * this.slotWidth)
        },

        drawTimeSlot: function (inData, outData, width, height) {
            let svg = this.svg;
            let self = this;
            const margin = 60;
            const axisMargin = 10;
            const axisLength = width - margin * 2;
            const maxHeight = height / 2 - 20;
            const slotNum = 48;

            const slotWidth = (axisLength - 2 * axisMargin) / slotNum;
            const windowHeight = maxHeight * 2 + 20;
            const windowSlotsNum = 4;

            let maxValue;
            maxValue = this.findMax(outData);
            maxValue = maxValue > this.findMax(inData) ? maxValue : this.findMax(inData);
            let scale = maxHeight / maxValue;

            // compute positions
            let positions = this.computePosition(inData, outData, scale, height / 2);

            // draw white canvas
            let canvas = svg.append("g")
                .attr("class", "barCharts")
                .append("rect")
                .attr("x", margin + axisMargin + self.startTime * slotWidth)
                .attr("y", 0)
                .attr("width", slotWidth * this.timeLength)
                .attr("height", this.height - 21)
                .attr("fill", 'white')

            // draw rects
            let rects = svg.append("g")
                .attr("class", "barCharts")
                .selectAll("timeSlots")
                .data(positions)
                .enter()
                .append("rect")
                .attr("class", d => "timeSlot" + d[0])
                .attr("x", d => margin + axisMargin + d[0] * slotWidth)
                .attr("y", d => d[1])
                .attr("width", slotWidth)
                .attr("height", d => d[2])
                // .attr("fill", 'lightsteelblue')
                .attr("fill", d => d[3])
                .attr("opacity", d => (d[0] >= self.startTime && d[0] < self.startTime + self.timeLength) ? 1 : 0)
                .attr("stroke", '#505254')
                .attr("stroke-width", 1)

            // // draw time axis
            // let line = svg.append('line')
            //     .style("Stroke", "black")
            //     .style("opacity", 0.5)
            //     .attr("x1", margin)
            //     .attr("y1", height / 2)
            //     .attr("x2", margin + axisLength)
            //     .attr("y2", height / 2)
            // let SLine = svg.append('line')
            //     .style("Stroke", "black")
            //     .style("opacity", 1)
            //     .attr("x1", margin)
            //     .attr("y1", height / 2 - 10)
            //     .attr("x2", margin)
            //     .attr("y2", height / 2 + 10)
            // let ELine = svg.append('line')
            //     .style("Stroke", "black")
            //     .style("opacity", 1)
            //     .attr("x1", margin + axisLength)
            //     .attr("y1", height / 2 - 10)
            //     .attr("x2", margin + axisLength)
            //     .attr("y2", height / 2 + 10)


            // // add text
            // let startTime = svg.append('text')
            //     .attr("y", this.height - margin)
            //     .attr("x", margin - 15)
            //     .attr('text-anchor', 'middle')
            //     .attr("class", 'timeText')
            //     .text("00:00")
            //     .style("font-size", 10)
            // let endTime = svg.append('text')
            //     .attr("y", this.height - margin)
            //     .attr("x", margin + axisMargin + axisLength + 5)
            //     .attr('text-anchor', 'middle')
            //     .attr("class", 'timeText')
            //     .text("24:00")
            //     .style("font-size", 10)
            // let six = svg.append('text')
            //     .attr("y", this.height - 10)
            //     .attr("x", margin + axisMargin + slotWidth * 12)
            //     .attr('text-anchor', 'middle')
            //     .attr("class", 'timeText')
            //     .text("06:00")
            //     .style("font-size", 10)
            // let twelve = svg.append('text')
            //     .attr("y", this.height - 10)
            //     .attr("x", margin + axisMargin + slotWidth * 24)
            //     .attr('text-anchor', 'middle')
            //     .attr("class", 'timeText')
            //     .text("12:00")
            //     .style("font-size", 10)
            // let eighteen = svg.append('text')
            //     .attr("y", this.height - 10)
            //     .attr("x", margin + axisMargin + slotWidth * 36)
            //     .attr('text-anchor', 'middle')
            //     .attr("class", 'timeText')
            //     .text("18:00")
            //     .style("font-size", 10)

            // Slide Window
            this.$emit("passTime", this.startTime, this.timeLength);

            // remove original slide window
            d3.selectAll('.draggableSquare').remove();

            let g = svg.selectAll('.draggableSquare')
                .data([{
                    x: margin + axisMargin + self.startTime * slotWidth,
                    y: (height - windowHeight) / 2,
                    width: slotWidth * self.timeLength,
                    height: windowHeight
                }])
                .enter()
                .append('g')
                .attr('class', 'draggableSquare');

            g.append('svg:rect')
                .attr('class', 'resizingSquare')
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
                .style("cursor", 'w-resize')

            g.append('svg:rect')
                .attr('class', 'square')
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
            d3.select(".square").call(this.drag(margin, axisMargin, slotWidth));
            d3.select(".resizingSquare").call(this.resize(margin, axisMargin, slotWidth));
        },

        resize: function (margin, axisMargin, slotWidth) {
            let self = this;
            let x, y, w, h;
            let c = d3.select('.resizingSquare');
            let s = d3.select(".square");

            function resizeStarted() {
                s.attr("opacity", 0.5);

                // remove barCharts
                d3.selectAll(".barCharts").remove();
            }

            function resized() {
                x = Number(d3.select(this).attr("x"));
                y = Number(d3.select(this).attr("y"));
                w = Number(d3.select(this).attr("width"));
                h = Number(d3.select(this).attr("height"));

                let c3 = {x: x + w, y: y + h};

                c.attr('width', function () {
                    return w + (d3.event.sourceEvent.offsetX - c3.x) + 12;
                })
                s.attr('width', function () {
                    return w + (d3.event.sourceEvent.offsetX - c3.x);
                })
            }

            function resizeEnded() {
                // resize discretely
                let correction = Math.round(s.attr("width") / slotWidth);
                correction = (correction < 0) ? 1 : correction;
                c.attr("width", correction * slotWidth + 12);
                s.attr("width", correction * slotWidth);

                // Pass data to the state transition view
                self.startTime = Math.round((s.attr("x") - margin - axisMargin) / slotWidth);
                self.timeLength = s.attr("width") / slotWidth;
                self.$emit("passTime", self.startTime, self.timeLength);

                // highlight timeSlots in slideWindow
                if (self.type) {
                    for (let i = 0; i < 48; i++) {
                        if (i >= self.startTime && i < self.startTime + self.timeLength)
                            d3.selectAll(".timeSlot" + i).attr('opacity', 1);
                        else
                            d3.selectAll(".timeSlot" + i).attr('opacity', 0.5);
                    }
                }

                s.attr("opacity", 0.1);
            }

            return d3.drag()
                .on("start", resizeStarted)
                .on("drag", resized)
                .on("end", resizeEnded);
        },

        drag: function (margin, axisMargin, slotWidth) {
            // let self be the vue instance, this variable will change
            let self = this;
            let dx, dx2;
            let g = d3.select(".draggableSquare");
            let bigRect = d3.select(".resizingSquare");
            let smallRect = d3.select(".square")

            function dragstarted() {
                smallRect.attr("opacity", 0.5);
                // calculate the x_distance between mouse and the origin rect
                // to avoid jump move of rect
                dx = d3.event.x - smallRect.attr("x");
                dx2 = d3.event.x - bigRect.attr("x");

                // remove barCharts
                d3.selectAll(".barCharts").remove();
            }

            function dragged() {
                g.select(".square").attr("x", d3.event.x - dx);
                g.select(".resizingSquare").attr("x", d3.event.x - dx2);
            }

            function dragended() {
                // drag discretely
                let slotIndex = Math.round((smallRect.attr("x") - margin - axisMargin) / slotWidth);
                let correction = smallRect.attr("x") - slotIndex * slotWidth - margin - axisMargin;
                smallRect.attr("x", smallRect.attr("x") - correction);
                bigRect.attr("x", bigRect.attr("x") - correction);
                d3.select(this).attr("opacity", 0.1);

                // Pass data to the state transition view
                self.startTime = slotIndex;
                self.timeLength = smallRect.attr("width") / slotWidth;
                self.$emit("passTime", self.startTime, self.timeLength);

                // highlight timeSlots in slideWindow
                if (self.type) {
                    for (let i = 0; i < 48; i++) {
                        if (i >= self.startTime && i < self.startTime + self.timeLength)
                            d3.selectAll(".timeSlot" + i).attr('opacity', 1);
                        else
                            d3.selectAll(".timeSlot" + i).attr('opacity', 0.5);
                    }
                }
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
                let colors = ['#99CCCC', '#FFCC99', '#FFCCCC', '#0099CC', '#CC9999',
                    '#FF6666', '#e3e309', '#CCCCFF', '#CC9966', '#CCCCCC']
                // let colors = ['#bab0ab', '#9c755f', '#ff9da7', '#af7aa1', '#edc949', '#59a14f',
                //     '#76b7b2', '#e15759', '#f28e2c', '#4e79a7', '#085E7D']
                // let colors = ['#D1D1D1', '#99CCCC', '#FFCC99', '#FFCCCC', '#0099CC', '#CC9999', '#FF6666', '#FFFF99', '#CCCCFF', '#CC9966', '#CCCCCC'];
                // let rect = {id: 0, y: 0, height: 0, color: "black"};

                // compute inData
                let inFlow = 0
                let inRect = [];
                let max = 0;
                let maxIndex = 0;
                for (let j = 0; j < slotIn.length; j++) {
                    inFlow += slotIn[j] * scale;
                    if (slotIn[j] * scale > max) {
                        max = slotIn[j] * scale;
                        maxIndex = j;
                    }
                    // inX = inX - slotIn[j] * scale;
                    // rect.push(i);
                    // rect.push(inX);
                    // rect.push(slotIn[j] * scale);
                    // rect.push(colors[j]);
                    // data.push(rect);
                }
                inRect.push(i);
                inRect.push(inX - inFlow);
                inRect.push(inFlow);
                inRect.push(this.colors[maxIndex]);
                data.push(inRect);


                let outFlow = 0
                let outRect = [];
                max = 0;
                maxIndex = 0;
                // compute outData
                for (let j = 0; j < slotOut.length; j++) {
                    outFlow += slotOut[j] * scale;
                    if (slotOut[j] * scale > max) {
                        max = slotOut[j] * scale;
                        maxIndex = j;
                    }
                    // let rect = [];
                    // rect.push(i);
                    // rect.push(outX);
                    // outX = outX + slotOut[j] * scale;
                    // rect.push(slotOut[j] * scale);
                    // rect.push(colors[j]);
                    // data.push(rect);
                }
                outRect.push(i);
                outRect.push(outX);
                outRect.push(outFlow);
                outRect.push(this.colors[maxIndex]);
                data.push(outRect);
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
