<template>
    <div class="media-analyzer">
        <ul class="current-tracks">
            <li v-for="(track, index) in tracks_under_analysis" v-bind:key="index">
                <h3><span ref="track-name" class="track-name" v-html="track._formatted_name"></span> | <span>{{track._track.remote ? 'Remote' : 'Local'}} ({{ track._track.kind }})</span></h3>
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
                <div class="stat">
                    <line-chart :new_d="track.twilio_data_rate" ref="twilioDataRateChart"></line-chart>
                </div>
            </li>
        </ul>

        <ul class="snapshots">
            <li v-for="(track, index) in snapshots" v-bind:key="index">
                <h3><span ref="track-name" class="track-name" v-html="track._formatted_name"></span> | <span>{{track._track.remote ? 'Remote' : 'Local'}} ({{ track._track.kind }})</span></h3>
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
    props: ['available_tracks'],
    data: function() {
        return {
            tracks_under_analysis: [],
            snapshots: []
        };
    },
    methods: {
        convert_network_data: convert_network_data,
        stop_analyzing_track: stop_analyzing_track
    },
    watch: {
        available_tracks: function() {
            const new_track = this.available_tracks.find(t => !t.analyzer);
            if (new_track) {
                add_analyzer_to_track(new_track, this);
            }
        }
    }
}

function add_analyzer_to_track(track, component) {
    let tr = track._localTrack ? track._localTrack.mediaStreamTrack : track.mediaStreamTrack;
    const mediaStream = new MediaStream([tr]);
    const mediaRecorder = new MediaRecorder(mediaStream);

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

        _prev_stat_object: null
    };
    component.tracks_under_analysis.push(a_track);

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
                if (a_track._track.kind === 'audio') {
                    stat_object = window.__twilio.stats[0].remoteAudioTrackStats;
                }
                else {
                    stat_object = window.__twilio.stats[0].remoteVideoTrackStats;
                }
                stat_object = stat_object.find(t => t.trackSid === a_track._track.sid);
                a_track.twilio_total_data = stat_object.bytesReceived;
                
                if (a_track._prev_stat_object) {
                    a_track.twilio_data_rate = ( (stat_object.bytesReceived - a_track._prev_stat_object.bytesReceived) / ((stat_object.timestamp - a_track._prev_stat_object.timestamp) / 1000) )
                }
            }
            else {
                if (a_track._track.kind === 'audioinput') {
                    stat_object = window.__twilio.stats[0].localAudioTrackStats;
                }
                else {
                    stat_object = window.__twilio.stats[0].localVideoTrackStats;
                }
                stat_object = stat_object.find(t => t.trackId === a_track._track.name);
                a_track.twilio_total_data = stat_object.bytesSent;

                if (a_track._prev_stat_object) {
                    a_track.twilio_data_rate = ( (stat_object.bytesSent - a_track._prev_stat_object.bytesSent) / ((stat_object.timestamp - a_track._prev_stat_object.timestamp) / 1000) )
                }
            }

            if (a_track._track.kind === 'audioinput' || a_track._track.kind === 'audio') {
                a_track._is_audio = true;
            }
            else {
                a_track._is_video = true;
                a_track._vt_width = stat_object.dimensions.width;
                a_track._vt_height = stat_object.dimensions.height;
                a_track._vt_frameRate = stat_object.frameRate;
            }

            a_track._prev_stat_object = stat_object;
        }
    };

    track.analyzer.recorder.start(1000);
    console.log(`${track.label} |  Track Analyzer Started`);
}

function convert_network_data(data, bit = false) {
    if(bit) data = data * 8;

    let divisor = 0;
    let suffix = bit ? 'b' : 'B';
    let logB = __get_log_by_base(1024, data);
    if (logB >= 3) {
        suffix = 'G' + suffix;
        divisor = 3;
    }
    else if (logB >= 2) {
        suffix = 'M' + suffix;
        divisor = 2;
    }
    else if (logB >= 1) {
        suffix = 'K' + suffix;
        divisor = 1;
    }
    
    if (divisor === 0) return data + ' ' + suffix;
    else return (data / Math.pow(1024, divisor)).toFixed(2) + ' ' + suffix;
}

function stop_analyzing_track(track) {
    if (!track) return;
    track.analyzer.recorder.stop();
    let index = this.tracks_under_analysis.indexOf(
        this.tracks_under_analysis.find(t => __check_equality(t._track, track))
    );
    this.snapshots.push(...this.tracks_under_analysis.splice(index, 1));
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
    let new_array = name_string.split('').map(ele => {
        if (!(ele >= '0' && ele <= '9')) {
            return '<span class="letter">' + ele + '</span>';
        }
        else return ele;
    });
    return new_array.join('');
}

function __get_log_by_base(base, number) {
    return Math.log(number) / Math.log(base);
}
</script>

<style>
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
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5), 0 0 8px rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    margin-bottom: 10px;
}

ul > li > h3 {
    grid-column: 1 / -1;
    margin: 10px 0;
    font-weight: 700;
    font-size: 1.2rem;
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
