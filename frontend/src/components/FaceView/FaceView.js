/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-console */
import  {getGroup} from './drawFace.js'
import 'leaflet/dist/leaflet.css'
import dataService from "@/service/dataService";
import L from "leaflet";
import {bounds, layerGroup} from "leaflet/dist/leaflet-src.esm";
import "leaflet.markercluster"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import "leaflet.markercluster/dist/leaflet.markercluster"
// import dataService from "@/service/dataService";
// import * as Json from "acorn";
// import dataService from '../../service/dataService.js'
// import * as d3Lasso from 'd3-lasso/build/d3-lasso.min.js';
// import * as d3 from "d3";
// import pipeService from '../../service/pipeService.js'

import movingMarker from './MovingMarker'

export default {
    name: 'FaceView',
    components: {},
    data() {
        return {
            // new project
            content: [],
            mymap: null,
            bounds:0,
            layerGroups:new L.FeatureGroup(),
            direction : [[0,1],[1,0],[-1,0],[0,-1],[-1,1],[1,-1],[1,1],[-1,-1],]
        }
    },

    props: ['user', 'date'],

    watch: {

        user(val) {
            dataService.display(this.user, this.date, response => {
                console.log(response.data);
                this.content = response.data;
            })
        },

        date(val) {
            dataService.display(this.user, this.date, response => {
                console.log("in face view")
                console.log(response.data);
                this.content = response.data;
            })
        },

        // update trajectory
        content(val) {
            //clear all circles in origin map
            // this.mymap.eachLayer(layer => {
            //     if (layer instanceof L.Circle){
            //         this.mymap.removeLayer(layer);
            //     }
            //     if (layer instanceof L.Polyline){
            //         this.mymap.removeLayer(layer);
            //     }
            // })

            let traj = [];
            // display all points
            for(let i = 0; i < this.content.length; i++){
                let node = this.content[i];
                let point = [node[2], node[3]];
                traj.push(point);
            }

            let latlngs = [[40.726057, -73.991733], [40.74195650925749, -74.00483627296967],
                [40.74285240592211, -74.00749891494839], [40.742746131478135, -74.00865233240317],
                [40.738, -74.013], [40.735, -74.014], [40.71509485589921, -74.01641620013078], [40.701593743002, -73.99592399597168],
                [40.74040459976035, -73.97232055664062]
            ]

            // display all lines
            let polyline = L.polyline(latlngs, {
                color: '#5f3c23',
                weight: 6,
            }).addTo(this.mymap);

            // display larger circle
            for(let i = 0; i < traj.length; i++){
                L.circle(traj[i], {
                    stroke: false,
                    radius: 300,
                    fillOpacity: 1.0,
                    fillColor: '#5f3c23'
                }).addTo(this.mymap);
            }

            // display smaller circle
            for(let i = 0; i < traj.length; i++){
                L.circle(traj[i], {
                    weight: 0.5,
                    radius: 45,
                    color: 'black',
                    fillOpacity: 1.0,
                    fillColor: '#d3d7d4'
                }).addTo(this.mymap);
            }

            this.mymap.fitBounds(polyline.getBounds())
        },

        bounds: function (newQuestion, oldQuestion) {
            // this.layerGroups = getGroup()
            this.layerGroups.clearLayers()
            let a = Math.random()* 4
            a = Math.floor(a)
            let b;
            b = []
            for (let i = 0; i < a; i++) {
                b[i] = Math.floor(Math.random()*7);
            }
        }

    },

    mounted: function () {
        // this.drawFace = new
        // DrawFace('mapDiv', this.radius);
        this.mymap = this.init('mapDiv')
        console.log(this.mymap)
        this.mymap.on('dragend',()=> {
            this.bounds = this.mymap.getBounds();
            // console.log('drag end')
        })
        console.log("this mounted: " +this)

    },
    methods: {
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

            let baseLayer = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
                maxZoom: 20,
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                id: 'mapbox/streets-v11',
                tileSize: 512,

                zoomOffset: -1
            })
            let map = new L.map(id, {
                center: new L.LatLng(40.7143528, -74.0079731),
                zoom: 11,
                preferCanvas: true
            });
            console.log('in draw')
            this.layerGroups.addTo(map)

            // create another trajectory
            let traj = [[40.735614, -74.007132],[40.7679124817876, -73.98507762454408],
                [40.77143374050618, -73.98247003555298],[40.726121, -73.992822]];

            // display all lines
            let polyline = L.polyline(traj, {
                color: '#008792',
                weight: 6,
            }).addTo(map);

            // display larger circle
            for(let i = 0; i < traj.length; i++){
                L.circle(traj[i], {
                    stroke: false,
                    radius: 400,
                    fillOpacity: 1.0,
                    fillColor: '#008792'
                }).addTo(map);
            }

            // display smaller circle
            for(let i = 0; i < traj.length; i++){
                L.circle(traj[i], {
                    weight: 0.5,
                    radius: 45,
                    color: 'black',
                    fillOpacity: 1.0,
                    fillColor: '#d3d7d4'
                }).addTo(map);
            }

            map.fitBounds(polyline.getBounds());

            // const lassoControl =
            map.addLayer(baseLayer);
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
