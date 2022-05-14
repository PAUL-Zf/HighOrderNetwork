<template src='./StateView.html'></template>

<script src='./StateView.js'></script>

<style scoped>
    .card {
        margin-bottom: 0px;
        /* height: 400px; */
        border-radius: 5px;
    }

    .card-header {
        font-size: 12px;
        padding: 6px 12px;
        height: 36px;
        background-color: white;
    }

    .card-block {
        padding: 0px;
        position: relative;
    }

    text {
        font-weight: 300;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serf;
        font-size: 14px;
    }

    #audioContainer {
        /* height: 243px; */
        height: 262px;
    }

    #audioGraph {
        /* height: 243px; */
        height: 350px;
    }

    div.tooltip {
        position: absolute;
        text-align: center;
        width: 100px;
        height: 28px;
        padding: 2px;
        font: 8px sans-serif;
        background: lightsteelblue;
        border: 0px;
        border-radius: 8px;
        pointer-events: none;
    }

</style>
