<template lang="pug">
  canvas(
    id="canvas"
    @mousemove="mousemove"
    @mousedown="mousedown"
    @mouseup="mouseup"
    @mouseout="mouseout"
    :width="canvasWidth"
    :height="canvasHeight"
  )
</template>

<script>
import _ from 'lodash';

export default {
  props: {
    pencilColor: {
      type: String,
      default: 'black',
    },
    pencilSize: {
      type: Number,
      default: 2,
    },
    image: {
      type: String,
      default: undefined,
    },
    canvasWidth: {
      type: Number,
      default: window.innerWidth - 200,
    },
    canvasHeight: {
      type: Number,
      default: window.innerHeight - 200,
    },
  },
  data () {
    return {
      canvas: null,
      ctx: null,
      flag: false,
      prevX: 0,
      currX: 0,
      prevY: 0,
      currY: 0,
      dotFlag: false,
      color: 'black',
      size: 2,
    };
  },
  watch: {
    image () {
      this.init();
    },
  },
  mounted () {
    this.init();
  },
  methods: {
    init () {
      this.canvas = document.getElementById('canvas');
      this.ctx = this.canvas.getContext('2d');
      if (!_.isEmpty(this.image)) { this.initImg(); }
    },
    initImg () {
      const img = new window.Image();
      img.src = this.image;
      img.onload = () => {
        // this.ctx.drawImage(img,
        //   this.canvas.width / 2 - img.width / 2,
        //   this.canvas.height / 2 - img.height / 2
        // );
        var hRatio = this.canvas.width / img.width;
        var vRatio = this.canvas.height / img.height;
        var ratio = Math.min(hRatio, vRatio);
          var centerShift_x = (this.canvas.width - img.width * ratio) / 2; // eslint-disable-line
          var centerShift_y = (this.canvas.height - img.height * ratio) / 2; // eslint-disable-line
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(img, 0, 0, img.width, img.height,
          centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
      };
    },
    mousemove (e) {
      this.findXY('move', e);
    },
    mousedown (e) {
      this.findXY('down', e);
    },
    mouseup (e) {
      this.findXY('up', e);
    },
    mouseout (e) {
      this.findXY('out', e);
    },
    draw () {
      this.ctx.beginPath();
      this.ctx.moveTo(this.prevX, this.prevY);
      this.ctx.lineTo(this.currX, this.currY);
      this.ctx.strokeStyle = this.pencilColor;
      this.ctx.lineWidth = this.pencilSize;
      this.ctx.stroke();
      this.ctx.closePath();
    },
    findXY (res, e) {
      const rect = this.canvas.getBoundingClientRect();
      if (res === 'down') {
        this.prevX = this.currX;
        this.prevY = this.currY;
        this.currX = e.clientX - rect.left;
        this.currY = e.clientY - rect.top;

        this.flag = true;
        this.dotFlag = true;
        if (this.dotFlag) {
          this.ctx.beginPath();
          this.ctx.fillStyle = this.pencilColor;
          this.ctx.fillRect(this.currX, this.currY, 2, 2);
          this.ctx.closePath();
          this.dotFlag = false;
        }
      }

      if (res === 'up') {
        this.dotFlag = false;
        this.flag = false;
      }

      if (res === 'move') {
        if (this.flag) {
          this.prevX = this.currX;
          this.prevY = this.currY;
          this.currX = e.clientX - rect.left;
          this.currY = e.clientY - rect.top;
          this.draw();
        }
      }
    },
    save () {
      this.$emit('save', this.canvas.toDataURL('image/png'));
      this.init();
      return this.canvas.toDataURL('image/png');
    },
    clear () {
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      // document.getElementById('canvas').style.display = 'none';
    },
  },
};
</script>

<style scoped>
  canvas {
    background: white;
    display: block;
    margin: 0 auto;
  }
</style>
