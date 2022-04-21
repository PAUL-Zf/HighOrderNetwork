/* eslint-disable */
// /* global d3 $ */
import L from "leaflet";
// import {pipes,points} from "@/components/MapView/data";
// import HeatmapOverlay from "heatmap.js/plugins/leaflet-heatmap";

import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

import dataService from "@/service/dataService";
import "leaflet-lasso";
import {bounds} from "leaflet/dist/leaflet-src.esm";

// Draw Map

// export let DrawFace = function(id, data, map) {
    // const mapElement = document.querySelector('#map');
    // const toggleLasso = document.querySelector('#toggleLasso');
    // const contain = document.querySelector('#contain');
    // const intersect = document.querySelector('#intersect');
    // const lassoEnabled = document.querySelector('#lassoEnabled');
    // const lassoResult = document.querySelector('#lassoResult');

    // var geolayer = L.geoJSON(data).addTo(map);

    // let marker = L.marker(geolayer);
    // var ciLayer = L.canvasIconLayer({}).addTo(map);
    // ciLayer.addMarker(marker);






    // toggleLasso.addEventListener('click', () => {
    //     if (lassoControl.enabled()) {
    //         lassoControl.disable();
    //     } else {
    //         lassoControl.enable();
    //     }
    // });

    // contain.addEventListener('change', () => {
    //     lassoControl.setOptions({ intersect: intersect.checked });
    // });
    // intersect.addEventListener('change', () => {
    //     lassoControl.setOptions({ intersect: intersect.checked });
    // });




    // const mapElement = document.querySelector('#map');
    // const toggleLasso = document.querySelector('#toggleLasso');
    // const contain = document.querySelector('#contain');
    // const intersect = document.querySelector('#intersect');
    // const lassoEnabled = document.querySelector('#lassoEnabled');
    // const lassoResult = document.querySelector('#lassoResult');
    //
    // const map = L.map(mapElement, { center: [0, 0], zoom: 0 });
    // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    // }).addTo(map);
    // const lassoControl = L.control.lasso().addTo(map);
    //
    // // the same layers as in unit test
    // const startLatLng = [51.5, -0.11];
    // const latDelta = 0.01;
    // const lngDelta = latDelta * 1.75;
    // const latSmallDelta = 0.002;
    // const lngSmallDelta = latSmallDelta * 1.75;
    // const markers = new Array(9).fill(undefined).map((_, i) => L.marker([startLatLng[0] + Math.floor(i / 3) * latDelta, startLatLng[1] + (i % 3) * lngDelta]));
    // const circleMarker = L.circleMarker([startLatLng[0] + latDelta * 2, startLatLng[1] + lngDelta * 3], { radius: 21 });
    // const circle = L.circle([startLatLng[0] + latDelta * 2, startLatLng[1] + lngDelta * 4], { radius: 250 });
    // const polyline = (latLng => L.polyline([
    //     [latLng[0] - latSmallDelta, latLng[1] - lngSmallDelta],
    //     [latLng[0] + latSmallDelta, latLng[1] - lngSmallDelta],
    //     [latLng[0] + latSmallDelta, latLng[1] + lngSmallDelta],
    //     [latLng[0] - latSmallDelta, latLng[1] + lngSmallDelta],
    // ]))([startLatLng[0] + latDelta * 1, startLatLng[1] + lngDelta * 3]);
    // const multiPolyline = (latLng => L.polyline([
    //     [
    //         [latLng[0] - latSmallDelta, latLng[1] - lngSmallDelta],
    //         [latLng[0] + latSmallDelta, latLng[1] - lngSmallDelta],
    //         [latLng[0] + latSmallDelta, latLng[1] + lngSmallDelta],
    //         [latLng[0] - latSmallDelta, latLng[1] + lngSmallDelta],
    //     ],
    //     [
    //         [latLng[0] - latSmallDelta / 2, latLng[1] - lngSmallDelta / 2],
    //         [latLng[0] + latSmallDelta / 2, latLng[1] - lngSmallDelta / 2],
    //         [latLng[0] + latSmallDelta / 2, latLng[1] + lngSmallDelta / 2],
    //         [latLng[0] - latSmallDelta / 2, latLng[1] + lngSmallDelta / 2],
    //     ],
    // ]))([startLatLng[0] + latDelta * 1, startLatLng[1] + lngDelta * 4]);
    // const rectangle = (latLng => L.rectangle([
    //     [latLng[0] - latSmallDelta, latLng[1] - lngSmallDelta],
    //     [latLng[0] + latSmallDelta, latLng[1] + lngSmallDelta],
    // ]))([startLatLng[0], startLatLng[1] + lngDelta * 3]);
    // const polygon = (latLng => L.polygon([
    //     [
    //         [latLng[0] - latSmallDelta, latLng[1] - lngSmallDelta],
    //         [latLng[0] + latSmallDelta, latLng[1] - lngSmallDelta],
    //         [latLng[0] + latSmallDelta, latLng[1] + lngSmallDelta],
    //         [latLng[0] - latSmallDelta, latLng[1] + lngSmallDelta],
    //     ],
    // ]))([startLatLng[0], startLatLng[1] + lngDelta * 4]);
    // const holedPolygon = (latLng => L.polygon([
    //     [
    //         [latLng[0] - latSmallDelta, latLng[1] - lngSmallDelta],
    //         [latLng[0] - latSmallDelta, latLng[1] + lngSmallDelta],
    //         [latLng[0] + latSmallDelta, latLng[1] + lngSmallDelta],
    //         [latLng[0] + latSmallDelta, latLng[1] - lngSmallDelta],
    //     ],
    //     [
    //         [latLng[0] - latSmallDelta / 2, latLng[1] - lngSmallDelta / 2],
    //         [latLng[0] - latSmallDelta / 2, latLng[1] + lngSmallDelta / 2],
    //         [latLng[0] + latSmallDelta / 2, latLng[1] + lngSmallDelta / 2],
    //         [latLng[0] + latSmallDelta / 2, latLng[1] - lngSmallDelta / 2],
    //     ],
    // ]))([startLatLng[0], startLatLng[1] + lngDelta * 5]);
    // const multiPolygon = (latLng => L.polygon([
    //     [
    //         [
    //             [latLng[0] - latSmallDelta, latLng[1] - lngSmallDelta],
    //             [latLng[0] - latSmallDelta, latLng[1]],
    //             [latLng[0], latLng[1]],
    //             [latLng[0], latLng[1] - lngSmallDelta],
    //         ],
    //     ],
    //     [
    //         [
    //             [latLng[0], latLng[1]],
    //             [latLng[0], latLng[1] + lngSmallDelta],
    //             [latLng[0] + latSmallDelta, latLng[1] + lngSmallDelta],
    //             [latLng[0] + latSmallDelta, latLng[1]],
    //         ],
    //     ],
    // ]))([startLatLng[0], startLatLng[1] + lngDelta * 6]);
    // const holedMultiPolygon = (latLng => L.polygon([
    //     [
    //         [
    //             [latLng[0] - latSmallDelta, latLng[1] - lngSmallDelta],
    //             [latLng[0] - latSmallDelta, latLng[1]],
    //             [latLng[0], latLng[1]],
    //             [latLng[0], latLng[1] - lngSmallDelta],
    //         ],
    //         [
    //             [latLng[0] - latSmallDelta / 4 * 3, latLng[1] - lngSmallDelta / 4 * 3],
    //             [latLng[0] - latSmallDelta / 4 * 3, latLng[1] - lngSmallDelta / 4],
    //             [latLng[0] - latSmallDelta / 4, latLng[1] - lngSmallDelta / 4],
    //             [latLng[0] - latSmallDelta / 4, latLng[1] - lngSmallDelta / 4 * 3],
    //         ],
    //     ],
    //     [
    //         [
    //             [latLng[0], latLng[1]],
    //             [latLng[0], latLng[1] + lngSmallDelta],
    //             [latLng[0] + latSmallDelta, latLng[1] + lngSmallDelta],
    //             [latLng[0] + latSmallDelta, latLng[1]],
    //         ],
    //         [
    //             [latLng[0] + latSmallDelta / 4 * 3, latLng[1] + lngSmallDelta / 4 * 3],
    //             [latLng[0] + latSmallDelta / 4 * 3, latLng[1] + lngSmallDelta / 4],
    //             [latLng[0] + latSmallDelta / 4, latLng[1] + lngSmallDelta / 4],
    //             [latLng[0] + latSmallDelta / 4, latLng[1] + lngSmallDelta / 4 * 3],
    //         ],
    //     ],
    // ]))([startLatLng[0], startLatLng[1] + lngDelta * 7]);
    // const markerClusterGroup = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 40 });
    // markerClusterGroup.addLayers(markers);
    // const layers = [
    //     markerClusterGroup,
    //     circleMarker,
    //     circle,
    //     polyline,
    //     multiPolyline,
    //     rectangle,
    //     polygon,
    //     holedPolygon,
    //     multiPolygon,
    //     holedMultiPolygon,
    // ];
    //
    // const featureGroup = L.featureGroup(layers).addTo(map);
    // map.fitBounds(featureGroup.getBounds(), { animate: false });
    //
    // function resetSelectedState() {
    //     map.eachLayer(layer => {
    //         if (layer instanceof L.Marker) {
    //             layer.setIcon(new L.Icon.Default());
    //         } else if (layer instanceof L.Path) {
    //             layer.setStyle({ color: '#3388ff' });
    //         }
    //     });
    //
    //     lassoResult.innerHTML = '';
    // }
    // function setSelectedLayers(layers) {
    //     resetSelectedState();
    //
    //     layers.forEach(layer => {
    //         if (layer instanceof L.Marker) {
    //             layer.setIcon(new L.Icon.Default({ className: 'selected '}));
    //         } else if (layer instanceof L.Path) {
    //             layer.setStyle({ color: '#ff4620' });
    //         }
    //     });
    //
    //     lassoResult.innerHTML = layers.length ? `Selected ${layers.length} layers` : '';
    // }
    //
    // map.on('mousedown', () => {
    //     resetSelectedState();
    // });
    // map.on('lasso.finished', event => {
    //     setSelectedLayers(event.layers);
    // });
    // map.on('lasso.enabled', () => {
    //     lassoEnabled.innerHTML = 'Enabled';
    //     resetSelectedState();
    // });
    // map.on('lasso.disabled', () => {
    //     lassoEnabled.innerHTML = 'Disabled';
    // });
    //
    // toggleLasso.addEventListener('click', () => {
    //     if (lassoControl.enabled()) {
    //         lassoControl.disable();
    //     } else {
    //         lassoControl.enable();
    //     }
    // });
    // contain.addEventListener('change', () => {
    //     lassoControl.setOptions({ intersect: intersect.checked });
    // });
    // intersect.addEventListener('change', () => {
    //     lassoControl.setOptions({ intersect: intersect.checked });
    // });




    // let coords = [];
    // function onEachFeature1(feature, layer) {
    //     var popupContent = "" + feature.geometry.coordinates
    //
    //     // if (feature.properties && feature.properties.popupContent) {
    //     //     popupContent += feature.properties.popupContent;
    //     // }
    //     if (flag === 1){
    //         coords.push({data:feature.geometry.coordinates});
    //     }
    //     layer.bindPopup(popupContent);
    // }
    // function onEachFeature(feature, layer) {
    //     var popupContent = "" + feature.geometry.coordinates
    //
    //     // if (feature.properties && feature.properties.popupContent) {
    //     //     popupContent += feature.properties.popupContent;
    //     // }
    //
    //     layer.bindPopup(popupContent);
    // }
    //
    //     let type_list = type;
    // let radius_mm = radius;
    //
    // let testData = {
    //     max: 13,

    // };
    //
    //
    // let cfg = {
    //     // radius should be small ONLY if scaleRadius is true (or small radius is intended)
    //     // if scaleRadius is false it will be the constant radius used in pixels
    //     "radius": 0.003,
    //     "maxOpacity": .6,
    //     // scales the radius based on map zoom
    //     "scaleRadius": true,
    //     // if set to false the heatmap uses the global maximum for colorization
    //     // if activated: uses the data maximum within the current map boundaries
    //     //   (there will always be a red spot with useLocalExtremas true)
    //     "useLocalExtrema": true,
    //     // which field name in your data represents the latitude - default "lat"
    //     latField: 'lat',
    //     // which field name in your data represents the longitude - default "lng"
    //     lngField: 'lng',
    //     // which field name in your data represents the data value - default "value"
    //     valueField: 'count'
    // };
    //
    //
    // let heatmapLayer = new HeatmapOverlay(cfg);
    // heatmapLayer.setData(testData);
    // let baseLayer = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    //     maxZoom: 13,
    //     attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
    //         '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    //         'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    //     id: 'mapbox/streets-v11',
    //     tileSize: 512,
    //     zoomOffset: -1
    // })

    // if (flag ===1) {
    //     mymap = new L.Map(id, {
    //         center: new L.LatLng(22.75190354731786, 113.91390510319258),
    //         zoom: 13,
    //
    //     });
    // }
    
    // let pi = L.geoJSON(pipes, {
    //
    //     // filter: function (feature, layer) {
    //     //     if (feature.properties) {
    //     //         // If the property "underConstruction" exists and is true, return false (don't render features under construction)
    //     //         return feature.properties.underConstruction !== undefined ? !feature.properties.underConstruction : true;
    //     //     }
    //     //     return false;
    //     // },
    //     style: function (feature) {
    //         feature.properties.PIPE_MM
    //         switch (feature.properties.PIPE_KIND) {
    //             case '钢筋混凝土管': {
    //                 if (type_list.indexOf('钢筋混凝土管') !== -1 && feature.properties.PIPE_MM <= radius_mm)
    //                     return {color: '#002aff', weight: 4}
    //                 else
    //                     return {opacity: 0}
    //             }
    //             case '球墨铸铁管': {
    //                 if (type_list.indexOf('球墨铸铁管') !== -1 && feature.properties.PIPE_MM <= radius_mm)
    //                     return {color: '#ff001e', weight: 4}
    //                 else
    //                     return {opacity: 0}
    //             }
    //             case '钢管': {
    //                 if (type_list.indexOf('钢管') !== -1 && feature.properties.PIPE_MM <= radius_mm)
    //                     return {color: '#ecc606', weight: 4}
    //                 else
    //                     return {opacity: 0}
    //             }
    //             case 'NULL': {
    //                 if (type_list.indexOf('NULL') !== -1 && feature.properties.PIPE_MM <= radius_mm)
    //                     return {color: '#e600ff', weight: 4}
    //                 else
    //                     return {opacity: 0}
    //             }
    //             case 'PE管': {
    //                 if (type_list.indexOf('PE管') !== -1 && feature.properties.PIPE_MM <= radius_mm)
    //                     return {color: '#44ff00', weight: 4}
    //                 else
    //                     return {opacity: 0}
    //             }
    //             default: {
    //                 if (feature.properties.PIPE_MM <= radius_mm)
    //                     return {color: '#ff7700', weight: 4}
    //             }
    //         }
    //     },
    //     onEachFeature: onEachFeature
    // });
    // let po = L.geoJSON(points, {
    //     style: function (feature) {
    //         return feature.properties && feature.properties.style;
    //     },
    //
    //     onEachFeature: onEachFeature1,
    //
    //     pointToLayer: function (feature, latlng) {
    //         return L.circleMarker(latlng, {
    //             radius: 3,
    //             fillColor: "#0a0a0a",
    //             color: "#000",
    //             weight: 1,
    //             opacity: 1,
    //             fillOpacity: 0.8
    //         });
    //     }
    // });
    // // console.log(points.features.geometry.coordinates);
    // mymap.eachLayer(function(layer){
    //     mymap.removeLayer(layer);
    // });

    // mymap.addLayer(pi);
    // mymap.addLayer(po);
    // mymap.addLayer(heatmapLayer);
    // return map;
