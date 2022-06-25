/* eslint-disable */

import dataService from "@/service/dataService";
import response from "vue-resource/src/http/response";

export default {
    data() {
        return {
            // slider
            legendView: null,
            gridView: null,
            temporalView: null,
            dataset: '',
            datasets: ['New York'],
            value: [0, 6],
            scaleValue: 0,
            number: 10,
            marks: {
                0: {style: "font-size: 8px", label: 'min'},
                1: {style: "font-size: 8px", label: '5'},
                2: {style: "font-size: 8px", label: '10'},
                3: {style: "font-size: 8px", label: '15'},
                5: {style: "font-size: 8px", label: '60'},
                6: {style: "font-size: 8px", label: 'max'}
            },
            scaleMarks: {
                0: {style: "font-size: 8px", label: '1'},
                1: {style: "font-size: 8px", label: '2'},
                2: {style: "font-size: 8px", label: '3'},
                3: {style: "font-size: 8px", label: '4'},
            },
            users: [],
            dates: ['Weekdays', 'Holidays'],
            valueOfUser: '',
            valueOfDate: '',
            overview: [],
            checkin: null,
            patterns: null,
            flows: null,
            type: false,    // false: heatMap  true: barchart
            scale: 1,

            // signal
            load: 0,    // 每次点击load都自增
            start: 0,    // work as start algorithm signal
            drawSignal: 0,
            isDisplay: false,

            distribution: null,
            heatMap: null,
            overviewPattern: null,
            flowCount: null,
            categoryDistribution: null,
            startTime: 0,
            timeLength: 0,
            halfInterval: 0,
            time: 0,
            slotWidth: 0,
            marginLeft: 32,
            colors: ['#8dd3c7', '#fb8072', '#b3de69', '#fdb462', '#bc80bd', '#bebada',
                '#fccde5', '#d9d9d9', '#80b1d3', '#CCCCCC', '#666666', '#99CC66', '#CCCC99'],
        }
    },

    props: ['generate', 'selects'],

    watch: {
        scaleValue(val) {
            this.scale = val + 1;
        },

        load(val) {
            dataService.getCheckin(this.valueOfDate, response => {
                this.checkin = response.data;
                this.updateTemporalView();
                this.drawHeatMap();
                this.type = false;
            })

            this.number = this.valueOfDate === 'Weekdays' ? 12 : 10;
            dataService.getSankey(this.valueOfDate, this.number, response => {
                let sankey = response.data;
                this.patterns = sankey.patterns;
                this.flows = sankey.flows;
                this.sum = sankey.sum;
                this.rects = sankey.rects;
                this.timeRects = sankey.timeRects;
                this.links = sankey.links;
                this.nodes = sankey.nodes;
                this.regions = sankey.regions;
                this.heatMap = sankey.heatMap;
                this.categoryDistribution = sankey.regionsFlow;
                this.distribution = sankey.distribution;

                this.isDisplay = false;

                // this.drawGradient();
                this.$emit("conveyHeatmap", this.heatMap);
                this.updateGridView();
                this.drawGrids();
            })
        },

        generate(val) {
            let params = {selects: this.selects};
            dataService.getRegionInOut(params, response => {
                // this.updateSvg();
                // this.type = true;
                this.drawTimeSlot(response.data[0], response.data[1]);
            })
        },
    },

    methods: {
        startAlgorithm(){
            this.start++;
            this.$emit("conveyStart", this.start, this.scale);
        },


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

        updateGridView: function (){
            d3.select("#gridView").remove();
            this.gridView = d3.select(".gridDiv")
                .append("svg")
                .attr("id", 'gridView')
                .attr("width", 373)
                .attr("height", 301);
        },

        updateTemporalView: function (){
            d3.select("#temporalView").remove();
            this.temporalView = d3.select(".timeDiv")
                .append("svg")
                .attr("id", 'temporalView')
                .attr("width", 373)
                .attr("height", 201);
        },

        drawLegend: function () {
            let svg = this.legendView;
            // create a list of keys
            let keys = [
                'Travel & Transport', 'Food',
                'College & University', 'Residence',
                'Arts & Entertainment', 'Nightlife Spot',
                'Outdoors & Recreation', 'Shop & Service',
                'Professional & Other Places']

            let colors = [
                '#bc80bd', '#8dd3c7', '#d9d9d9', '#80b1d3',
                '#fccde5', '#bebada', '#b3de69', '#fb8072', '#fdb462'
            ]

            for(let i = 0; i < keys.length; i++){
                svg.append("circle")
                    .attr("cx", (i % 2 === 0) ? 50 : 230)
                    .attr("cy", Math.floor(i / 2) * 30 + 15)
                    .attr("r", 4)
                    .style("fill", colors[i])

                svg.append("text")
                    .attr("x", ((i % 2 === 0) ? 50 : 230) + 8)
                    .attr("y", Math.floor(i / 2) * 30 + 15)
                    .style("fill", colors[i])
                    .text(keys[i])
                    .attr("text-anchor", "left")
                    .style("alignment-baseline", "middle")
                    .style("font-size", 14)
            }
        },

        drawGrids: function (){
            let svg = this.gridView;
            let margin = {top: 10, bottom: 30, left: 32, right: 32}
            let height = 301 - margin.top - margin.bottom;
            let width = 373 - margin.left - margin.right;
            let columnNumber = 24;
            let rowNumber = this.number;
            let gridHeight = height / rowNumber;
            let gridWidth = width / 24;

            let max = this.distribution[0][0];
            let min = this.distribution[0][0];
            for (let i = 0; i < this.number; i++) {
                for (let j = 0; j < 24; j++) {
                    max = max > this.distribution[i][j] ? max : this.distribution[i][j];
                    min = min < this.distribution[i][j] ? min : this.distribution[i][j];
                }
            }

            let myColor = d3.scaleLinear()
                .range(["#FFF7BC", "#FD5D5D"])
                .domain([min, max])


            // let gridsData = [];
            // for (let i = 0; i < rowNumber; i++) {
            //     for (let j = 0; j < columnNumber; j++) {
            //         let grid = {row: 0, column: 0};
            //         grid.row = i;
            //         grid.column = j;
            //         gridsData.push(grid);
            //     }
            // }

            for (let i = 0; i < this.number; i++) {
                svg.append("g")
                    .attr("class", "grids")
                    .selectAll('grids')
                    .data(this.distribution[i])
                    .enter()
                    .append("rect")
                    .attr("class", "grid")
                    .attr("x", (d,i) => margin.left + i * gridWidth)
                    .attr("y", d => margin.top + i * gridHeight)
                    .attr("rx", 2)
                    .attr("ry", 2)
                    .attr("width", gridWidth)
                    .attr("height", gridHeight)
                    .attr("fill", d => myColor(d))
                    .attr("opacity", 1)
                    .attr("stroke", '#505254')
                    .attr("stroke-width", 0.5)
            }

            // let grids = svg.append("g")
            //     .attr("class", "grids")
            //     .selectAll('grids')
            //     .data(this.distribution)
            //     .enter()
            //     .append("rect")
            //     .attr("class", "grid")
            //     .attr("x", d => margin.left + d.column * gridWidth)
            //     .attr("y", d => margin.top + d.row * gridHeight)
            //     .attr("rx", 2)
            //     .attr("ry", 2)
            //     .attr("width", gridWidth)
            //     .attr("height", gridHeight)
            //     .attr("fill", "#F7F5F2")
            //     .attr("opacity", 1)
            //     .attr("stroke", '#505254')
            //     .attr("stroke-width", 1)

            // add pattern id label
            for (let i = 0; i < this.number; i++) {
                svg.append('text')
                    .attr("y", margin.top + gridHeight * i + gridHeight / 2 + 3)
                    .attr("x", margin.left - 5)
                    .attr('text-anchor', 'end')
                    .attr("class", 'patternLabel')
                    .text(i)
                    .style("font-size", 8)
            }

            if(this.load > 0){
                // draw timeRects
                let timeRects = svg.append("g")
                    .classed('timeRects', true)
                    .selectAll('timeRects')
                    .data(this.timeRects)
                    .enter()
                    .append("rect")
                    .attr("class", d => 'timeRect' + d.id)
                    .attr("x", d => margin.left + d.time / 24 * width - d.length / 24 * width / 2)
                    .attr("y", d => margin.top + d.id * gridHeight)
                    .attr("rx", 2)
                    .attr("ry", 2)
                    .attr("width", d => d.length / 24 * width)
                    .attr("height", gridHeight)
                    .attr("fill", '#FF6363')
                    // .attr("opacity", 0.6)
                    .attr("stroke", '#505254')
                    .attr("stroke-width", 1.5)
                    .on("mouseover", d => this.mouseover(d))
                    .on("mouseout", d => this.mouseout(d))
                    .on("click", d => this.click(d))
            }

            this.isDisplay = true;
        },

        drawHeatMap: function(){
            let svg = this.temporalView;
            let margin = {top: 0, bottom: 70, left: 32, right: 32}
            let height = 190 - margin.top - margin.bottom;
            let width = 373 - margin.left - margin.right;
            let columnNumber = 48;

            let baseline = 100;
            let maxBarHeight = 40;
            let padding = 20;
            let rectHeight = height - 2 * padding;
            let rectWidth = width / columnNumber;
            let windowHeight = height;

            this.slotWidth = rectWidth;

            // draw time divider
            svg.append("line")
                .attr("x1", margin.left)
                .attr("y1", baseline)
                .attr("x2", margin.left + width)
                .attr("y2", baseline)
                .attr("stroke", 'black')
                .attr("stroke-width", 1)

            // svg.append("line")
            //     .attr("x1", margin.left)
            //     .attr("y1", baseline + 19)
            //     .attr("x2", margin.left + width)
            //     .attr("y2", baseline + 19)
            //     .attr("stroke", 'black')
            //     .attr("stroke-width", 1)

            // let timeSlider = svg.append("rect")
            //     .attr("x", margin.left)
            //     .attr("y", baseline)
            //     .attr("rx", 2)
            //     .attr("ry", 2)
            //     .attr("width", width)
            //     .attr("height", 19)
            //     .attr("fill", "#F7F5F2")
            //     .attr("opacity", 1)
            //     .attr("stroke", '#505254')
            //     .attr("stroke-width", 1)

            // add time label
            let timeLabel = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"];
            for (let i = 0; i <= columnNumber; i++) {
                svg.append('text')
                    .attr("y", baseline + 12)
                    .attr("x", margin.left + i * width / 6)
                    .attr('text-anchor', 'middle')
                    .attr("class", 'timeLabel')
                    .text(timeLabel[i])
                    .style("font-size", 8)
            }

            // compute max value and min value
            let min = this.checkin[0];
            let max = this.checkin[1];
            for(let i = 0; i < columnNumber; i++){
                max = max > this.checkin[i] ? max : this.checkin[i];
                min = min < this.checkin[i] ? min : this.checkin[i];
            }

            let barChart = svg.append("g")
                .attr("class", 'heatmap')
                .selectAll('whatever')
                .data(this.checkin)
                .enter()
                .append("rect")
                .attr("class", (d, i) => 'rect' + i)
                .attr("x", (d, i) => margin.left + rectWidth * i)
                .attr("y", d => baseline - d / max * maxBarHeight - 1)
                .attr("width", rectWidth)
                .attr("height", d => d / max * maxBarHeight - 1)
                .attr("fill", 'lightsteelblue')
                .attr("opacity", 1)
                .attr("stroke", '#505254')
                .attr("stroke-width", 1)

            // Slide Window
            this.startTime = 16;
            this.timeLength = 4;
            // this.$emit("passTime", this.startTime, this.timeLength);

            let g = svg.selectAll('.draggableSquare')
                .data([{
                    x: margin.left + this.startTime * rectWidth,
                    y: margin.top + windowHeight / 3,
                    width: rectWidth * this.timeLength,
                    height: windowHeight / 3 * 2
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
            d3.select("#temporalView").select(".square").call(this.drag(margin.left, 0, rectWidth));
            d3.select("#temporalView").select(".resizingSquare").call(this.resize(margin.left, 0, rectWidth));
        },

        drawTimeSlot: function (inData, outData) {
            let svg = this.temporalView;
            let self = this;
            let margin = {top: 0, bottom: 70, left: 32, right: 32}
            let height = 201 - margin.top - margin.bottom;
            let width = 373 - margin.left - margin.right;
            const maxHeight = 25;
            const baseline = 40;
            const slotNum = 48;

            const slotWidth = width / slotNum;
            const windowHeight = height;

            let maxValue;
            maxValue = this.findMax(outData);
            maxValue = maxValue > this.findMax(inData) ? maxValue : this.findMax(inData);
            let scale = maxHeight / maxValue;

            // compute positions
            let positions = this.computePosition(inData, outData, scale, baseline);

            // // draw white canvas
            // let canvas = svg.append("g")
            //     .attr("class", "barCharts")
            //     .append("rect")
            //     .attr("x", margin.left + self.startTime * slotWidth)
            //     .attr("y", margin.top - 1)
            //     .attr("width", slotWidth * this.timeLength)
            //     .attr("height", height + 2)
            //     .attr("fill", 'white')

            // draw rects
            let rects = svg.append("g")
                .attr("class", "barCharts")
                .selectAll("timeSlots")
                .data(positions)
                .enter()
                .append("rect")
                .attr("class", d => "timeSlot" + d[0])
                .attr("x", d => margin.left + d[0] * slotWidth)
                .attr("y", d => d[1])
                .attr("width", slotWidth)
                .attr("height", d => d[2])
                // .attr("fill", 'lightsteelblue')
                .attr("fill", d => d[3])
                .attr("opacity", d => (d[0] >= self.startTime && d[0] < self.startTime + self.timeLength) ? 1 : 0)
                .attr("stroke", '#505254')
                .attr("stroke-width", 1)

            // Slide Window
            this.$emit("passTime", this.startTime, this.timeLength);

            // remove original slide window
            d3.selectAll('.draggableSquare').remove();

            let g = svg.selectAll('.draggableSquare')
                .data([{
                    x: margin.left + this.startTime * slotWidth,
                    y: margin.top,
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
            d3.select("#temporalView").select(".square").call(this.drag(margin.left, 0, slotWidth));
            d3.select("#temporalView").select(".resizingSquare").call(this.resize(margin.left, 0, slotWidth));
        },

        mouseover: function (d){
            d3.select("#gridView").selectAll(".timeRect" + d.id).attr('fill', 'red');
        },

        mouseout: function (d){
            d3.select("#gridView").selectAll(".timeRect" + d.id).attr('fill', '#FF6363');
        },

        click: function (d) {
            d3.select("#gridView").selectAll(".timeRect" + d.id).attr('fill', 'red');
            this.halfInterval = d.length;
            this.time = d.time;
            this.resetSlideWindow();

            this.overviewPattern = this.patterns[d.id];
            this.flowCount = this.flows[d.id];
            this.drawSignal++;

            let start = this.timeRects[d.id].time * 2 - this.timeRects[d.id].length;
            let length = this.timeRects[d.id].length * 2;

            this.$emit("conveyPatternId", d.id);
            this.$emit("conveyOverviewPattern", this.drawSignal, this.overviewPattern, this.flows,
                this.heatMap, this.categoryDistribution, start, length);
            this.$emit("conveyTimeInterval", d.time, d.length);
        },

        resetSlideWindow: function () {
            let c = d3.select("#temporalView").select('.resizingSquare');
            let s = d3.select("#temporalView").select(".square");

            c.attr("width", 2 * this.halfInterval * this.slotWidth + 12);
            s.attr("width", 2 * this.halfInterval * this.slotWidth);
            s.attr("x", this.marginLeft + this.time * 2 * this.slotWidth - this.halfInterval * this.slotWidth);
            c.attr("x", this.marginLeft + this.time * 2 * this.slotWidth - this.halfInterval * this.slotWidth - 6);
        },

        resize: function (margin, axisMargin, slotWidth) {
            let self = this;
            let x, y, w, h;
            let c = d3.select("#temporalView").select('.resizingSquare');
            let s = d3.select("#temporalView").select(".square");

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
            let g = d3.select("#temporalView").select(".draggableSquare");
            let bigRect = d3.select("#temporalView").select(".resizingSquare");
            let smallRect = d3.select("#temporalView").select(".square")

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
            let start = this.startTime;
            let length = this.timeLength;
            let max = 0;
            for (let i = start; i < start + length; i++) {
                let slot = a[i];
                let sum = 0;
                for (let j = 0; j < slot.length; j++) {
                    sum += slot[j];
                }
                max = sum > max ? sum : max;
            }
            return max;
        },

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
        dataService.initialization(response => {
            console.log("---------System Start----------");
        })

        this.isDisplay = false;

        const legendView = d3.select("#legendView")
            .attr("width", 373)
            .attr("height", 200);
        const temporalView = d3.select(".timeDiv").select("#temporalView")
            .attr("width", 373)
            .attr("height", 201);
        const gridView = d3.select("#gridView")
            .attr("width", 373)
            .attr("height", 301);
        this.legendView = legendView;
        this.gridView = gridView;
        this.temporalView = temporalView;
        this.drawLegend();
        // this.drawGrids();
    },


    // 初始化所有用户
    // created: function (){
    //     dataService.getAllUsers(response => {
    //         // console.log(response.data)
    //         this.users = response.data
    //     })
    // }
}



