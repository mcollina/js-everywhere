
module.exports = function blink () {
  return function (deck) {
    var interval;

    deck.on('activate', function() {
      var el = document.querySelector(".bespoke-active .blink");
      if (el) {
        interval = setInterval(render, 500, el);
        render(el);
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

    function render (el) {
      el.style.visibility = (el.style.visibility === 'hidden') ? 'visible' : 'hidden';
    }
  }
}
