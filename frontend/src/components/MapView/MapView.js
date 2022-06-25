/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-console */
import 'leaflet/dist/leaflet.css'
import dataService from "@/service/dataService";
import L from "leaflet";
import "leaflet.markercluster"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import "leaflet.markercluster/dist/leaflet.markercluster"
// import * as d3 from 'd3-selection';
import 'd3-transition';
import 'leaflet-providers';
import response from "vue-resource/src/http/response";
// import dataService from "@/service/dataService";
// import * as Json from "acorn";
// import dataService from '../../service/dataService.js'
// import * as d3Lasso from 'd3-lasso/build/d3-lasso.min.js';
// import * as d3 from "d3";
// import pipeService from '../../service/pipeService.js'


export default {
    name: 'FaceView',
    components: {},
    data() {
        return {
            // new project
            mode: false,    // false: Segmentation mode; true: h-flow mode
            isOverview: true,    // select drawOverview or drawKelp
            circles: null,
            highOrder: null,
            segmentation: null,
            generate: -1,    // work as generate signal
            finish: 0,    // getHighOrder Finishing and finish++
            drawMapviewSignal: 0,    // work as draw mapview pattern signal
            showBoundary: false,
            showFlow: true,
            showHistory: false,
            showSegmentation: true,
            highOrderMode: false,
            number: 1,
            choice: [1, 2, 3, 4],
            entropy: 1.0,
            svg: null,
            trajNum: 0,
            regionId: -1,
            regions: null,
            geoJSONLayer: null,
            boundaryLayer: null,
            segmentationLayer: null,
            historyLayer: null,
            endTime: 10,
            centroids: null,
            selects: [],
            groupId: 100000,
            overviewColors : ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9',
                '#bc80bd','#ccebc5','#ffed6f','#b3e2cd','#fdcdac','#cbd5e8','#f4cae4','#e6f5c9', '#1f78b4', '#33a02c'],
            colors: ['#8dd3c7', '#fb8072', '#b3de69', '#fdb462', '#bc80bd', '#bebada',
                '#fccde5', '#d9d9d9', '#80b1d3', '#CCCCCC', '#666666', '#99CC66', '#CCCC99'],
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
            content: {},
            mymap: null,
            bounds: 0,
        }
    },

    props: ['date', 'startTime', 'timeLength', 'highlight', 'select', 'selectedData',
        'level', 'pattern', 'type', 'patternId', 'load', 'start', 'scale'],

    computed: {
        info() {
            const {startTime, timeLength, regionId} = this;
            return {startTime, timeLength, regionId};
        },

        time() {
            const {startTime, timeLength} = this;
            return {startTime, timeLength};
        },

        signal(){
            const {start, entropy} = this;
            return {start, entropy};
        }
    },

    watch: {
        // info(val) {
        //     if (this.type && this.highOrderMode) {
        //         dataService.getHighOrder(this.startTime, this.timeLength, this.regionId, this.date, response => {
        //             this.content = response.data;
        //             this.$emit("conveyHighOrder", this.content);
        //             console.log(this.content)
        //             // let data = this.content;
        //             // this.drawKelp(data);
        //         })
        //     }
        // },

        patternId(val) {
            if(!this.highOrderMode) {
                dataService.getPattern(this.patternId, response => {
                    this.highOrder = response.data.lines;
                    this.circles = response.data.circles;
                    console.log(this.circles);
                    this.drawOverview();
                })
            }
        },

        start(val) {
            let self = this;
            this.endTime = this.startTime + this.timeLength;

            this.highOrderMode = true;

            // 每次self-organization算法，mapview数据都要更新
            this.selects = [];
            this.showHistory = false;

            // map value to real entropy
            let entropy;
            if(this.scale === 1){
                entropy = 1.6;
            } else if(this.scale === 2){
                entropy = 1.9;
            } else if(this.scale === 3){
                entropy = 2.2;
            } else if(this.scale === 4){
                entropy = 2.5;
            }

            dataService.getSelfOrganization(Math.floor(this.startTime / 2), Math.floor(this.endTime / 2), entropy, response => {
                let result = response.data;
                let segmentation = result.area;
                let centroids = result.centroids;
                this.centroids = centroids;
                this.segmentation = segmentation;

                // 更新地图
                this.mymap.remove();
                this.mymap = this.init('mapDiv');

                let segmentationLayer = L.geoJson(segmentation, {
                        style: function (feature) {
                            let exist = false;
                            for (let key in self.category_map) {
                                if(key === feature.properties.category){
                                    exist = true;
                                    break;
                                }
                            }

                            if(exist){
                                return {
                                    weight: 0.1,
                                    color: 'black',
                                    fill: true,
                                    fillColor: self.colors[self.category_map[feature.properties.category]],
                                    fillOpacity: 1,
                                }
                            } else {
                                return {
                                    weight: 0.1,
                                    color: 'black',
                                    fill: true,
                                    fillColor: '#fdb462',
                                    fillOpacity: 1,
                                }
                            }

                        },
                        onEachFeature: self.onEachFeature,
                    }).addTo(self.mymap);

                let boundaryLayer = L.geoJson(segmentation, {
                    style: function (feature) {
                        return {
                            weight: 0.5,
                            color: 'black',
                            fillOpacity: 0,
                        }
                    }
                })

                this.showHistory = true;
                this.segmentationLayer = segmentationLayer;
                this.boundaryLayer = boundaryLayer;
            })
        },

        // select(val) {
        //     this.drawKelp(this.selectedData);
        // },

        // level(val) {
        //     this.mymap.remove();
        //     this.mymap = this.init('mapDiv');
        //     this.drawSegmentation();
        // },

        load(value) {
            // 传给后端：Weekdays or Holidays
            // 后端返回：region flow data
            this.drawSegmentation();
            this.highOrderMode = false;
        },

        pattern(value) {
            // console.log(this.pattern);
        },

        showFlow(value) {
            if (value){
                if(this.isOverview){this.drawOverview();}
                else {this.drawKelp();}
            } else {
                this.removeHFlow();
            }
        },

        showSegmentation(value){
            if(value) {
                this.showBoundary = false;
                this.segmentationLayer.addTo(this.mymap);
            } else{
                this.mymap.removeLayer(this.segmentationLayer);
            }
            this.showHistory = false;
        },

        showHistory(value){
            if(value){
                if(this.historyLayer !== null){
                    this.historyLayer.addTo(this.mymap);
                }
            } else {
                this.mymap.removeLayer(this.historyLayer);
            }
        },

        showBoundary(value) {
            if (value) {
                this.showSegmentation = false;
                this.boundaryLayer.addTo(this.mymap);
            } else {
                this.mymap.removeLayer(this.boundaryLayer);
            }
        },

        // mode(value) {
        //     this.mymap.remove();
        //     this.mymap = this.init('mapDiv');
        //     if (!value) {
        //         this.drawGlyph();
        //     } else {
        //         this.drawSegmentation()
        //
        //         let map = this.mymap;
        //         L.svg({clickable: true}).addTo(map);
        //         const overlay = d3.select(map.getPanes().overlayPane);
        //         const svg = overlay.select('svg').attr("pointer-events", "auto");
        //         this.svg = svg;
        //
        //         let data = this.content;
        //         this.drawKelp(data);
        //     }
        // },

        // number(value) {
        //     this.$emit("conveyNumber", this.number);
        // },

        highlight(value) {
            this.changeStyle();
        },
    },

    mounted: function () {
        this.mymap = this.init('mapDiv')
        this.mymap.on('dragend', () => {
            this.bounds = this.mymap.getBounds();
        })
    },

    methods: {
        generateHighOrder() {
            // generate signal changed
            this.generate++;
            this.$emit("conveyGenerate", this.generate);

            let params = {startTime: this.startTime, timeLength: this.timeLength,
                regionsId: this.selects, groupId: this.groupId}
            dataService.getHighOrderByRegions(params, response => {
                this.highOrder = response.data.lines;
                this.circles = response.data.circles;
                this.glyphs = response.data.glyphs;
                this.content = response.data.content;
                this.regions = response.data.regions;
                let links = response.data.links;
                let destLinks = response.data.destLinks;

                this.finish++;
                this.$emit("conveyFinish", this.finish);
                this.$emit("conveyHighOrder", this.content, this.glyphs, links, destLinks);

                console.log("--------------MapView---------------");
                console.log(this.highOrder);
                console.log(this.circles);
                console.log(this.regions);
                console.log("--------------MapView---------------");
                this.mode = false;
                this.svg = null;
                this.drawKelp();
            })

            this.groupId++;
            this.createHistoryLayer();
        },

        createHistoryLayer(){
            let self = this;
            let historyLayer = L.geoJson(this.segmentation, {
                style: function (feature) {
                    let isSelected = false;
                    let id = feature.properties.traj_key;
                    for (let i = 0; i < self.selects.length; i++){
                        if(id === Number(self.selects[i])){
                            isSelected = true;
                        }
                    }
                    if(isSelected){
                        return {
                            weight: 1.5,
                            color: 'black',
                            fill: true,
                            fillColor: 'black',
                            fillOpacity: 0.3,
                        }
                    } else {
                        return {
                            weight: 0,
                            color: 'black',
                            fill: false,
                            fillColor: 'black',
                            fillOpacity: 0,
                        }
                    }
                },
            })
            this.historyLayer = historyLayer;
        },

        onEachFeature(feature, layer) {
            let self = this;
            let colors = this.colors;
            let category_map = this.category_map;
            let regionId = feature.properties.traj_key;
            let isClicked = false;
            // Judge whether clicked
            for(let i = 0; i < self.selects.length; i++){
                if (self.selects === regionId){
                    isClicked = true;
                }
            }
            layer.on({
                click: function (e) {
                    // this.setStyle({
                    //     fillColor:'grey',
                    //     fillOpacity: 1,
                    // });
                    this.setStyle({
                        weight: 1.5,
                        color: 'black',
                        fill: true,
                        fillColor: 'black',
                        fillOpacity: 0.3,
                    });

                    self.$emit("conveyRegion", regionId);
                    self.regionId = regionId;
                    console.log(regionId);
                    self.selects.push(regionId);
                    self.$emit("conveySelects", self.selects);
                },
                mouseover: function(e) {
                    // Judge whether clicked
                    for(let i = 0; i < self.selects.length; i++){
                        if (self.selects[i] === regionId){
                            isClicked = true;
                        }
                    }
                    if(!isClicked){
                        this.setStyle({
                            fillColor:'grey',
                            fillOpacity: 1,
                        });
                    }
                },
                mouseout: function (e){
                    // Judge whether clicked
                    for(let i = 0; i < self.selects.length; i++){
                        if (self.selects[i] === regionId){
                            isClicked = true;
                        }
                    }
                    if(!isClicked){
                        this.setStyle({
                            weight: 0.1,
                            color: 'black',
                            fill: true,
                            fillColor: colors[category_map[feature.properties.category]],
                            fillOpacity: 1,
                        })
                    }
                }
            })
        },

        myStyle(feature) {
            let opacity = (this.category_map[feature.properties.category] === this.highlight) ? 1 : 0
            return {
                weight: 0.1,
                color: 'black',
                fill: true,
                fillColor: this.colors[this.category_map[feature.properties.category]],
                fillOpacity: opacity
            };
        },

        changeStyle() {
            let geoJson = this.geoJSONLayer;
            geoJson.setStyle(this.myStyle);
        },

        drawOverview() {
            let self = this;
            let svg = this.svg;
            let map = this.mymap;
            if(svg === null){
                L.svg({clickable: true}).addTo(map);
                const overlay = d3.select(map.getPanes().overlayPane);
                svg = overlay.select('svg').attr("pointer-events", "auto");
                this.svg = svg;
            }

            this.removeHFlow();

            // if(this.mode){
            //     svg.selectAll('.glyph').remove();
            //     svg.selectAll('.HFlow').remove()
            // } else {
            //     this.mymap.remove();
            //     this.mymap = this.init('mapDiv');
            //     map = this.mymap;
            //     L.svg({clickable: true}).addTo(map);
            //     const overlay = d3.select(map.getPanes().overlayPane);
            //     svg = overlay.select('svg').attr("pointer-events", "auto");
            //     this.svg = svg;
            // }

            // draw lines
            let lineGenerator = d3.line()
                .x(function(d) {
                    return map.latLngToLayerPoint(d).x;
                })
                .y(function(d) {
                    return map.latLngToLayerPoint(d).y;
                })

            const borders = svg.selectAll('whatever')
                .data(this.highOrder)
                .enter()
                .append('path')
                .attr("class", "HFlow")
                .attr("stroke", 'black')
                .attr("stroke-width", 6)
                .attr("fill", 'none')
                .attr('d', d => lineGenerator.curve(d3['curveCardinal'])(d.coordinate))

            const lines = svg.selectAll('whatever')
                .data(this.highOrder)
                .enter()
                .append('path')
                .attr("class", "HFlow")
                .attr("stroke", d => self.overviewColors[d.id])
                .attr("stroke-width", 5)
                .attr("fill", 'none')
                .attr('d', d => lineGenerator.curve(d3['curveCardinal'])(d.coordinate))


            // draw circles
            const nodes = svg.selectAll('whatever')
                .data(this.circles)
                .enter()
                .append('circle')
                .attr("class", "HFlow")
                .attr("fill", d => self.overviewColors[d.id])
                // .attr("fill", d => color[d.radius])
                .attr("stroke", "black")
                .attr("stroke-width", d => (d.type === 0) ? 2 : 1)
                .attr("cx", d => map.latLngToLayerPoint(d.coordinate).x)
                .attr("cy", d => map.latLngToLayerPoint(d.coordinate).y)
                .attr("r", 10)
            // .attr("r", d => radius[d.radius])

            const update = (level) => {
                borders
                    .attr('d', d => lineGenerator.curve(d3['curveCardinal'])(d.coordinate))

                lines
                    .attr('d', d => lineGenerator.curve(d3['curveCardinal'])(d.coordinate))

                nodes
                    .attr("cx", d => map.latLngToLayerPoint(d.coordinate).x)
                    .attr("cy", d => map.latLngToLayerPoint(d.coordinate).y)
            }

            map.on("zoomend", (e) => {
                let level = e.target.getZoom();
                update(level);
                // console.log("Zoom Level is: " + e.target.getZoom());
            })

            // 画完第一个h-flow就设为h-flow模式
            this.mode = true;
            this.isOverview = true;
        },

        removeHFlow(){
            d3.selectAll(".HFlow").remove();
        },

        drawKelp() {
            let self = this;
            let svg = this.svg;
            let map = this.mymap;
            if(svg === null){
                L.svg({clickable: true}).addTo(map);
                const overlay = d3.select(map.getPanes().overlayPane);
                svg = overlay.select('svg').attr("pointer-events", "auto");
                this.svg = svg;
            }

            this.removeHFlow();

            // if(this.mode){
            //     svg.selectAll('.glyph').remove();
            //     svg.selectAll('.HFlow').remove();
            // } else {
            //     this.mymap.remove();
            //     this.mymap = this.init('mapDiv');
            //     map = this.mymap;
            //     L.svg({clickable: true}).addTo(map);
            //     const overlay = d3.select(map.getPanes().overlayPane);
            //     svg = overlay.select('svg').attr("pointer-events", "auto");
            //     this.svg = svg;
            // }

            // 生成circles & lines
            let count = 0;
            // let color = ['#FF6666', '#FFFF00', '#0066CC', 'green', 'red']
            // let color = ['#9ADCFF', '#FFF89A', '#FFB2A6', '#C1F4C5', '#65C18C']
            let color = ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072']
            let radius = [12, 9, 6, 3]
            let opacity = [0.7, 0.8, 0.9, 1]
            let lineWidth = [4, 3, 2, 1]
            let top = 4
            // for (let key in data) {
            //     let points = [];
            //     let lines = [];
            //     let arrows = [];
            //
            //     if (count >= top)
            //         break;
            //     let t = key.split('_')
            //     let start;
            //     for (let i = 0; i < t.length - 1; i++) {
            //         let point = {regionId: 0, coordinate: [0, 0], radius: 0, color: "black"}
            //         start = this.regions_coordinates[Number(t[i])];
            //         point.regionId = Number(t[i]);
            //         point.coordinate = this.regions_coordinates[Number(t[i])];
            //         point.radius = radius[count];
            //         point.color = color[count];
            //         points.push(point);
            //
            //         let line = {start: [0, 0], end: [0, 0], width: 0, color: 'black'}
            //         let arrow = {coordinate: [0, 0], rotate: 0, width: 0, color: 'black'}
            //         if (i < t.length - 2) {
            //             line.start = start;
            //             line.end = this.regions_coordinates[Number(t[i + 1])]
            //             line.width = radius[count]
            //             line.color = color[count]
            //             lines.push(line)
            //
            //             arrow.coordinate = [line.start[0] * 2 / 3 + line.end[0] / 3, line.start[1] * 2 / 3 + line.end[1] / 3]
            //             arrow.rotate = Math.atan2((line.end[1] - line.start[1]), line.end[0] - line.start[0]) * 180 / (Math.PI)
            //             arrow.color = color[count]
            //             arrow.width = radius[count]
            //             arrows.push(arrow)
            //         }
            //     }
            //
            //     for (let i = 0; i < data[key].length; i++) {
            //         if (data[key][i] !== 0) {
            //             let point = {regionId: 0, coordinate: [0, 0], radius: 0, color: "black"}
            //             point.regionId = i;
            //             point.coordinate = this.regions_coordinates[i];
            //             point.radius = radius[count];
            //             point.color = color[count];
            //             points.push(point);
            //
            //             let line = {start: [0, 0], end: [0, 0], width: 0, color: 'black'}
            //             line.start = start;
            //             line.end = this.regions_coordinates[i];
            //             line.width = radius[count];
            //             line.color = color[count];
            //             lines.push(line);
            //
            //             let arrow = {coordinate: [0, 0], rotate: 0, width: 0, color: 'black'}
            //             arrow.coordinate = [line.start[0] * 2 / 3 + line.end[0] / 3, line.start[1] * 2 / 3 + line.end[1] / 3]
            //             arrow.rotate = Math.atan2((line.end[1] - line.start[1]), line.end[0] - line.start[0]) * 180 / (Math.PI)
            //             arrow.color = color[count]
            //             arrow.width = radius[count]
            //             arrows.push(arrow)
            //         }
            //     }
            //     count++;
            //
            //     // draw trajectory
            //     const nodes = svg.selectAll('whatever')
            //         .data(points)
            //         .enter()
            //         .append('circle')
            //         .attr("class", "highOrder")
            //         .attr("fill", d => d.color)
            //         .attr("stroke", "black")
            //         .attr("stroke-width", 0)
            //         .attr("cx", d => map.latLngToLayerPoint(d.coordinate).x)
            //         .attr("cy", d => map.latLngToLayerPoint(d.coordinate).y)
            //         .attr("r", d => d.radius)
            //         .on("click", d => {
            //             self.$emit("conveyRegion", d.regionId);
            //             self.regionId = d.regionId;
            //             console.log(d.regionId)
            //         })
            //         .on("mouseover", function (d) {
            //             self.drawSingleGlyph(d.regionId, 20, 40);
            //         })
            //         .on("mouseout", function (d) {
            //             svg.selectAll('.glyph').remove()
            //         })
            //
            //     const polyLines = svg.selectAll('whatever')
            //         .data(lines)
            //         .enter()
            //         .append('line')
            //         .attr("class", "highOrder")
            //         .attr("stroke", d => d.color)
            //         .attr("stroke-width", d => d.width * 0.6)
            //         .attr("x1", d => map.latLngToLayerPoint(d.start).x)
            //         .attr("y1", d => map.latLngToLayerPoint(d.start).y)
            //         .attr("x2", d => map.latLngToLayerPoint(d.end).x)
            //         .attr("y2", d => map.latLngToLayerPoint(d.end).y);
            //
            //     const triangles = svg.selectAll('whatever')
            //         .data(arrows)
            //         .enter()
            //         .append('path')
            //         .attr("class", 'highOrder')
            //         .attr('d', d3.symbol().size(d => d.width * 10).type(d3.symbolTriangle))
            //         .attr("fill", d => d.color)
            //         .attr("transform", d => "translate(" + map.latLngToLayerPoint(d.coordinate).x + ","
            //             + map.latLngToLayerPoint(d.coordinate).y + ")" + "rotate(" + d.rotate + ")")
            //
            //     const update = (level) => {
            //         nodes
            //             .attr("cx", d => map.latLngToLayerPoint(d.coordinate).x)
            //             .attr("cy", d => map.latLngToLayerPoint(d.coordinate).y)
            //
            //         polyLines
            //             .attr("x1", d => map.latLngToLayerPoint(d.start).x)
            //             .attr("y1", d => map.latLngToLayerPoint(d.start).y)
            //             .attr("x2", d => map.latLngToLayerPoint(d.end).x)
            //             .attr("y2", d => map.latLngToLayerPoint(d.end).y);
            //
            //         triangles
            //             .attr("transform", d => "translate(" + map.latLngToLayerPoint(d.coordinate).x + ","
            //                 + map.latLngToLayerPoint(d.coordinate).y + ")" + "rotate(" + d.rotate + ")")
            //         // .attr("r", level)
            //     }
            //
            //     map.on("zoomend", (e) => {
            //         let level = e.target.getZoom();
            //         update(level);
            //         // console.log("Zoom Level is: " + e.target.getZoom());
            //     })
            //
            // }


            // draw lines
            let lineGenerator = d3.line()
                .x(function(d) {
                    return map.latLngToLayerPoint(d).x;
                })
                .y(function(d) {
                    return map.latLngToLayerPoint(d).y;
                })

            const borders = svg.selectAll('whatever')
                .data(this.highOrder)
                .enter()
                .append('path')
                .attr("class", "HFlow")
                .attr("stroke", 'black')
                .attr("stroke-width", d => lineWidth[d.id] + 1)
                .attr("fill", 'none')
                .attr('d', d => lineGenerator.curve(d3['curveCardinal'])(d.coordinate))

            const lines = svg.selectAll('whatever')
                .data(this.highOrder)
                .enter()
                .append('path')
                .attr("class", "HFlow")
                .attr("stroke", d => color[d.id])
                .attr("stroke-width", d => lineWidth[d.id])
                .attr("fill", 'none')
                .attr('d', d => lineGenerator.curve(d3['curveCardinal'])(d.coordinate))

            // let lineData = lineGenerator.curve(d3['curveCardinal'])

            // draw circles
            const nodes = svg.selectAll('whatever')
                .data(this.circles)
                .enter()
                .append('circle')
                .attr("class", "HFlow")
                .attr("fill", d => color[d.radius])
                .attr("stroke", "black")
                .attr("stroke-width", d => (d.type === 0) ? 2 : 1)
                .attr("cx", d => map.latLngToLayerPoint(d.coordinate).x)
                .attr("cy", d => map.latLngToLayerPoint(d.coordinate).y)
                .attr("r", d => radius[d.radius])
                .on("click", function(d){
                    if(d.type !== 1){
                        self.drawMapviewSignal++;
                        self.$emit("conveyMapviewPatternId", self.drawMapviewSignal, d.type, d.index, d.radius);
                    }
                    console.log("--------Here is information----------");
                    console.log(d.type);
                    console.log(d.index);
                    console.log(d.entropy);
                    console.log("--------Here is information----------");
                })

            // draw entropy circle
            let myColor = d3.scaleLinear()
                .range(["#CCF3EE", "#0AA1DD"])
                .domain([0, 1])

            const entropyCircle = svg.selectAll('whatever')
                .data(this.circles)
                .enter()
                .append('circle')
                .attr("class", "HFlow")
                .attr("fill", d => myColor(d.entropy))
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("cx", d => map.latLngToLayerPoint(d.coordinate).x)
                .attr("cy", d => map.latLngToLayerPoint(d.coordinate).y)
                .attr("r", d => (d.type === 2) ? 3 : 0)
                .on("click", function(d){
                    if(d.type !== 1){
                        self.drawMapviewSignal++;
                        self.$emit("conveyMapviewPatternId", self.drawMapviewSignal, d.type, d.index, d.radius);
                    }
                    console.log("--------Here is information----------");
                    console.log(d.type);
                    console.log(d.index);
                    console.log(d.entropy);
                    console.log("--------Here is information----------");
                })

            const update = (level) => {
                borders
                    .attr('d', d => lineGenerator.curve(d3['curveCardinal'])(d.coordinate))

                lines
                    .attr('d', d => lineGenerator.curve(d3['curveCardinal'])(d.coordinate))

                nodes
                    .attr("cx", d => map.latLngToLayerPoint(d.coordinate).x)
                    .attr("cy", d => map.latLngToLayerPoint(d.coordinate).y)

                entropyCircle
                    .attr("cx", d => map.latLngToLayerPoint(d.coordinate).x)
                    .attr("cy", d => map.latLngToLayerPoint(d.coordinate).y)
            }

            map.on("zoomend", (e) => {
                let level = e.target.getZoom();
                update(level);
                // console.log("Zoom Level is: " + e.target.getZoom());
            })

            // 画完第一个h-flow就设为h-flow模式
            this.mode = true;
            this.isOverview = false;
        },

        drawGlyph() {
            let map = this.mymap;
            L.svg({clickable: true}).addTo(map);
            const overlay = d3.select(map.getPanes().overlayPane);
            const svg = overlay.select('svg').attr("pointer-events", "auto");
            this.svg = svg;

            // 旧数据
            // let coordinates = this.regions_coordinates;
            // for (let i = 0; i < coordinates.length; i++) {
            //     this.drawSingleGlyph(i, 10, 20);
            // }

            for (let id in this.centroids) {
                this.drawSingleGlyph(id, 6, 10);
            }
        },

        drawSingleGlyph(regionId, innerRadius, outerRadius) {
            // let coordinate = this.regions_coordinates[regionId];

            let coordinates = this.centroids[regionId].split(" ");
            // 坐标需要颠倒，这里有坑，经纬度调换位置了
            let coordinate = [Number(coordinates[1]), Number(coordinates[0])]
            let svg = this.svg;
            let self = this;
            let offset = this.mymap.latLngToLayerPoint(coordinate);

            let g = svg.append("g")
                .attr("class", 'glyph')
                .attr("transform", "translate(" + offset.x + "," + offset.y + ")")

            // set the color map
            let color = ['#99CCCC', '#FFCC99', '#FFCCCC', '#0099CC', '#CC9999', '#FF6666', '#FFFF99', '#CCCCFF', '#CC9966', '#CCCCCC']

            // // Compute the position of each group on the pie:
            // let pie = d3.pie()
            //     .value(function (d) {
            //         return d;
            //     })
            // let data_ready = pie(region)
            //
            // // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
            // g.selectAll('whatever')
            //     .data(data_ready)
            //     .enter()
            //     .append('path')
            //     .attr('d', d3.arc()
            //         .innerRadius(innerRadius)         // This is the size of the donut hole
            //         .outerRadius(outerRadius)
            //     )
            //     .attr('fill', function (d) {
            //         return color[d.index]
            //     })
            //     .attr("stroke", "black")
            //     .style("stroke-width", "0.3px")
            //     .style("opacity", 1)

            g.append('circle')
                .attr("class", "circle")
                .attr("r", innerRadius)
                .attr("stroke", 'black')
                .attr("stroke-width", 1)
                .attr("fill", "#EF6D6D")
                .attr("opacity", 1)      // 可以通过设置opacity为0将圆圈隐去
                .on("click", function () {
                    self.$emit("conveyRegion", regionId);
                    self.regionId = regionId;
                    console.log(regionId)
                })

            const update = () => {
                offset = this.mymap.latLngToLayerPoint(coordinate);
                g.attr("transform", "translate(" + offset.x + "," + offset.y + ")")
            }

            this.mymap.on("zoomend", (e) => {
                update();
            })
        },

        drawSegmentation() {
            // 更新地图
            this.mymap.remove();
            this.mymap = this.init('mapDiv');

            let map = this.mymap;
            let self = this;

            let colors = ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9',
                '#bc80bd','#ccebc5','#ffed6f','#b3e2cd','#fdcdac','#cbd5e8','#f4cae4','#e6f5c9', '#1f78b4', '#33a02c'];


            // dataService.getVanAreasMap(this.level, response => {
            //     let VanAreas = response.data;
            //
            //     let VanAreasLayer = L.geoJson(VanAreas, {
            //             style: function (feature) {
            //                 return {
            //                     weight: 0.1,
            //                     color: 'black',
            //                     fill: true,
            //                     fillColor: colors[category_map[feature.properties.category]],
            //                     fillOpacity: 1
            //                 }
            //             }
            //         }
            //     ).bindPopup(function (layer) {
            //         return "Region: " + layer.feature.properties.category;
            //     }).addTo(map);
            //
            //     this.geoJSONLayer = VanAreasLayer;
            //
            //     dataService.getBoundary(response => {
            //         let boundary = response.data;
            //         let boundaryLayer = L.geoJson(boundary, {
            //                 style: function (feature) {
            //                     return {
            //                         weight: 0,
            //                         color: 'black',
            //                         fillOpacity: 0
            //                     }
            //                 }
            //             }
            //         ).addTo(map);
            //         this.boundaryLayer = boundaryLayer;
            //     })
            // })

            dataService.getBoundary(response => {
                let result = response.data;
                let segmentation = result.info;
                this.segmentation = segmentation;
                // let belong = result.belong;
                let segmentationLayer = L.geoJson(segmentation, {
                        style: function (feature) {
                            return {
                                weight: 0.1,
                                color: 'black',
                                fill: true,
                                fillColor: colors[feature.properties.class_center],
                                fillOpacity: 1,
                            }
                        },
                        // onEachFeature: self.onEachFeature,
                    }
                ).addTo(map);

                let boundaryLayer = L.geoJson(segmentation, {
                    style: function (feature) {
                        return {
                            weight: 0.5,
                            color: 'black',
                            fillOpacity: 0,
                        }
                    }
                })

                this.segmentationLayer = segmentationLayer;
                this.boundaryLayer = boundaryLayer;

                // // 底图，不允许修改
                // let segmentationLayer = L.geoJson(segmentation, {
                //         style: function (feature) {
                //             return {
                //                 weight: 0.1,
                //                 color: 'black',
                //                 fill: true,
                //                 fillColor: colors[feature.properties.class_center],
                //                 fillOpacity: 1,
                //             }
                //         },
                //         // onEachFeature: self.onEachFeature,
                //     }
                // );
                // this.segmentationLayer = segmentationLayer;

                // remove layer
                // map.removeLayer(boundaryLayer);
            })
        },

        init(id) {
            let map = new L.map(id, {
                // center: new L.LatLng(40.7243528, -73.9559731),
                center: new L.LatLng(40.7383528, -73.947731),
                zoom: 13,
                preferCanvas: true
            });

            // try change leaflet type: The origin type:
            // let baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            //     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            // }).addTo(map);

            // let baseLayer = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
            //     maxZoom: 20,
            //     id: 'mapbox/streets-v11',
            //     tileSize: 512,
            //     zoomOffset: -1
            // }).addTo(map)

            let baseLayer = L.tileLayer.provider('Esri.WorldGrayCanvas').addTo(map);

            // this.layerGroups.addTo(map)

            // L.svg({clickable: true}).addTo(map)// we have to make the svg layer clickable
            // const overlay = d3.select(map.getPanes().overlayPane)
            // const svg = overlay.select('svg').attr("pointer-events", "auto")

            // // create another trajectory
            // let traj = [[40.735614, -74.007132], [40.7679124817876, -73.98507762454408],
            //     [40.77143374050618, -73.98247003555298], [40.726121, -73.992822]];
            //
            // // display all lines
            // let polyline = L.polyline(traj, {
            //     color: '#008792',
            //     weight: 6,
            // }).addTo(map);

            // map.fitBounds(polyline.getBounds());
            // map.addLayer(baseLayer);

            return map
        },
        // changeData() {
        //     this.$emit('changeData', this.coords);
        // },
    }
}
