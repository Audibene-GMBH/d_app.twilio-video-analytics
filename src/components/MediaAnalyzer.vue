<template>
    <div class="media-analyzer">
        <ul class="participant-dashboard">
            <li class ="white" v-for="(participant, index) in participant_data" v-bind:key="index">
                <div class="card-header">
                    <h3>Participant #{{ index + 1 }}</h3>
                    <h5>{{participant.name}}</h5>
                </div>
                
                <div class="stats">
                    <div class="stat">
                        <span>{{participant.tracks.audio.reduce((a,t) => a + 1, 0)}}</span>
                        <label>Audio Tracks</label>
                    </div>
                    <div class="stat">
                        <span>{{participant.tracks.video.reduce((a,t) => a + 1, 0)}}</span>
                        <label>Video Tracks</label>
                    </div>
                    <div class="stat">
                        <span>{{ 
                            convert_network_data(
                                participant.tracks.audio.reduce((a, t) => t.twilio_data_rate + a, 0) + 
                                participant.tracks.video.reduce((a, t) => t.twilio_data_rate + a, 0), 
                            true) 
                        }}ps</span>
                        <label>Total Bandwidth Consumption</label>
                    </div>
                </div>

                <section class="table" v-for="(track, i) in participant.tracks.audio" v-bind:key="'au' + i">
                    <div class="heading">
                        <h3>Audio Track #{{i + 1}}</h3>
                        <div class="sidenote">
                            {{ convert_network_data(track.twilio_data_rate, true) }}ps
                        </div>
                        <h6>{{ track._track.name }}</h6>
                    </div>
                    <div class="body"></div>
                </section>

                <section class="table" v-for="(track, i) in participant.tracks.video" v-bind:key="'vi' + i">
                    <div :id="'track-renderer-' + i" class="track-renderer"></div>
                    <div class="heading">
                        <h3>Video Track #{{i + 1}}</h3>
                        <div class="sidenote">
                            {{ convert_network_data(track.twilio_data_rate, true) }}ps
                        </div>
                        <h6>{{ track._track.name }}</h6>
                    </div>
                    <div class="body"></div>
                </section>

            </li>
        </ul>

        <ul class="current-tracks">
            <li v-for="(track, index) in tracks_under_analysis" v-bind:key="index">
                <h3>
                    <span ref="track-name" class="track-name" v-html="track._formatted_name"></span> | 
                    <span>{{track._track.remote ? "Remote" : "Local"}} ({{ track._track.kind }})</span>
                </h3>
                <div class="stat">
                    <label>Total Data Generated (Bytes)</label>
                    <span>{{ convert_network_data(track.total_data) }}</span>
                </div>
                <div class="stat">
                    <label>Data Rate (Bytes)</label>
                    <span>{{ convert_network_data(track.current_data) }}</span>
                </div>
                <div class="stat">
                    <label>Average Data Rate (Bytes)</label>
                    <span>{{ convert_network_data(track.total_data / track.total_ticks) }}</span>
                </div>
                <div class="stat" v-if="track._is_video">
                    <label>Width</label>
                    <span>{{ track._vt_width }}</span>
                </div>
                <div class="stat" v-if="track._is_audio">
                    <label></label>
                    <span></span>
                </div>
                <div class="stat" style="grid-row: span 2">
                    <label>Twilio Data Rate</label>
                    <line-chart :new_d="track.twilio_data_rate" ref="twilioDataRateChart"></line-chart>
                </div>
                <div class="stat">
                    <label>Total Data Generated (Bits)</label>
                    <span>{{ convert_network_data(track.total_data, true) }}</span>
                </div>
                <div class="stat">
                    <label>Data Rate (Bits)</label>
                    <span>{{ convert_network_data(track.current_data, true) }}</span>
                </div>
                <div class="stat">
                    <label>Average Data Rate (Bits)</label>
                    <span>{{ convert_network_data(track.total_data / track.total_ticks, true) }}</span>
                </div>
                <div class="stat" v-if="track._is_video">
                    <label>Height</label>
                    <span>{{ track._vt_height }}</span>
                </div>
                <div class="stat" v-if="track._is_audio">
                    <label></label>
                    <span></span>
                </div>
                <div class="stat">
                    <label>Total Data Transferred (Twilio) (Bytes)</label>
                    <span>{{ convert_network_data(track.twilio_total_data) }}</span>
                </div>
                <div class="stat" v-if="track._is_video">
                    <label></label>
                    <span></span>
                </div>
                <div class="stat" v-if="track._is_audio">
                    <label></label>
                    <span></span>
                </div>
                <div class="stat">
                    <label>Average Data Rate (Twilio) (Bits)</label>
                    <span>{{ convert_network_data(track.twilio_data_rate, true) }}</span>
                </div>
                <div class="stat" v-if="track._is_video">
                    <label>Frame Rate</label>
                    <span>{{ track._vt_frameRate }}</span>
                </div>
                <div class="stat" v-if="track._is_video">
                    <label></label>
                    <span></span>
                </div>
                <div class="stat" v-if="track._is_audio">
                    <label></label>
                    <span></span>
                </div>
                <div class="stat" v-if="track._is_audio">
                    <label></label>
                    <span></span>
                </div>
                <div class="stat">
                    <label>Total Data Transferred (Twilio) (Bits)</label>
                    <span>{{ convert_network_data(track.twilio_total_data, true) }}</span>
                </div>
                <div class="stat">
                    <label></label>
                    <span></span>
                </div>
                <div class="stat" v-if="track._is_audio">
                    <label></label>
                    <span></span>
                </div>
            </li>
        </ul>

        <ul class="snapshots">
            <li v-for="(track, index) in snapshots" v-bind:key="index">
                <h3><span ref="track-name" class="track-name" v-html="track._formatted_name"></span> | <span>{{track._track.remote ? "Remote" : "Local"}} ({{ track._track.kind }})</span></h3>
                <div class="stat">
                    <label>Total Data Generated (Bytes)</label>
                    <span>{{ convert_network_data(track.total_data) }}</span>
                </div>
                <div class="stat">
                    <label>Total Data Transferred (Twilio) (Bytes)</label>
                    <span>{{ convert_network_data(track.twilio_total_data) }}</span>
                </div>
                <div class="stat">
                    <label>Data Rate (Bytes)</label>
                    <span>{{ convert_network_data(track.current_data) }}</span>
                </div>
                <div class="stat">
                    <label>Average Data Rate (Bytes)</label>
                    <span>{{ convert_network_data(track.total_data / track.total_ticks) }}</span>
                </div>
                <div class="stat">
                    <label>Average Data Rate (Twilio) (Bytes)</label>
                    <span>{{ convert_network_data(track.twilio_data_rate) }}</span>
                </div>
                <div class="stat">
                    <label>Total Data Generated (Bits)</label>
                    <span>{{ convert_network_data(track.total_data, true) }}</span>
                </div>
                <div class="stat">
                    <label>Total Data Transferred (Twilio) (Bits)</label>
                    <span>{{ convert_network_data(track.twilio_total_data, true) }}</span>
                </div>
                <div class="stat">
                    <label>Data Rate (Bits)</label>
                    <span>{{ convert_network_data(track.current_data, true) }}</span>
                </div>
                <div class="stat">
                    <label>Average Data Rate (Bits)</label>
                    <span>{{ convert_network_data(track.total_data / track.total_ticks, true) }}</span>
                </div>
                <div class="stat">
                    <label>Average Data Rate (Twilio) (Bits)</label>
                    <span>{{ convert_network_data(track.twilio_data_rate, true) }}</span>
                </div>
                <div class="stat" v-if="track._is_video">
                    <label>Width</label>
                    <span>{{ track._vt_width }}</span>
                </div>
                <div class="stat" v-if="track._is_video">
                    <label>Height</label>
                    <span>{{ track._vt_height }}</span>
                </div>
                <div class="stat" v-if="track._is_video">
                    <label>Frame Rate</label>
                    <span>{{ track._vt_frameRate }}</span>
                </div>
            </li>
        </ul>
    </div>