// };

// let DrawFace= function (id) {
// 	this.id = id
//     this.svgWidth = $('#' + id).width()
//     this.svgHeight = $('#' + id).height()
//     this.margin = { top: 50, right: 100, bottom: 10, left: 100 }
//     this.width = this.svgWidth - this.margin.left - this.margin.right
//     this.height = this.svgHeight - this.margin.top - this.margin.bottom

//     this.svg = d3.select('#' + id).append('svg')
//         .attr('class', 'statisticSvg')
//         .attr('width', this.svgWidth)
// 		.attr('height', this.svgHeight)

// 	this.graphContainer = this.svg.append('g')
// 		.attr('class', 'g_main')
//         .attr('transform', 'translate(' + this.margin.left + ', ' + this.margin.top + ')')

//     this.emotionList = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
//     this.emotionListAll = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral', 'empty']

//     // origin happy <=> angry
//     this.emotionColorRange = {
//         'angry': '#fe6271',
//         'disgust': '#aa81f3',
//         'fear': '#45b0e2',
//         'happy': '#fbca35',
//         'neutral': '#bdbdbd',
//         'sad': '#4667cc',
//         'surprise': '#3ec845'
//     }

//     this.poseList = ['closePostures', 'openArms', 'openPostures']
//     this.poseListAll = ['closePostures', 'openArms', 'openPostures', 'empty']

