// /* global d3 $ */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-extra-semi */
import DrawAudio from './drawAudio.js'
import dataService from "@/service/dataService";
import col from "element-ui/packages/col/src/col";
import he from "element-ui/src/locale/lang/he";
// import * as d3Lasso from 'd3-lasso/build/d3-lasso.min.js';
// import dataService from '../../service/dataService.js'
// import pipeService from '../../service/pipeService'

// import * as d3 from "d3";

export default {
    name: 'AudioView',
    components: {},
    props: ['content', 'region', 'number', 'index', 'finish', 'glyphs', 'links', 'destLinks', 'startTime',
        'timeLength', 'drawSignal', 'overviewPattern', 'flowCounts', 'categoryDistribution',
        'overviewStart', 'overviewLength', 'heatMap', 'mapviewPatternId', 'drawMapviewSignal',
        'patternType', 'glyphIndex', 'generate', 'overviewPatternId'],

    watch: {
        drawSignal(val) {
            // 遍历判断是否有空余位置
            this.regionsFlow = this.categoryDistribution;
            for (let i = 0; i < 4; i++) {
                if (this.isEmpty[i]) {
                    this.isEmpty[i] = false;
                    this.fourPatternsId[i] = this.overviewPatternId;
                    this.fourPatterns[i] = this.overviewPattern;
                    this.fourRegionsFlow[i] = this.categoryDistribution;

                    // 添加pattern的时间记录
                    let time = [];
                    time.push(this.startTime);
                    time.push(this.timeLength);
                    this.fourPatternsTime[i] = time;

                    if(!this.isExist){
                        const svg = d3.select("#sankey")
                            .append('svg')
                            .attr("class", "state")
                            .attr("width", 600)
                            .attr("height", this.height * 2)

                        this.svg = svg;
                        this.isExist = true;
                    }

                    this.drawOverview(i);
                    break;
                }
            }
        },

        drawMapviewSignal(val) {
            this.patterns = this.content['patterns'];
            // 遍历判断是否有空余位置
            for (let i = 0; i < 4; i++) {
                if (this.isEmpty[i]) {
                    this.isEmpty[i] = false;
                    this.fourPatternsId[i] = this.mapviewPatternId;
                    this.fourPatterns[i] = this.patterns[this.mapviewPatternId];
                    this.fourRegionsFlow[i] = this.regionsFlow;

                    // 添加pattern的时间记录
                    let time = [];
                    time.push(this.startTime);
                    time.push(this.timeLength);
                    this.fourPatternsTime[i] = time;

                    if(!this.isExist){
                        const svg = d3.select("#sankey")
                            .append('svg')
                            .attr("class", "state")
                            .attr("width", 600)
                            .attr("height", this.height * 2)

                        this.svg = svg;
                        this.isExist = true;
                    }

                    this.drawMapviewPattern(i);
                    break;
                }
            }
        },

        finish(val) {
            let svg = this.svg;
            dataService.getRegionFlow(response => {
                console.log("--------------StateView---------------");
                this.regionsFlow = response.data;
                console.log(this.regionsFlow);
                console.log(this.glyphs);
                console.log(this.links);
                console.log(this.destLinks);
                console.log("--------------StateView---------------");

                this.update();
                this.drawDendrogram();
            })
        },
    },
    data() {
        return {
            select: 0,          // 用于标记是否有新的点击事件，值递增
            clickedData: {},    //当前正在点击的data
            savedData: {},
            indexMapKey: [],
            patterns: null,

            isExist: false,
            patternId: null,
            fourPatterns: [],    //用来记录四个位置对应的pattern信息
            fourPatternsId: [],    //用来记录四个位置对应的patternId
            fourRegionsFlow: [],   //用来记录四个位置对应的patternRegionsFlow
            fourPatternsCount: [],
            fourPatternsTime: [],    //用来记录四个位置对应的pattern时间戳
            isEmpty: [],    //用来判断四个位置是否为空
            allData: [],    //用来存储最多四个region的所有轨迹数据
            width: 1123,
            height: 265,
            regionsFlow: null,
            column: 0,
            row: 0,
            entropy: [],
            rects: [],
            hLinks: [],
            nextLinks: [],
            lastLinks: [],
            svg: null,
            octopusSvg: null,
            total: 0,
            cx: 0,
            cy: 0,
            color: ['#8dd3c7', '#fb8072', '#b3de69', '#fdb462', '#bc80bd', '#bebada',
            '#fccde5', '#d9d9d9', '#80b1d3', '#CCCCCC', '#666666', '#99CC66', '#CCCC99'],
        }
    },

    mounted: function () {
        const svg = d3.select("#octopus")
            .append('svg')
            .attr("class", "oct")
            .attr("width", 483)
            .attr("height", this.height)

        this.octopusSvg = svg;

        // 初始四个空位
        for (let i = 0; i < 4; i++) {
            this.isEmpty[i] = true;
            this.fourPatternsId[i] = 0;
            this.fourPatterns[i] = {};
            this.fourRegionsFlow[i] = {};
        }
    },

    methods: {
        clearPatterns: function () {
            // 清除历史记录
            for (let i = 0; i < 4; i++) {
                this.isEmpty[i] = true;
                this.fourPatternsId[i] = null;
                this.fourPatterns[i] = null;
                this.fourRegionsFlow[i] = null;
                this.fourPatternsTime[i] = null;
            }

            // 删除patterns
            d3.select(".state").remove()
            const svg = d3.select("#sankey")
                .append('svg')
                .attr("class", "state")
                .attr("width", 600)
                .attr("height", this.height * 2)

            this.svg = svg;
        },

        mapIndexToKey: function () {
            let count = 0;
            let map = {};
            for (let key in this.content) {
                map[count] = key;
                count++;
            }
            this.indexMapKey[this.index] = map;
        },

        computeEntropy: function () {
            this.entropy = [];
            for (let key in this.content) {
                let dest = this.content[key];
                let sum = 0;
                let nonzero_data = [];
                let entropy = 0;

                for (let i = 0; i < dest.length; i++) {
                    if (dest[i] !== 0) {
                        nonzero_data.push(dest[i]);
                        sum += dest[i];
                    }
                }
                for (let i = 0; i < nonzero_data.length; i++) {
                    entropy += (-1) * (nonzero_data[i] / sum) * Math.log(nonzero_data[i] / sum)
                }
                this.entropy.push(entropy);
            }
        },

        update: function () {
            d3.selectAll(".dendrogram").remove();

            // 更新allData数据
            // this.allData[index] = this.content;
            // 更新indexMapKey
            // this.mapIndexToKey();
        },

        drawOverview: function (index) {
            // let moduleWidth = 1123;
            let moduleWidth = 600;
            let moduleHeight = 250;
            // let patternWidth = moduleWidth / 2;
            let patternWidth = moduleWidth;
            let patternHeight = moduleHeight / 2;
            let moduleLeft = 20;
            // let cx = index % 2 * patternWidth + moduleLeft;
            let cx = moduleLeft;
            // let cy = Math.floor(index / 2) * patternHeight;
            let cy = index * patternHeight;

            let svg = this.svg;
            let margin = {left: 20, right: 60, top: 20, bottom: 20}

            // data
            let patternId = this.fourPatternsId[index];
            let pattern = this.fourPatterns[index];
            let regionsFlow = this.fourRegionsFlow[index];

            let regionWidth = 20;
            // let radius = 20;
            let radius = 14;
            let innerRadius = 8;
            // let columnNumber = pattern.length;
            let columnNumber = 4;
            let flowWidth = ((patternWidth - margin.left - margin.right)
                - regionWidth * columnNumber) / (columnNumber - 1);
            let columnWidth = flowWidth + regionWidth;
            let padding = 5;
            let regionHeight = patternHeight - margin.top - margin.bottom - padding * 2;

            for (let i = 0; i < pattern.length; i++) {
                let num = i;

                // // draw region category rect
                // let region = this.regionsFlow[pattern[i]];
                // let sum = 0;
                // let regionData = [];

                // region = this.mergeCategory(region);
                // for(let j = 0; j < region.length; j++){
                //     regionData.push(sum);
                //     sum += region[j];
                // }

                // draw flow
                let maxFlow = this.flowCounts[0];
                let maxFlowHeight = regionHeight - 15 * 2;
                let flowCount = this.flowCounts[patternId];
                let flowHeight = flowCount / maxFlow * maxFlowHeight;
                let flowData = [];
                let min, max;

                let order = (patternId + i) % 10
                for(let j = order * 24; j < order * 24 + 24; j++){
                    flowData.push(this.heatMap[j].count);
                    min = this.heatMap[j].min;
                    max = this.heatMap[j].max;
                }
                let heatPadding = 20;
                let heatWidth = flowWidth - heatPadding * 2;
                let regionId = pattern[i];
                let x = cx + margin.left + num * columnWidth + regionWidth / 2;
                let y = cy + patternHeight / 2;

                if(i < pattern.length - 1){
                    svg.append('line')
                        .style("Stroke", "lightsteelblue")
                        .attr("stroke-width", 6)
                        .style("opacity", 0.5)
                        .attr("x1", cx + margin.left + num * columnWidth + regionWidth)
                        .attr("y1", cy + patternHeight / 2)
                        .attr("x2", cx + margin.left + (i + 1) * columnWidth)
                        .attr("y2", cy + patternHeight / 2)

                    svg.append('rect')
                        .attr("x", (d,i) => cx + margin.left + heatPadding + num * columnWidth + regionWidth + heatWidth / 24 * i)
                        .attr("y", cy + patternHeight / 2 - flowHeight / 2)
                        .attr('rx', 2)
                        .attr('ry', 2)
                        .attr("width", heatWidth)
                        .attr("height", flowHeight)
                        .attr("fill", 'white')
                        .attr("opacity", 1)
                        .attr("stroke", 'black')
                        .attr("stroke-width", 1)

                    let heatMap = svg.append("g")
                        .selectAll('whatever')
                        .data(flowData)
                        .enter()
                        .append("rect")
                        .attr("x", (d,i) => cx + margin.left + heatPadding + num * columnWidth + regionWidth + heatWidth / 24 * i)
                        .attr("y", cy + patternHeight / 2 - flowHeight / 2)
                        .attr("width", heatWidth / 24)
                        .attr("height", flowHeight)
                        .attr("fill", function (d) {
                            let myColor = d3.scaleLinear()
                                .range(["#FFF7BC", "#FD5D5D"])
                                .domain([min, max])
                            return myColor(d);
                        })
                        .attr("opacity", 1)
                }

                this.drawSingleGlyph(this.generate, regionId, patternId, x, y, true,'patterns', 0, innerRadius, radius);

                // // draw outer rect
                // svg.append("rect")
                //     .attr("x", cx + margin.left + i * columnWidth)
                //     .attr("y", cy + margin.top + padding)
                //     .attr("rx", 2)
                //     .attr("ry", 2)
                //     .attr("width", regionWidth)
                //     .attr("height", regionHeight)
                //     .attr("fill", '#F7F5F2')
                //     .attr("stroke", '#505254')
                //     .attr("stroke-width", 0.5)
                //
                // let regionCategory = svg.append("g")
                //     .selectAll('whatever')
                //     .data(regionData)
                //     .enter()
                //     .append("rect")
                //     .attr("x", cx + margin.left + i * columnWidth)
                //     .attr("y", d => cy + margin.top + padding + d / sum * regionHeight)
                //     .attr("width", regionWidth)
                //     .attr("height", (d,i) => region[i] / sum * regionHeight)
                //     .attr("fill", (d,i) => color[i])
                //     .attr("opacity", 1)
            }

            // draw time axis
            let number = pattern.length;
            let axisLength = (number === 3) ? 363 : 530;
            let y = cy + patternHeight - margin.bottom / 2;
            let x = cx + 16;
            let startTime = this.generateTimeText(this.overviewStart);
            let endTime = this.generateTimeText(this.overviewStart + this.overviewLength);
            svg.append('line')
                .style("Stroke", "black")
                .style("opacity", 0.5)
                .attr("x1", x)
                .attr("y1", y)
                .attr("x2", x + axisLength)
                .attr("y2", y)
            svg.append('line')
                .style("Stroke", "black")
                .style("opacity", 0.5)
                .attr("x1", x)
                .attr("y1", y - 5)
                .attr("x2", x)
                .attr("y2", y + 5)
            svg.append('line')
                .style("Stroke", "black")
                .style("opacity", 0.5)
                .attr("x1", x + axisLength)
                .attr("y1", y - 5)
                .attr("x2", x + axisLength)
                .attr("y2", y + 5)

            svg.append('text')
                .attr("y", y + 3)
                .attr("x", x - 3)
                .attr('text-anchor', 'end')
                .attr("class", 'timeText')
                .text("00:00")
                .style("font-size", 8)

            svg.append('text')
                .attr("y", y + 3)
                .attr("x", x + axisLength + 3)
                .attr('text-anchor', 'start')
                .attr("class", 'timeText')
                .text("24:00")
                .style("font-size", 8)

            // draw timeRects
            let timeInterval = svg.append("rect")
                .attr("class", "interval")
                .attr("x", x + this.overviewStart / 48 * axisLength)
                .attr("y", y - 5)
                .attr("rx", 2)
                .attr("ry", 2)
                .attr("width", axisLength / 48 * this.overviewLength)
                .attr("height", 10)
                .attr("fill", 'red')
                .attr("opacity", 1)
                .attr("stroke", '#505254')
                .attr("stroke-width", 1)

            svg.append('text')
                .attr("y", y + 8)
                .attr("x", x + this.overviewStart / 48 * axisLength - 3)
                .attr('text-anchor', 'end')
                .attr("class", 'timeText')
                .text(startTime)
                .style("font-size", 8)

            svg.append('text')
                .attr("y", y + 8)
                .attr("x", x + this.overviewStart / 48 * axisLength + axisLength / 48 * this.overviewLength + 3)
                .attr('text-anchor', 'start')
                .attr("class", 'timeText')
                .text(endTime)
                .style("font-size", 8)

        },

        drawMapviewPattern: function (index) {
            // let moduleWidth = 1123;
            let moduleWidth = 600;
            let moduleHeight = 250;
            // let patternWidth = moduleWidth / 2;
            let patternWidth = moduleWidth;
            let patternHeight = moduleHeight / 2;
            let moduleLeft = 20;
            // let cx = index % 2 * patternWidth + moduleLeft;
            let cx = moduleLeft;
            // let cy = Math.floor(index / 2) * patternHeight;
            let cy = index * patternHeight;
            let svg = this.svg;
            let margin = {left: 20, right: 40, top: 20, bottom: 20}

            // data
            let patternId = this.fourPatternsId[index];
            let pattern = this.fourPatterns[index];
            let regionsFlow = this.fourRegionsFlow[index];

            console.log(pattern);

            let regionWidth = 20;
            // let columnNumber = pattern['preamble'].length + 1;
            let columnNumber = 4;
            let rowNumber = pattern['destinations'].length;
            // let radius = (rowNumber === 2) ? 16 : 14;
            let radius = 14;
            // let innerRadius = (rowNumber === 2) ? 10 : 8;
            let innerRadius = 6;

            let flowWidth = ((patternWidth - margin.left - margin.right)
                - regionWidth * columnNumber) / (columnNumber - 1);
            let columnWidth = flowWidth + regionWidth;
            let padding = 5;
            let regionHeight = patternHeight - margin.top - margin.bottom - padding * 2;

            // draw flow
            let total = 0;
            for (let i = 0; i < pattern['destinations'].length; i++) {
                total += pattern['destinations'][i]['count'];
            }

            // draw destinations
            if(this.patternType === 0){
                for (let i = 0; i < pattern['destinations'].length; i++){
                    let num = pattern['preamble'].length;

                    // draw flow
                    let maxFlow = 5;
                    let maxFlowHeight = regionHeight - 15 * 2;
                    // let flowCount = total;
                    let flowCount = pattern['destinations'][i]['count'];
                    let entropy = flowCount / total;
                    let flowHeight = flowCount / maxFlow * maxFlowHeight;
                    let flowData = [];
                    let min, max;
                    for (let j = patternId * 24; j < patternId * 24 + 24; j++) {
                        flowData.push(this.heatMap[j].count);
                        min = this.heatMap[j].min;
                        max = this.heatMap[j].max;
                    }

                    let rowD = (pattern['destinations'].length === 2) ? patternHeight / 3 : patternHeight / 4;

                    let heatPadding = 20;
                    let heatWidth = flowWidth - heatPadding * 2;
                    let regionId = pattern['destinations'][i]['regionId'];
                    let x = cx + margin.left + num * columnWidth + regionWidth / 2;
                    let y = cy + (i + 1) * rowD;

                    svg.append('line')
                        .style("Stroke", "lightsteelblue")
                        .attr("stroke-width", 6)
                        .style("opacity", 0.5)
                        .attr("x1", x - columnWidth)
                        .attr("y1", cy + patternHeight / 2)
                        .attr("x2", cx + margin.left + heatPadding + (num - 1) * columnWidth + regionWidth)
                        .attr("y2", y)

                    svg.append('line')
                        .style("Stroke", "lightsteelblue")
                        .attr("stroke-width", 6)
                        .style("opacity", 0.5)
                        .attr("x1", x - flowWidth / 2)
                        .attr("y1", y)
                        .attr("x2", x)
                        .attr("y2", y)

                    svg.append('rect')
                        .attr("x", cx + margin.left + heatPadding + (num - 1) * columnWidth + regionWidth)
                        .attr("y", y - flowHeight / 2)
                        .attr('rx', 2)
                        .attr('ry', 2)
                        .attr("width", heatWidth)
                        .attr("height", flowHeight)
                        .attr("fill", 'white')
                        .attr("opacity", 1)
                        .attr("stroke", 'black')
                        .attr("stroke-width", 1)

                    let heatMap = svg.append("g")
                        .selectAll('whatever')
                        .data(flowData)
                        .enter()
                        .append("rect")
                        .attr("x", (d,i) => cx + margin.left + heatPadding + (num - 1) * columnWidth + regionWidth + heatWidth / 24 * i)
                        .attr("y", y - flowHeight / 2)
                        .attr("width", heatWidth / 24)
                        .attr("height", flowHeight)
                        .attr("fill", function (d) {
                            let myColor = d3.scaleLinear()
                                .range(["#FFF7BC", "#FD5D5D"])
                                .domain([min, max])
                            return myColor(d);
                        })
                        .attr("opacity", 1)

                    this.drawSingleGlyph(this.generate, regionId, patternId, x, y, true, 'dest', entropy, innerRadius, radius);
                }
            } else {
                let num = pattern['preamble'].length;

                // draw flow
                let maxFlow = 5;
                let maxFlowHeight = regionHeight - 15 * 2;
                // let flowCount = total;
                let flowCount = pattern['destinations'][this.glyphIndex]['count'];
                let entropy = flowCount / total;
                let flowHeight = flowCount / maxFlow * maxFlowHeight;
                let flowData = [];
                let min, max;
                for (let j = patternId * 24; j < patternId * 24 + 24; j++) {
                    flowData.push(this.heatMap[j].count);
                    min = this.heatMap[j].min;
                    max = this.heatMap[j].max;
                }

                let heatPadding = 20;
                let heatWidth = flowWidth - heatPadding * 2;
                let regionId = pattern['destinations'][this.glyphIndex]['regionId'];
                let x = cx + margin.left + num * columnWidth + regionWidth / 2;
                let y = cy + patternHeight / 2;

                svg.append('line')
                    .style("Stroke", "lightsteelblue")
                    .attr("stroke-width", 6)
                    .style("opacity", 0.5)
                    .attr("x1", x - columnWidth)
                    .attr("y1", cy + patternHeight / 2)
                    .attr("x2", cx + margin.left + heatPadding + (num - 1) * columnWidth + regionWidth)
                    .attr("y2", y)

                svg.append('line')
                    .style("Stroke", "lightsteelblue")
                    .attr("stroke-width", 6)
                    .style("opacity", 0.5)
                    .attr("x1", x - flowWidth / 2)
                    .attr("y1", y)
                    .attr("x2", x)
                    .attr("y2", y)

                svg.append('rect')
                    .attr("x", cx + margin.left + heatPadding + (num - 1) * columnWidth + regionWidth)
                    .attr("y", y - flowHeight / 2)
                    .attr('rx', 2)
                    .attr('ry', 2)
                    .attr("width", heatWidth)
                    .attr("height", flowHeight)
                    .attr("fill", 'white')
                    .attr("opacity", 1)
                    .attr("stroke", 'black')
                    .attr("stroke-width", 1)

                let heatMap = svg.append("g")
                    .selectAll('whatever')
                    .data(flowData)
                    .enter()
                    .append("rect")
                    .attr("x", (d,i) => cx + margin.left + heatPadding + (num - 1) * columnWidth + regionWidth + heatWidth / 24 * i)
                    .attr("y", y - flowHeight / 2)
                    .attr("width", heatWidth / 24)
                    .attr("height", flowHeight)
                    .attr("fill", function (d) {
                        let myColor = d3.scaleLinear()
                            .range(["#FFF7BC", "#FD5D5D"])
                            .domain([min, max])
                        return myColor(d);
                    })
                    .attr("opacity", 1)

                this.drawSingleGlyph(this.generate, regionId, patternId, x, y, true,'dest', entropy, innerRadius, radius);
            }

            // draw preamble
            for (let i = 0; i < pattern['preamble'].length; i++) {
                let num = i;

                // draw flow
                let maxFlow = 5;
                let maxFlowHeight = regionHeight - 15 * 2;
                let flowCount = total;
                let flowHeight = flowCount / maxFlow * maxFlowHeight;
                let flowData = [];
                let min, max;
                for (let j = patternId * 24; j < patternId * 24 + 24; j++) {
                    flowData.push(this.heatMap[j].count);
                    min = this.heatMap[j].min;
                    max = this.heatMap[j].max;
                }

                let heatPadding = 20;
                let heatWidth = flowWidth - heatPadding * 2;
                let regionId = pattern['preamble'][i];
                let x = cx + margin.left + num * columnWidth + regionWidth / 2;
                let y = cy + patternHeight / 2;

                if (i < pattern['preamble'].length - 1) {
                    svg.append('line')
                        .style("Stroke", "lightsteelblue")
                        .attr("stroke-width", 6)
                        .style("opacity", 0.5)
                        .attr("x1", cx + margin.left + num * columnWidth + regionWidth)
                        .attr("y1", cy + patternHeight / 2)
                        .attr("x2", cx + margin.left + (i + 1) * columnWidth)
                        .attr("y2", cy + patternHeight / 2)

                    svg.append('rect')
                        .attr("x", cx + margin.left + heatPadding + num * columnWidth + regionWidth)
                        .attr("y", cy + patternHeight / 2 - flowHeight / 2)
                        .attr('rx', 2)
                        .attr('ry', 2)
                        .attr("width", heatWidth)
                        .attr("height", flowHeight)
                        .attr("fill", 'white')
                        .attr("opacity", 1)
                        .attr("stroke", 'black')
                        .attr("stroke-width", 1)

                    let heatMap = svg.append("g")
                        .selectAll('whatever')
                        .data(flowData)
                        .enter()
                        .append("rect")
                        .attr("x", (d, i) => cx + margin.left + heatPadding + num * columnWidth + regionWidth + heatWidth / 24 * i)
                        .attr("y", cy + patternHeight / 2 - flowHeight / 2)
                        .attr("width", heatWidth / 24)
                        .attr("height", flowHeight)
                        .attr("fill", function (d) {
                            let myColor = d3.scaleLinear()
                                .range(["#FFF7BC", "#FD5D5D"])
                                .domain([min, max])
                            return myColor(d);
                        })
                        .attr("opacity", 1)
                }

                this.drawSingleGlyph(this.generate, regionId, patternId, x, y, true, 'patterns', 0,innerRadius, radius);
            }

            // draw time axis
            let number = pattern['preamble'].length + 1;
            let axisLength = (number === 3) ? 363 : 530;
            let y = cy + patternHeight - margin.bottom / 2;
            let x = cx + 16;
            let startTime = this.generateTimeText(this.startTime);
            let endTime = this.generateTimeText(this.startTime + this.timeLength);
            svg.append('line')
                .style("Stroke", "black")
                .style("opacity", 0.5)
                .attr("x1", x)
                .attr("y1", y)
                .attr("x2", x + axisLength)
                .attr("y2", y)
            svg.append('line')
                .style("Stroke", "black")
                .style("opacity", 0.5)
                .attr("x1", x)
                .attr("y1", y - 5)
                .attr("x2", x)
                .attr("y2", y + 5)
            svg.append('line')
                .style("Stroke", "black")
                .style("opacity", 0.5)
                .attr("x1", x + axisLength)
                .attr("y1", y - 5)
                .attr("x2", x + axisLength)
                .attr("y2", y + 5)

            svg.append('text')
                .attr("y", y + 3)
                .attr("x", x - 3)
                .attr('text-anchor', 'end')
                .attr("class", 'timeText')
                .text("00:00")
                .style("font-size", 8)

            svg.append('text')
                .attr("y", y + 3)
                .attr("x", x + axisLength + 3)
                .attr('text-anchor', 'start')
                .attr("class", 'timeText')
                .text("24:00")
                .style("font-size", 8)

            // draw timeRects
            let timeInterval = svg.append("rect")
                .attr("class", "interval")
                .attr("x", x + this.startTime / 48 * axisLength)
                .attr("y", y - 5)
                .attr("rx", 2)
                .attr("ry", 2)
                .attr("width", axisLength / 48 * this.timeLength)
                .attr("height", 10)
                .attr("fill", 'red')
                .attr("opacity", 1)
                .attr("stroke", '#505254')
                .attr("stroke-width", 1)

            svg.append('text')
                .attr("y", y + 8)
                .attr("x", x + this.startTime / 48 * axisLength - 3)
                .attr('text-anchor', 'end')
                .attr("class", 'timeText')
                .text(startTime)
                .style("font-size", 8)

            svg.append('text')
                .attr("y", y + 8)
                .attr("x", x + this.startTime / 48 * axisLength + axisLength / 48 * this.timeLength + 3)
                .attr('text-anchor', 'start')
                .attr("class", 'timeText')
                .text(endTime)
                .style("font-size", 8)
        },

        drawDendrogram: function () {
            let svg = this.octopusSvg;
            let margin = {top: 10, bottom: 10, left: 10, right: 10};

            this.patterns = this.content['patterns'];

            let dendrogram = {left: 0, width: 483, height: 250};
            let columnNumber = this.content.columnNumber;
            let patternNumber = this.content.patternNumber;
            let destinationNumber = this.content.destinationNumber;

            console.log("--------------StateView---------------");
            console.log(columnNumber);
            console.log(patternNumber);
            console.log(destinationNumber);
            console.log(this.patterns);
            console.log("--------------StateView---------------");

            let columnWidth = (dendrogram.width - margin.left - margin.right) / columnNumber;
            let rowHeight = (dendrogram.height - margin.top - margin.bottom) / patternNumber;
            let rowPadding = 4;
            let centerRadius = dendrogram.height / patternNumber / 3;
            let preambleRadius = centerRadius / 3;
            let destRow = rowHeight / destinationNumber;
            let destRadius = destRow / 2 - 4;
            let tab = 30;
            let heatWidth = 30;

            // // Add divider
            // let line = svg.append('line')
            //     .style("Stroke", "black")
            //     .style("opacity", 0.5)
            //     .attr("class", "dendrogram")
            //     .attr("x1", 650)
            //     .attr("y1", 10)
            //     .attr("x2", 650)
            //     .attr("y2", this.height - 10)

            // Build the links
            let links = this.links;
            let link = d3.linkHorizontal();

            let svgLinks = svg.append("g")
                .attr("class", "dendrogram")
                .selectAll("path")
                .data(links)
                .enter()
                .append("path")
                .attr("class", d => "link" + d.startRow)
                .attr("d", d => {
                    let l = {source: [0, 0], target: [0, 0]};
                    l.source[0] = dendrogram.left + margin.left + d.startColumn * columnWidth + columnWidth / 2 + tab;
                    l.source[1] = margin.top + d.startRow * rowHeight + rowHeight / 2;
                    if (d.endType === 3) {
                        l.target[0] = dendrogram.left + margin.left + d.endColumn * columnWidth + columnWidth / 2;
                        l.target[1] = dendrogram.height / 2;
                    } else {
                        l.target[0] = dendrogram.left + margin.left + d.endColumn * columnWidth + columnWidth / 2;
                        l.target[1] = margin.top + d.endRow * rowHeight + rowHeight / 2;
                    }
                    return link(l);
                })
                .attr("fill", "none")
                .attr("stroke", 'lightsteelblue')
                .attr("stroke-width", 4)
                .attr("opacity", 1)

            let svgHLinks = svg.append("g")
                .attr("class", "dendrogram")
                .selectAll("path")
                .data(links)
                .enter()
                .append("path")
                .attr("class", d => "link" + d.startRow)
                .attr("d", d => {
                    let l = {source: [0, 0], target: [0, 0]};
                    l.source[0] = dendrogram.left + margin.left + d.startColumn * columnWidth + columnWidth / 2 - heatWidth;
                    l.source[1] = margin.top + d.startRow * rowHeight + rowHeight / 2;
                    l.target[0] = dendrogram.left + margin.left + d.startColumn * columnWidth + columnWidth / 2 + tab;
                    l.target[1] = margin.top + d.startRow * rowHeight + rowHeight / 2;
                    return link(l);
                })
                .attr("fill", "none")
                .attr("stroke", 'lightsteelblue')
                .attr("stroke-width", 4)
                .attr("opacity", 1)

            // draw heatmap
            for (let i = 0; i < links.length; i++) {
                let flowData = [];
                let min, max;
                let data = links[i];
                let id = data.startRow;
                let order = (i + id) % 10;
                let flowHeight = 20;
                for(let j = order * 24; j < order * 24 + 24; j++){
                    flowData.push(this.heatMap[j].count);
                    min = this.heatMap[j].min;
                    max = this.heatMap[j].max;
                }

                svg.append('rect')
                    .attr("x", dendrogram.left + margin.left + data.startColumn * columnWidth
                        + columnWidth / 2 + tab - heatWidth)
                    .attr("y", margin.top + data.startRow * rowHeight + rowHeight / 2 - flowHeight / 2)
                    .attr('rx', 2)
                    .attr('ry', 2)
                    .attr("width", heatWidth)
                    .attr("height", flowHeight)
                    .attr("fill", 'white')
                    .attr("opacity", 1)
                    .attr("stroke", 'black')
                    .attr("stroke-width", 1)

                let heatMap = svg.append("g")
                    .selectAll('whatever')
                    .data(flowData)
                    .enter()
                    .append("rect")
                    .attr("x", (d,i) => dendrogram.left + margin.left + data.startColumn * columnWidth
                        + columnWidth / 2 + tab - heatWidth + heatWidth / 24 * i)
                    .attr("y", margin.top + data.startRow * rowHeight + rowHeight / 2 - flowHeight / 2)
                    .attr("width", heatWidth / 24)
                    .attr("height", flowHeight)
                    .attr("fill", function (d) {
                        let myColor = d3.scaleLinear()
                            .range(["#FFF7BC", "#FD5D5D"])
                            .domain([min, max])
                        return myColor(d);
                    })
                    .attr("opacity", 1)
            }

            // draw centerLinks
            let centerLinksData = []
            for (let i = 0; i < patternNumber; i++) {
                centerLinksData[i] = i;
            }
            let centerLinks = svg.append("g")
                .attr("class", "dendrogram")
                .selectAll("path")
                .data(centerLinksData)
                .enter()
                .append("path")
                .attr("class", d => "link" + d)
                .attr("d", d => {
                    let l = {source: [0, 0], target: [0, 0]};
                    l.source[0] = dendrogram.left + margin.left + (columnNumber - 2) * columnWidth + columnWidth / 2;
                    l.source[1] = dendrogram.height / 2;
                    l.target[0] = dendrogram.left + margin.left + (columnNumber - 1) * columnWidth + columnWidth / 4 - tab;
                    l.target[1] = margin.top + d * rowHeight + rowHeight / 2;
                    return link(l);
                })
                .attr("fill", "none")
                .attr("stroke", 'lightsteelblue')
                .attr("stroke-width", 4)
                .attr("opacity", 1)

            // draw destLinks
            let destLinks = svg.append("g")
                .attr("class", "dendrogram")
                .selectAll("path")
                .data(this.destLinks)
                .enter()
                .append("path")
                .attr("class", d => "link" + d.row)
                .attr("d", d => {
                    let l = {source: [0, 0], target: [0, 0]};
                    l.source[0] = dendrogram.left + margin.left + (columnNumber - 1) * columnWidth + columnWidth / 4 - tab;
                    l.source[1] = margin.top + d.row * rowHeight + rowHeight / 2;
                    l.target[0] = dendrogram.left + margin.left + (columnNumber - 1) * columnWidth + columnWidth / 2 - tab;
                    l.target[1] = margin.top + rowHeight * d.row + d.destCount * destRow + rowPadding + destRadius;
                    return link(l);
                })
                .attr("fill", "none")
                .attr("stroke", 'lightsteelblue')
                .attr("stroke-width", 4)
                .attr("opacity", 1)

            let destHLinks = svg.append("g")
                .attr("class", "dendrogram")
                .selectAll("path")
                .data(this.destLinks)
                .enter()
                .append("path")
                .attr("class", d => "link" + d.row)
                .attr("d", d => {
                    let l = {source: [0, 0], target: [0, 0]};
                    l.source[0] = dendrogram.left + margin.left + (columnNumber - 1) * columnWidth + columnWidth / 2 - tab;
                    l.source[1] = margin.top + rowHeight * d.row + d.destCount * destRow + rowPadding + destRadius;
                    l.target[0] = dendrogram.left + margin.left + (columnNumber - 1) * columnWidth + columnWidth / 2 + heatWidth;
                    l.target[1] = margin.top + rowHeight * d.row + d.destCount * destRow + rowPadding + destRadius;
                    return link(l);
                })
                .attr("fill", "none")
                .attr("stroke", 'lightsteelblue')
                .attr("stroke-width", 4)
                .attr("opacity", 1)

            // draw heatmap
            for (let i = 0; i < this.destLinks.length; i++) {
                let flowData = [];
                let min, max;
                let data = this.destLinks[i];
                let id = data.row + data.destCont;
                let order = (i + id) % 10;
                let flowHeight = 20;
                for(let j = order * 24; j < order * 24 + 24; j++){
                    flowData.push(this.heatMap[j].count);
                    min = this.heatMap[j].min;
                    max = this.heatMap[j].max;
                }

                svg.append('rect')
                    .attr("x", dendrogram.left + margin.left + (columnNumber - 1) * columnWidth + columnWidth / 2 - tab)
                    .attr("y", margin.top + rowHeight * data.row + data.destCount * destRow + rowPadding + destRadius - flowHeight / 2)
                    .attr('rx', 2)
                    .attr('ry', 2)
                    .attr("width", heatWidth)
                    .attr("height", flowHeight)
                    .attr("fill", 'white')
                    .attr("opacity", 1)
                    .attr("stroke", 'black')
                    .attr("stroke-width", 1)

                let heatMap = svg.append("g")
                    .selectAll('whatever')
                    .data(flowData)
                    .enter()
                    .append("rect")
                    .attr("x", (d,i) => dendrogram.left + margin.left + (columnNumber - 1) * columnWidth
                        + columnWidth / 2 - tab + heatWidth / 24 * i)
                    .attr("y", margin.top + rowHeight * data.row + data.destCount * destRow + rowPadding + destRadius - flowHeight / 2)
                    .attr("width", heatWidth / 24)
                    .attr("height", flowHeight)
                    .attr("fill", function (d) {
                        let myColor = d3.scaleLinear()
                            .range(["#FFF7BC", "#FD5D5D"])
                            .domain([min, max])
                        return myColor(d);
                    })
                    .attr("opacity", 1)
            }

            // draw glyphs
            for (let i = 0; i < this.glyphs.length; i++) {
                let glyph = this.glyphs[i];
                let column = columnNumber - 2 + glyph.column;
                let row = glyph.patternId;
                let patternId = glyph.patternId;
                let regionId = glyph.regionId;
                let type = glyph.type;

                let cx, cy, innerRadius, outerRadius;
                // compute glyph position
                if (type === 1) {
                    cx = dendrogram.left + margin.left + column * columnWidth + columnWidth / 2 + heatWidth;
                    cy = margin.top + rowHeight * row + glyph.destCount * destRow + rowPadding + destRadius;
                    innerRadius = destRadius - patternNumber * 2;
                    outerRadius = destRadius;
                } else if (type === 2) {
                    cx = dendrogram.left + margin.left + column * columnWidth + columnWidth / 2 - heatWidth;
                    cy = margin.top + rowHeight * row + rowHeight / 2;
                    innerRadius = destRadius - patternNumber * 2;
                    outerRadius = destRadius;
                } else {
                    cx = dendrogram.left + margin.left + column * columnWidth + columnWidth / 2;
                    cy = dendrogram.height / 2;
                    innerRadius = centerRadius - patternNumber * 4;
                    outerRadius = centerRadius;
                }

                this.drawSingleGlyph(this.generate, regionId, patternId, cx, cy, false, 'dendrogram', 0, innerRadius, outerRadius);
            }
        },

        drawSingleGlyph(generate, regionId, patternId, cx, cy, mode, type, entropy, innerRadius, outerRadius) {
            let region = this.regionsFlow[regionId]
            // console.log("--------------StateView---------------");
            // console.log(this.regionsFlow);
            // console.log(regionId);
            // console.log(region)
            // console.log("--------------StateView---------------");

            let self = this;
            let svg;
            if(type === 'dendrogram')
                svg = this.octopusSvg;
            else
                svg = this.svg;

            let g = svg.append("g")
                .attr("class", type)
                .attr("transform", "translate(" + cx + "," + cy + ")")

            // set the color map
            let region_color = ['#99CCCC', '#FFCC99', '#FFCCCC', '#0099cc', '#CC9999', '#FF6666',
                '#FFFF99', '#CCCCFF', '#CC9966', '#CCCCCC', '#666666', '#99CC66', '#CCCC99'];
            let color = ['#8dd3c7', '#fb8072', '#b3de69', '#fdb462', '#bc80bd', '#bebada',
                '#fccde5', '#d9d9d9', '#80b1d3', '#CCCCCC', '#666666', '#99CC66', '#CCCC99'];

            // Compute the position of each group on the pie:
            let pie = d3.pie()
                .value(function (d) {
                    return d;
                })
            let data_ready = pie(region)

            // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
            g.selectAll('whatever')
                .data(data_ready)
                .enter()
                .append('path')
                .attr('d', d3.arc()
                    .innerRadius(innerRadius)         // This is the size of the donut hole
                    .outerRadius(outerRadius)
                )
                .attr('fill', d => color[d.index])
                .attr("stroke", "black")
                .style("stroke-width", "0.3px")
                .style("opacity", 1)
                .on("click", function () {
                    // mode true:点击统计category分布 false:点击显示pattern
                    if(mode) {
                        self.$emit("conveyRegionId", regionId, generate);
                    } else {
                        self.patternId = patternId;
                        // self.findPosition(patternId);
                    }
                })

            if (type === 'dest'){
                let myColor = d3.scaleLinear()
                    .range(["#CCF3EE", "#0AA1DD"])
                    .domain([0, 1])

                g.append('circle')
                    .attr("class", "circle")
                    .attr("r", innerRadius)
                    .attr("fill", myColor(entropy))
                    .attr("stroke", "black")
                    .attr("stroke-width", "0.3px")
                    .attr("opacity", 1)
                    .style("cursor", 'pointer')
                    .on("click", function () {
                        // mode true:点击统计category分布 false:点击显示pattern
                        if(mode) {
                            self.$emit("conveyRegionId", regionId, generate);
                            console.log(generate);
                        } else {
                            self.patternId = patternId;
                            // self.findPosition(patternId);
                        }
                    })
            } else {
                g.append('circle')
                    .attr("class", "circle")
                    .attr("r", innerRadius)
                    .attr("fill", 'white')
                    .attr("stroke", "black")
                    .attr("stroke-width", "0.3px")
                    .attr("opacity", 1)
                    .style("cursor", 'pointer')
                    .on("click", function () {
                        // mode true:点击统计category分布 false:点击显示pattern
                        if(mode) {
                            self.$emit("conveyRegionId", regionId, generate);
                        } else {
                            self.patternId = patternId;
                            // self.findPosition(patternId);
                        }
                    })
            }

            if(type !== 'dendrogram'){
                svg.append('text')
                    .attr("class", "pattern")
                    .attr("y", cy + outerRadius + 10)
                    .attr("x", cx)
                    .attr('text-anchor', 'middle')
                    .text("R" + regionId)
                    .style("font-size", 8)
            }


            //     if(type === 3){
            //         // 计算entropy, 按照entropy比例画扇形
            //         this.computeEntropy();
            //         let entropy = this.entropy;
            //         let entropy_data = pie(this.entropy);
            //
            //         let startColor = d3.rgb('#7f2704')
            //         let endColor = d3.rgb('#fff5eb') // orange
            //         let computeColor = d3.interpolate(startColor, endColor)
            //
            //         // computer max and min in variance
            //         let max = entropy[0];
            //         let min = entropy[0];
            //         for (let i = 0; i < entropy.length; i++){
            //             max = max > entropy[i] ? max : entropy[i];
            //             min = min < entropy[i] ? min : entropy[i];
            //         }
            //
            //         let linearColor = d3.scaleLinear()
            //             .domain([min, max])
            //             .range([0, 1])
            //
            //         g.selectAll('whatever')
            //             .data(entropy_data)
            //             .enter()
            //             .append('path')
            //             .attr('d', d3.arc()
            //                 .innerRadius(0)         // This is the size of the donut hole
            //                 .outerRadius(innerRadius)
            //             )
            //             .attr('fill', function (d, i) {return computeColor(linearColor(entropy[i]))})
            //             .attr("stroke", "black")
            //             .style("stroke-width", "0.3px")
            //             .style("opacity", 1)
            //             .on("mouseover", function(d) {
            //                 d3.select(this).attr("fill", '#92A9BD');
            //                 d3.selectAll(".sankey" + index).selectAll(".link" + d.index).attr('stroke', 'black');
            //             })
            //             .on("mouseout", function (d, i){
            //                 d3.select(this).attr("fill", computeColor(linearColor(entropy[i])));
            //                 d3.selectAll(".sankey" + index).selectAll(".link" + d.index).attr('stroke', 'grey');
            //             })
            //             .on("click", function (d){
            //                 d3.selectAll(".sankey" + index).selectAll(".link" + d.index).attr('stroke', 'black');
            //                 let key = self.indexMapKey[self.index][d.index]
            //                 self.savedData[key] = self.allData[self.index][key];
            //                 self.$emit("conveySelected", self.select, self.savedData);
            //                 self.select++;
            //                 console.log(self.savedData);
            //             })
            //
            //
            //     } else {
            //         g.append('circle')
            //             .attr("class", "circle")
            //             .attr("r", innerRadius)
            //             .attr("fill", 'lightsteelblue')
            //             .attr("stroke", "black")
            //             .attr("stroke-width", "0.3px")
            //             .attr("opacity", 1)
            //     }
        },

        // drawSinglePattern: function (index) {
        //     let moduleWidth = 600;
        //     let moduleHeight = 250;
        //     let patternWidth = moduleWidth / 2;
        //     let patternHeight = moduleHeight / 2;
        //     let cx = index % 2 * patternWidth;
        //     let cy = Math.floor(index / 2) * patternHeight;
        //
        //     let svg = this.svg;
        //     // let g = svg.append("g")
        //     //     .attr("class", 'pattern')
        //     //     .attr("transform", "translate(" + cx + "," + cy + ")")
        //
        //     let margin = {left: 10, right: 10, top: 20, bottom: 20}
        //
        //     // data
        //     let patternId = this.fourPatternsId[index];
        //     let pattern = this.fourPatterns[index];
        //     let regionsFlow = this.fourRegionsFlow[index];
        //
        //     console.log("-------------Pattern RegionsId-----------------");
        //     console.log(pattern);
        //     console.log("-------------Pattern RegionsId-----------------");
        //
        //
        //     let columnNumber = pattern['preamble'].length + 1;
        //     let destNumber = pattern['destinations'].length;
        //     let columnWidth = (patternWidth - margin.left - margin.right) / columnNumber;
        //
        //     // draw flow
        //     let total = 0;
        //     for (let i = 0; i < pattern['destinations'].length; i++) {
        //         total += pattern['destinations'][i]['count'];
        //     }
        //
        //     // Find special pattern type by check pattern
        //     let patternType = 0;    // patternType = 0 means no special
        //     let preamble = pattern['preamble'];
        //     let destinations = pattern['destinations'];
        //
        //     // Type 1: A->B->A
        //     if (preamble.length === 2) {
        //         let s = preamble[0];
        //         for (let i = 0; i < destinations.length; i++) {
        //             if (destinations[i]['regionId'] === s) {
        //                 patternType = 1;
        //                 destNumber--;
        //             }
        //         }
        //     }
        //
        //     // Type 2: A->B->A->C
        //     if (preamble.length === 3) {
        //         if (preamble[0] === preamble[2]) {
        //             patternType = 2;
        //         }
        //     }
        //
        //     // 所有glyph的半径需要保持一致
        //     let destHeight = (patternHeight - margin.top - margin.bottom) / destNumber;
        //     let padding = 2
        //     let preambleRadius = ((patternHeight - margin.top - margin.bottom) / 2 - padding * 2) / 2;
        //     let radius = (destNumber > 2) ? (destHeight - padding * 2) / 2 : preambleRadius;
        //
        //     if (patternType === 0) {
        //         // draw preamble flow
        //         for (let i = 0; i < pattern['preamble'].length - 1; i++) {
        //             svg.append('line')
        //                 .attr("class", 'pattern')
        //                 .style("Stroke", "lightsteelblue")
        //                 .attr("stroke-width", preambleRadius - 6)
        //                 .style("opacity", 1)
        //                 .attr("x1", cx + margin.left + i * columnWidth + columnWidth / 2)
        //                 .attr("y1", cy + patternHeight / 2)
        //                 .attr("x2", cx + margin.left + (i + 1) * columnWidth + columnWidth / 2)
        //                 .attr("y2", cy + patternHeight / 2)
        //         }
        //
        //         // draw destination flow
        //         for (let i = 0; i < pattern['destinations'].length; i++) {
        //             let regionId = pattern['destinations'][i]['regionId'];
        //             let flow = pattern['destinations'][i]['count'];
        //             let x = cx + margin.left + (columnNumber - 1) * columnWidth + columnWidth / 2;
        //             let y = cy + margin.top + destHeight * i + destHeight / 2;
        //             svg.append('line')
        //                 .attr("class", 'pattern')
        //                 .style("Stroke", "lightsteelblue")
        //                 .attr("stroke-width", (preambleRadius - 6) * flow / total)
        //                 .style("opacity", 1)
        //                 .attr("x1", cx + margin.left + (columnNumber - 2) * columnWidth + columnWidth / 2)
        //                 .attr("y1", cy + patternHeight / 2)
        //                 .attr("x2", x)
        //                 .attr("y2", y)
        //         }
        //
        //         // draw preamble glyph
        //         for (let i = 0; i < pattern['preamble'].length; i++) {
        //             let regionId = pattern['preamble'][i];
        //             let x = cx + margin.left + i * columnWidth + columnWidth / 2;
        //             let y = cy + patternHeight / 2;
        //             this.drawSingleGlyph(regionId, patternId, x, y, 'patterns', radius - 6, radius);
        //
        //             svg.append('text')
        //                 .attr("class", "pattern")
        //                 .attr("y", y + radius + 10)
        //                 .attr("x", x)
        //                 .attr('text-anchor', 'middle')
        //                 .text("R" + regionId)
        //                 .style("font-size", 8)
        //         }
        //
        //         // draw destination glyph
        //         for (let i = 0; i < pattern['destinations'].length; i++) {
        //             let regionId = pattern['destinations'][i]['regionId'];
        //             let x = cx + margin.left + (columnNumber - 1) * columnWidth + columnWidth / 2;
        //             let y = cy + margin.top + destHeight * i + destHeight / 2;
        //             this.drawSingleGlyph(regionId, index, x, y, 'patterns', radius - 6, radius);
        //         }
        //     } else if (patternType === 1) {
        //         // draw preamble flow
        //         for (let i = 0; i < pattern['preamble'].length - 1; i++) {
        //             svg.append('line')
        //                 .attr("class", 'pattern')
        //                 .style("Stroke", "lightsteelblue")
        //                 .attr("stroke-width", preambleRadius - 6)
        //                 .style("opacity", 1)
        //                 .attr("x1", cx + margin.left + i * columnWidth + columnWidth / 2)
        //                 .attr("y1", cy + patternHeight / 2)
        //                 .attr("x2", cx + margin.left + (i + 1) * columnWidth + columnWidth / 2)
        //                 .attr("y2", cy + patternHeight / 2)
        //         }
        //
        //         // draw destination flow
        //         let order = 0;
        //         let backCount = 0;
        //         let startId = preamble[0];
        //         for (let i = 0; i < pattern['destinations'].length; i++) {
        //             let regionId = pattern['destinations'][i]['regionId'];
        //             let flow = pattern['destinations'][i]['count'];
        //
        //             // 遇到回去的regionId则跳过不画直线
        //             if (regionId === startId) {
        //                 backCount = flow;
        //                 continue;
        //             }
        //             let x = cx + margin.left + (columnNumber - 1) * columnWidth + columnWidth / 2;
        //             let y = cy + margin.top + destHeight * order + destHeight / 2;
        //             order++;
        //             svg.append('line')
        //                 .attr("class", 'pattern')
        //                 .style("Stroke", "lightsteelblue")
        //                 .attr("stroke-width", (preambleRadius - 6) * flow / total)
        //                 .style("opacity", 1)
        //                 .attr("x1", cx + margin.left + (columnNumber - 2) * columnWidth + columnWidth / 2)
        //                 .attr("y1", cy + patternHeight / 2)
        //                 .attr("x2", x)
        //                 .attr("y2", y)
        //         }
        //
        //         // draw back flow
        //         let lineGenerator = d3.line()
        //             .x(function (d) {
        //                 return d[0];
        //             })
        //             .y(function (d) {
        //                 return d[1];
        //             })
        //
        //         const curvePoints = [
        //             [cx + margin.left + columnWidth / 2, cy + patternHeight / 2],
        //             [cx + margin.left + columnWidth, cy + patternHeight / 4],
        //             [cx + margin.left + columnWidth + columnWidth / 2, cy + patternHeight / 2],
        //         ];
        //
        //         const lines = svg.append('path')
        //             .attr("class", "backFlow")
        //             .attr("stroke", 'lightsteelblue')
        //             .attr("stroke-width", (preambleRadius - 6) * backCount / total)
        //             .attr("fill", 'none')
        //             .attr('d', lineGenerator.curve(d3['curveCardinal'])(curvePoints))
        //
        //         // draw preamble glyph
        //         for (let i = 0; i < pattern['preamble'].length; i++) {
        //             let regionId = pattern['preamble'][i];
        //             let x = cx + margin.left + i * columnWidth + columnWidth / 2;
        //             let y = cy + patternHeight / 2;
        //             this.drawSingleGlyph(regionId, patternId, x, y, 'patterns', radius - 6, radius);
        //
        //             svg.append('text')
        //                 .attr("class", "pattern")
        //                 .attr("y", y + radius + 10)
        //                 .attr("x", x)
        //                 .attr('text-anchor', 'middle')
        //                 .text("R" + regionId)
        //                 .style("font-size", 8)
        //         }
        //
        //         // draw destination glyph
        //         order = 0
        //         for (let i = 0; i < pattern['destinations'].length; i++) {
        //             let regionId = pattern['destinations'][i]['regionId'];
        //             // 遇到回去的regionId则跳过不画glyph
        //             if (regionId === startId) {
        //                 continue;
        //             }
        //             let x = cx + margin.left + (columnNumber - 1) * columnWidth + columnWidth / 2;
        //             let y = cy + margin.top + destHeight * order + destHeight / 2;
        //             order++;
        //             this.drawSingleGlyph(regionId, index, x, y, 'patterns', radius - 6, radius);
        //         }
        //     } else if (patternType === 2) {
        //         // reset columnWidth
        //         columnNumber--;
        //         columnWidth = (patternWidth - margin.left - margin.right) / columnNumber;
        //
        //         // draw preamble flow
        //         for (let i = 0; i < pattern['preamble'].length - 2; i++) {
        //             svg.append('line')
        //                 .attr("class", 'pattern')
        //                 .style("Stroke", "lightsteelblue")
        //                 .attr("stroke-width", preambleRadius - 6)
        //                 .style("opacity", 1)
        //                 .attr("x1", cx + margin.left + i * columnWidth + columnWidth / 2)
        //                 .attr("y1", cy + patternHeight / 2)
        //                 .attr("x2", cx + margin.left + (i + 1) * columnWidth + columnWidth / 2)
        //                 .attr("y2", cy + patternHeight / 2)
        //         }
        //
        //         // draw backFlow
        //         let lineGenerator = d3.line()
        //             .x(function (d) {
        //                 return d[0];
        //             })
        //             .y(function (d) {
        //                 return d[1];
        //             })
        //
        //         let curvePoints = [
        //             [cx + margin.left + columnWidth / 2, cy + patternHeight / 2],
        //             [cx + margin.left + columnWidth, cy + patternHeight / 4],
        //             [cx + margin.left + columnWidth + columnWidth / 2, cy + patternHeight / 2],
        //         ];
        //
        //         const lines = svg.append('path')
        //             .attr("class", "backFlow")
        //             .attr("stroke", 'lightsteelblue')
        //             .attr("stroke-width", preambleRadius - 6)
        //             .attr("fill", 'none')
        //             .attr('d', lineGenerator.curve(d3['curveCardinal'])(curvePoints))
        //
        //         // draw destinations flow
        //         let destinations = pattern['destinations'];
        //         if (destinations.length === 1) {
        //             curvePoints = [
        //                 [cx + margin.left + columnWidth / 2, cy + patternHeight / 2],
        //                 [cx + margin.left + columnWidth + columnWidth / 2, cy + 3 * patternHeight / 4],
        //                 [cx + margin.left + columnWidth * 2 + columnWidth / 2, cy + patternHeight / 2],
        //             ];
        //
        //             let flow = destinations[0]['count'];
        //
        //             const jumpLine = svg.append('path')
        //                 .attr("class", "jumpFlow")
        //                 .attr("stroke", 'lightsteelblue')
        //                 .attr("stroke-width", (preambleRadius - 6) * flow / total)
        //                 .attr("fill", 'none')
        //                 .attr('d', lineGenerator.curve(d3['curveCardinal'])(curvePoints))
        //         } else {
        //             // 如果目的地有两条
        //             curvePoints = [
        //                 [cx + margin.left + columnWidth / 2, cy + patternHeight / 2],
        //                 [cx + margin.left + columnWidth + columnWidth / 2, cy + patternHeight],
        //                 [cx + margin.left + columnWidth * 2 + columnWidth / 2, margin.top + destHeight / 2],
        //             ];
        //
        //             let flow1 = destinations[0]['count'];
        //
        //             const jumpLine1 = svg.append('path')
        //                 .attr("class", "jumpFlow")
        //                 .attr("stroke", 'lightsteelblue')
        //                 .attr("stroke-width", (preambleRadius - 6) * flow1 / total)
        //                 .attr("fill", 'none')
        //                 .attr('d', lineGenerator.curve(d3['curveCardinal'])(curvePoints))
        //
        //             curvePoints = [
        //                 [cx + margin.left + columnWidth / 2, cy + patternHeight / 2],
        //                 [cx + margin.left + columnWidth + columnWidth / 2, cy + 3 * patternHeight / 4],
        //                 [cx + margin.left + columnWidth * 2, cy + patternHeight / 2],
        //                 [cx + margin.left + columnWidth * 2 + columnWidth / 2, margin.top + destHeight + destHeight / 2],
        //             ];
        //
        //             let flow2 = destinations[1]['count'];
        //
        //             const jumpLine2 = svg.append('path')
        //                 .attr("class", "jumpFlow")
        //                 .attr("stroke", 'lightsteelblue')
        //                 .attr("stroke-width", (preambleRadius - 6) * flow2 / total)
        //                 .attr("fill", 'none')
        //                 .attr('d', lineGenerator.curve(d3['curveCardinal'])(curvePoints))
        //         }
        //
        //         // draw preamble glyph
        //         for (let i = 0; i < pattern['preamble'].length - 1; i++) {
        //             let regionId = pattern['preamble'][i];
        //             let x = cx + margin.left + i * columnWidth + columnWidth / 2;
        //             let y = cy + patternHeight / 2;
        //             this.drawSingleGlyph(regionId, patternId, x, y, 'patterns', radius - 6, radius);
        //
        //             svg.append('text')
        //                 .attr("class", "pattern")
        //                 .attr("y", y + radius + 10)
        //                 .attr("x", x)
        //                 .attr('text-anchor', 'middle')
        //                 .text("R" + regionId)
        //                 .style("font-size", 8)
        //         }
        //
        //         // draw destination glyph
        //         for (let i = 0; i < pattern['destinations'].length; i++) {
        //             let regionId = pattern['destinations'][i]['regionId'];
        //             let x = cx + margin.left + (columnNumber - 1) * columnWidth + columnWidth / 2;
        //             let y = cy + margin.top + destHeight * i + destHeight / 2;
        //             this.drawSingleGlyph(regionId, index, x, y, 'patterns', radius - 6, radius);
        //         }
        //     }
        //
        //     // draw time axis
        //     let axisLength = patternWidth - margin.left * 4 - margin.right * 4;
        //     let y = cy + patternHeight - margin.bottom / 2;
        //     let x = cx + margin.left * 4;
        //     let startTime = this.generateTimeText(this.startTime);
        //     let endTime = this.generateTimeText(this.startTime + this.timeLength);
        //     svg.append('line')
        //         .style("Stroke", "black")
        //         .style("opacity", 0.5)
        //         .attr("x1", x)
        //         .attr("y1", y)
        //         .attr("x2", x + axisLength)
        //         .attr("y2", y)
        //     svg.append('line')
        //         .style("Stroke", "black")
        //         .style("opacity", 0.5)
        //         .attr("x1", x)
        //         .attr("y1", y - 5)
        //         .attr("x2", x)
        //         .attr("y2", y + 5)
        //     svg.append('line')
        //         .style("Stroke", "black")
        //         .style("opacity", 0.5)
        //         .attr("x1", x + axisLength)
        //         .attr("y1", y - 5)
        //         .attr("x2", x + axisLength)
        //         .attr("y2", y + 5)
        //
        //     svg.append('text')
        //         .attr("y", y + 3)
        //         .attr("x", x - 3)
        //         .attr('text-anchor', 'end')
        //         .attr("class", 'timeText')
        //         .text("00:00")
        //         .style("font-size", 8)
        //
        //     svg.append('text')
        //         .attr("y", y + 3)
        //         .attr("x", x + axisLength + 3)
        //         .attr('text-anchor', 'start')
        //         .attr("class", 'timeText')
        //         .text("24:00")
        //         .style("font-size", 8)
        //
        //     // draw timeRects
        //     let timeInterval = svg.append("rect")
        //         .attr("class", "interval")
        //         .attr("x", x + this.startTime / 48 * axisLength)
        //         .attr("y", y - 5)
        //         .attr("rx", 2)
        //         .attr("ry", 2)
        //         .attr("width", axisLength / 48 * this.timeLength)
        //         .attr("height", 10)
        //         .attr("fill", 'red')
        //         .attr("opacity", 1)
        //         .attr("stroke", '#505254')
        //         .attr("stroke-width", 1)
        //
        //     svg.append('text')
        //         .attr("y", y + 8)
        //         .attr("x", x + this.startTime / 48 * axisLength - 3)
        //         .attr('text-anchor', 'end')
        //         .attr("class", 'timeText')
        //         .text(startTime)
        //         .style("font-size", 8)
        //
        //     svg.append('text')
        //         .attr("y", y + 8)
        //         .attr("x", x + this.startTime / 48 * axisLength + axisLength / 48 * this.timeLength + 3)
        //         .attr('text-anchor', 'start')
        //         .attr("class", 'timeText')
        //         .text(endTime)
        //         .style("font-size", 8)
        //
        // },

        // drawOverviewPattern: function (index) {
        //     let moduleWidth = 600;
        //     let moduleHeight = 250;
        //     let patternWidth = moduleWidth / 2;
        //     let patternHeight = moduleHeight / 2;
        //     let cx = index % 2 * patternWidth;
        //     let cy = Math.floor(index / 2) * patternHeight;
        //
        //     let svg = this.svg;
        //     let margin = {left: 10, right: 10, top: 20, bottom: 20}
        //
        //     // data
        //     let patternId = this.fourPatternsId[index];
        //     let pattern = this.fourPatterns[index];
        //     let regionsFlow = this.fourRegionsFlow[index];
        //
        //     // detect pattern type
        //     let patternType = 0;
        //     if (pattern.length === 3) {
        //         if (pattern[0] === pattern[2]) {
        //             // A->B->A
        //             patternType = 1;
        //         }
        //     } else {
        //         // A->B->A->B
        //         patternType = 2;
        //     }
        //
        //     // glyph半径保持一致
        //     let padding = 2
        //     let radius = ((patternHeight - margin.top - margin.bottom) / 2 - padding * 2) / 2;
        //     // draw pattern
        //     if (patternType === 0) {
        //         let columnNumber = 3
        //         let columnWidth = (patternWidth - margin.left - margin.right) / columnNumber;
        //
        //         // draw flow
        //         for (let i = 0; i < pattern.length - 1; i++) {
        //             svg.append('line')
        //                 .attr("class", 'pattern')
        //                 .style("Stroke", "lightsteelblue")
        //                 .attr("stroke-width", radius - 10)
        //                 .style("opacity", 1)
        //                 .attr("x1", cx + margin.left + i * columnWidth + columnWidth / 2)
        //                 .attr("y1", cy + patternHeight / 2)
        //                 .attr("x2", cx + margin.left + (i + 1) * columnWidth + columnWidth / 2)
        //                 .attr("y2", cy + patternHeight / 2)
        //         }
        //
        //         // draw glyph
        //         for (let i = 0; i < pattern.length; i++) {
        //             let regionId = pattern[i];
        //             let x = cx + margin.left + i * columnWidth + columnWidth / 2;
        //             let y = cy + patternHeight / 2;
        //             this.drawSingleGlyph(regionId, patternId, x, y, 'patterns', radius - 6, radius);
        //
        //             svg.append('text')
        //                 .attr("class", "pattern")
        //                 .attr("y", y + radius + 10)
        //                 .attr("x", x)
        //                 .attr('text-anchor', 'middle')
        //                 .text("R" + regionId)
        //                 .style("font-size", 8)
        //         }
        //     } else if (patternType === 1) {
        //         let columnNumber = 2
        //         let columnWidth = (patternWidth - margin.left - margin.right) / columnNumber;
        //
        //         // draw flow
        //         for (let i = 0; i < pattern.length - 2; i++) {
        //             svg.append('line')
        //                 .attr("class", 'pattern')
        //                 .style("Stroke", "lightsteelblue")
        //                 .attr("stroke-width", radius - 10)
        //                 .style("opacity", 1)
        //                 .attr("x1", cx + margin.left + i * columnWidth + columnWidth / 2)
        //                 .attr("y1", cy + patternHeight / 2)
        //                 .attr("x2", cx + margin.left + (i + 1) * columnWidth + columnWidth / 2)
        //                 .attr("y2", cy + patternHeight / 2)
        //         }
        //
        //         // draw back flow
        //         let lineGenerator = d3.line()
        //             .x(function (d) {
        //                 return d[0];
        //             })
        //             .y(function (d) {
        //                 return d[1];
        //             })
        //
        //         const curvePoints = [
        //             [cx + margin.left + columnWidth / 2, cy + patternHeight / 2],
        //             [cx + margin.left + columnWidth, cy + patternHeight / 4],
        //             [cx + margin.left + columnWidth + columnWidth / 2, cy + patternHeight / 2],
        //         ];
        //
        //         const lines = svg.append('path')
        //             .attr("class", "backFlow")
        //             .attr("stroke", 'lightsteelblue')
        //             .attr("stroke-width", radius - 10)
        //             .attr("fill", 'none')
        //             .attr('d', lineGenerator.curve(d3['curveCardinal'])(curvePoints))
        //
        //         // draw glyph
        //         for (let i = 0; i < pattern.length - 1; i++) {
        //             let regionId = pattern[i];
        //             let x = cx + margin.left + i * columnWidth + columnWidth / 2;
        //             let y = cy + patternHeight / 2;
        //             this.drawSingleGlyph(regionId, patternId, x, y, 'patterns', radius - 6, radius);
        //
        //             svg.append('text')
        //                 .attr("class", "pattern")
        //                 .attr("y", y + radius + 10)
        //                 .attr("x", x)
        //                 .attr('text-anchor', 'middle')
        //                 .text("R" + regionId)
        //                 .style("font-size", 8)
        //         }
        //     } else {
        //         let columnNumber = 2
        //         let columnWidth = (patternWidth - margin.left - margin.right) / columnNumber;
        //
        //         // draw flow
        //         for (let i = 0; i < pattern.length - 3; i++) {
        //             svg.append('line')
        //                 .attr("class", 'pattern')
        //                 .style("Stroke", "lightsteelblue")
        //                 .attr("stroke-width", radius - 10)
        //                 .style("opacity", 1)
        //                 .attr("x1", cx + margin.left + i * columnWidth + columnWidth / 2)
        //                 .attr("y1", cy + patternHeight / 2)
        //                 .attr("x2", cx + margin.left + (i + 1) * columnWidth + columnWidth / 2)
        //                 .attr("y2", cy + patternHeight / 2)
        //         }
        //
        //         // draw back flow
        //         let lineGenerator = d3.line()
        //             .x(function (d) {
        //                 return d[0];
        //             })
        //             .y(function (d) {
        //                 return d[1];
        //             })
        //
        //         const curvePoints = [
        //             [cx + margin.left + columnWidth / 2, cy + patternHeight / 2],
        //             [cx + margin.left + columnWidth, cy + patternHeight / 4],
        //             [cx + margin.left + columnWidth + columnWidth / 2, cy + patternHeight / 2],
        //         ];
        //
        //         const lines = svg.append('path')
        //             .attr("class", "backFlow")
        //             .attr("stroke", 'lightsteelblue')
        //             .attr("stroke-width", radius - 10)
        //             .attr("fill", 'none')
        //             .attr('d', lineGenerator.curve(d3['curveCardinal'])(curvePoints))
        //
        //         // draw glyph
        //         for (let i = 0; i < pattern.length - 2; i++) {
        //             let regionId = pattern[i];
        //             let x = cx + margin.left + i * columnWidth + columnWidth / 2;
        //             let y = cy + patternHeight / 2;
        //             this.drawSingleGlyph(regionId, patternId, x, y, 'patterns', radius - 6, radius);
        //
        //             svg.append('text')
        //                 .attr("class", "pattern")
        //                 .attr("y", y + radius + 10)
        //                 .attr("x", x)
        //                 .attr('text-anchor', 'middle')
        //                 .text("R" + regionId)
        //                 .style("font-size", 8)
        //         }
        //     }
        //
        //     // draw time axis
        //     let axisLength = patternWidth - margin.left * 4 - margin.right * 4;
        //     let y = cy + patternHeight - margin.bottom / 2;
        //     let x = cx + margin.left * 4;
        //     let startTime = this.generateTimeText(this.overviewStart);
        //     let endTime = this.generateTimeText(this.overviewStart + this.overviewLength);
        //     svg.append('line')
        //         .style("Stroke", "black")
        //         .style("opacity", 0.5)
        //         .attr("x1", x)
        //         .attr("y1", y)
        //         .attr("x2", x + axisLength)
        //         .attr("y2", y)
        //     svg.append('line')
        //         .style("Stroke", "black")
        //         .style("opacity", 0.5)
        //         .attr("x1", x)
        //         .attr("y1", y - 5)
        //         .attr("x2", x)
        //         .attr("y2", y + 5)
        //     svg.append('line')
        //         .style("Stroke", "black")
        //         .style("opacity", 0.5)
        //         .attr("x1", x + axisLength)
        //         .attr("y1", y - 5)
        //         .attr("x2", x + axisLength)
        //         .attr("y2", y + 5)
        //
        //     svg.append('text')
        //         .attr("y", y + 3)
        //         .attr("x", x - 3)
        //         .attr('text-anchor', 'end')
        //         .attr("class", 'timeText')
        //         .text("00:00")
        //         .style("font-size", 8)
        //
        //     svg.append('text')
        //         .attr("y", y + 3)
        //         .attr("x", x + axisLength + 3)
        //         .attr('text-anchor', 'start')
        //         .attr("class", 'timeText')
        //         .text("24:00")
        //         .style("font-size", 8)
        //
        //     // draw timeRects
        //     let timeInterval = svg.append("rect")
        //         .attr("class", "interval")
        //         .attr("x", x + this.overviewStart / 48 * axisLength)
        //         .attr("y", y - 5)
        //         .attr("rx", 2)
        //         .attr("ry", 2)
        //         .attr("width", axisLength / 48 * this.overviewLength)
        //         .attr("height", 10)
        //         .attr("fill", 'red')
        //         .attr("opacity", 1)
        //         .attr("stroke", '#505254')
        //         .attr("stroke-width", 1)
        //
        //     svg.append('text')
        //         .attr("y", y + 8)
        //         .attr("x", x + this.overviewStart / 48 * axisLength - 3)
        //         .attr('text-anchor', 'end')
        //         .attr("class", 'timeText')
        //         .text(startTime)
        //         .style("font-size", 8)
        //
        //     svg.append('text')
        //         .attr("y", y + 8)
        //         .attr("x", x + this.overviewStart / 48 * axisLength + axisLength / 48 * this.overviewLength + 3)
        //         .attr('text-anchor', 'start')
        //         .attr("class", 'timeText')
        //         .text(endTime)
        //         .style("font-size", 8)
        // },

        // findPosition: function (patternId) {
        //     // 遍历四个位置
        //     for (let i = 0; i < 4; i++) {
        //         if (this.isEmpty[i]) {
        //             this.isEmpty[i] = false;
        //             this.fourPatternsId[i] = patternId;
        //             this.fourPatterns[i] = this.patterns[patternId];
        //             this.fourRegionsFlow[i] = this.regionsFlow;
        //
        //             this.drawSinglePattern(i);
        //             return 1;
        //         }
        //     }
        //     return -1;
        // },

        compute: function () {
            let regionNum;    //HighOrder所涉及的region数目
            let columnNum = 0;    //列数
            let regionCount = [];    //统计出现的region
            let regionIndex = {};    //region对应的序号 {regionId: index}
            let regionInOut = [];
            let lastLine = [];
            let nextLine = [];
            let rects = [];
            let links = [];
            let hLinks = [];
            let colors = ['#8dd3c7', '#fb8072', '#b3de69', '#fdb462', '#bc80bd', '#bebada',
                '#fccde5', '#d9d9d9', '#80b1d3', '#CCCCCC', '#666666', '#99CC66', '#CCCC99'];

            // 统计涉及到的region个数（即行数），以及最高阶（即列数）
            for (let key in this.content) {
                let t = key.split('_');
                columnNum = columnNum > t.length ? columnNum : t.length;
                for (let i = 0; i < t.length - 1; i++) {
                    if (!this.isInArray(regionCount, Number(t[i]))) {
                        regionCount.push(Number(t[i]));
                    }
                }

                for (let i = 0; i < this.content[key].length; i++) {
                    if (this.content[key][i] !== 0) {
                        if (!this.isInArray(regionCount, i)) {
                            regionCount.push(i);
                        }
                    }
                }
            }
            regionNum = regionCount.length;
            this.row = regionNum;
            this.column = columnNum;

            // 给region编号，所研究的region在最中间
            for (let i = 0; i < regionNum; i++) {
                if (regionCount[i] === this.region) {
                    let temp = regionCount[Math.floor(regionNum / 2)];
                    regionCount[Math.floor(regionNum / 2)] = this.region;
                    regionCount[i] = temp;
                }
            }
            for (let i = 0; i < regionNum; i++) {
                regionIndex[regionCount[i]] = i;
            }

            // 统计每块rect进出的路径数
            for (let i = 0; i < columnNum; i++) {
                regionInOut[i] = []
                for (let j = 0; j < regionNum; j++) {
                    regionInOut[i][j] = [0, 0];
                }
            }

            // 存储所关注的region的前后的links,按row顺序存储
            for (let i = 0; i < regionNum; i++) {
                lastLine[i] = [];
                nextLine[i] = [];
            }

            let total = 0;    //计算通过所研究的region的总流量
            let id = 0;       // 用于标记entropy分类的轨迹id
            // 统计矩形，赋予列系数，行系数，颜色
            for (let key in this.content) {
                let t = key.split('_');
                let start;

                // 计算该条路径的总流量
                let flow = 0;
                for (let i = 0; i < this.content[key].length; i++) {
                    flow += this.content[key][i];
                }
                // 计算通过所研究的region的总流量
                total += flow;
                this.total = total;

                for (let i = 0; i < t.length - 1; i++) {
                    let rect = {regionId: 0, column: 0, row: 0, color: "black"};
                    rect.regionId = Number(t[i]);
                    rect.column = columnNum - t.length + i;
                    rect.row = regionIndex[Number(t[i])];
                    rect.color = colors[rect.row];
                    rects.push(rect);

                    start = [rect.column, rect.row];
                    let link = {id: 0, start: [0, 0], end: [0, 0], outR: 0, inR: 0, flow: 0}
                    if (i < t.length - 2) {
                        link.id = id;
                        link.start = start;
                        link.end = [rect.column + 1, regionIndex[Number(t[i + 1])]]
                        link.flow = flow;
                        link.outR = regionInOut[rect.column][rect.row][1];
                        // 添加右水平线
                        if (link.start[1] % 2 === 0) {
                            hLinks.push({id: id, type: 1, point: link.start, index: link.outR})
                        }
                        regionInOut[rect.column][rect.row][1]++;
                        link.inR = regionInOut[rect.column + 1][regionIndex[Number(t[i + 1])]][0];
                        // 添加左水平线
                        if (link.end[1] % 2 === 1 && link.end[0] !== columnNum - 2) {
                            hLinks.push({id: id, type: 0, point: link.end, index: link.inR})
                        }
                        regionInOut[rect.column + 1][regionIndex[Number(t[i + 1])]][0]++;
                        if (i === t.length - 3) {
                            lastLine[start[1]].push(link)
                        } else links.push(link);
                    }
                }

                for (let i = 0; i < this.content[key].length; i++) {
                    if (this.content[key][i] !== 0) {
                        let rect = {regionId: 0, column: 0, row: 0, color: "black"};
                        rect.regionId = i;
                        rect.column = columnNum - 1;
                        rect.row = regionIndex[i];
                        rect.color = colors[rect.row];
                        rects.push(rect);

                        let link = {id: 0, start: [0, 0], end: [0, 0], outR: 0, inR: 0, flow: 0};
                        link.id = id;
                        link.start = start;
                        link.end = [start[0] + 1, regionIndex[i]];
                        link.flow = this.content[key][i];
                        link.outR = regionInOut[start[0]][start[1]][1];
                        regionInOut[start[0]][start[1]][1]++;
                        link.inR = regionInOut[start[0] + 1][regionIndex[i]][0];
                        if (link.end[1] % 2 === 1) {
                            hLinks.push({id: id, type: 0, point: link.end, index: link.inR})
                        }
                        regionInOut[start[0] + 1][regionIndex[i]][0]++;
                        nextLine[regionIndex[i]].push(link);
                    }
                }

                // 轨迹id记得每次循环后要加一
                id++;
            }

            let next = [];
            let count = 0;
            // 按顺序添加next路径
            for (let i = 0; i < regionNum; i++) {
                for (let j = 0; j < nextLine[i].length; j++) {
                    let l = nextLine[i][j];
                    l.outR = count;
                    next.push(l);
                    count++;
                }
            }
            this.nextLinks = next;

            let last = [];
            count = 0;
            // 按顺序添加last路径
            for (let i = 0; i < regionNum; i++) {
                for (let j = 0; j < lastLine[i].length; j++) {
                    let l = lastLine[i][j];
                    l.inR = count;
                    last.push(l);
                    count++;
                }
            }
            this.lastLinks = last;

            // 添加水平线
            // for (let i = 0; i < columnNum; i++) {
            //     if (i === columnNum - 2)
            //         continue;
            //     for (let j = 0; j < regionNum; j++) {
            //         let inOut = regionInOut[i][j];
            //         let inR = inOut[0];
            //         let outR = inOut[1];
            //         if (j % 2 === 0) {
            //             for (let k = 0; k < outR; k++) {
            //                 hLinks.push({type: 1, point: [i, j], index: k});
            //             }
            //         } else {
            //             for (let k = 0; k < inR; k++) {
            //                 hLinks.push({type: 0, point: [i, j], index: k});
            //             }
            //         }
            //     }
            // }

            this.rects = rects;
            this.links = links;
            this.hLinks = hLinks;

            // console.log(rects);

        },

        mergeCategory: function (a) {
            let k = 0;
            let m = 1;
            let n = 2;
            for(let i = 0; i < a.length ; i++){
                // 先判断a[i]是否大于第三个最大数
                if (a[i] >= a[k]) {
                    // 在判断a[i]是否大于第二个最大数
                    if (a[i] >= a[m]) {
                        // 最后判断a[i]是否大于第一个最大数
                        if (a[i] >= a[n]) {
                            // 交换相应的下标
                            k = m; // 当满足第一个最大数时不要忘记先交换后两个最大数的坐标
                            m = n;
                            n = i;
                        }else {
                            k = m;
                            m = i;
                        }
                    }else{
                        k = i;
                    }
                }
            }

            let extra = 0;
            let b = [];
            for(let i = 0; i < a.length; i++){
                if(i === k || i === m || i === n){
                    b[i] = a[i]
                } else{
                    extra += a[i];
                    b[i] = 0;
                }
            }
            b.push(extra);
            return b;
        },

        isInArray: function (arr, value) {
            for (let i = 0; i < arr.length; i++) {
                if (value === arr[i]) {
                    return true;
                }
            }
            return false;
        },

        generateTimeText: function (time) {
            let hour, minute;
            hour = Math.floor(time / 2);
            minute = time % 2;
            if (hour < 10) {
                hour = "0" + hour;
            }
            return hour + ":" + (minute === 1 ? "30" : "00");
        },

        // drawSankey: function (index, width, height) {
        //     // svg
        //     let svg = this.svg;
        //
        //     let x = (index % 2) * width;
        //     let y = Math.floor(index / 2) * height;
        //
        //     // sankey
        //     let leftMargin = (this.number === 1) ? 20 : 10;
        //     let topMargin = (this.number === 1) ? 50 : 10;
        //     let columnNum = this.column;
        //     let rowNum = this.row;
        //     let linkWidth = 5 - this.number;
        //
        //     // rect
        //     let rects = this.rects;
        //     let rectWidth = (this.number === 1) ? 20 : 10;
        //     let rectHeight = (height - topMargin * 2) / rowNum * 4 / 3;
        //     let columnPadding = (width - leftMargin * 2) / columnNum;
        //     let rowPadding = rectHeight * 3 / 4;
        //     let staggered = 5;
        //     let firstColumn = leftMargin + (width - leftMargin * 2 -
        //         columnPadding * (columnNum - 1) - rectWidth * 2 - staggered) / 2
        //
        //     // glyph
        //     let outerRadius = rectHeight / 2 - 2;
        //     let innerRadius = (this.number === 1) ? (outerRadius - 10) : (outerRadius - 5);
        //     let focusOuterRadius = height / 8 - 4;
        //     let focusInnerRadius = (this.number === 1) ? (focusOuterRadius - 10) : (focusOuterRadius - 5);
        //
        //     //links
        //     let links = this.links;
        //     let hLinks = this.hLinks;
        //     let nextLinks = this.nextLinks;
        //     let lastLinks = this.lastLinks;
        //
        //
        //     // draw rects
        //     // let nodes = svg.append("g")
        //     //     .classed("nodes", true)
        //     //     .selectAll("rect")
        //     //     .data(rects)
        //     //     .enter()
        //     //     .append("rect")
        //     //     .attr("class", 'highOrder')
        //     //     .attr("x", d => firstColumn + columnPadding * d.column + (d.row % 2) * (rectWidth + staggered))
        //     //     .attr("y", function (d) {if(d.column===columnNum-2) return height / 2 - height / 8;else return topMargin + rowPadding * d.row})
        //     //     .attr("width", rectWidth)
        //     //     .attr("height", function(d) {if(d.column===columnNum-2) return height / 4;else return rectHeight})
        //     //     .attr("fill", d => d.color)
        //     //     .attr("opacity", 1);
        //
        //     // Build the links
        //     let link = d3.linkHorizontal();
        //     let svgLinks = svg.append("g")
        //         .attr("class", "sankey" + index)
        //         .selectAll("path")
        //         .data(links)
        //         .enter()
        //         .append("path")
        //         .attr("class", d => "link" + d.id)
        //         .attr("d", d => {
        //             let l = {source: [0, 0], target: [0, 0]};
        //             l.source[0] = firstColumn + columnPadding * d.start[0] + 2 * rectWidth + staggered;
        //             l.source[1] = rectHeight / 3 + topMargin + rowPadding * d.start[1] + linkWidth * d.outR;
        //             l.target[0] = firstColumn + columnPadding * d.end[0];
        //             l.target[1] = rectHeight / 3 + topMargin + rowPadding * d.end[1] + linkWidth * d.inR;
        //             return link(l);
        //         })
        //         .attr("fill", "none")
        //         .attr("stroke", '#77787b')
        //         .attr("stroke-width", linkWidth)
        //         .attr("opacity", 1)
        //
        //     // draw hLinks
        //     let svgHLinks = svg.append("g")
        //         .attr("class", "sankey" + index)
        //         .selectAll("path")
        //         .data(hLinks)
        //         .enter()
        //         .append("path")
        //         .attr("class", d => 'link' + d.id)
        //         .attr("d", d => {
        //             let l = {source: [0, 0], target: [0, 0]};
        //             if (d.type === 0) {
        //                 l.source[0] = firstColumn + columnPadding * d.point[0] - 1;
        //                 l.source[1] = rectHeight / 3 + topMargin + rowPadding * d.point[1] + linkWidth * d.index;
        //                 l.target[0] = firstColumn + columnPadding * d.point[0] + rectWidth + staggered;
        //                 l.target[1] = rectHeight / 3 + topMargin + rowPadding * d.point[1] + linkWidth * d.index;
        //             } else {
        //                 l.source[0] = firstColumn + columnPadding * d.point[0] + rectWidth;
        //                 l.source[1] = rectHeight / 3 + topMargin + rowPadding * d.point[1] + linkWidth * d.index;
        //                 l.target[0] = firstColumn + columnPadding * d.point[0] + 2 * rectWidth + staggered + 1;
        //                 l.target[1] = rectHeight / 3 + topMargin + rowPadding * d.point[1] + linkWidth * d.index;
        //             }
        //             return link(l);
        //         })
        //         .attr("fill", "none")
        //         .attr("stroke", '#77787b')
        //         .attr("stroke-width", linkWidth)
        //         .attr("opacity", 1)
        //
        //     // draw next links
        //     let svgNextLinks = svg.append("g")
        //         .attr("class", "sankey" + index)
        //         .selectAll("path")
        //         .data(nextLinks)
        //         .enter()
        //         .append("path")
        //         .attr("class", d => "link" + d.id)
        //         .attr("d", d => {
        //             let l = {source: [0, 0], target: [0, 0]};
        //             l.source[0] = firstColumn + columnPadding * d.start[0] + rectWidth
        //                 + (rectWidth + staggered) * (d.start[1] % 2);
        //             l.source[1] = rectHeight / 4 + height / 2 - height / 8 + linkWidth * d.outR;
        //             l.target[0] = firstColumn + columnPadding * d.end[0];
        //             l.target[1] = rectHeight / 3 + topMargin + rowPadding * d.end[1] + linkWidth * d.inR;
        //             return link(l);
        //         })
        //         .attr("fill", "none")
        //         .attr("stroke", '#77787b')
        //         .attr("stroke-width", linkWidth)
        //         .attr("opacity", 1)
        //
        //     // draw last links
        //     let svgLastLinks = svg.append("g")
        //         .attr("class", "sankey" + index)
        //         .selectAll("path")
        //         .data(lastLinks)
        //         .enter()
        //         .append("path")
        //         .attr("class", d => "link" + d.id)
        //         .attr("d", d => {
        //             let l = {source: [0, 0], target: [0, 0]};
        //             l.source[0] = firstColumn + columnPadding * d.start[0] + 2 * rectWidth + staggered;
        //             l.source[1] = rectHeight / 3 + topMargin + rowPadding * d.start[1] + linkWidth * d.outR;
        //             l.target[0] = firstColumn + columnPadding * d.end[0]
        //                 + (rectWidth + staggered) * (d.end[1] % 2);
        //             l.target[1] = height / 10 + height / 2 - height / 8 + linkWidth * d.inR;
        //             return link(l);
        //         })
        //         .attr("fill", "none")
        //         .attr("stroke", '#77787b')
        //         .attr("stroke-width", linkWidth)
        //         .attr("opacity", 1)
        //
        //     for (let i = 0; i < rects.length; i++) {
        //         let rect = rects[i];
        //         let cx = firstColumn + columnPadding * rect.column +
        //             (rect.row % 2) * (rectWidth + staggered) + rectWidth / 2;
        //         let cy = topMargin + rowPadding * rect.row + rectHeight / 2;
        //         if (rect.column === columnNum - 2) {
        //             this.cx = cx;
        //             this.drawSingleGlyph(index, true, rect.regionId, cx + x, height / 2 + y, focusInnerRadius, focusOuterRadius);
        //         } else {
        //             this.drawSingleGlyph(index, false, rect.regionId, cx + x, cy + y, innerRadius, outerRadius);
        //         }
        //     }
        //
        //     // 将所有的links作为整体平移
        //     d3.selectAll(".sankey" + index)
        //         .attr("transform", "translate(" + x + "," + y + ")");
        //
        //     // let circle = svg.append("g")
        //     //     .attr("class", "sankey" + index)
        //     // g.append('circle')
        //     //     .attr("class", "highOrder")
        //     //     .attr("cx", this.cx)
        //     //     .attr("cy", height / 2)
        //     //     .attr("r", height / 8 - 14)
        //     //     .attr("fill", 'white')
        // },
    }
}
