<template>
    <div class="layout default">
        <MainHeader/>
        <div class="content">
            <TwilioVideo/>
        </div>
    </div>
</template>

<script>
import MainHeader from "../components/MainHeader.vue"
import TwilioVideo from "../pages/TwilioVideo.vue"

export default {
    components: { MainHeader, TwilioVideo }
}
</script>