</template>

<script>
import LineChart from "./charts/LineChart.vue";

export default {
    components: { LineChart },
    props: ["available_tracks"],
    data: function() {
        return {
            tracks_under_analysis: [],
            snapshots: [],
            participant_data: []
        };
    },
    methods: {
        convert_network_data: convert_network_data,
        stop_analyzing_track: stop_analyzing_track,
        deactivate_participant: deactivate_participant
    },
    watch: {
        available_tracks: function() {
            const new_track = this.available_tracks.find(t => !t.analyzer);
            if (new_track) {
                add_participant_data(new_track, this);
                add_analyzer_to_track(new_track, this);
            }
        }
    }
}

function deactivate_participant(participant_name) {
    let participant = this.participant_data.find(p => p.name === participant_name);

    participant.tracks.audio.forEach(track => {
        remove_track_from_participant_data(track, this);
    });
    participant.tracks.video.forEach(track => {
        remove_track_from_participant_data(track, this);
    });
}

function add_participant_data(track, component) {
    let participant = component.participant_data.find(p => p.name === track.participantName);
    if (!participant) {
        component.participant_data.push({
            name: track.participantName,
            tracks: {
                audio: [],
                video: []
            }
        });
    }
}

function add_track_to_participant_data(track, component) {
    let is_track_type_audio = track._track.kind === "audio";
    let participant = component.participant_data.find(p => p.name === track._track.participantName);

    if (is_track_type_audio) participant.tracks.audio.push(track);
    else participant.tracks.video.push(track);
}

