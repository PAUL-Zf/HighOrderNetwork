import Vue from 'vue'

var pipeService = new Vue({
    data: {
        COLLECTION2VIDEO: 'collection_2_video',
        SELECTVIDEO: 'select_video',
        VISIONDATA: 'vision_data',
        AUDIODATA: 'audio_data',
        TEXTDATA: 'text_data',
        FRAMETIME: 'frame_time'
    },
    methods: {
        emitCollection2Video: function (msg) {
            this.$emit(this.COLLECTION2VIDEO, msg)
        },
        onCollection2Video: function (callback) {
            this.$on(this.COLLECTION2VIDEO, function (msg) {
                callback(msg)
            })
        },
        emitSelectVideo: function (msg) {
            this.$emit(this.SELECTVIDEO, msg)
        },
        onSelectVideo: function (callback) {
            this.$on(this.SELECTVIDEO, function (msg) {
                callback(msg)
            })
        },
        emitVisionData: function (msg) {
            this.$emit(this.VISIONDATA, msg)
        },
        onVisionData: function (callback) {
            this.$on(this.VISIONDATA, function (msg) {
                callback(msg)
            })
        },
        emitAudioData: function (msg) {
            this.$emit(this.AUDIODATA, msg)
        },
        onAudioData: function (callback) {
            this.$on(this.AUDIODATA, function (msg) {
                callback(msg)
            })
        },
        emitTextData: function (msg) {
            this.$emit(this.TEXTDATA, msg)
        },
        onTextData: function (callback) {
            this.$on(this.TEXTDATA, function (msg) {
                callback(msg)
            })
        },
        emitFrameTime: function (msg) {
            this.$emit(this.FRAMETIME, msg)
        },
        onFrameTime: function (callback) {
            this.$on(this.FRAMETIME, function (msg) {
                callback(msg)
            })
        }

        
    }
})

export default pipeService
