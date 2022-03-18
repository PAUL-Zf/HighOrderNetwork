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
    props: ['content', 'region', 'regionsFlow', 'number', 'index'],

    watch: {
        content(val) {
            let svg = this.svg;
            if (this.number === 1) {
                this.compute();
                // update sankey
                this.update(this.index);
                this.drawSankey(this.index, this.width, this.height);
            } else if (this.number === 2) {
                this.compute();
                // 先把index对应的svg删除，再重新构建新的
                this.update(this.index)
                this.drawSankey(this.index, this.width / 2, this.height)
            } else if(this.number === 3){
                this.compute();
                this.update(this.index);
                this.drawSankey(this.index, this.width / 2, this.height / 2);
            } else if(this.number === 4){
                this.compute();
                this.update(this.index);
                this.drawSankey(this.index, this.width / 2, this.height / 2);
            }
        },
    },
    data() {
        return {
            width: 500,
            height: 320,
            region_number: 13,
            column: 0,
            row: 0,
            entropy: [],
            rects: [],
            links: [],
            hLinks: [],
            nextLinks: [],
            lastLinks: [],
            svg: null,
            total: 0,
            cx: 0,
            cy: 0,
        }
    },

    mounted: function () {
        const svg = d3.select("#sankey")
            .append('svg')
            .attr("class", "sankey")
            .attr("width", this.width)
            .attr("height", this.height)

        this.svg = svg;
    },

    methods: {
        computeEntropy: function(){
           this.entropy = [];
           for(let key in this.content){
               let dest = this.content[key];
               let sum = 0;
               let nonzero_data = [];
               let entropy = 0;

               for (let i = 0; i < dest.length; i++){
                   if(dest[i] !== 0) {
                       nonzero_data.push(dest[i]);
                       sum += dest[i];
                   }
               }
               for (let i = 0; i < nonzero_data.length; i++){
                   entropy += (-1) * (nonzero_data[i] / sum) * Math.log(nonzero_data[i] / sum)
               }
               this.entropy.push(entropy);
           }
        },
        update: function (index) {
            d3.selectAll(".sankey" + index).remove();
            d3.selectAll(".highOrder" + index).remove();
        },

        drawSankey: function (index, width, height) {
            // svg
            let svg = this.svg;

            let x = (index % 2) * width;
            let y = Math.floor(index / 2) * height;

            // sankey
            let leftMargin = (this.number === 1) ? 20 : 10;
            let topMargin = (this.number === 1) ? 50 : 10;
            let columnNum = this.column;
            let rowNum = this.row;
            let linkWidth = 5 - this.number;

            // rect
            let rects = this.rects;
            let rectWidth = (this.number === 1) ? 20 : 10;
            let rectHeight = (height - topMargin * 2) / rowNum * 4 / 3;
            let columnPadding = (width - leftMargin * 2) / columnNum;
            let rowPadding = rectHeight * 3 / 4;
            let staggered = 5;
            let firstColumn = leftMargin + (width - leftMargin * 2 -
                columnPadding * (columnNum - 1) - rectWidth * 2 - staggered) / 2

            // glyph
            let outerRadius = rectHeight / 2 - 2;
            let innerRadius = (this.number === 1) ? (outerRadius - 10) : (outerRadius - 5);
            let focusOuterRadius = height / 8 - 4;
            let focusInnerRadius = focusOuterRadius - 10;

            //links
            let links = this.links;
            let hLinks = this.hLinks;
            let nextLinks = this.nextLinks;
            let lastLinks = this.lastLinks;


            // draw rects
            // let nodes = svg.append("g")
            //     .classed("nodes", true)
            //     .selectAll("rect")
            //     .data(rects)
            //     .enter()
            //     .append("rect")
            //     .attr("class", 'highOrder')
            //     .attr("x", d => firstColumn + columnPadding * d.column + (d.row % 2) * (rectWidth + staggered))
            //     .attr("y", function (d) {if(d.column===columnNum-2) return height / 2 - height / 8;else return topMargin + rowPadding * d.row})
            //     .attr("width", rectWidth)
            //     .attr("height", function(d) {if(d.column===columnNum-2) return height / 4;else return rectHeight})
            //     .attr("fill", d => d.color)
            //     .attr("opacity", 1);

            // Build the links
            let link = d3.linkHorizontal();
            let svgLinks = svg.append("g")
                .attr("class", "sankey" + index)
                .selectAll("path")
                .data(links)
                .enter()
                .append("path")
                .attr("class", d => "link" + d.id)
                .attr("d", d => {
                    let l = {source: [0, 0], target: [0, 0]};
                    l.source[0] = firstColumn + columnPadding * d.start[0] + 2 * rectWidth + staggered;
                    l.source[1] = rectHeight / 3 + topMargin + rowPadding * d.start[1] + linkWidth * d.outR;
                    l.target[0] = firstColumn + columnPadding * d.end[0];
                    l.target[1] = rectHeight / 3 + topMargin + rowPadding * d.end[1] + linkWidth * d.inR;
                    return link(l);
                })
                .attr("fill", "none")
                .attr("stroke", '#77787b')
                .attr("stroke-width", linkWidth)
                .attr("opacity", 1)

            // draw hLinks
            let svgHLinks = svg.append("g")
                .attr("class", "sankey" + index)
                .selectAll("path")
                .data(hLinks)
                .enter()
                .append("path")
                .attr("class", d => 'link' + d.id)
                .attr("d", d => {
                    let l = {source: [0, 0], target: [0, 0]};
                    if (d.type === 0) {
                        l.source[0] = firstColumn + columnPadding * d.point[0] - 1;
                        l.source[1] = rectHeight / 3 + topMargin + rowPadding * d.point[1] + linkWidth * d.index;
                        l.target[0] = firstColumn + columnPadding * d.point[0] + rectWidth + staggered;
                        l.target[1] = rectHeight / 3 + topMargin + rowPadding * d.point[1] + linkWidth * d.index;
                    } else {
                        l.source[0] = firstColumn + columnPadding * d.point[0] + rectWidth;
                        l.source[1] = rectHeight / 3 + topMargin + rowPadding * d.point[1] + linkWidth * d.index;
                        l.target[0] = firstColumn + columnPadding * d.point[0] + 2 * rectWidth + staggered + 1;
                        l.target[1] = rectHeight / 3 + topMargin + rowPadding * d.point[1] + linkWidth * d.index;
                    }
                    return link(l);
                })
                .attr("fill", "none")
                .attr("stroke", '#77787b')
                .attr("stroke-width", linkWidth)
                .attr("opacity", 1)

            // draw next links
            let svgNextLinks = svg.append("g")
                .attr("class", "sankey" + index)
                .selectAll("path")
                .data(nextLinks)
                .enter()
                .append("path")
                .attr("class", d => "link" + d.id)
                .attr("d", d => {
                    let l = {source: [0, 0], target: [0, 0]};
                    l.source[0] = firstColumn + columnPadding * d.start[0] + rectWidth
                        + (rectWidth + staggered) * (d.start[1] % 2);
                    l.source[1] = rectHeight / 4 + height / 2 - height / 8 + linkWidth * d.outR;
                    l.target[0] = firstColumn + columnPadding * d.end[0];
                    l.target[1] = rectHeight / 3 + topMargin + rowPadding * d.end[1] + linkWidth * d.inR;
                    return link(l);
                })
                .attr("fill", "none")
                .attr("stroke", '#77787b')
                .attr("stroke-width", linkWidth)
                .attr("opacity", 1)

            // draw last links
            let svgLastLinks = svg.append("g")
                .attr("class", "sankey" + index)
                .selectAll("path")
                .data(lastLinks)
                .enter()
                .append("path")
                .attr("class", d => "link" + d.id)
                .attr("d", d => {
                    let l = {source: [0, 0], target: [0, 0]};
                    l.source[0] = firstColumn + columnPadding * d.start[0] + 2 * rectWidth + staggered;
                    l.source[1] = rectHeight / 3 + topMargin + rowPadding * d.start[1] + linkWidth * d.outR;
                    l.target[0] = firstColumn + columnPadding * d.end[0]
                        + (rectWidth + staggered) * (d.end[1] % 2);
                    l.target[1] = height / 10 + height / 2 - height / 8 + linkWidth * d.inR;
                    return link(l);
                })
                .attr("fill", "none")
                .attr("stroke", '#77787b')
                .attr("stroke-width", linkWidth)
                .attr("opacity", 1)

            for (let i = 0; i < rects.length; i++) {
                let rect = rects[i];
                let cx = firstColumn + columnPadding * rect.column +
                    (rect.row % 2) * (rectWidth + staggered) + rectWidth / 2;
                let cy = topMargin + rowPadding * rect.row + rectHeight / 2;
                if (rect.column === columnNum - 2) {
                    this.cx = cx;
                    this.drawSingleGlyph(index, rect.regionId, cx + x, height / 2 + y, focusInnerRadius, focusOuterRadius);
                } else {
                    this.drawSingleGlyph(index, rect.regionId, cx + x, cy + y, innerRadius, outerRadius);
                }
            }

            // 将所有的links作为整体平移
            d3.selectAll(".sankey" + index)
                .attr("transform", "translate(" + x + "," + y + ")");

            // let circle = svg.append("g")
            //     .attr("class", "sankey" + index)
            // g.append('circle')
            //     .attr("class", "highOrder")
            //     .attr("cx", this.cx)
            //     .attr("cy", height / 2)
            //     .attr("r", height / 8 - 14)
            //     .attr("fill", 'white')
        },

        drawSingleGlyph(index, regionId, cx, cy, innerRadius, outerRadius) {
            let region = this.regionsFlow[regionId];
            let svg = this.svg;

            let g = svg.append("g")
                .attr("class", 'highOrder' + index)
                .attr("transform", "translate(" + cx + "," + cy + ")")

            // set the color map
            let region_color = ['#99CCCC', '#FFCC99', '#FFCCCC', '#0099cc', '#CC9999', '#FF6666',
                '#FFFF99', '#CCCCFF', '#CC9966', '#CCCCCC', '#666666', '#99CC66', '#CCCC99'];
            let color = ['#99CCCC', '#FFCC99', '#FFCCCC', '#0099CC', '#CC9999', '#FF6666', '#FFFF99', '#CCCCFF', '#CC9966', '#CCCCCC']

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
                .attr('fill', function (d) {
                    return color[d.index]
                })
                .attr("stroke", "black")
                .style("stroke-width", "0.3px")
                .style("opacity", 1)

            if(regionId === this.region){
                // 计算entropy, 按照entropy比例画扇形
                this.computeEntropy();
                let entropy_data = pie(this.entropy);

                g.selectAll('whatever')
                    .data(entropy_data)
                    .enter()
                    .append('path')
                    .attr('d', d3.arc()
                        .innerRadius(0)         // This is the size of the donut hole
                        .outerRadius(innerRadius)
                    )
                    .attr('fill', '#D1D1D1')
                    .attr("stroke", "black")
                    .style("stroke-width", "0.3px")
                    .style("opacity", 1)
                    .on("mouseover", function(d) {
                        d3.select(this).attr("fill", '#92A9BD');
                    })
                    .on("mouseout", function (d){
                        d3.select(this).attr("fill", '#D1D1D1');
                        d3.selectAll(".sankey" + index).selectAll(".link" + d.index).attr('stroke', 'grey');
                    })
                    .on("click", function (d){
                        d3.selectAll(".sankey" + index).selectAll(".link" + d.index).attr('stroke', 'black');
                        console.log(d);
                    })


            } else {
                g.append('circle')
                    .attr("class", "circle")
                    .attr("r", innerRadius)
                    .attr("fill", region_color[regionId])
                    .attr("stroke", "black")
                    .attr("stroke-width", "0.3px")
                    .attr("opacity", 1)
            }
        },

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
            let colors = ['#99CCCC', '#FFCC99', '#FFCCCC', '#0099cc', '#CC9999', '#FF6666',
                '#FFFF99', '#CCCCFF', '#CC9966', '#CCCCCC', '#666666', '#99CC66', '#CCCC99']

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
                        if (link.end[1] % 2 === 1 && link.end[0] !== t.length - 2) {
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

        isInArray: function (arr, value) {
            for (let i = 0; i < arr.length; i++) {
                if (value === arr[i]) {
                    return true;
                }
            }
            return false;
        },
    }
}
