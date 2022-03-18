/* eslint-disable no-console */
import axios from 'axios'
// import dataService from "@/service/dataService";
const GET_REQUEST = 'get'
const POST_REQUEST = 'post'
const dataServerUrl = 'http://127.0.0.1:8888'
import Vue from 'vue'
import VueResource from 'vue-resource'
Vue.use(VueResource)
// const $http = Vue.http;
function request(url, params, type, callback) {
    let func
    if (type === GET_REQUEST) {
        func = axios.get
    } else if (type === POST_REQUEST) {
        func = axios.post
    }

    func(url, params).then((response) => {
        if (response.status === 200) {
            callback(response)

        } else {
            console.error(response) /* eslint-disable-line */
        }
    })
    .catch((error) => {
        console.error(error) /* eslint-disable-line */
    })
}

function initialization(videoId, callback) {
    const url = `${dataServerUrl}/initialization/${videoId}`
    const params = {}
    request(url, params, GET_REQUEST, callback)
}

function poseData(videoId, callback) {
    const url = `${dataServerUrl}/pose/${videoId}`
    const params = {}
    request(url, params, GET_REQUEST, callback)
}

function videoInfo(videoId, callback) {
    const url = `${dataServerUrl}/videoInfo/${videoId}`
    const params = {}
    request(url, params, GET_REQUEST, callback)
}

function visionData(videoId, callback) {
    const url = `${dataServerUrl}/vision/${videoId}`
    const params = {}
    request(url, params, GET_REQUEST, callback)
}

// 初始化获取所有users
function getAllUsers(callback){
    const url = `${dataServerUrl}/getAllUsers`
    const params = {}
    request(url, params, GET_REQUEST, callback)
}

// 根据userId获取对应的有效dates
function getDatesByUser(userId, callback){
    const url = `${dataServerUrl}/getDatesByUser/${userId}`
    const params = {}
    request(url, params, GET_REQUEST, callback)
}

// 根据 userId和date 显示对应用户在对应日期的所有点
function display(userId, date, callback){
    const url = `${dataServerUrl}/display/${userId}/${date}`
    const params = {}
    request(url, params, GET_REQUEST, callback)
}

/*
     Pass start time and time length to the backend
     start: the slot index of start time (int)
     time length: the slots number of time period (int)
*/
function getHighOrder (start, period, region, type, callback) {
    const url = `${dataServerUrl}/getHighOrder/${start}/${period}/${region}/${type}`
    const params = {}
    request(url, params, GET_REQUEST, callback)
}

// 取 VanAreasMap geoJson数据
function getVanAreasMap(entropy, callback){
    const url = `${dataServerUrl}/getVanAreasMap/${entropy}`
    const params = {}
    request(url, params, GET_REQUEST, callback)
}

// 取 map geoJson数据
function getMap(callback){
    const url = `${dataServerUrl}/getMap`
    const params = {}
    request(url, params, GET_REQUEST, callback)
}

// 取 map region flow数据
function getRegionFlow(date, callback){
    const url = `${dataServerUrl}/getRegionFlow/${date}`
    const params = {}
    request(url, params, GET_REQUEST, callback)
}

function getOverview(type, callback){
    const url = `${dataServerUrl}/getOverview/${type}`
    const params = {}
    request(url, params, GET_REQUEST, callback)
}

// 根据 date和region 获取对应region的 in and out流量数据
function getRegionInOut(date, region, callback){
    const url = `${dataServerUrl}/getRegionInOut/${date}/${region}`
    const params = {}
    request(url, params, GET_REQUEST, callback)
}

function audioData(videoId, interval, sliding_speed, callback) {
    const url = `${dataServerUrl}/audio/${videoId}/${interval}/${sliding_speed}`
    const params = {}
    request(url, params, GET_REQUEST, callback)
}

function textData(videoId, callback) {
    const url = `${dataServerUrl}/text/${videoId}`
    const params = {}
    request(url, params, GET_REQUEST, callback)
}
// function fetchLassoedDataPost(lassoedData, callback) {
//     const url = `${dataServerUrl}/fetchLassoedDataPost`
//     console.log('Overview: run function fetchOverviewDataPost()')
//     $http.post(url, {
//         lassoedData: lassoedData
//     }).then(response => {
//         callback(response.data)
//     }, errResponse => {
//         console.log(errResponse)
//     })
// }
function fetchRoadDataPost1(params,callback) {
    const url = `${dataServerUrl}/fetchroaddata1`

    request(url,params, POST_REQUEST, callback)
    console.log(callback)
    // console.log('Overview: run function fetchOverviewDataPost()')
    // $http.post(url, {
    // }).then(response => {
    //     callback(response.data)
    // }, errResponse => {
    //     console.log(errResponse)
    // })
}
function fetchRoadDataPost2(params,callback) {
    const url = `${dataServerUrl}/fetchroaddata2`

    request(url,params, POST_REQUEST, callback)
    console.log(callback)
    // console.log('Overview: run function fetchOverviewDataPost()')
    // $http.post(url, {
    // }).then(response => {
    //     callback(response.data)
    // }, errResponse => {
    //     console.log(errResponse)
    // })
}
function fetchRoadDataPost3(params,callback) {
    const url = `${dataServerUrl}/fetchroaddata3`

    request(url,params, POST_REQUEST, callback)
    console.log(callback)
    // console.log('Overview: run function fetchOverviewDataPost()')
    // $http.post(url, {
    // }).then(response => {
    //     callback(response.data)
    // }, errResponse => {
    //     console.log(errResponse)
    // })
}
function fetchnode(callback) {
    const url = `${dataServerUrl}/static/final_back.json`

    request(url,{}, GET_REQUEST, callback)
    // console.log(callback)
    // console.log('Overview: run function fetchOverviewDataPost()')
    // $http.post(url, {
    // }).then(response => {
    //     callback(response.data)
    // }, errResponse => {
    //     console.log(errResponse)
    // })
}
export default {
    dataServerUrl,
    initialization,
    videoInfo,
    poseData,
    visionData,
    audioData,
    textData,
    fetchRoadDataPost1,
    fetchRoadDataPost2,
    fetchRoadDataPost3,
    fetchnode,
    // fetchLassoedDataPost

    // new project
    getAllUsers,
    getDatesByUser,
    display,
    getHighOrder,
    getVanAreasMap,
    getOverview,
    getRegionFlow,
    getRegionInOut,
    getMap
}
