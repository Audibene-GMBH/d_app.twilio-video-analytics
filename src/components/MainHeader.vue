<template>
    <header>
        <div class="main-logo">
            <span class="main">audibene | Teleaudiology Lab</span>
        </div>
        <span class="console">
            <img src="../assets/icons/console.svg">
        </span>
    </header>
</template>


<style scoped>
header {
    padding: 20px 50px;
    display: grid;
    grid-template-columns: max-content auto;
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
.main {
    font-weight: 400;
    font-size: 1.2rem;
    color: #334;
}
</style>