//     this.poseColorRange = {
//         'closePostures': '#1967A1',
//         'openArms': '#B31515',
//         'openPostures': '#F49445'
//     }

//     // Close postures owing to overlapping hand key points.
//     // Open arms since both the elbow points cross the torso region and wrist points go outermost.
//     // Open postures as the hands fall in the torso region.

// }

// DrawFace.prototype.layout = function (data) {
//     console.log('draw Face data: ', data)  /* eslint-disable-line */
//     let faceInfo = data['face_info'].map((frameFaceInfo) => {
//         if (frameFaceInfo['face_info'].length > 0) {
//             return frameFaceInfo['face_info'][0]['emotion']
//         } else {
//             return 'empty'
//         }
//     })
//     // console.log('faceInfo: ', faceInfo)

//     function judgePose (cocoPart) {
//         // console.log('cocoPart: ', cocoPart)
//         const distance = (x0, y0, x1, y1) => Math.hypot(x1 - x0, y1 - y0)

//         let Rwrist = cocoPart[4]
//         let LWrist = cocoPart[7]
//         let RElbow = cocoPart[3]
//         let LElbow = cocoPart[6]
//         let RShoulder = cocoPart[2]
//         let LShoulder = cocoPart[5]

//         let wristDistance = 0
//         let elbowDistance = 0
//         let shoulderDistance = 0
//         try {
//             wristDistance = distance(Rwrist[0], Rwrist[1], LWrist[0], LWrist[1])
//             elbowDistance = distance(RElbow[0], RElbow[1], LElbow[0], LElbow[1])
//             shoulderDistance = distance(RShoulder[0], RShoulder[1], LShoulder[0], LShoulder[1])
//         } catch {
//             return 'empty'
//         }