function remove_track_from_participant_data(track, component) {
    let is_track_type_audio = track._track.kind === "audio";
    let participant = component.participant_data.find(p => p.name === track._track.participantName);

    let track_to_remove = participant.tracks[is_track_type_audio ? 'audio' : 'video'].find(t => __check_equality(t, track._track));
    participant.tracks[is_track_type_audio ? 'audio' : 'video'].splice(
        participant.tracks[is_track_type_audio ? 'audio' : 'video'].indexOf(track_to_remove), 1
    );
}

function add_analyzer_to_track(track, component) {
    let tr = track._localTrack ? track._localTrack.mediaStreamTrack : track.mediaStreamTrack;
    const mediaStream = new MediaStream([tr]);

    let recorderOptions = {};
    recorderOptions.mimeType = track.kind === "audioinput" || track.kind === "audio" ? "audio/webm;codecs=opus" : "video/webm;codecs=vp8";
    const mediaRecorder = new MediaRecorder(mediaStream, recorderOptions);

    let a_track = {
        current_data: 0,
        total_data: 0,
        total_ticks: 0,
        twilio_total_data: 0,
        twilio_data_rate: 0,
        _track: track,
        _formatted_name: __format_name(track.name),

        _is_video: false,
        _is_audio: false,

        _vt_width: 0,
        _vt_height: 0,
        _vt_frameRate: 0,

        _prev_stat_object: null,

        _track_events_log: []
    };
    component.tracks_under_analysis.push(a_track);
    add_track_to_participant_data(a_track, component);

    track.analyzer = {
        total_data: 0,
        current_data: 0
    };

    track.analyzer.recorder = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            a_track.total_data += event.data.size;
            a_track.current_data = event.data.size;
            a_track.total_ticks++;

            let stat_object = {};
            if (a_track._track.remote) {
                if (a_track._track.kind === "audio") {
                    stat_object = window.__twilio.stats[0].remoteAudioTrackStats;
                }
                else {
                    stat_object = window.__twilio.stats[0].remoteVideoTrackStats;
                }
                stat_object = stat_object.find((t) => {
                    return t.hasOwnProperty("frameRate") ? t.trackSid === a_track._track.sid && t.bytesReceived > 0 :
                        t.trackSid === a_track._track.sid && t.bytesReceived > 0;
                });
                if (stat_object) a_track.twilio_total_data = stat_object.bytesReceived;

                if (a_track._prev_stat_object && stat_object) {
                    a_track.twilio_data_rate = ( (stat_object.bytesReceived - a_track._prev_stat_object.bytesReceived) / ((stat_object.timestamp - a_track._prev_stat_object.timestamp) / 1000) )
                }
            }
            else {
                if (a_track._track.kind === "audioinput") {
                    stat_object = window.__twilio.stats[0].localAudioTrackStats;
                }
                else {
                    stat_object = window.__twilio.stats[0].localVideoTrackStats;
                }
                stat_object = stat_object.find((t) => {
                    return t.hasOwnProperty("frameRate") ? t.trackId === a_track._track.name && t.frameRate > 0 && t.bytesSent > 0 :
                        t.trackId === a_track._track.name && t.bytesSent > 0;
                });
                if (!stat_object) {
                    // no suitable data yet
                    return;
                }
                a_track.twilio_total_data = stat_object.bytesSent;

                if (a_track._prev_stat_object) {
                    a_track.twilio_data_rate = ( (stat_object.bytesSent - a_track._prev_stat_object.bytesSent) / ((stat_object.timestamp - a_track._prev_stat_object.timestamp) / 1000) )
                }
            }

            if (a_track._track.kind === "audioinput" || a_track._track.kind === "audio") {
                a_track._is_audio = true;
            }
            else {
                a_track._is_video = true;
                if (stat_object.dimensions) a_track._vt_width = stat_object.dimensions.width;
                if (stat_object.dimensions) a_track._vt_height = stat_object.dimensions.height;
                a_track._vt_frameRate = stat_object.frameRate;
            }

            if (stat_object) a_track._prev_stat_object = stat_object;
        }
    };

    track.analyzer.recorder.start(1000);
    console.log(`${track.label} |  Track Analyzer Started`);
}

