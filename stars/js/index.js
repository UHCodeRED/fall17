"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var mouse = { x: 0, y: 0, down: false };

function B(x1, y1, x2, y2) {
  return function (t) {
    return 1 - t;
  };
}

function lerp(a, b, t) {
  return b * t + a * (1 - t);
}

var Graph = function () {
  function Graph(w, h) {
    _classCallCheck(this, Graph);

    this.canvas = document.createElement('canvas');
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0px";
    this.canvas.style.right = "0px";
    this.canvas.style.zIndex = "100";

    this.ctx = this.canvas.getContext('2d');
    this.w = this.canvas.width = w;
    this.h = this.canvas.height = h;
    this.bg = "rgba(0,0,0,0.8)";
    this.fg = "#33cccc";
    this.upperBound = 100;
    this.lowerBound = 0;
    this.target = 60;
    this.targetColor = "#cc3333";

    // Initialize bg
    this.ctx.fillStyle = this.bg;
    this.ctx.fillRect(0, 0, w, h);
  }

  Graph.prototype.update = function update(val) {
    // Shift contents right 1px
    // this.ctx.translate(1, 0)
    var d = this.ctx.getImageData(0, 0, this.w, this.h);
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.ctx.putImageData(d, 1, 0);

    // Draw bg
    this.ctx.fillStyle = this.bg;
    this.ctx.fillRect(0, 0, 1, this.h);

    // Draw fg
    this.ctx.fillStyle = this.fg;
    var bw = this.upperBound - this.lowerBound;
    var y = this.h * (val - this.lowerBound) / bw;
    this.ctx.fillRect(0, this.h, 1, -y);

    // Draw target
    this.ctx.fillStyle = this.targetColor;
    var ty = this.h * (this.target - this.lowerBound) / bw;
    this.ctx.fillRect(0, this.h - ty, 1, 1);
  };

  return Graph;
}();

