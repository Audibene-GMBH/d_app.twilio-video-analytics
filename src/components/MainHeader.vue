<template>
    <header>
        <div class="main-logo">
            <span class="main">audibene | Teleaudiology Lab</span>
        </div>
        <span class="console">
            <img src="../assets/icons/console.svg" @click="toggleDevTools">
        </span>
        <span class="console">
            <img src="../assets/icons/internals.png" @click="toggleWebrtcInternals">
        </span>
    </header>
</template>

<style scoped>
header {
    padding: 20px 50px;
    display: grid;
    grid-template-columns: 2fr 1fr 40px;
    grid-template-areas: "a b c";
    background: #fff;
}
.main-logo {
    display: flex;
    flex-flow: column;
}
.console {
    display: block;
    width: 100%;
    text-align: right;
}
.console img {
    height: 100%;
}
span {
    display: block;
}
span:last-child {
    margin-top: 3px;
}
.main {
    font-weight: 400;
    font-size: 1.2rem;
    color: #334;
}
</style>

<script>
const { remote } = require("electron");
export default {
    methods: {
        toggleDevTools: () => {
            remote.getCurrentWebContents().toggleDevTools();
        },
        toggleWebrtcInternals: () => {
            const webrtcInternals = remote.getCurrentWindow().getChildWindows().find((win) => {
               return /webrtc/ig.test(win.title);
            });
            if (!webrtcInternals) {
                return;
            }
            webrtcInternals.isVisible() ? webrtcInternals.hide() : webrtcInternals.show();
        },
    }
}
</script>
