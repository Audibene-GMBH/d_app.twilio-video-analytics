<template>
    <div ref="viewer" class="media-viewer" v-if="active">

    </div>
</template>

<script>
export default {
    data: function() {
        return {
            active: false,
            media_type: null
        };
    },

    methods: {
        show_media_viewer: show_media_viewer
    }
}

function show_media_viewer(show = false) {
    if (show) {
        this.$refs.viewer.classList.add("active");
    } else {
        this.$refs.viewer.classList.remove("active");
    }
}
</script>

<style>
.media-viewer {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #eee;
}
</style>
