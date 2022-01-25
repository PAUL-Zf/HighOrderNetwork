<template src='./TextView.html'></template>

<script src='./TextView.js'></script>



<style>
    .card {
        margin-bottom: 1px;
        /* height: 400px; */
        border-radius: 5px;
    }

    .card-header {
        font-size: 12px;
        padding: 6px 12px;
        height: 36px;
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

    #textContainer {
        height: 450px;
        overflow-y: auto;
    }
    #mapDiv {
      width: 100%;
      height: 100%;
    }
    .lasso path {
      stroke: rgb(80,80,80);
      stroke-width:2px;
    }

    .lasso .drawn {
      fill-opacity:.05 ;
    }

    .lasso .loop_close {
      fill:none;
      stroke-dasharray: 4,4;
    }

    .lasso .origin {
      fill:#3399FF;
      fill-opacity:.5;
    }

</style>
