import dataService from "@/service/dataService";
import response from "vue-resource/src/http/response";

export default {
    name: 'StatisticView',
    components: {},
    props: ['region', 'date'],
    data() {
        return {
            width: 279,
            height: 500,
            svg: null,
            POI: null,
            access: null,
            category_map: {'Food': 0,
                'Shop & Service': 1,
                'Outdoors & Recreation': 2,
                'Professional & Other Places': 3,
                'Travel & Transport': 4,
                'Nightlife Spot': 5,
                'Arts & Entertainment': 6,
                'College & University': 7,
                'Residence': 8,
                'Event': 9},
            color: ['#8dd3c7', '#80b1d3', '#b3de69', '#fdb462', '#bc80bd',
                '#bebada', '#fccde5', '#d9d9d9', '#fb8072']
        }
    },
    watch: {
        region(val){
            dataService.getStatistic(this.date, this.region, response => {
                this.POI = response.data[0];
                this.access = response.data[1];
                this.updateSvg();
                this.drawLine();
                this.drawBarchart();
            })
        }
    },

    mounted: function () {
        const svg = d3.select("#comparison")
            .attr("width", this.width)
            .attr("height", this.height);
        this.svg = svg;
    },

    methods: {
        updateSvg: function () {
            d3.select('#comparison').remove();
            const svg = d3.select("#StatisticViewContainer")
                .append('svg')
                .attr("id", "comparison")
                .attr("width", this.width)
                .attr("height", this.height);

            this.svg = svg;
        },

        findMax: function (a) {
            let max = 0;
            for (let i = 0; i < a.length; i++) {
                let slot = a[i];
                max = slot > max ? slot : max;
            }
            return max;
        },

        drawLine: function () {
            let svg = this.svg;
            const topMargin = 20;
            const leftMargin = 20;

            let HLine = svg.append('line')
                .style("Stroke", "black")
                .style("stroke-width", 1)
                .style("opacity", 1)
                .attr("x1", leftMargin)
                .attr("y1", this.height / 8)
                .attr("x2", this.width - leftMargin)
                .attr("y2", this.height / 8)

            let VLine = svg.append('line')
                .style("Stroke", "black")
                .style("stroke-width", 1)
                .style("opacity", 1)
                .attr("x1", this.width / 2)
                .attr("y1", topMargin)
                .attr("x2", this.width / 2)
                .attr("y2", this.height / 8)

            // Add Text
            let startTime = svg.append('text')
                .attr("y", this.height / 8 - topMargin)
                .attr("x", leftMargin + 20)
                .attr('text-anchor', 'right')
                .attr("class", 'Text')
                .text("POI Statistic")
                .style("font-size", 14)
            let endTime = svg.append('text')
                .attr("y", this.height / 8 - topMargin)
                .attr("x", this.width / 2 + 20)
                .attr('text-anchor', 'left')
                .attr("class", 'Text')
                .text("Access Statistic")
                .style("font-size", 14)
        },

        drawBarchart: function (){
            let svg = this.svg;
            const topMargin = 20;
            const leftMargin = 20;
            const middleMargin = 10;
            const margin = 10;
            const axisMargin = 20;
            const startHeight = this.height / 8
            const axisLength = this.height - topMargin;
            const maxWidth = this.width / 2 -  leftMargin - margin;
            const slotNum = 9;
            const baseWidth = 10;

            const slotHeight= (axisLength - 2 * axisMargin) / slotNum / 3;
            const slotPadding = slotHeight * 2;

            let max1 = this.POI[0]['count'];
            let max2 = this.access[0]['count'];
            let scale1 = (maxWidth - baseWidth) / max1 * 2 / 3;
            let scale2 = (maxWidth - baseWidth) / max2;

            // draw POI rects
            let POIRects = svg.append("g")
                .classed("rects", true)
                .selectAll("rect")
                .data(this.POI)
                .enter()
                .append("rect")
                .classed("rect", true)
                .attr("x", d => this.width / 2 - middleMargin - (d['count'] * scale1 + baseWidth))
                .attr("y", function (d, i){return startHeight + axisMargin + i * slotHeight * 3})
                .attr("width", d => d['count'] * scale1 + baseWidth)
                .attr("height", slotHeight)
                .attr("fill", d => this.color[this.category_map[d.category]])
                .attr("opacity", 1)
                .attr("stroke", '#505254')
                .attr("stroke-width", 0.5)

            // draw access rects
            let AccessRects = svg.append("g")
                .classed("rects", true)
                .selectAll("rect")
                .data(this.access)
                .enter()
                .append("rect")
                .classed("rect", true)
                .attr("x", this.width / 2 + middleMargin)
                .attr("y", function (d, i){return startHeight + axisMargin + i * slotHeight * 3})
                .attr("width", d => d['count'] * scale2 + baseWidth)
                .attr("height", slotHeight)
                .attr("fill", d => this.color[this.category_map[d.category]])
                .attr("opacity", 1)
                .attr("stroke", '#505254')
                .attr("stroke-width", 0.5)

            // add POI text
            svg.selectAll("POILabels")
                .data(this.POI)
                .enter()
                .append("text")
                .attr("x", this.width / 2 - middleMargin)
                .attr("y", function (d, i) {return startHeight + axisMargin + i * slotHeight * 3 - 8})
                .text(function(d){ return d.category})
                .attr("text-anchor", "end")
                // .attr("font-weight", 400)
                .attr("font-size", 10)
                .style("alignment-baseline", "middle")

            // add access text
            svg.selectAll("accessLabels")
                .data(this.access)
                .enter()
                .append("text")
                .attr("x", this.width / 2 + middleMargin)
                .attr("y", function (d, i) {return startHeight + axisMargin + i * slotHeight * 3 - 8})
                .text(function(d){ return d.category})
                .attr("text-anchor", "start")
                .attr("font-size", 10)
                .style("alignment-baseline", "middle")
        },

        computePosition: function (inData, outData, scale1, scale2, zero) {
            let data = [];
            for (let i = 0; i < inData.length; i++) {
                let slotIn = inData[i];
                let slotOut = outData[i];
                let inX = zero;
                let outX = zero;
                let colors = ['#99CCCC', '#FFCC99', '#FFCCCC', '#0099CC', '#CC9999',
                    '#FF6666', '#e3e309', '#CCCCFF', '#CC9966', '#CCCCCC']

                // compute inData
                let inRect = [];
                let poi = slotIn * scale1;
                inRect.push(i);
                inRect.push(inX - poi);
                inRect.push(poi);
                inRect.push(colors[i]);
                data.push(inRect);

                let outRect = [];
                let access = slotOut * scale2;
                outRect.push(i);
                outRect.push(outX);
                outRect.push(access);
                outRect.push(colors[i]);
                data.push(outRect);
            }
            return data;
        },
    }
}