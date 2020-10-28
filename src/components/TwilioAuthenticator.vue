<template>
    <div class="twilio-authenticator">
        <div class="mode-selector">
            <p>Select from the following options</p>
            <div class="ip-section">
                <input type="radio" id="mode-rfs" name="mode" v-model="mode" value="rfs">
                <label for="mode-rfs">Be part of a Call</label>
            </div>
            <div class="ip-section">
                <input type="radio" id="mode-custom" name="mode" v-model="mode" value="custom">
                <label for="mode-custom">Test Twilio APIs</label>
            </div>
        </div>
        <div class="rfs-options" v-if="mode ==='rfs'">
            <div>
                <label>Environment</label>
                <select v-model="env">
                    <option selected value="development">Development</option>
                    <option value="testing">Testing</option>
                    <option value="staging">Staging</option>
                    <option value="production" disabled>Production</option>
                </select>
            </div>
            <div>
                <label>User Name</label>
                <input type="text" v-model="fitter_user">
            </div>
            <div>
                <label>Password</label>
                <input type="password" v-model="fitter_password">
            </div>
            <div>
                <label>Fitting ID</label>
                <input type="text" v-model="fitting_id">
            </div>
            <button @click="getCallDetails">get Call Details</button>
        </div>
        <div class="drag" v-if="mode === 'custom'" @dragenter.capture="dragEnter" @dragover.capture="dragOver" @dragleave.capture="dragLeave" @drop.capture="dropEvent">
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
import { ipcRenderer, remote } from "electron";

export default {
    data: function() {
        return {
            mode: "rfs",
        
            env: 'development',
            fitter_user: "",
            fitter_password: "",
            fitting_id: "",

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
        },
        getCallDetails: async function() {
            this.$emit("new-session-information", await getCallDetails(this.fitter_user, this.fitter_password, this.fitting_id));
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
    },
    watch: {
        mode: function(new_value) {
            this.$emit("mode-changed", new_value);
        },
        env: function(new_value) {
            ipcRenderer.send("set_config_env", new_value);
        }
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

function getCallDetails(username, password, fitting_id) {
    return new Promise((res, rej) => {
        ipcRenderer.once("get_auth_token", async (e, access_token) => {
            const fitting_details = await getFittingDetails(access_token, fitting_id);
            res(fitting_details);
        });
        ipcRenderer.send("get_auth_token", {username, password});
    });
}

async function getFittingDetails(access_token, fitting_id) {
    const response = await fetch(`${ipcRenderer.sendSync("get_config_object").cockpit}v1/fittings/${fitting_id}`, {
        headers: new Headers({
            authorization: access_token ? `Bearer ${access_token}` : '',
            'Content-Type': 'application/json',
        })
    });
    return await response.json();
}
</script>

<style>
.twilio-authenticator {
    padding: 50px 20px;
    /* background: linear-gradient(to top right, #d01095, #5e349a); */
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
}
.twilio-authenticator .mode-selector p {
    color: #333;
    margin-bottom: 5px;
    font-size: 0.93rem;
}
.twilio-authenticator .mode-selector {
    display: grid;
    grid-gap: 5px;
    margin-bottom: 40px;
}
.twilio-authenticator .mode-selector .ip-section {
    display: grid;
    grid-gap: 10px;
    grid-template-columns: max-content auto;
    align-items: center;
    font-size: 0.9rem;
}
.twilio-authenticator .rfs-options > div {
    padding: 10px;
}
.twilio-authenticator .rfs-options label {
    font-size: 0.8rem;
    display: block;
    color: #777;
    font-weight: 700;
}
.twilio-authenticator .rfs-options input[type='text'],
.twilio-authenticator .rfs-options input[type='password'] {
    border: none;
    padding: 10px 5px;
    border-bottom: 1px solid #999;
    font-size: 0.95rem;
    font-weight: 700;
    width: 100%;
}
.twilio-authenticator .rfs-options select {
    border: none;
    padding: 10px 5px;
    border-bottom: 1px solid #999;
    font-size: 0.95rem;
    font-weight: 700;
    width: 100%;
}
.twilio-authenticator .drag {
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
.twilio-authenticator .drag input[type="file"] {
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