//         if (wristDistance < 0.2) {
//             return 'closePostures'
//         } else if (elbowDistance > elbowDistance && elbowDistance > shoulderDistance) {
//             return 'openArms'
//         } else if (wristDistance < elbowDistance) {
//             return 'openPostures'
//         } else {
//             return 'empty'
//         }
//     }

//     let poseInfo = data['pose_info'].map((framePoseInfo) => {
//         if (framePoseInfo['pose_info'].length > 0) {
//             return judgePose(framePoseInfo['pose_info'][0])
//         } else {
//             return 'empty'
//         }
//     })

//     // console.log('poseInfo: ', poseInfo)

//     // emotion
//     let emotionCount = this.emotionListAll.reduce(function(accumulator, currentValue) {
//         accumulator[currentValue] = 0
//         return accumulator
//     }, {})

//     for (let i=0; i<faceInfo.length; i++) {
//         emotionCount[faceInfo[i]] += 1
//     }

//     // let maxEmotionKey = 'empty'
//     let maxEmotionValue = 0
//     for (let emotionKey in emotionCount) {
//         if (emotionCount[emotionKey] > maxEmotionValue) {
//             maxEmotionValue = emotionCount[emotionKey]
//             // maxEmotionKey = emotionKey
//         }
//     }

//     let widthEmotion = this.width / 3
//     let heightEmotion = this.height

