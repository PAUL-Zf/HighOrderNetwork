/* global d3 $ */
// import List from 'list.js'
// import pipeService from '../../service/pipeService'
// import globalConfig from '../../service/globalConfig'
const Tabulator = require('tabulator-tables')
import './tabulator.min.css'

let DrawText= function (id) {	
	this.id = id
    this.divWidth = $('#' + id).width()
    this.divHeight = $('#' + id).height()
    // this.margin = { top: 50, right: 100, bottom: 10, left: 100 }
    // this.width = this.divWidth - this.margin.left - this.margin.right
    // this.height = this.divHeight - this.margin.top - this.margin.bottom

    this.svg = d3.select('#' + id).append('div')
        .attr('id', 'sentence-table')
}



export default DrawText