import dataService from "@/service/dataService";
import response from "vue-resource/src/http/response";
import {left} from "d3-sankey/src/align";
import ta from "element-ui/src/locale/lang/ta";

export default {
    name: 'StatisticView',
    components: {},
    props: ['region', 'date', 'generate', 'selects', 'startTime', 'timeLength', 'regionId', 'historyGenerate'],
    data() {
        return {
            width: 279,
            height: 630 / 2,
            nodeSvg: null,
            regionSvg: null,
            POIOrder_poi: null,
            POIOrder_access: null,
            accessOrder_poi: null,
            accessOrder_access: null,
            node_POIOrder_poi: null,
            node_POIOrder_access: null,
            node_accessOrder_poi: null,
            node_accessOrder_access: null,
            inOrder: false,
            category_map: {'Food': 0,
                'Shop & Service': 1,
                'Outdoors & Recreation': 2,
                'Professional & Other Places': 3,
                'Travel & Transport': 4,
                'Nightlife Spot': 5,
                'Arts & Entertainment': 6,
                'College & University': 7,
                'Residence': 8,
            },
            color: ['#8dd3c7', '#fb8072', '#b3de69', '#fdb462', '#bc80bd', '#bebada',
                '#fccde5', '#d9d9d9', '#80b1d3', '#F7F5F2', '#666666', '#99CC66', '#CCCC99'],
        }
    },
    watch: {
        generate(val) {
            let params = {selects: this.selects, startTime: this.startTime, timeLength: this.timeLength};
            dataService.getStatistic(params, response => {
                this.POIOrder_poi = response.data[0];
                this.POIOrder_access = response.data[1];
                this.accessOrder_poi = response.data[2];
                this.accessOrder_access = response.data[3];
                console.log("------------Statistic View-------------");
                console.log(this.POIOrder_poi);
                console.log(this.POIOrder_access);
                console.log(this.accessOrder_poi);
                console.log(this.accessOrder_access);
                console.log("------------Statistic View-------------");
                this.updateRegionSvg();
                this.drawBarchart(this.POIOrder_poi, this.POIOrder_access, 0);
            })
        },

        regionId(val) {
            dataService.getRegionCategory(this.historyGenerate, val, response => {
                this.node_POIOrder_poi = response.data[0];
                this.node_POIOrder_access = response.data[1];
                this.node_accessOrder_poi = response.data[2];
                this.node_accessOrder_access = response.data[3];
                console.log("------------Statistic View-------------");
                console.log(this.POIOrder_poi);
                console.log(this.POIOrder_access);
                console.log(this.accessOrder_poi);
                console.log(this.accessOrder_access);
                console.log("------------Statistic View-------------");
                this.updateNodeSvg();
                this.drawBarchart(this.node_POIOrder_poi, this.node_POIOrder_access, 1);
            })
        },

        inOrder(value) {
            this.updateNodeSvg();
            this.updateRegionSvg();
            if (value) {
                this.drawBarchart(this.accessOrder_poi, this.accessOrder_access, 0);
                if(this.node_accessOrder_access !== null) {
                    this.drawBarchart(this.node_accessOrder_poi, this.node_accessOrder_access, 1);
                }
            }
            else {
                this.drawBarchart(this.POIOrder_poi, this.POIOrder_access, 0);
                if(this.node_POIOrder_poi !== null) {
                    this.drawBarchart(this.node_POIOrder_poi, this.node_POIOrder_access, 1);
                }
            }
        },
    },

    mounted: function () {
        const regionSvg = d3.select("#regionComparison")
            .attr("width", this.width)
            .attr("height", this.height);
        this.regionSvg = regionSvg;

        const nodeSvg = d3.select("#nodeComparison")
            .attr("width", this.width)
            .attr("height", this.height);
        this.nodeSvg = nodeSvg;

        // this.drawLine()
    },

    methods: {
        updateNodeSvg: function () {
            d3.select('#nodeComparison').remove();
            const svg = d3.select("#nodeContainer")
                .append('svg')
                .attr("id", "nodeComparison")
                .attr("width", this.width)
                .attr("height", this.height);

            this.nodeSvg = svg;
        },

        updateRegionSvg: function () {
            d3.select('#regionComparison').remove();
            const svg = d3.select("#regionContainer")
                .append('svg')
                .attr("id", "regionComparison")
                .attr("width", this.width)
                .attr("height", this.height);

            this.regionSvg = svg;
        },

        findMax: function (a) {
            let max = 0;
            for (let i = 0; i < a.length; i++) {
                let slot = a[i];
                max = slot > max ? slot : max;
            }
            return max;
        },

        drawLine: function (cy, index) {
            let svg = index === 0 ? this.regionSvg : this.nodeSvg;
            const topMargin = 55;
            const leftMargin = 20;
            const tableWidth = this.width - leftMargin * 2;
            const tableHeight = this.height;
            const columnWidth = tableWidth / 3;
            const rowHeight = (tableHeight - topMargin) / 9;

            let HLine = svg.append('line')
                .style("Stroke", "grey")
                .style("stroke-width", 1)
                .style("opacity", 1)
                .attr("x1", leftMargin)
                .attr("y1", cy + topMargin)
                .attr("x2", this.width - leftMargin)
                .attr("y2", cy + topMargin)

            let VLine1 = svg.append('line')
                .style("Stroke", "grey")
                .style("stroke-width", 1)
                .style("opacity", 1)
                .attr("x1", leftMargin + columnWidth)
                .attr("y1", cy + topMargin / 2 + 5)
                .attr("x2", leftMargin + columnWidth)
                .attr("y2", cy + topMargin)

            let VLine2 = svg.append('line')
                .style("Stroke", "grey")
                .style("stroke-width", 1)
                .style("opacity", 1)
                .attr("x1", leftMargin + columnWidth * 2)
                .attr("y1", cy + topMargin / 2 + 5)
                .attr("x2", leftMargin + columnWidth * 2)
                .attr("y2", cy + topMargin)

            // Add Text
            svg.append('text')
                .attr("y", cy + topMargin - 8)
                .attr("x", leftMargin + columnWidth / 2)
                .attr('text-anchor', 'middle')
                .attr("class", 'Text')
                .text("Category")
                .style("font-size", 12)
            svg.append('text')
                .attr("y", cy + topMargin - 8)
                .attr("x", leftMargin + columnWidth / 2 * 3)
                .attr('text-anchor', 'middle')
                .attr("class", 'Text')
                .text("POI")
                .style("font-size", 12)
            svg.append('text')
                .attr("y", cy + topMargin - 8)
                .attr("x", leftMargin + columnWidth / 2 * 5)
                .attr('text-anchor', 'middle')
                .attr("class", 'Text')
                .text("Access")
                .style("font-size", 12)

            let title;
            if (index === 0){
                if(this.selects.length > 1){
                    title = "Regions: " + this.selects;
                } else
                    title = "Region: " + this.selects;
            } else {
                title = "Region: " + this.regionId;
            }

            svg.append('text')
                .attr("y", 20)
                .attr("x", this.width / 2)
                .attr('text-anchor', 'middle')
                .attr("class", 'Text')
                .text(title)
                .style("font-size", 14)
                .style("font-weight", "bold")
        },

        drawBarchart: function (poi, access, index){
            let svg = index === 0 ? this.regionSvg : this.nodeSvg;
            const topMargin = 55;
            const leftMargin = 20;
            const tableWidth = this.width - leftMargin * 2;
            const tableHeight = this.height;
            const columnWidth = tableWidth / 3;
            const rowHeight = (tableHeight - topMargin) / 9;
            const baseWidth = 10;
            let cy = -5;

            let max1 = this.POIOrder_poi[0]['count'];
            if (index === 1) max1 = this.node_POIOrder_poi[0]['count'];
            let max2 = this.accessOrder_access[0]['count'];
            if (index === 1) max2 = this.node_accessOrder_access[0]['count'];
            let scale1 = (columnWidth - baseWidth) / max1;
            let scale2 = (columnWidth - baseWidth) / max2;

            this.drawLine(cy, index);

            let grids = svg.append("g")
                .selectAll('whatever')
                .data(poi)
                .enter()
                .append("rect")
                .attr("class", "tables")
                .attr("x", leftMargin)
                .attr("y", (d, i) => cy + topMargin + i * rowHeight + 2)
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("width", tableWidth)
                .attr("height", rowHeight - 2)
                .attr("fill", "white")
                .attr("opacity", 1)
                .attr("stroke", 'grey')
                // .attr("stroke", '#505254')
                .attr("stroke-width", 1)

            // Add category text
            for(let i = 0; i < poi.length; i++){
                let text = poi[i].category;
                if(text.length < 18){
                    svg.append("text")
                        .attr("x", leftMargin + columnWidth / 2)
                        .attr("y", cy + topMargin + i * rowHeight + rowHeight / 2)
                        .style("fill", 'black')
                        .text(text)
                        .attr("text-anchor", "middle")
                        .style("alignment-baseline", "middle")
                        .style("font-size", 10)
                } else {
                    let index = text.indexOf('&');
                    let high = text.slice(0, index + 2);
                    let low = text.slice(index + 2)
                    svg.append("text")
                        .attr("x", leftMargin + columnWidth / 2)
                        .attr("y", cy + topMargin + i * rowHeight + 11)
                        .style("fill", 'black')
                        .text(high)
                        .attr("text-anchor", "middle")
                        .style("alignment-baseline", "middle")
                        .style("font-size", 10)

                    svg.append("text")
                        .attr("x", leftMargin + columnWidth / 2)
                        .attr("y", cy + topMargin + i * rowHeight + 21)
                        .style("fill", 'black')
                        .text(low)
                        .attr("text-anchor", "middle")
                        .style("alignment-baseline", "middle")
                        .style("font-size", 10)
                }
            }

            let POIRects = svg.append("g")
                .selectAll('whatever')
                .data(poi)
                .enter()
                .append("rect")
                .attr("class", "tables")
                .attr("x", d => leftMargin + columnWidth * 2 - (d.count * scale1 + baseWidth))
                .attr("y", (d, i) => cy + topMargin + i * rowHeight + 4)
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("width", d => d.count * scale1 + baseWidth)
                .attr("height", rowHeight - 6)
                .attr("fill", (d, i) => this.color[this.category_map[d.category]])
                .attr("opacity", 1)
                .attr("stroke", '#505254')
                .attr("stroke-width", 1)

            let accessRects = svg.append("g")
                .selectAll('whatever')
                .data(access)
                .enter()
                .append("rect")
                .attr("class", "tables")
                .attr("x", leftMargin + columnWidth * 2)
                .attr("y", (d, i) => cy + topMargin + i * rowHeight + 4)
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("width", d => d.count * scale2 + baseWidth)
                .attr("height", rowHeight - 6)
                .attr("fill", (d, i) => this.color[this.category_map[d.category]])
                .attr("opacity", 1)
                .attr("stroke", '#505254')
                .attr("stroke-width", 1)

            let VLine = svg.append('line')
                .style("Stroke", "grey")
                .style("stroke-width", 1)
                .style("opacity", 1)
                .attr("x1", leftMargin + columnWidth * 2)
                .attr("y1", cy + topMargin + 2)
                .attr("x2", leftMargin + columnWidth * 2)
                .attr("y2", cy + topMargin + poi.length * rowHeight)
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