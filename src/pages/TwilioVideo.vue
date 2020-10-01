<template>
    <div class="video-call">
        <div class="main-heading">
            <h2>Twilio Video Analytics</h2>
            <p>A simple page for testing the Twilio Video API. This is mainly to check the reliability and bandwidth consumption of different Media Streams</p>
        </div>

        <section>
            <h4>Check-In</h4>
            <p>If you have a .cred file, you can drop it over here. And we'll take it from there.</p>
            <twilio-authenticator></twilio-authenticator>
        </section>

        <section>
            <h4>Get a Room</h4>
            <p>Enter the details mentioned below. That should let us get you to the Room</p>
            <section class="input-container">
                <div class="input-section">
                    <label>Room Name</label>
                    <input type="text" v-model="room_name">
                </div>
                <div class="input-section">
                    <label>Your Name</label>
                    <input type="text" v-model="participant_name">
                </div>
                <div class="input-section">
                    <button :disabled="room._status === 'connecting' ? true : false" @click="connectToRoom">
                        {{ this.room._status === "disconnected" ? "Connect to" : "Disconnect from" }} Room
                    </button>
                </div>
            </section>
            <section class="room-output-container">
                <div class="stat">
                    <label>Room Connection Status: </label>
                    <span>{{ this.room._status }}</span>
                </div>
                <div class="stat" v-if="room._room">
                    <label>Room SID: </label>
                    <span>{{ this.room._room.sid }}</span>
                </div>
                <div class="stat" v-if="room._room">
                    <label>Remote Participants: </label>
                    <span>{{ this.room._participants }}</span>
                </div>
            </section>
        </section>

        <section>
            <h4>Put on some Tracks</h4>
            <p>Now that you're in, you can add a bunch of Tracks and go nuts!</p>
            <media-tracks class="media-tracks" @track_added="addTrackToRoom" @track_removed="removeTrackFromRoom"></media-tracks>
        </section>

        <section class="data-section">
            <h4>Play Around with the Data</h4>
            <p>Here we present you with the data from the tracks that you've added. By the way, you are gonna see a bunch of other data from other Track Nerds.</p>
            <media-analyzer ref="analyzer" :available_tracks="room._tracks"></media-analyzer>
        </section>
    </div>
</template>

<script>
import { connect } from "twilio-video";
import MediaTracks from "../components/MediaTracks.vue";
import MediaAnalyzer from "../components/MediaAnalyzer.vue";
import TwilioAuthenticator from "../components/TwilioAuthenticator.vue";
import { ipcRenderer, remote } from "electron";

const tv = remote.require("./modules/twilio-video");

export default {
    components : { MediaTracks, MediaAnalyzer, TwilioAuthenticator },

    data: function() {
        return {
            access_token: null,
            participant_name: null,
            room_name: null,
            room: {
                _room: null,
                _status: "disconnected",
                _tracks: [],
                _participants: 0,
                _remote_tracks: []
            }
        };
    },

    methods: {
        connectToRoom: connectToRoom,
        addTrackToRoom: addTrackToRoom,
        removeTrackFromRoom: removeTrackFromRoom,
    },

    mounted: function() {
        window.__twilio = {};
        this.master_timer = setInterval(async () => {
            if (this.room._room) {
                window.__twilio.stats = await this.room._room.getStats();
            }
        }, 1000);

        this.room_name = tv.generateRoomName();
        this.participant_name = tv.generateParticipantName();
    }
}

async function connectToRoom() {
    if (this.room._status === "connected" || this.room._status === "reconnected") {
        this.room._room.disconnect();
    }
    else {
        this.room._status = "connecting";
        const {access_token, room_name} = await getPermissionToken(this.participant_name, this.room_name);
        this.access_token = access_token;
        this.room_name = room_name;

        // https://miro.com/app/board/o9J_ksM7LNY=/?moveToWidget=3074457348070591695&cot=14
        await connect(this.access_token, {
            name: this.room_name,
            region: "us1", // signaling only
            audio: false,
            video: false,
            networkQuality: {
                local: 3, // detailed
                remote: 3
            },
            preferredAudioCodecs: ["opus"], // default
            preferredVideoCodecs: [{
                codec: "VP8",
                // https://www.twilio.com/docs/video/tutorials/using-bandwidth-profile-api#video-codecs-and-the-bw-profile
                simulcast: false, // true,
            }, "VP9"],
            enableDscp: true,
            dominantSpeaker: true,
            maxAudioBitrate: 32000, // 32kbps
            maxVideoBitrate: 4000000, // 4mbps
            bandwidthProfile: { // subscription related
                video: {
                    mode: "collaboration",
                    trackSwitchOffMode: "detected", // "disabled"
                    dominantSpeakerPriority: "high",
                    maxTracks: 5,
                    maxSubscriptionBitrate: 4000000, // max value for Group Rooms
                    // https://www.twilio.com/docs/video/tutorials/using-bandwidth-profile-api#bw-profiles-vs-track-subscriptions
                    renderDimensions: { // used to "downscale" tracks to optimize bandwidth
                        high: { // relates to priority, not resolution
                            width: 960,
                            height: 540
                        },
                        standard: {
                            width: 640,
                            height: 360
                        },
                        low: {
                            width: 320,
                            height: 180
                        }
                    }
                }
            },
            logLevel: "info", // "debug",
        }).then(room => {
            this.room._room = room;
            this.room._participants = this.room._room.participants.size;
            this.room._status = "connected";
            setEventHandlersForRoom(this);
        }).catch(err => {
            this.room._status = "disconnected";
        });
    }
}