//     let xScaleEmotion = d3.scaleLinear()
//             .domain([0, maxEmotionValue])
//             .range([0, widthEmotion])

//     let yScaleEmotion = d3.scaleBand()
//         .domain(this.emotionListAll)
//         .range([0, heightEmotion])
//         .padding(0.1)

//     let emotionContainer = this.graphContainer.append('g').attr('class', 'emotion')
//     emotionContainer.append('g').attr('class', 'barchart')
//         .selectAll()
//         .data(this.emotionListAll)
//         .enter()
//         .append('rect')
//         .attr('x', 0)
//         .attr('y', (emotion) => yScaleEmotion(emotion))
//         .attr('width', (emotion) => xScaleEmotion(emotionCount[emotion]))
//         .attr('height', yScaleEmotion.bandwidth())
//         .style('fill', (emotion) => this.emotionColorRange[emotion])

//     emotionContainer.append('g').attr('class', 'x-axis')
//         .attr('transform', 'translate(' + 0 + ',0)')
//         .call(d3.axisTop(xScaleEmotion).ticks(5))

//     emotionContainer.append('g').attr('class', 'y-axis')
//         .attr('transform', 'translate(' + 0 + ',0)')
//         .call(d3.axisLeft(yScaleEmotion))

//     // pose
//     let poseCount = this.poseListAll.reduce(function(accumulator, currentValue) {
//         accumulator[currentValue] = 0
//         return accumulator
//     }, {})

