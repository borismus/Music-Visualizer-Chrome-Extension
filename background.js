var context;
var source;
var analyser;
var buffer;
var freqs;
var timer;
var isPlaying = false;

document.addEventListener('DOMContentLoaded', function() {
  // If web audio API is disabled, redirect to an instruction page
  if (! window.webkitAudioContext) {
    chrome.tabs.create({url: 'webaudio.html'});
    return;
  }

  // Start off by initializing some web audio API goodness
  context = new webkitAudioContext();
  source = context.createBufferSource();
  analyser = context.createAnalyser();

  // Connect graph
  source.connect(analyser);
  analyser.connect(context.destination);
  loadAudioBuffer('song.mp3');

  // Whenever the page action is clicked, toggle playback
  chrome.browserAction.onClicked.addListener(togglePlayback);
});

// Toggle playback
function togglePlayback() {
  if (isPlaying) {
    // Stop playback
    source.buffer = null;
    // Stop drawing the music visualizer
    clearInterval(timer);
    drawPaused();
  } else {
    // Start playback
    source.noteOn(0.0);
    source.buffer = buffer;
    // Start the music visualizer timer
    // Note: requestAnimationFrame doesn't work in background pages!
    timer = setInterval(draw, 17);
  }
  isPlaying = !isPlaying;
}

function loadAudioBuffer(url) {
  drawLoading();
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  request.onload = function() {
    buffer = context.createBuffer(request.response, false);
    source.buffer = buffer;
    source.looping = true;
    freqs = new Uint8Array(analyser.frequencyBinCount);

    // Start with the icon paused
    drawPaused(true);
  }

  request.send();
}

function draw() {
  analyser.smoothingTimeConstant = 0.3;
  // Get the frequency data from the currently playing music
  analyser.getByteFrequencyData(freqs);
  // Sample 19 points from the distribution
  var width = parseInt(freqs.length / 19, 10);
  var canvas = document.getElementById('canvas');
  var drawContext = canvas.getContext('2d');
  drawContext.clearRect(0, 0, 19, 19);
  // Draw a frame around the visualizer
  frameHelper(drawContext);
  // Draw the visualizer itself
  for (var i = 0; i < 20; i++) {
    var value = freqs[i * width];
    percent = value / 256;
    var height = 19 * percent;
    var offset = 18 - height;
    // drawContext.fillStyle = 'rgb(255, 0, 0)';
    drawContext.fillStyle = 'hsl(' + (10 + (2*i)) + ', 100%, 50%)';
    drawContext.fillRect(i, offset, 1, height);
  }
  // Display visualizer in the browser action, extracting it from the
  // canvas element.
  var imageData = drawContext.getImageData(0, 0, 19, 19);
  chrome.browserAction.setIcon({
    imageData: imageData
  });
}

function drawPaused(clear) {
  var canvas = document.getElementById('canvas');
  var drawContext = canvas.getContext('2d');
  // Draw a pause button
  playButtonHelper(drawContext, clear);
  // Display canvas data in the icon
  var imageData = drawContext.getImageData(0, 0, 19, 19);
  chrome.browserAction.setIcon({
    imageData: imageData
  });
}

function drawLoading() {
  var canvas = document.getElementById('canvas');
  var drawContext = canvas.getContext('2d');
  loadingButtonHelper(drawContext);
  var imageData = drawContext.getImageData(0, 0, 19, 19);
  chrome.browserAction.setIcon({
    imageData: imageData
  });
}

function loadingButtonHelper(context) {
  context.fillStyle = '#000';
  context.fillRect(3, 8, 3, 3);
  context.fillRect(8, 8, 3, 3);
  context.fillRect(13, 8, 3, 3);
}

function playButtonHelper(context, clear) {
  if (clear) {
    context.clearRect(0, 0, 19, 19);
  }
  context.beginPath();
  context.lineWidth = '0.5';
  context.moveTo(4, 4);
  context.lineTo(4, 15);
  context.lineTo(15, 10);
  context.closePath();
  context.fillStyle = 'rgba(0,0,0,0.7)';
  context.strokeStyle = '#000';
  context.fill();
  context.stroke();
}

function frameHelper(context) {
  context.beginPath();
  context.moveTo(0, 19);
  context.lineTo(19, 19);
  context.strokeStyle = '#666';
  context.stroke();
}
