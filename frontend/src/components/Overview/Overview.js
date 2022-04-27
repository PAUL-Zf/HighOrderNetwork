import dataService from "@/service/dataService";
import response from "vue-resource/src/http/response";
import {schemeAccent} from "d3-scale-chromatic";

export default {
    name: 'Overview',
    components: {},
    props: ['region', 'date', 'load'],
    data() {
        return {
            width: 373,
            height: 758,
            svg: null,
            number: 10,
            options: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            sum: null,
            rects: null,
            links: null,
            nodes: null,
            regions: null,
        }
    },
    watch: {
        load(val) {
            dataService.getSankey(this.date, this.number, response => {
                let sankey = response.data;
                this.patterns = sankey.patterns;
                this.sum = sankey.sum;
                this.rects = sankey.rects;
                this.timeRects = sankey.timeRects;
                this.links = sankey.links;
                this.nodes = sankey.nodes;
                this.regions = sankey.regions;

                // this.drawGradient();
                this.updateSvg();
                this.drawSankey();
            })
        },

        number(val) {
            dataService.getSankey(this.date, this.number, response => {
                let sankey = response.data;
                this.patterns = sankey.patterns;
                this.sum = sankey.sum;
                this.rects = sankey.rects;
                this.timeRects = sankey.timeRects;
                this.links = sankey.links;
                this.nodes = sankey.nodes;
                this.regions = sankey.regions;

                this.updateSvg();
                this.drawSankey();
            })
        }
    },

    mounted: function () {
        const svg = d3.select("#sankeyView")
            .attr("width", this.width)
            .attr("height", this.height);
        this.svg = svg;
    },

    methods: {
        generateTimeText: function(time){
            let hour, minute;
            hour = Math.round(time / 2);
            minute = time % 2;
            if (hour < 10){
                hour = "0" + hour;
            }
            return hour + ":" + (minute === 1 ? "30" : "00");
        },

        drawDashedLine: function (id, margin, nodeHeight, rectMargin, rectHeight){
            let svg = this.svg;
            let interval = d3.select("#sankeyView").select(".timeRect" + id);
            let x1 = margin.left * 6 / 8;
            let y1 = Number(interval.attr("y"));
            let x2 = interval.attr("x");
            let y2 = Number(interval.attr("y")) + Number(interval.attr("height"));
            let startTime = Math.round((y1 - margin.top - nodeHeight - rectMargin) / rectHeight * 48)
            let endTime = Math.round((y2 - margin.top - nodeHeight - rectMargin) / rectHeight * 48)

            // modify time text format
            startTime = this.generateTimeText(startTime);
            endTime = this.generateTimeText(endTime);

            svg.append('line')
                .attr("class", 'dashedLine')
                .style("Stroke", "black")
                .style("opacity", 0.5)
                .style("stroke-dasharray", ("3, 3"))
                .attr("x1", x1)
                .attr("y1", y1)
                .attr("x2", x2)
                .attr("y2", y1)

            svg.append('line')
                .attr("class", 'dashedLine')
                .style("Stroke", "black")
                .style("opacity", 0.5)
                .style("stroke-dasharray", ("3, 3"))
                .attr("x1", x1)
                .attr("y1", y2)
                .attr("x2", x2)
                .attr("y2", y2)

            // add text
            svg.append('text')
                .attr("class", 'dashedLine')
                .attr("y", y1 + 1)
                .attr("x", x1 - 2)
                .attr('text-anchor', 'end')
                .text(startTime)
                .style("font-size", 8)
            svg.append('text')
                .attr("class", 'dashedLine')
                .attr("y", y2 + 5)
                .attr("x", x1 - 2)
                .attr('text-anchor', 'end')
                .text(endTime)
                .style("font-size", 8)
        },

        updateSvg: function () {
            d3.select('#sankeyView').remove();
            const svg = d3.select("#labelsContainer")
                .append('svg')
                .attr("id", "sankeyView")
                .attr("width", this.width)
                .attr("height", this.height);
            this.svg = svg;
        },

        drawSankey: function () {
            let self = this;
            let svg = this.svg;
            let colors = ["#8dd3c7",
                "#ffffb3",
                "#bebada",
                "#fb8072",
                "#80b1d3",
                "#fdb462",
                "#b3de69",
                "#fccde5",
                "#d9d9d9",
                "#bc80bd",
                "#ccebc5",
                "#ffed6f"]

            const margin = {top: 30, bottom: 20, left: 40, right: 10};
            const nodePadding = 5;
            const rectPadding = 5;
            const scale = (this.width - margin.left - margin.right - nodePadding * 3) / this.sum;
            const rectScale = (this.width - margin.left- margin.right - rectPadding * this.number) / this.sum;
            const nodeHeight = 15;
            const rowDistance = (this.height - margin.top - margin.bottom) / 3 - 10;
            const rectMargin = 40;
            const rectHeight = rowDistance - nodeHeight - rectMargin * 2;
            const linkWidth = 4;

            // draw time axis
            let line = svg.append('line')
                .style("Stroke", "black")
                .style("opacity", 0.5)
                .attr("x1", margin.left * 6 / 8)
                .attr("y1", margin.top + nodeHeight + rectMargin)
                .attr("x2", margin.left * 6 / 8)
                .attr("y2", margin.top + nodeHeight + rectMargin + rectHeight)
            let SLine = svg.append('line')
                .style("Stroke", "black")
                .style("opacity", 0.5)
                .attr("x1", margin.left * 6 / 8)
                .attr("y1", margin.top + nodeHeight + rectMargin)
                .attr("x2", margin.left * 7 / 8)
                .attr("y2", margin.top + nodeHeight + rectMargin)
            let ELine = svg.append('line')
                .style("Stroke", "black")
                .style("opacity", 0.5)
                .attr("x1", margin.left * 6 / 8)
                .attr("y1", margin.top + nodeHeight + rectMargin + rectHeight)
                .attr("x2", margin.left * 7 / 8)
                .attr("y2", margin.top + nodeHeight + rectMargin + rectHeight)

            // add text
            let startTime = svg.append('text')
                .attr("y", margin.top + nodeHeight + rectMargin)
                .attr("x", margin.left * 6 / 8 - 2)
                .attr('text-anchor', 'end')
                .attr("class", 'timeText')
                .text("00:00")
                .style("font-size", 8)
            let endTime = svg.append('text')
                .attr("y", margin.top + nodeHeight + rectMargin + rectHeight + 5)
                .attr("x", margin.left * 6 / 8 - 2)
                .attr('text-anchor', 'end')
                .attr("class", 'timeText')
                .text("24:00")
                .style("font-size", 8)

            // draw regions
            let regions = svg.append("g")
                .classed('regions', true)
                .selectAll('regions')
                .data(this.regions)
                .enter()
                .append("rect")
                .attr("class", d => 'regions' + d.id)
                .attr("x", d => margin.left + d.x * scale + d.index * nodePadding)
                .attr("y", d => margin.top + d.order * rowDistance)
                .attr("rx", 2)
                .attr("ry", 2)
                .attr("width", d => d.width * scale)
                .attr("height", nodeHeight)
                .attr("fill", '#F7F5F2')
                .attr("opacity", 1)
                .attr("stroke", '#505254')
                .attr("stroke-width", 0.5)

            // add region text
            let regionLabels = svg.append("g")
                .classed('regionText', true)
                .selectAll('regionText')
                .data(this.regions)
                .enter()
                .append("text")
                .attr("class", 'regionText')
                .attr("x", d => margin.left + d.x * scale + d.index * nodePadding + 1)
                .attr("y", d => margin.top + d.order * rowDistance + 10)
                .attr('text-anchor', 'start')
                .text(d => "R" + d.community)
                .style("font-size", 7)

            // draw nodes
            let nodes = svg.append("g")
                .classed('nodes', true)
                .selectAll('nodes')
                .data(this.nodes)
                .enter()
                .append("rect")
                .attr("class", d => 'node' + d.id)
                .attr("x", d => margin.left + d.x * scale + d.index * nodePadding)
                .attr("y", d => margin.top + d.order * rowDistance)
                .attr("rx", 2)
                .attr("ry", 2)
                .attr("width", d => d.width * scale)
                .attr("height", nodeHeight)
                .attr("fill", '#F7F5F2')
                .attr("opacity", 0)
                .attr("stroke", '#505254')
                .attr("stroke-width", 0.5)
                .on("mouseover", function (d) {
                    d3.select("#sankeyView").selectAll(".node" + d.id).attr('fill', '#DDDDDD').attr('opacity', 1);
                    d3.select("#sankeyView").selectAll(".link" + d.id).attr('opacity', 1);
                    d3.select("#sankeyView").selectAll(".rect" + d.id).attr('opacity', 1);
                    d3.select("#sankeyView").selectAll(".timeRect" + d.id).attr('opacity', 1);
                    // add line to show time interval
                    self.drawDashedLine(d.id, margin, nodeHeight, rectMargin, rectHeight);
                })
                .on("mouseout", function (d) {
                    d3.select("#sankeyView").selectAll(".node" + d.id).attr('fill', '#F7F5F2').attr('opacity', 0);
                    d3.select("#sankeyView").selectAll(".link" + d.id).attr('opacity', 0.3);
                    d3.select("#sankeyView").selectAll(".rect" + d.id).attr('opacity', 0.5);
                    d3.select("#sankeyView").selectAll(".timeRect" + d.id).attr('opacity', 0.5);
                    d3.select("#sankeyView").selectAll(".dashedLine").remove();
                })
                .on("click", function (d) {
                    self.$emit("conveyTimeInterval", d.time, d.length);
                    self.$emit("conveyPatternId", d.id);
                })

            // draw rects
            let rects = svg.append("g")
                .classed('flows', true)
                .selectAll('flows')
                .data(this.rects)
                .enter()
                .append("rect")
                .attr("class", d => 'rect' + d.id)
                .attr("x", d => margin.left + d.x * rectScale + d.id * rectPadding)
                .attr("y", d => margin.top + nodeHeight + rowDistance * d.order + rectMargin)
                .attr("rx", 2)
                .attr("ry", 2)
                .attr("width", d => d.width * rectScale)
                .attr("height", rectHeight)
                .attr("fill", 'lightsteelblue')
                .attr("opacity", 0.5)
                .attr("stroke", '#505254')
                .attr("stroke-width", 1)
                .on("mouseover", function (d) {
                    d3.select("#sankeyView").selectAll(".node" + d.id).attr('fill', '#DDDDDD');
                    d3.select("#sankeyView").selectAll(".link" + d.id).attr('opacity', 1);
                    d3.select("#sankeyView").selectAll(".rect" + d.id).attr('opacity', 1);
                    d3.select("#sankeyView").selectAll(".timeRect" + d.id).attr('opacity', 1);
                    // add line to show time interval
                    self.drawDashedLine(d.id, margin, nodeHeight, rectMargin, rectHeight);
                })
                .on("mouseout", function (d) {
                    d3.select("#sankeyView").selectAll(".node" + d.id).attr('fill', '#F7F5F2');
                    d3.select("#sankeyView").selectAll(".link" + d.id).attr('opacity', 0.3);
                    d3.select("#sankeyView").selectAll(".rect" + d.id).attr('opacity', 0.5);
                    d3.select("#sankeyView").selectAll(".timeRect" + d.id).attr('opacity', 0.5);
                    d3.select("#sankeyView").selectAll(".dashedLine").remove();
                })
                .on("click", function (d) {
                    self.$emit("conveyTimeInterval", d.time, d.length);
                    self.$emit("conveyPatternId", d.id);
                })

            // draw timeRects
            let timeRects = svg.append("g")
                .classed('timeRects', true)
                .selectAll('timeRects')
                .data(this.timeRects)
                .enter()
                .append("rect")
                .attr("class", d => 'timeRect' + d.id)
                .attr("x", d => margin.left + d.x * rectScale + d.id * rectPadding)
                .attr("y", d => margin.top + nodeHeight + rectMargin + d.time / 24 * rectHeight - d.length / 24 * rectHeight / 2)
                .attr("rx", 2)
                .attr("ry", 2)
                .attr("width", d => d.width * rectScale)
                .attr("height", d => d.length / 24 * rectHeight)
                .attr("fill", 'red')
                .attr("opacity", 0.5)
                .attr("stroke", '#505254')
                .attr("stroke-width", 1)
                .on("mouseover", function (d) {
                    d3.select("#sankeyView").selectAll(".node" + d.id).attr('fill', '#DDDDDD');
                    d3.select("#sankeyView").selectAll(".link" + d.id).attr('opacity', 1);
                    d3.select("#sankeyView").selectAll(".rect" + d.id).attr('opacity', 1);
                    d3.select("#sankeyView").selectAll(".timeRect" + d.id).attr('opacity', 1);
                    // add line to show time interval
                    self.drawDashedLine(d.id, margin, nodeHeight, rectMargin, rectHeight);
                })
                .on("mouseout", function (d) {
                    d3.select("#sankeyView").selectAll(".node" + d.id).attr('fill', '#F7F5F2');
                    d3.select("#sankeyView").selectAll(".link" + d.id).attr('opacity', 0.3);
                    d3.select("#sankeyView").selectAll(".rect" + d.id).attr('opacity', 0.5);
                    d3.select("#sankeyView").selectAll(".timeRect" + d.id).attr('opacity', 0.5);
                    d3.select("#sankeyView").selectAll(".dashedLine").remove();
                })
                .on("click", function (d) {
                    self.$emit("conveyTimeInterval", d.time, d.length);
                    self.$emit("conveyPatternId", d.id);
                })

            // Build the links
            let link = d3.linkVertical();
            let topLinks = svg.append("g")
                .attr("class", "sankey")
                .selectAll("path")
                .data(this.links)
                .enter()
                .append("path")
                .attr("class", d => "link" + d.id)
                .attr("d", d => {
                    let l = {source: [0, 0], target: [0, 0]};
                    l.source[0] = margin.left * ((d.type===0) ? 1 : 1) + d.startX * ((d.type===0) ? scale : rectScale) + d.startIndex * ((d.type===0) ? nodePadding : rectPadding);
                    l.source[1] = margin.top + d.order * rowDistance + nodeHeight + ((d.type===0) ? 0 : (rectMargin + rectHeight));
                    l.target[0] = margin.left * ((d.type===0) ? 1 : 1) + d.endX * ((d.type===0) ? rectScale : scale) + d.endIndex * ((d.type===0) ? rectPadding : nodePadding);
                    l.target[1] = margin.top + ((d.type===0) ? d.order : d.order + 1) * rowDistance + ((d.type===0) ? (nodeHeight + rectMargin) : 0);
                    return link(l);
                })
                .attr("fill", "none")
                // .attr("stroke", '#b8b7b7')
                .attr("stroke", 'lightsteelblue')
                .attr("stroke-width", linkWidth)
                .attr("opacity", 0.3)
                .on("mouseover", function (d) {
                    d3.select("#sankeyView").selectAll(".node" + d.id).attr('fill', '#DDDDDD');
                    d3.select("#sankeyView").selectAll(".link" + d.id).attr('opacity', 1);
                    d3.select("#sankeyView").selectAll(".rect" + d.id).attr('opacity', 1);
                    d3.select("#sankeyView").selectAll(".timeRect" + d.id).attr('opacity', 1);
                })
                .on("mouseout", function (d) {
                    d3.select("#sankeyView").selectAll(".node" + d.id).attr('fill', '#F7F5F2');
                    d3.select("#sankeyView").selectAll(".link" + d.id).attr('opacity', 0.3);
                    d3.select("#sankeyView").selectAll(".rect" + d.id).attr('opacity', 0.5);
                    d3.select("#sankeyView").selectAll(".timeRect" + d.id).attr('opacity', 0.5);
                })


            // // draw bars
            // let bars = svg.append("g")
            //     .classed('bars', true)
            //     .selectAll('bars')
            //     .data(this.bars)
            //     .enter()
            //     .append("rect")
            //     .attr("class", 'bars')
            //     .attr("x", d => margin.left + d.index * patternWidth)
            //     .attr("y", d => margin.top - d.count * scale)
            //     .attr("width", patternWidth)
            //     .attr("height", d => d.count * scale)
            //     .attr("fill", 'lightsteelblue')
            //     .attr("opacity", 1)
            //     .attr("stroke", '#505254')
            //     .attr("stroke-width", 1)
            //     .on("click", function (d, i) {
            //         self.$emit("conveyPattern", self.patterns[i]);
            //     })

            // Build the links
            // let bottomLinks = svg.append("g")
            //     .attr("class", "sankey")
            //     .selectAll("path")
            //     .data(this.links)
            //     .enter()
            //     .append("path")
            //     .attr("class", d => "link" + d.id)
            //     .attr("d", d => {
            //         let l = {source: [0, 0], target: [0, 0]};
            //         l.source[0] = margin.left + d.start_index * patternWidth + linkWidth / 2 +
            //             (d.end_index - d.start_index) * patternWidth * d.time / 24;
            //         l.source[1] = margin.top + d.start_order * rowDistance + rectHeight +
            //             d.time / 24 * (rowDistance - rectHeight) +
            //             d.half_time_length / 24 * (rowDistance - rectHeight) / 2;
            //         l.target[0] = margin.left + d.end_index * patternWidth + linkWidth / 2;
            //         l.target[1] = margin.top + d.end_order * rowDistance;
            //         return link(l);
            //     })
            //     .attr("fill", "none")
            //     // .attr("stroke", '#b8b7b7')
            //     .attr("stroke", 'lightsteelblue')
            //     .attr("stroke-width", linkWidth)
            //     .attr("opacity", 0.3)
            //     .on("mouseover", function (d) {
            //         d3.select(this).attr("opacity", 1);
            //         d3.select("#sankeyView").selectAll(".link" + d.id).attr('opacity', 1);
            //         d3.select("#sankeyView").selectAll(".highOrder" + d.id).attr('opacity', 1);
            //     })
            //     .on("mouseout", function (d) {
            //         d3.select(this).attr("opacity", 0.3);
            //         d3.select("#sankeyView").selectAll(".link" + d.id).attr('opacity', 0.3);
            //         d3.select("#sankeyView").selectAll(".highOrder" + d.id).attr('opacity', 0.3);
            //     })
            //     .on("click", function (d) {
            //         self.$emit("conveyTimeInterval", d.time, d.half_time_length);
            //     })

        }
    }
}