var StarField = function () {
  function StarField(x, y, z, w, h, d, n) {
    _classCallCheck(this, StarField);

    this.x = x;
    this.y = y;
    this.z = z;
    this.width = w;
    this.height = h;
    this.depth = d;
    this.focalLength = 20;
    this.speed = 2.4;

    this.warpMode = false;
    this.warp = 0;
    this.warpStart = 0;
    this.warpEnd;
    this.t = 0;

    this.numStars = n;
    // this.density = starsPer64pxCubed / (64 * 64 * 64)
    // this.numStars = Math.round(this.density * this.width * this.height * this.depth)
    this.stars = [];
    this.maxRadius = 5;
    this.minRadius = 1;
    var dr = this.maxRadius - this.minRadius;

    // Initialize n stars
    for (var i = 0; i < this.numStars; ++i) {
      this.stars[i] = {
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        z: Math.random() * this.depth,
        r: Math.random() * dr + this.minRadius
      };
    }

    // Z-sorting (only happens once)
    this.stars.sort(function (a, b) {
      return a.z - b.z;
    });
    this.index = 0;

    // this.fpsGraph = new Graph(100, 50);
    // document.body.appendChild(this.fpsGraph.canvas);

    this.debug = false;
  }

  StarField.prototype.update = function update(dt) {
    // Move camera forward
    this.z_last = this.z;
    this.z += this.speed * dt / 1000;

    var dr = this.maxRadius - this.minRadius;

    for (var _iterator = this.stars, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var star = _ref;

      // Check if star is out of view
      if (this.z - this.focalLength >= star.z) {
        // Increment this.index
        this.index = (this.index + 1) % this.numStars;
        // Push star back by 1 depth and randomize X, Y coordinates and radius
        star.x = Math.random() * this.width;
        star.y = Math.random() * this.height;
        star.z += this.depth;
        star.r = Math.random() * dr + this.minRadius;
      }
    }

    var t = undefined;
    if (mouse.down) {
      if (this.warpStart === 0) {
        this.warpStart = Date.now();
        t = this.t;
      } else {
        t = (Date.now() - this.warpStart) / 1000;
      }

      // MAXIMUM WARP, ENGAGE!
      this.warpMode = true;
      this.warpEnd = 0;
      var x = t < 1 ? 3 * (1 - t) * t * t + t * t * t : 1;
      this.warp = Math.min(Math.max(0, x), 1);
    } else {
      if (this.warpEnd === 0) {
        this.warpEnd = Date.now();
        t = 0;
      } else {
        t = (Date.now() - this.warpEnd) / 1000;
      }

      var x = t < 1 ? this.warp - (3 * (1 - t) * t * t + t * t * t) : 0;
      this.warp = Math.min(Math.max(0, x), 1);
      if (this.warp === 0) this.warpMode = false;
      this.warpStart = 0;
    }

    this.speed = lerp(2.4, 24, this.warp);
    this.focalLength = lerp(20, 10, this.warp);
  };

  StarField.prototype.draw = function draw(ctx, dt) {
    ctx.save();

    // Draw background
    ctx.fillStyle = "rgb(16,16,16)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Put origin in center of canvas
    ctx.translate(0.5 * ctx.canvas.width, 0.5 * ctx.canvas.height);

    var f = this.focalLength;

    // Stars
    // for (let star of this.stars) {
    for (var i = 0; i < this.numStars; ++i) {
      // Iterate backwards starting at this.index
      var index = this.index - 1 - i;
      if (index < 0) index += this.numStars;
      var star = this.stars[index];

      // Distance from star to focal point
      var z = star.z - this.z + f;
      if (z < 1) continue;

      // Pinhole camera projection transformation
      var sx = f * (star.x - this.x) / z;
      var sy = f * (star.y - this.y) / z;
      var sr = star.r * f / z;

      // Interpolate color based on depth
      var color = Math.floor(224 * Math.max(1 - z / this.depth, 0) + 16);
      ctx.fillStyle = "rgb(" + color + "," + color + "," + color + ")";

      // Alpha falloff as approaching focal point
      ctx.globalAlpha = Math.min(Math.max(0, 1 - Math.exp(-z + 1)), 1);

      if (this.warpMode) {
        // This should be correct, but produces jittery results
        // let wf = 1.0 + 20.0 * this.warp // warp factor
        // let z2 = star.z - (wf * (this.z_last - this.z) + this.z) + f

        // This seems to be more stable
        var wf = 1.0 + 0.2 * this.warp; // warp factor
        var z2 = wf * (star.z - this.z_last + f);

        // Pinhole camera projection transformation (rear)
        var sx2 = f * (star.x - this.x) / z2;
        var sy2 = f * (star.y - this.y) / z2;

        // Calculate angles to tangents
        var x1 = sx;
        var y1 = sy;
        var x2 = sx2;
        var y2 = sy2;
        var r1 = sr;
        var r2 = star.r * f / z2;
        var beta = Math.asin((r2 - r1) / Math.hypot(x2 - x1, y2 - y1));
        var a1 = Math.atan2(y1 - y2, x2 - x1) - beta;
        var a2 = Math.atan2(y2 - y1, x1 - x2) + beta;

        if (!isNaN(beta)) {
          // Connect two circles by their tangents
          ctx.beginPath();
          ctx.arc(x1, y1, r1, Math.PI / 2 - a1, Math.PI / 2 - a2, false);
          ctx.arc(x2, y2, r2, Math.PI / 2 - a2, Math.PI / 2 - a1, false);
          ctx.closePath();
          ctx.fill();
        } else {
          // One circle is inside the other, draw the larger circle
          ctx.beginPath();
          if (r1 > r2) ctx.arc(x1, y1, r1, 0, 2 * Math.PI, false);else ctx.arc(x2, y2, r2, 0, 2 * Math.PI, false);
          ctx.fill();
        }
      } else {
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, 2 * Math.PI, false);
        ctx.fill();
      }
    }

    ctx.restore();

    // Draw debug info
    if (this.debug) {
      ctx.font = "12px monospace";
      ctx.fillStyle = "rgb(255,255,255)";
      ctx.fillText("focal length: " + this.focalLength.toFixed(1) + " px", 4, 16);
      ctx.fillText("speed: " + this.speed.toFixed(1) + " px/s", 4, 32);
      ctx.fillText("index: " + this.index, 4, 48);
      ctx.fillText("fps: " + (1000 / dt).toFixed(0), 4, 64);

      this.fpsGraph.update(1000 / dt);
    }

    // Draw message
    // ctx.fillStyle = "#cc3333";
    // var textWidth = ctx.measureText('CLICK TO ENGAGE WARP DRIVE').width;
    // ctx.fillText('CLICK TO ENGAGE WARP DRIVE', (ctx.canvas.width - textWidth) / 2, ctx.canvas.height - 16);
  };

  return StarField;
}();

window.addEventListener('load', function () {
  var canvas = document.getElementById('stars');
  var ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var sf = new StarField(0, 0, 0, 2 * canvas.width, 2 * canvas.height, 100, 1000);
  sf.x = sf.width / 2;
  sf.y = sf.height / 2;

  canvas.addEventListener('mousedown', function (e) {
    return mouse.down = true;
  });
  canvas.addEventListener('mouseup', function (e) {
    return mouse.down = false;
  });

  // Reset canvas size, starfield size, and camera position on window resize
  window.addEventListener('resize', function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    sf.width = 2 * window.innerWidth;
    sf.height = 2 * window.innerHeight;
    sf.x = sf.width / 2;
    sf.y = sf.height / 2;
  });

  // Key combo Ctrl-` to toggle debug info
  window.addEventListener('keypress', function (e) {
    if (e.key === '`' && e.ctrlKey) sf.debug = !sf.debug;
  });

  var t0 = Date.now() - 1 / 60;
  function loop() {
    var dt = Date.now() - t0;
    t0 = Date.now();
    sf.update(dt);
    sf.draw(ctx, dt);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});