<template>
    <div class="chart line-chart" ref="container">
        <canvas width="300" height="200" id="drawSpace"></canvas>
    </div>
</template>

<script>
import AnimationEngine from "./util/animation-engine";

export default {
    props: ['d', 'new_d'],
    data: function() {
        return {
            canvas: null,
            context: null,
            width: 0,
            height: 0,
            divisions: 5,
            padding: 20,
            data_points: {
                d: [],
                min: 0,
                max: 0
            },
            format: {
                y: "network"
            },

            sliding_window: {
                size: 30,
                current_pointer: 0
            }
        };
    },
    methods: {
        add_data_point: addDataPoint
    },
    mounted: function() {
        this.canvas = this.$refs.container.querySelector(`#drawSpace`);
        this.context = this.canvas.getContext('2d');
        correctCanvasSize(this, "16:9");
        AnimationEngine.addToQueue(null, drawGridLines, this);
    },
    watch: {
        new_d: function(d) {
            this.add_data_point(d);
        }
    }
}

function addDataPoint(data_point) {
    this.data_points.d.push(data_point);
    updateMetaData(data_point, this);

    // Call the Re-Paint Functions
    AnimationEngine.addToQueue(null, drawGridLines, this);
    AnimationEngine.addToQueue(null, drawDataLine, this);
}

function updateMetaData(data_point, _this) {
    // Setting the Min or Max values that should trigger a re-draw of the Grid Lines
    if (data_point < _this.data_points.min) _this.data_points.min = data_point;
    else if (data_point > _this.data_points.max) _this.data_points.max = data_point;

    // Update the Data Window
    _this.sliding_window.current_pointer = _this.data_points.d.length - 1;
}

function correctCanvasSize(_this, aspectRatio = "1:1") {
    const { width, height } = _this.canvas.getBoundingClientRect();
    const widthPropotion = parseInt(aspectRatio.split(":")[0]);
    const heightPropotion = parseInt(aspectRatio.split(":")[1]);

    _this.width = width;
    _this.height = width * heightPropotion / widthPropotion;
    _this.canvas.width = _this.width;
    _this.canvas.height = _this.height;
}

function drawGridLines(_this) {
    _this.context.clearRect(0, 0, _this.canvas.width, _this.canvas.height);
    _this.context.strokeStyle = "rgb(200, 200, 200)";
    _this.context.setLineDash([5, 5]);
    _this.context.beginPath();

    let content_height = _this.height - (_this.padding * 2);

    for(let i = 0; i <= _this.divisions; i++) {
        let y = parseInt((content_height / _this.divisions) * i) + _this.padding;
        _this.context.moveTo(0, y);
        _this.context.lineTo(_this.width, y);

        if (i === 0) {
            _text(_this, _formatLabel(_this, "y", _this.data_points.max), 10, y);
        }
        else if (i === _this.divisions) {
            _text(_this, _formatLabel(_this, "y", _this.data_points.min), 10, y);
        }
    }
    _this.context.stroke();
    _this.context.setLineDash([]);
}

function drawDataLine(_this) {
    let data_window = _this.data_points.d.slice(
        _this.sliding_window.current_pointer < _this.sliding_window.size ? 
        0 : (_this.sliding_window.current_pointer - _this.sliding_window.size),
        _this.sliding_window.current_pointer
    );

    let content_width = _this.width - (_this.padding * 2);
    let content_height = _this.height - (_this.padding * 2);

    let plots = data_window.map((data, index) => {
        let _x = _this.padding + (content_width / _this.sliding_window.size * ((_this.sliding_window.size - data_window.length) + index));
        let _y = _this.padding + content_height - (data * (content_height / (_this.data_points.max - _this.data_points.min)));
        return {
            x: _x,
            y: _y
        };
    });

    _this.context.strokeStyle = "#0288d1";
    _this.context.beginPath();

    for(let i = plots.length - 1; i > 0; i--) {
        _this.context.moveTo(plots[i].x, plots[i].y);
        _this.context.lineTo(plots[i-1].x, plots[i-1].y);
    }
    _this.context.stroke();
}

function _text(_this, text, x, y) {
    _this.context.font = "10px sans-serif";
    _this.context.fillText(text, x, y);
}

function _formatLabel(_this, axis, data) {
    if (!_this.format) return data;
    if (axis) {
        let _f = _this.format.y;
        switch (_f) {
            case "network":
                return _formatDataToNetworkNotation(data);
            default: 
                return data;
        }
    }
    else {
        return data;
    }
}

function _formatDataToNetworkNotation(data) {
    data *= 8;
    let divisor = 0;
    let suffix = 'b';
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

function __get_log_by_base(base, number) {
    return Math.log(number) / Math.log(base);
}
</script>

<style scoped>
.chart {
    display: block;
}
</style>