function convert_network_data(data, bit = false) {
    if(bit) data = data * 8;

    let divisor = 0;
    let suffix = bit ? "b" : "B";
    let logB = __get_log_by_base(1024, data);
    if (logB >= 3) {
        suffix = "G" + suffix;
        divisor = 3;
    }
    else if (logB >= 2) {
        suffix = "M" + suffix;
        divisor = 2;
    }
    else if (logB >= 1) {
        suffix = "K" + suffix;
        divisor = 1;
    }

    if (divisor === 0) return data + " " + suffix;
    else return (data / Math.pow(1024, divisor)).toFixed(2) + " " + suffix;
}

function stop_analyzing_track(track) {
    if (!track) return;
    track.analyzer.recorder.stop();
    
    let track_to_be_removed = this.tracks_under_analysis.find(t => __check_equality(t._track, track));
    let index = this.tracks_under_analysis.indexOf(track_to_be_removed);
    this.snapshots.push(...this.tracks_under_analysis.splice(index, 1));

    remove_track_from_participant_data(track_to_be_removed, this);
}

function __check_equality(track1, track2) {
    if (track1.remote && !track2.remote) return false;
    else if (!track1.remote && track2.remote) return false;
    else if (track1.remote && track2.remote) {
        return (track1.sid === track2.sid &&
        track1.participantName === track2.participantName);
    }
    else return (
        track1.kind === track2.kind &&
        track1.deviceId === track2.deviceId &&
        track1.groupId === track2.groupId &&
        track1.label === track2.label
    );
}

function __format_name(name_string) {
    let new_array = name_string.split("").map(ele => {
        if (!(ele >= "0" && ele <= "9")) {
            return "<span class=\"letter\">" + ele + "</span>";
        }
        else return ele;
    });
    return new_array.join("");
}

function __get_log_by_base(base, number) {
    return Math.log(number) / Math.log(base);
}
</script>

<style>

.card-header {
    margin: 0 0 20px 0;
    display: grid;
    grid-gap: 5px;
    grid-column: 1 / -1;
}
.card-header > h3 {
    font-size: 1.3rem;
    font-weight: 700;
    color: #232F34;
}
.card-header > h5 {
    font-size: 0.95rem;
    font-weight: 400;
    color: #232F34;
}

.stats {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
}
.stats .stat {
    display: grid;
    grid-gap: 10px;
    align-items: center;
    justify-content: center;
}
.stats .stat span {
    font-weight: 700;
    font-size: 2rem;
    text-align: center;
    color: #233456;
}
.stats .stat label {
    font-weight: 400;
    font-size: 1rem;
    text-align: center;
    color: #54546F;
}

.table {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: repeat(auto-fit, minmax(75px, 1fr));
    margin: 20px 10px;
}
.table .heading {
    grid-column: 1/ -1;
    grid-template-columns: auto max-content;
    display: grid;
    grid-gap: 5px;
}
.table .heading h3 {
    font-size: 1rem;
    font-weight: 700;
    color: #232345;
}
.table .heading h6 {
    font-size: 0.7rem;
    font-weight: 700;
    color: #233445;
}
.table .heading .sidenote {
    grid-row: span 2;
    align-content: center;
    display: grid;
    color: #999;
    font-weight: 700;
}

ul {
    display: flex;
    grid-gap: 10px;
    flex-direction: column;
}

ul.snapshots {
    flex-direction: column-reverse;
}

ul.current-tracks > li {
    margin-top: 10px;
    background: #fff;
}

ul.snapshots > li {
    margin-top: 10px;
    background: #eee;
}

ul > li {
    display: grid;
    padding: 15px;
    grid-gap: 10px;
    grid-template-columns: repeat(5, 1fr);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 3px 5px rgba(0, 0, 0, 0.1);
    border-radius: 2px;
    margin-bottom: 10px;
}

ul > li.white {
    background: #fff;
}

ul > li > h3 {
    grid-column: 1 / -1;
    margin: 10px 0;
    font-weight: 300;
    font-size: 1.2rem;
}
ul > li > h3 > b {
    font-weight: 700;
}

ul > li > h3 > span {
    font-weight: 300;
}
ul > li > h3 > .track-name {
    font-size: 1.2rem;
    font-weight: 700;
}
ul > li > h3 > .track-name > .letter {
    color: #666;
    font-size: 1.6rem;
    font-weight: 400;
}

ul > li .stat {
    display: grid;
}
ul > li .stat label {
    display: block;
    font-weight: 400;
    font-size: 0.8rem;
}
ul > li .stat span{
    display: block;
    font-weight: 300;
    font-size: 1.6rem;
}
</style>
