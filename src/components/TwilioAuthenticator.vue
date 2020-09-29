<template>
    <div class="twilio-authenticator">
        <div class="drag" @dragenter.capture="dragEnter" @dragover.capture="dragOver" @dragleave.capture="dragLeave" @drop.capture="dropEvent">
            <div v-if="!drop && !drag">
                <span >Drag and Drop the "File" over here (.cred)</span>
                <input ref="file_input" type="file" @input="set_credentials">
                <button @click="open_file_dialog">Choose File</button>
            </div>
            <div v-if="drag" >
                <span>Wha? Huh??</span>
            </div>
            <div v-if="!drag && drop">
                <div v-if="valid">
                    <span>Credential File Accepted!</span>
                    <p>You can join the Room now. Go ahead and Enjoy!</p>
                    <button @click="giveAnotherChance">Submit another File</button>
                </div>
                <div v-if="!valid">
                    <span>Credential File Not Valid</span>
                    <p>You need to give the .cred file with the right information</p>
                    <button @click="giveAnotherChance">Submit another File</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
const { ipcRenderer, remote } = require("electron");

export default {
    data: function() {
        return {
            credentials: null,
            drag: false,
            drop: false,
            valid: false
        };
    },
    methods: {
        dragEnter: function(event) {
            event.preventDefault();
            this.drag = true;
        },
        dragOver: function(event) {
            event.preventDefault();
        },
        dropEvent: async function(event) {
            event.preventDefault();
            await handleFile.call(this, event.dataTransfer.files[0]);
        },
        dragLeave: function(event) {
            this.drag = false;
        },
        open_file_dialog: function() {
            this.$refs.file_input.click();
        },
        set_credentials: async function(event) {
            event.preventDefault();
            await handleFile.call(this, event.target.files[0]);
        },
        giveAnotherChance: function() {
            this.drag = false;
            this.drop = false;
            this.valid = false;
        }
    },
    async mounted() {
        const config = remote.require("./modules/config-loader");
        const credentials = await config.load();
        if (!credentials) {
            return;
        }
        const file = new File([JSON.stringify(credentials)], "dev.cred", {
            type: "text/plain",
        });
        await handleFile.call(this, file);
    }
};

async function handleFile(file) {
    this.credentials = await getFileContent(file);
    if (this.credentials) {
        if (this.credentials.acc_sid && this.credentials.api_key && this.credentials.api_sec) {
            this.valid = true;
            setCredentials(this.credentials);
        }
        else {
            this.valid = false;
        }
    }
    this.drag = false;
    this.drop = true;
}

async function getFileContent(file) {
    return new Promise((res, rej)=>{
        let valid = file.name.match(/\.cred$/);
        if (valid) {
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    let j = JSON.parse(e.target.result);
                    res(j);
                }
                catch(e) {
                    res(null);
                }
            };
            reader.readAsText(file);
        }
        else {
            res(null);
        }
    });
}

function setCredentials(credentials) {
    ipcRenderer.send("set_twilio_credentials", credentials);
}
</script>

<style>
.twilio-authenticator .drag {
    padding: 50px 20px;
    /* background: linear-gradient(to top right, #d01095, #5e349a); */
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
}
.twilio-authenticator .drag * {
    pointer-events: none;
}
.twilio-authenticator .drag p {
    font-size: 0.83rem;
}

.twilio-authenticator .drag button {
    pointer-events: visible;
}
.twilio-authenticator .drag span{
    display: inline-block;
    text-align: center;
    font-size: 1.1rem;
    font-weight: 700;
    color: #666;
    margin-bottom: 10px;
}
.twilio-authenticator .drag input[type='file'] {
    display: none;
}

.twilio-authenticator button {
    padding: 10px 30px;
    font-size: 0.8rem;
    color: #fff;
    background: #1976d2;
    font-weight: 400;
    text-transform: uppercase;
    border: none;
    margin-top: 20px;
    border-radius: 3px;
    transition: all 0.3s;
    cursor: pointer;
}
.twilio-authenticator button:hover {
    background: #2196f3;
}
</style>