//     for (let i=0; i<poseInfo.length; i++) {
//         poseCount[poseInfo[i]] += 1
//     }
//     // let poseCount = {
//     //     'closePostures': 20,
//     //     'openArms': 30,
//     //     'openPostures':10,
//     //     'empty': 0
//     // }

//     // let maxPoseKey = 'empty'
//     let maxPoseValue = 0
//     for (let poseKey in poseCount) {
//         if (poseCount[poseKey] > maxPoseValue) {
//             maxPoseValue = poseCount[poseKey]
//             // maxPoseKey = poseKey
//         }
//     }

//     let widthPose = this.width / 3
//     let heightPose = this.height

//     let xScalePose = d3.scaleLinear()
//             .domain([0, maxPoseValue])
//             .range([0, widthPose])

//     let yScalePose = d3.scaleBand()
//         .domain(this.poseListAll)
//         .range([0, heightPose])
//         .padding(0.1)

//     let poseContainer = this.graphContainer.append('g').attr('class', 'pose')
//         .attr('transform', 'translate(' + (2 * this.width / 3) + ', ' + 0 + ')')
//     poseContainer.append('g').attr('class', 'barchart')
//         .selectAll()
//         .data(this.poseListAll)
//         .enter()
//         .append('rect')
//         .attr('x', 0)
//         .attr('y', (pose) => yScalePose(pose))
//         .attr('width', (pose) => xScalePose(poseCount[pose]))
//         .attr('height', yScalePose.bandwidth())
//         .style('fill', (pose) => this.poseColorRange[pose])

//     poseContainer.append('g').attr('class', 'x-axis')
//         .attr('transform', 'translate(' + 0 + ',0)')
//         .call(d3.axisTop(xScalePose).ticks(5))

//     poseContainer.append('g').attr('class', 'y-axis')
//         .attr('transform', 'translate(' + 0 + ',0)')
//         .call(d3.axisLeft(yScalePose))

// }

// export default init;



