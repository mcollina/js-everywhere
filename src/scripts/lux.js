
var mg = require('metrics-graphics')

function lux(client) {

  var data = [{
    date: new Date(),
    value: 0
  }];

  var interval;

  client.on('connect', function() {
    client.subscribe('edison/lux/#')
  });

  client.on('message', function(topic, payload) {
    if (topic.indexOf('lux') < 0) {
      return;
    }

    data.push({
      date: new Date(),
      value: parseInt(payload.toString())
    });

    if (data.length > 60 * 5) {
      data.shift();
    }
  });

  function render() {
    MG.data_graphic({
      title: "Light in this room",
      data: data,
      width: 600,
      height: 250,
      target: '#lux',
      x_accessor: 'date',
      y_accessor: 'value',
      y_label: 'lux',
      small_text: true,
      interpolate: 'basis'
    })
  }

  function toArray(array) {
    return Array.prototype.slice.call(array)
  }

  toArray(document.querySelectorAll(".light-on")).forEach(function(el) {
    el.onclick = function() {
      console.log('led on')
      client.publish('edison/led', 'on')
    }
  })

  toArray(document.querySelectorAll(".light-off")).forEach(function(el) {
    el.onclick = function() {
      console.log('led off')
      client.publish('edison/led', 'off')
    }
  })

  return function(deck) {

    deck.on('activate', function() {
      var el = document.querySelector(".bespoke-active #lux");
      if (el) {
        render()
        interval = setInterval(render, 1000);
      }
      return true;
    });

    deck.on('deactivate', function() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      return true;
    });
  }
}

module.exports = lux
