// Require Node modules in the browser thanks to Browserify: http://browserify.org
var bespoke = require('bespoke'),
  classes = require('bespoke-classes'),
  keys = require('bespoke-keys'),
  touch = require('bespoke-touch'),
  bullets = require('bespoke-bullets'),
  backdrop = require('bespoke-backdrop'),
  scale = require('bespoke-scale'),
  hash = require('bespoke-hash'),
  progress = require('bespoke-progress'),
  run = require('bespoke-run'),
  jQuery = require('jquery')
  broker = 'ws://test.mosca.io:80',
  client = require('mqtt').connect(broker),
  blink = require('./blink'),
  forms = require('bespoke-forms');

global.jQuery = jQuery;
global.$ = jQuery;
var lux = require('./lux');

client.on('connect', function() {
  console.log('connected to', broker);
  client.subscribe('$SYS/#/publish/received');
});

client.on('message', function(topic, payload) {
  var el = document.querySelector("#broker-stats");
  if (topic.indexOf('publish/received') >= 0) {
    el.textContent = "Total messages " + payload.toString();
  }
})

// Bespoke.js
bespoke.from('article', [
  classes(),
  keys(),
  touch(),
  run(),
  bullets('li, .bullet'),
  backdrop(),
  scale(),
  hash(),
  progress(),
  forms(),
  lux(client),
  blink()
]);

// Prism syntax highlighting
// This is actually loaded from "bower_components" thanks to
// debowerify: https://github.com/eugeneware/debowerify
require('prism');

var fakeMqtt = Object.create(require('mqtt'));

fakeMqtt._connect = fakeMqtt.connect;
fakeMqtt.connect = function() {
  return this._connect(broker);
};

window.mqtt = fakeMqtt;

