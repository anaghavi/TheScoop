(function () {
  'use strict';

  var ILLO_COUNT = 25;
  var ILLO_BASE = 'public/images/illustrations/illo-';

  document.addEventListener('DOMContentLoaded', function () {
    var fields = document.querySelectorAll('.gen-field');

    fields.forEach(function (field) {
      var input = field.querySelector('.gen-field__input');
      if (!input) return;

      input.addEventListener('focus', function () {
        field.classList.add('gen-field--active');
      });

      input.addEventListener('blur', function () {
        field.classList.remove('gen-field--active');
        if (input.value.trim() !== '') {
          field.classList.add('gen-field--filled');
        } else {
          field.classList.remove('gen-field--filled');
        }
      });

      if (input.value.trim() !== '') {
        field.classList.add('gen-field--filled');
      }
    });

    var form = document.getElementById('genForm');
    var submitBtn = document.getElementById('genSubmit');
    var progressEl = document.getElementById('genProgress');
    var pctEl = document.getElementById('genPct');
    var artworkIllo = document.getElementById('artworkIllo');
    var artworkInner = document.querySelector('.gen-artwork__inner');
    var artworkBizName = document.getElementById('artworkBizName');
    var artworkPlay = document.getElementById('artworkPlay');
    var bizNameInput = document.getElementById('genBizName');
    var nameInput = document.getElementById('genName');

    function updateBizName() {
      var biz = bizNameInput ? bizNameInput.value.trim() : '';
      var name = nameInput ? nameInput.value.trim() : '';
      if (biz) {
        artworkBizName.textContent = biz;
      } else if (name) {
        artworkBizName.textContent = name;
      } else {
        artworkBizName.textContent = '';
      }
    }

    if (bizNameInput) bizNameInput.addEventListener('input', updateBizName);
    if (nameInput) nameInput.addEventListener('input', updateBizName);

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      submitBtn.disabled = true;
      submitBtn.textContent = 'Generating…';
      progressEl.classList.add('gen-progress--visible');

      updateBizName();

      var pct = 0;
      var lastIlloIdx = -1;

      var shuffleTimer = setInterval(function () {
        var idx;
        do {
          idx = Math.floor(Math.random() * ILLO_COUNT);
        } while (idx === lastIlloIdx);
        lastIlloIdx = idx;
        artworkIllo.src = ILLO_BASE + idx + '.png';
      }, 180);

      var progressTimer = setInterval(function () {
        pct += Math.floor(Math.random() * 6) + 2;
        if (pct > 100) pct = 100;
        pctEl.textContent = pct + '%';

        if (pct >= 100) {
          clearInterval(progressTimer);
          clearInterval(shuffleTimer);
          submitBtn.textContent = 'Done!';

          artworkIllo.style.opacity = '0';
          artworkInner.style.backgroundImage = 'url(public/images/podcast-bg.png)';

          artworkPlay.classList.add('gen-artwork__play--visible');
        }
      }, 350);
    });
  });
})();