function setEventHandlersForRoom(component) {
    let r = component.room._room;
    r.on("reconnecting", () => { component.room._status = "reconnecting"; });
    r.on("reconnected", () => { component.room._status = "reconnected"; });
    r.on("disconnected", (room, error) => {
        room.localParticipant.tracks.forEach(track => {
            if (!track.stop) {
                track.track.mediaStreamTrack.stop();
            }
        });
        component.room._status = "disconnected";
    });

    r.on("participantConnected", participant => {
        component.room._participants = component.room._room.participants.size;
    });
    r.on("participantDisconnected", participant => {
        component.room._participants = component.room._room.participants.size;
    });
    r.on("participantReconnected", participant => { console.log("Participant Reconnected"); });
    r.on("participantReconnecting", participant => { console.log("Participant Reconnecting"); });

    r.on("trackDisabled", () => { console.log("Track Disabled"); });
    r.on("trackEnabled", () => { console.log("Track Enabled"); });
    r.on("trackPublished", (publication, participant) => {
        console.log(`Track Published by ${participant.identity}`);
    });
    r.on("trackSubscribed", (track, publication, participant) => {
        console.log(`Track Subscribed by ${participant.identity}`, track);
        console.log(`Track's name:`, publication.track);

        component.room._tracks.push({
            ...track,
            participantName: participant.identity,
            _participant: participant,
            _room: r,
            remote: true
        });

        track.on('switchedOff', () => {
            console.log(`The RemoteTrack ${track.name} was switched off`);
        });
        track.on('switchedOn', () => {
            console.log(`The RemoteTrack ${track.name} was switched on`);
        });
    });
    r.on("trackunSubscribed", (track, publication, participant) => {
        console.log(`Track UnSubscribed by ${participant.identity}`, track);
    });
    r.on("trackUnpublished", (publication, participant) => {
        console.log(`Track Unpublished by ${participant.identity}`, publication);
        let track_to_be_removed = component.room._tracks.find(t => {
            if (!t.remote) return false;
            return t.sid === publication.trackSid;
        });
        component.$refs.analyzer.stop_analyzing_track(track_to_be_removed);
        component.room._tracks.splice(
            component.room._tracks.indexOf(track_to_be_removed), 1
        );
    });
}

function addTrackToRoom(track) {
    console.log(`Track to be Added to Room : ${track.label}`, track);

    this.room._room.localParticipant.publishTrack(track._localTrack, {
        priority: track.priority
    });
    track.name = track._localTrack.id;
    this.room._tracks.push(track);

    // TODO Use MediaViewer component instead (w/ hide/show functionality)
    if (track.kind === "videoinput" || track.kind === "screen") { // we don't wanna render audio track to avoid feedback
        const videoEl = track._localTrack.attach();
        const node = document.querySelector('.data-section');
        if (node && videoEl) {
            const attr = node.getAttributeNames().find((name) => {
                return /^data/.test(name);
            }) || `media-track-${track.kind}`;

            videoEl.classList.add("media-track-element");
            videoEl.setAttribute(attr, "");
            node.appendChild(videoEl);
        }
    }
}

function removeTrackFromRoom(track) {
    this.room._room.localParticipant.unpublishTrack(track._localTrack);

    let removed_track = this.room._tracks.find(t => t.deviceId === track.deviceId && t.label === track.label);
    this.$refs.analyzer.stop_analyzing_track(removed_track);
    this.room._tracks.splice(this.room._tracks.indexOf(removed_track), 1);
}

function getPermissionToken(userName, roomName) {
    return new Promise((res, rej) => {
        ipcRenderer.on("get_access_token", (event, token_and_room) => {
            res(token_and_room);
        });
        ipcRenderer.send("get_access_token", userName, roomName);
    });
}
</script>

<style scoped>
.video-call {
    padding: 0 50px 20px 50px;
    background: #f6f6f6;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 50px;
}
.main-heading {
    background: #fff;
    margin: 0 -50px;
    padding: 20px 50px;
    grid-column: 1 / -1;
}
.main-heading h2 {
    font-size: 2rem;
    font-weight: 700;
    color: #445;
}

.main-heading p {
    color: #333;
    margin: 10px 0;
    font-size: 0.93rem;
}

.video-call > section h4 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #445;
}
.video-call > section p {
    color: #333;
    margin: 10px 0 20px 0;
    font-size: 0.93rem;
}

.input-container {
    padding: 50px 20px;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    display: grid;
    grid-gap: 10px;
}
.input-section label {
    font-size: 0.8rem;
    display: block;
    color: #777;
    font-weight: 700;
}
.input-section input[type="text"] {
    border: none;
    padding: 10px 5px;
    border-bottom: 1px solid #999;
    font-size: 0.95rem;
    font-weight: 700;
    width: 100%;
}

.room-output-container {
    margin: 20px 0;
}
.room-output-container .stat {
    font-size: 0.8rem;
    display: block;
    margin: 5px 0;
}
.room-output-container .stat label{
    display: inline-block;
    font-weight: 400;
}
.room-output-container .stat span{
    display: inline-block;
    font-weight: 700;
}

.media-tracks {
    margin-top: 20px;
}

.data-section {
    grid-column: 1 / -1;
}

button {
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
button:hover {
    background: #2196f3;
}
button:disabled {
    background: #777;
}

.media-track-element {
    display: inline-block;
    position: absolute;
    left: -10000px;
}
</style>
