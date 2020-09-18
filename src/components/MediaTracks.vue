<template>
    <div class="media-tracks">
        <select class="media-devices" @change="set_selected_device">
            <option v-for="device in devices" 
                v-bind:key="device.index" 
                :value="device.index">
                {{ device.label }}
            </option>
        </select>
        
        <div class="attribute-container" v-if="selected_device && (selected_device.kind === 'videoinput' || selected_device.kind === 'screen')">
            <section class="attributes">
                <label>Width</label>
                <input type="number" v-model="selected_device_info.width">
            </section>
            <section class="attributes">
                <label>Height</label>
                <input type="number" v-model="selected_device_info.height">
            </section>
            <section class="attributes">
                <label>Frame Rate</label>
                <input type="number" v-model="selected_device_info.framerate">
            </section>
            <section class="attributes">
                <label>Priority</label>
                <select v-model="selected_device_info.priority">
                    <option selected value="standard">Standard</option>
                    <option value="high">High</option>
                    <option value="low">Low</option>
                </select>
            </section>
        </div>
        <div class="attribute-container" v-if="selected_device && selected_device.kind === 'audioinput'">
            <section class="attributes">
                <label>Priority</label>
                <select v-model="selected_device_info.priority">
                    <option selected value="standard">Standard</option>
                    <option value="high">High</option>
                    <option value="low">Low</option>
                </select>
            </section>
        </div>
        <div><button @click="add_remove_track"> {{!this.device_added ? "Add to" : "Remove from"}} Room </button></div>
    </div>
</template>

<script>
import { createLocalAudioTrack, createLocalVideoTrack, LocalVideoTrack } from "twilio-video";

export default {
    data: function() {
        return {
            devices: null,
            device_added: false,
            selected_device: null,
            selected_device_info: {
                priority: 'standard'
            },
            added_devices: []
        };
    },
    methods: {
        add_remove_track: add_remove_track,
        set_selected_device: setSelectedDevice
    },
    mounted: async function() {
        let devices = await navigator.mediaDevices.enumerateDevices();
        devices = devices.filter(d => d.kind !== 'audiooutput');
        devices = devices.concat(await window.__electron.desktopCapturer.getSources({ types: ['screen'] }));
        this.devices = devices.map((d, i) => {
            if (!d.kind) return {
                index: i,
                kind: 'screen',
                label: d.name,
                deviceId: d.id
            };
            else return {
                index: i,
                deviceId: d.deviceId,
                groupId: d.groupId,
                kind: d.kind,
                label: d.label
            };
        });
        this.selected_device = this.devices[0];
    },
    watch: {
        selected_device: function() {
            if (this.added_devices.find(d => {
                if (d) return d.label === this.selected_device.label;
                else return false;
            })) {
                this.device_added = true;
            }
            else {
                this.device_added = false;
            }
        }
    }
}

async function add_remove_track() {
    if (!this.device_added) {
        let device = {
            label : this.selected_device.label, 
            deviceId: this.selected_device.deviceId, 
            groupId: this.selected_device.groupId, 
            kind: this.selected_device.kind, 
            priority: this.selected_device_info.priority,
            ...(this.selected_device.kind === 'videoinput' || this.selected_device.kind === 'screen' ? this.selected_device_info : [])
        };
        device._localTrack = await createTrack(device);
        this.added_devices.push(device);
        this.device_added = true;
        this.$emit("track_added", device);
    }
    else {
        let device_to_be_removed = this.added_devices.find(d => d.label === this.selected_device.label);
        this.added_devices.splice([
            this.added_devices.indexOf(
                device_to_be_removed
            )
        ], 1);
        device_to_be_removed._localTrack.stop();
        this.device_added = false;
        this.$emit("track_removed", device_to_be_removed)
    }
}

async function createTrack(device) {
    let localTrack = null;
    if (device.kind === 'audioinput') {
        localTrack = await createLocalAudioTrack({
            deviceId: device.deviceId,
            groupId: device.groupId
        });
    }
    else if (device.kind === 'videoinput') {
        localTrack = await createLocalVideoTrack({
            deviceId: device.deviceId,
            groupId: device.groupId,
            width: device.width,
            height: device.height,
            frameRate: {
                ideal: device.frameRate
            }
        });
    }
    else if (device.kind === 'screen') {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: device.deviceId,
                    maxWidth: device.width,
                    maxHeight: device.height
                }
            }
        });
        localTrack = await new LocalVideoTrack(stream.getVideoTracks()[0], {
            frameRate: device.frameRate
        });
    }
    return localTrack;
}

function setSelectedDevice(event) {
    this.selected_device = this.devices.find(d => d.index === parseInt(event.target.value));
}
</script>

<style scoped>
.media-tracks {
    padding: 50px 20px;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    display: grid;
    grid-template-columns: 1fr;
    grid-gap: 10px;
}
.media-tracks button {
    padding: 10px 30px;
    font-size: 0.8rem;
    color: #fff;
    background: #1976d2;
    font-weight: 400;
    text-transform: uppercase;
    border: none;
    margin-top: 10px;
    border-radius: 3px;
    transition: all 0.3s;
    cursor: pointer;
}
.media-tracks button:hover {
    background: #2196f3;
}
.media-tracks select {
    border: none;
    padding: 10px 5px;
    border-bottom: 1px solid #999;
    font-size: 0.95rem;
    font-weight: 700;
    width: 100%;
}
.media-tracks .attribute-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(75px, 1fr));
    grid-gap: 10px;
}
.media-tracks .attributes {
    display: block;
}
.media-tracks .attributes label {
    font-size: 0.8rem;
    display: block;
    color: #777;
    font-weight: 700;
}
.media-tracks .attributes input,
.media-tracks .attributes select {
    border: none;
    padding: 10px 5px;
    border-bottom: 1px solid #999;
    font-size: 0.95rem;
    font-weight: 700;
    width: 100%;
}
</style>