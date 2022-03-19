/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-console */
import {getGroup} from './drawFace.js'
import 'leaflet/dist/leaflet.css'
import dataService from "@/service/dataService";
import L from "leaflet";
import {bounds, layerGroup} from "leaflet/dist/leaflet-src.esm";
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
            mode: false,
            number: 1,
            choice: [1, 2, 3, 4],
            entropy: 1,
            svg: null,
            trajNum: 0,
            regionId: -1,
            regions: null,
            geoJSONLayer: null,
            colors: ['#99CCCC', '#FFCC99', '#FFCCCC', '#0099cc', '#CC9999', '#FF6666',
                '#FFFF99', '#CCCCFF', '#CC9966', '#CCCCCC', '#666666', '#99CC66', '#CCCC99'],
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
            regions_coordinates: [
                [40.71106894, -74.00783088],
                [40.72511451, -73.99513351],
                [40.72527513, -73.98450652],
                [40.74062869, -73.99462444],
                [40.7645624, -73.9733893],
                [40.75485609, -73.9845724],
                [40.78309201, -73.97783401],
                [40.77836093, -73.95765082],
                [40.80537075, -73.95895236],
                [40.79544377, -73.94270366],
                [40.82346498, -73.94589541],
                [40.84669929, -73.93685292],
                [40.86588784, -73.92291179],
            ],
            content: {},
            mymap: null,
            bounds: 0,
            layerGroups: new L.FeatureGroup(),
            direction: [[0, 1], [1, 0], [-1, 0], [0, -1], [-1, 1], [1, -1], [1, 1], [-1, -1],]
        }
    },

    // props: ['user', 'date'],

    props: ['date', 'startTime', 'timeLength', 'highlight', 'select','selectedData'],

    computed: {
        info() {
            const {startTime, timeLength, regionId} = this;
            return {startTime, timeLength, regionId};
        }
    },

    watch: {
        info(val) {
            if (this.timeLength !== 0) {
                dataService.getHighOrder(this.startTime, this.timeLength, this.regionId, this.date, response => {
                    this.content = response.data;
                    this.$emit("conveyHighOrder", this.content);
                    console.log(this.content)
                    let data = this.content;
                    this.drawKelp(data);
                })
            }
        },

        select(val){
            if(this.mode){
                this.drawKelp(this.selectedData);
            }
        },

        date(value) {
            // 传给后端：Weekdays or Holidays
            // 后端返回：region flow data
            dataService.getRegionFlow(this.date, response => {
                this.regions = response.data;
                this.$emit("conveyRegionFlow", this.regions);
                this.drawSegmentation();
            })
        },

        mode(value) {
            this.mymap.remove();
            this.mymap = this.init('mapDiv');
            if (value) {
                this.drawGlyph();
            } else {
                this.drawSegmentation()

                let map = this.mymap;
                L.svg({clickable: true}).addTo(map);
                const overlay = d3.select(map.getPanes().overlayPane);
                const svg = overlay.select('svg').attr("pointer-events", "auto");
                this.svg = svg;

                let data = this.content;
                this.drawKelp(data);
            }
        },

        number(value) {
            this.$emit("conveyNumber", this.number);
        },

        highlight(value){
            this.changeStyle();
        },

        // bounds: function (newQuestion, oldQuestion) {
        //     // this.layerGroups = getGroup()
        //     this.layerGroups.clearLayers()
        //     let a = Math.random() * 4
        //     a = Math.floor(a)
        //     let b;
        //     b = []
        //     for (let i = 0; i < a; i++) {
        //         b[i] = Math.floor(Math.random() * 7);
        //     }
        // }

    },

    mounted: function () {
        this.mymap = this.init('mapDiv')
        this.mymap.on('dragend', () => {
            this.bounds = this.mymap.getBounds();
        })
    },

    methods: {
        handleChange(){
            this.mymap.remove();
            this.mymap = this.init('mapDiv');

            if (this.mode) {
                this.drawGlyph();
            } else {
                this.drawSegmentation();
            }
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

        changeStyle(){
            let geoJson = this.geoJSONLayer;
            geoJson.setStyle(this.myStyle);
        },

        drawKelp (data){
            let self = this;
            let map = this.mymap;
            let svg = this.svg;

            svg.selectAll('.glyph').remove();
            svg.selectAll('.highOrder').remove()

            // 生成circles & lines
            let count = 0;
            // let color = ['#FF6666', '#FFFF00', '#0066CC', 'green', 'red']
            // let color = ['#9ADCFF', '#FFF89A', '#FFB2A6', '#C1F4C5', '#65C18C']
            let color = ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072']
            let radius = [16, 12, 8, 4]
            let opacity = [0.7, 0.8, 0.9, 1]
            let top = 4
            for (let key in data) {
                let points = [];
                let lines = [];
                let arrows = [];

                if (count >= top)
                    break;
                let t = key.split('_')
                let start;
                for (let i = 0; i < t.length - 1; i++) {
                    let point = {regionId: 0, coordinate: [0, 0], radius: 0, color: "black"}
                    start = this.regions_coordinates[Number(t[i])];
                    point.regionId = Number(t[i]);
                    point.coordinate = this.regions_coordinates[Number(t[i])];
                    point.radius = radius[count];
                    point.color = color[count];
                    points.push(point);

                    let line = {start: [0, 0], end: [0, 0], width: 0, color: 'black'}
                    let arrow = {coordinate: [0, 0], rotate: 0, width: 0, color: 'black'}
                    if (i < t.length - 2) {
                        line.start = start;
                        line.end = this.regions_coordinates[Number(t[i + 1])]
                        line.width = radius[count]
                        line.color = color[count]
                        lines.push(line)

                        arrow.coordinate = [line.start[0] * 2 / 3 + line.end[0] / 3, line.start[1] * 2 / 3 + line.end[1] / 3]
                        arrow.rotate = Math.atan2((line.end[1] - line.start[1]), line.end[0] - line.start[0]) * 180 / (Math.PI)
                        arrow.color = color[count]
                        arrow.width = radius[count]
                        arrows.push(arrow)
                    }
                }

                for (let i = 0; i < data[key].length; i++) {
                    if (data[key][i] !== 0) {
                        let point = {regionId: 0, coordinate: [0, 0], radius: 0, color: "black"}
                        point.regionId = i;
                        point.coordinate = this.regions_coordinates[i];
                        point.radius = radius[count];
                        point.color = color[count];
                        points.push(point);

                        let line = {start: [0, 0], end: [0, 0], width: 0, color: 'black'}
                        line.start = start;
                        line.end = this.regions_coordinates[i];
                        line.width = radius[count];
                        line.color = color[count];
                        lines.push(line);

                        let arrow = {coordinate: [0, 0], rotate: 0, width: 0, color: 'black'}
                        arrow.coordinate = [line.start[0] * 2 / 3 + line.end[0] / 3, line.start[1] * 2 / 3 + line.end[1] / 3]
                        arrow.rotate = Math.atan2((line.end[1] - line.start[1]), line.end[0] - line.start[0]) * 180 / (Math.PI)
                        arrow.color = color[count]
                        arrow.width = radius[count]
                        arrows.push(arrow)
                    }
                }
                count++;

                // draw trajectory
                const nodes = svg.selectAll('whatever')
                    .data(points)
                    .enter()
                    .append('circle')
                    .attr("class", "highOrder")
                    .attr("fill", d => d.color)
                    .attr("stroke", "black")
                    .attr("stroke-width", 0)
                    .attr("cx", d => map.latLngToLayerPoint(d.coordinate).x)
                    .attr("cy", d => map.latLngToLayerPoint(d.coordinate).y)
                    .attr("r", d => d.radius)
                    .on("click", d => {
                        self.$emit("conveyRegion", d.regionId);
                        self.regionId = d.regionId;
                        console.log(d.regionId)
                    })
                    .on("mouseover", function(d) {self.drawSingleGlyph(d.regionId, 20, 40);})
                    .on("mouseout", function(d) {svg.selectAll('.glyph').remove()})

                const polyLines = svg.selectAll('whatever')
                    .data(lines)
                    .enter()
                    .append('line')
                    .attr("class", "highOrder")
                    .attr("stroke", d => d.color)
                    .attr("stroke-width", d => d.width * 0.6)
                    .attr("x1", d => map.latLngToLayerPoint(d.start).x)
                    .attr("y1", d => map.latLngToLayerPoint(d.start).y)
                    .attr("x2", d => map.latLngToLayerPoint(d.end).x)
                    .attr("y2", d => map.latLngToLayerPoint(d.end).y);

                const triangles = svg.selectAll('whatever')
                    .data(arrows)
                    .enter()
                    .append('path')
                    .attr("class", 'highOrder')
                    .attr('d', d3.symbol().size(d => d.width * 10).type(d3.symbolTriangle))
                    .attr("fill", d => d.color)
                    .attr("transform", d => "translate(" + map.latLngToLayerPoint(d.coordinate).x + ","
                        + map.latLngToLayerPoint(d.coordinate).y + ")" + "rotate(" + d.rotate + ")")

                const update = (level) => {
                    nodes
                        .attr("cx", d => map.latLngToLayerPoint(d.coordinate).x)
                        .attr("cy", d => map.latLngToLayerPoint(d.coordinate).y)

                    polyLines
                        .attr("x1", d => map.latLngToLayerPoint(d.start).x)
                        .attr("y1", d => map.latLngToLayerPoint(d.start).y)
                        .attr("x2", d => map.latLngToLayerPoint(d.end).x)
                        .attr("y2", d => map.latLngToLayerPoint(d.end).y);

                    triangles
                        .attr("transform", d => "translate(" + map.latLngToLayerPoint(d.coordinate).x + ","
                            + map.latLngToLayerPoint(d.coordinate).y + ")" + "rotate(" + d.rotate + ")")
                    // .attr("r", level)
                }

                map.on("zoomend", (e) => {
                    let level = e.target.getZoom();
                    update(level);
                    // console.log("Zoom Level is: " + e.target.getZoom());
                })

            }
        },

        drawGlyph() {
            let map = this.mymap;
            L.svg({clickable: true}).addTo(map);
            const overlay = d3.select(map.getPanes().overlayPane);
            const svg = overlay.select('svg').attr("pointer-events", "auto");
            this.svg = svg;

            let coordinates = this.regions_coordinates;
            for (let i = 0; i < coordinates.length; i++) {
                this.drawSingleGlyph(i, 10, 20);
            }
        },

        drawSingleGlyph(regionId, innerRadius, outerRadius) {
            let coordinate = this.regions_coordinates[regionId];
            let region = this.regions[regionId];
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
            let map = this.mymap
            dataService.getVanAreasMap(this.entropy, response => {
                let VanAreas = response.data;

                let category_map = {'Food': 0,
                    'Shop & Service': 1,
                    'Outdoors & Recreation': 2,
                    'Professional & Other Places': 3,
                    'Travel & Transport': 4,
                    'Nightlife Spot': 5,
                    'Arts & Entertainment': 6,
                    'College & University': 7,
                    'Residence': 8,
                    'Event': 9}

                function myStyle(feature) {
                    return {
                        weight: 0.1,
                        color: 'black',
                        fill: true,
                        fillColor: 'black',
                        fillOpacity: 1
                    };
                }

                let VanAreasLayer = L.geoJson(VanAreas, {
                        style: function (feature) {
                            let colors = ['#99CCCC', '#FFCC99', '#FFCCCC', '#0099cc', '#CC9999', '#FF6666',
                                '#FFFF99', '#CCCCFF', '#CC9966', '#CCCCCC', '#666666', '#99CC66', '#CCCC99'];
                            return {
                                weight: 0.1,
                                color: 'black',
                                fill: true,
                                fillColor: colors[category_map[feature.properties.category]],
                                fillOpacity: 1
                            }
                        }
                    }
                ).bindPopup(function (layer) {
                    return "Region: " + layer.feature.properties.region;
                }).addTo(map);

                this.geoJSONLayer = VanAreasLayer;

                // VanAreasLayer.setStyle(this.myStyle);


                // Automatically fit
                // map.fitBounds(VanAreasLayer.getBounds());
            })
        },

        init(id) {
            // function resetSelectedState() {
            //     map.eachLayer(layer => {
            //         if (layer instanceof L.Marker) {
            //             // layer.setIcon(new L.Icon.Default());
            //         } else if (layer instanceof L.Path) {
            //             layer.setStyle({ color: '#0088ff',weight:1});
            //         }
            //     });
            //
            //     // lassoResult.innerHTML = '';
            // }

            // function setSelectedLayers(layers) {
            //     resetSelectedState();
            //     let lat = 0;
            //     let lng = 0;
            //     let count = 0;
            //     layers.forEach(layer => {
            //         if (layer instanceof L.Marker) {
            //             // layer.setIcon(new L.Icon.Default({ className: 'selected '}));
            //         } else if (layer instanceof L.Path ) {
            //             let bounds = layer.getBounds();
            //             let latLng = bounds.getCenter();
            //             lat = lat +latLng.lat;
            //             lng = lng +latLng.lng;
            //             count++;
            //             layer.setStyle({ color: '#ff4620',weight:1 });
            //         }
            //     });
            //     lat = lat/count;
            //     lng = lng/count;
            //     console.log(bounds)
            //     console.log("lat: "+lat);
            //     console.log("lng: "+lng);
            //     return [lat,lng];
            //     // lassoResult.innerHTML = layers.length ? `Selected ${layers.length} layers` : '';
            // }

            let map = new L.map(id, {
                // (53.2527, -123.1207)
                center: new L.LatLng(40.7743528, -73.9079731),
                zoom: 12,
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

            // L.control.lasso().addTo(map);
            // dataService.fetchnode( (returnedData) => {
            //     // console.log('selectview::fetchProductViewLassoedDataPost: ', returnedData)
            //     let coords = returnedData.data.coords
            //     let markers = L.markerClusterGroup();
            //     console.log(coords)
            //     for (let i in coords) {
            //         // console.log(i)
            //         // console.log(title)
            //         // console.log(i)
            //         let title=coords[i]
            //         let coord = eval(i)
            //
            //         markers.addLayer(L.marker(new L.latLng(coord[1],coord[0]),{title:title,}));
            //     }
            //     // console.log(markers)
            //     map.addLayer(markers);
            //     console.log('finish markders===================')
            // });
            //
            // map.on('zoomed',()=>{
            //     resetSelectedState();
            // })
            //
            // map.on('mousedown', () => {
            //     resetSelectedState();
            // });
            // let h = 0;
            // let w = 0;
            // map.on('lasso.finished', event => {
            //     let latlng = setSelectedLayers(event.layers);
            //     // console.log(latlng)
            //     let b = map.getBounds()
            //     h = (latlng[0] - b.getSouthWest().lat)/(b.getNorthEast().lat-b.getSouthWest().lat)
            //     w = (latlng[1] - b.getSouthWest().lng)/(b.getNorthEast().lng-b.getSouthWest().lng)
            //     // console.log("==============="+this.bound)
            //     // console.log(h)
            //     //             console.log(w)
            //     // console.log(this)
            //     this.$emit('changeData', w,h);
            // });
            //
            // // console.log(this)
            // map.on('lasso.enabled', () => {
            //     // lassoEnabled.innerHTML = 'Enabled';
            //     resetSelectedState();
            // });
            // map.on('lasso.disabled', () => {
            //     // lassoEnabled.innerHTML = 'Disabled';
            // });

            // map.getBounds()
            return map
        },
        // changeData() {
        //     this.$emit('changeData', this.coords);
        // },
    }
}
