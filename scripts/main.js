(function () {
  'use strict';

  var TILE_PATTERN = [
    [25, 26, 27, 28, 29],
    [30, 31, 32, 33, 34],
    [35, 20, 21, 37, 22],
    [38,  5, 16,  7,  8],
    [40, 41,  9, 10, 42],
    [43, 12, 13, 14, 44],
    [45, 6, 17, 18, 19]
  ];

  var PATTERN_COLS = TILE_PATTERN[0].length;
  var PATTERN_ROWS = TILE_PATTERN.length;
  var TILE_VW = 3.5;
  var GAP_VW = 1.25;

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  var allTiles = [];
  var s2Active = false;
  var flipTimeout = null;

  function buildTileGrid() {
    var section = document.getElementById('s2');
    var grid = document.getElementById('s2Grid');
    var textEl = section.querySelector('.s2-text');
    if (!section || !grid || !textEl) return;

    grid.innerHTML = '';
    allTiles = [];

    var vw = section.offsetWidth;
    var vh = section.offsetHeight;
    var tileSize = vw * TILE_VW / 100;
    var gap = vw * GAP_VW / 100;
    var step = tileSize + gap;

    var sRect = section.getBoundingClientRect();
    var tRect = textEl.getBoundingClientRect();
    var textL = tRect.left - sRect.left;
    var textT = tRect.top - sRect.top;
    var textR = textL + tRect.width;
    var textB = textT + tRect.height;
    var pad2 = step * 1.5;

    var cols = Math.ceil(vw / step) + 6;
    var rows = Math.ceil(vh / step) + 6;
    var gridW = cols * step - gap;
    var gridH = rows * step - gap;
    var ox = (vw - gridW) / 2;
    var oy = (vh - gridH) / 2;

    var frag = document.createDocumentFragment();
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = ox + c * step;
        var y = oy + r * step;
        if (x + tileSize > textL - pad2 && x < textR + pad2 &&
            y + tileSize > textT - pad2 && y < textB + pad2) {
          continue;
        }

        var tileIdx = TILE_PATTERN[r % PATTERN_ROWS][c % PATTERN_COLS];
        var div = document.createElement('div');
        div.className = 's2-tile';
        div.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + tileSize + 'px;height:' + tileSize + 'px';

        var inner = document.createElement('div');
        inner.className = 's2-tile__inner';

        var front = document.createElement('div');
        front.className = 's2-tile__front';
        var img = document.createElement('img');
        img.src = 'public/images/grid-tiles/tile-' + pad(tileIdx) + '.png';
        img.alt = '';
        img.loading = 'lazy';
        front.appendChild(img);

        var back = document.createElement('div');
        back.className = 's2-tile__back';

        inner.appendChild(front);
        inner.appendChild(back);
        div.appendChild(inner);
        frag.appendChild(div);
        allTiles.push(div);
      }
    }
    grid.appendChild(frag);
    seedInitialTiles();

    if (s2Active) startTileFlipping();
  }

  var TARGET_HIDDEN = 150;

  function seedInitialTiles() {
    if (allTiles.length === 0) return;
    for (var i = 0; i < allTiles.length; i++) {
      allTiles[i].classList.add('s2-tile--revealed');
    }
    var hideCount = Math.min(TARGET_HIDDEN, allTiles.length);
    var indices = [];
    for (var j = 0; j < allTiles.length; j++) indices.push(j);
    for (var k = indices.length - 1; k > 0; k--) {
      var r = Math.floor(Math.random() * (k + 1));
      var tmp = indices[k]; indices[k] = indices[r]; indices[r] = tmp;
    }
    for (var m = 0; m < hideCount; m++) {
      allTiles[indices[m]].classList.remove('s2-tile--revealed');
    }
  }

  function scheduleFlipBurst() {
    if (!s2Active || allTiles.length === 0) return;

    var revealedTiles = [];
    var hiddenTiles = [];
    for (var i = 0; i < allTiles.length; i++) {
      if (allTiles[i].classList.contains('s2-tile--revealed')) {
        revealedTiles.push(allTiles[i]);
      } else {
        hiddenTiles.push(allTiles[i]);
      }
    }

    var flipCount = Math.floor(2 + Math.random() * 5);

    for (var k = 0; k < flipCount; k++) {
      if (hiddenTiles.length > 0) {
        var ri = Math.floor(Math.random() * hiddenTiles.length);
        hiddenTiles.splice(ri, 1)[0].classList.add('s2-tile--revealed');
      }
      if (revealedTiles.length > 0) {
        var hi = Math.floor(Math.random() * revealedTiles.length);
        revealedTiles.splice(hi, 1)[0].classList.remove('s2-tile--revealed');
      }
    }

    var pause = 100 + Math.random() * 400;
    flipTimeout = setTimeout(scheduleFlipBurst, pause);
  }

  function startTileFlipping() {
    stopTileFlipping();
    scheduleFlipBurst();
  }

  function stopTileFlipping() {
    if (flipTimeout) {
      clearTimeout(flipTimeout);
      flipTimeout = null;
    }
  }

  function initS2Observer() {
    var s2 = document.getElementById('s2');
    if (!s2 || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          s2Active = true;
          startTileFlipping();
        } else {
          s2Active = false;
          stopTileFlipping();
        }
      });
    }, { threshold: 0.3 });

    observer.observe(s2);
  }

  function initS2CursorFlip() {
    var s2 = document.getElementById('s2');
    if (!s2) return;

    s2.addEventListener('mousemove', function (e) {
      var sRect = s2.getBoundingClientRect();
      var mx = e.clientX - sRect.left;
      var my = e.clientY - sRect.top;
      var vw = s2.offsetWidth;
      var tileSize = vw * TILE_VW / 100;
      var radius = tileSize * 0.6;
      var rSq = radius * radius;

      for (var i = 0; i < allTiles.length; i++) {
        var tile = allTiles[i];
        var tx = parseFloat(tile.style.left) + tileSize * 0.5;
        var ty = parseFloat(tile.style.top) + tileSize * 0.5;
        var dx = mx - tx;
        var dy = my - ty;
        if (dx * dx + dy * dy < rSq) {
          tile.classList.toggle('s2-tile--revealed');
        }
      }
    });
  }

  var resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildTileGrid, 200);
  }

  /* =============================================
     Section 3: Continuous sticker spawning
     ============================================= */

  var s3Active = false;
  var stickerTimeout = null;
  var STICKER_LIFETIME = 20000;

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawnOneSticker(container) {
    var img = document.createElement('img');
    img.src = 'public/images/S3-Sticker-2x.png';
    img.alt = '';
    img.className = 's3-sticker';

    var rotation = Math.round(randomRange(-40, 40));
    var top = randomRange(2, 68);

    var side = Math.random() < 0.5;
    var horizontalZone;
    if (side) {
      horizontalZone = randomRange(1, 22);
    } else {
      horizontalZone = randomRange(60, 92);
    }
    if (Math.random() < 0.2) {
      horizontalZone = randomRange(30, 55);
      top = randomRange(20, 50);
    }

    img.style.setProperty('--sticker-rotate', 'rotate(' + rotation + 'deg)');
    img.style.top = top + '%';
    img.style.left = horizontalZone + '%';

    container.appendChild(img);

    setTimeout(function () {
      if (img.parentNode) img.parentNode.removeChild(img);
    }, STICKER_LIFETIME + 100);
  }

  function scheduleBurst(container) {
    if (!s3Active) return;

    var burstCount = Math.random() < 0.3
      ? Math.floor(randomRange(5, 10))
      : Math.floor(randomRange(2, 5));

    var intraDelay = 0;
    for (var i = 0; i < burstCount; i++) {
      (function (d) {
        stickerTimeout = setTimeout(function () {
          if (s3Active) spawnOneSticker(container);
        }, d);
      })(intraDelay);
      intraDelay += Math.floor(randomRange(80, 250));
    }

    var pause = Math.random() < 0.35
      ? randomRange(1200, 2500)
      : randomRange(300, 800);

    stickerTimeout = setTimeout(function () {
      scheduleBurst(container);
    }, intraDelay + pause);
  }

  function startStickerLoop() {
    var container = document.getElementById('s3Stickers');
    if (!container) return;
    container.innerHTML = '';
    scheduleBurst(container);
  }

  function stopStickerLoop() {
    if (stickerTimeout) {
      clearTimeout(stickerTimeout);
      stickerTimeout = null;
    }
  }

  var s3MouseThrottled = false;

  function initS3CursorBoost() {
    var s3 = document.getElementById('s3');
    if (!s3) return;

    s3.addEventListener('mousemove', function () {
      if (!s3Active || s3MouseThrottled) return;
      s3MouseThrottled = true;

      var container = document.getElementById('s3Stickers');
      if (container) {
        spawnOneSticker(container);
      }

      setTimeout(function () {
        s3MouseThrottled = false;
      }, 600);
    });
  }

  function initS3Observer() {
    var s3 = document.getElementById('s3');
    if (!s3 || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          s3Active = true;
          startStickerLoop();
        } else {
          s3Active = false;
          stopStickerLoop();
          var container = document.getElementById('s3Stickers');
          if (container) container.innerHTML = '';
        }
      });
    }, { threshold: 0.3 });

    observer.observe(s3);
  }

  /* =============================================
     Scroll Progress Indicator
     Segment-based, visible from S3 (index 2) onwards.
     ============================================= */

  function initScrollIndicator() {
    var scrollContainer = document.querySelector('.sections');
    var indicator = document.getElementById('scrollIndicator');
    if (!scrollContainer || !indicator) return;

    var sections = scrollContainer.querySelectorAll('.section');
    var totalSections = sections.length;
    var startFrom = 2;
    var trackedCount = totalSections - startFrom;
    if (trackedCount <= 0) return;

    for (var i = 0; i < trackedCount; i++) {
      var seg = document.createElement('div');
      seg.className = 'scroll-indicator__segment';
      indicator.appendChild(seg);
    }

    var segments = indicator.querySelectorAll('.scroll-indicator__segment');

    function isDarkBg(bgColor) {
      var match = bgColor.match(/\d+/g);
      if (!match || match.length < 3) return false;
      var lum = (parseInt(match[0]) * 299 + parseInt(match[1]) * 587 + parseInt(match[2]) * 114) / 1000;
      return lum < 128;
    }

    function updateIndicator() {
      var currentIndex = Math.round(scrollContainer.scrollTop / scrollContainer.clientHeight);

      var visible = currentIndex >= startFrom;
      indicator.classList.toggle('scroll-indicator--visible', visible);

      if (!visible) return;

      var relIndex = currentIndex - startFrom;

      for (var i = 0; i < segments.length; i++) {
        segments[i].classList.toggle('scroll-indicator__segment--active', i === relIndex);
      }

      var currentSection = sections[currentIndex];
      if (currentSection) {
        var bg = window.getComputedStyle(currentSection).backgroundColor;
        indicator.classList.toggle('scroll-indicator--dark', !isDarkBg(bg));
      }
    }

    scrollContainer.addEventListener('scroll', updateIndicator);
    updateIndicator();
  }

  /* =============================================
     Adapt fixed UI (popup + logo) for dark sections
     ============================================= */

  function initDarkSectionAdapter() {
    var scrollContainer = document.querySelector('.sections');
    var popup = document.querySelector('.audio-popup');
    var logo = document.querySelector('.site-logo');
    if (!scrollContainer) return;

    var sections = scrollContainer.querySelectorAll('.section');

    function isDarkBg(bgColor) {
      var match = bgColor.match(/\d+/g);
      if (!match || match.length < 3) return false;
      var lum = (parseInt(match[0]) * 299 + parseInt(match[1]) * 587 + parseInt(match[2]) * 114) / 1000;
      return lum < 128;
    }

    function update() {
      var idx = Math.round(scrollContainer.scrollTop / scrollContainer.clientHeight);
      var sec = sections[idx];
      if (!sec) return;
      var bg = window.getComputedStyle(sec).backgroundColor;
      var dark = isDarkBg(bg);
      if (popup) popup.classList.toggle('audio-popup--on-dark', dark);
      if (logo) logo.classList.toggle('site-logo--light', dark);
    }

    scrollContainer.addEventListener('scroll', update);
    update();
  }

  /* =============================================
     Hero icon flicker on mouse move
     ============================================= */

  var HERO_ICON_COUNT = 23;
  var heroIconPaths = [];
  for (var hi = 0; hi < HERO_ICON_COUNT; hi++) {
    heroIconPaths.push('public/images/hero-icons/hero-icon-' + hi + '.png');
  }

  function initHeroIconFlicker() {
    var illo = document.getElementById('heroIllo');
    if (!illo) return;

    var preloaded = [];
    for (var i = 0; i < heroIconPaths.length; i++) {
      var img = new Image();
      img.src = heroIconPaths[i];
      preloaded.push(img);
    }

    var lastIndex = 0;
    var throttled = false;

    document.addEventListener('mousemove', function () {
      if (throttled) return;
      throttled = true;

      var next = lastIndex;
      while (next === lastIndex) {
        next = Math.floor(Math.random() * HERO_ICON_COUNT);
      }
      lastIndex = next;
      illo.src = heroIconPaths[next];

      setTimeout(function () { throttled = false; }, 60);
    });
  }

  /* =============================================
     Hero headline buzzy grain filter
     ============================================= */

  function initBuzzyGrain() {
    var noiseEls = document.querySelectorAll('.buzzy-noise');
    if (!noiseEls.length) return;

    var seed = 0;

    function buzz() {
      seed = (seed + 1) % 100;
      for (var i = 0; i < noiseEls.length; i++) {
        noiseEls[i].setAttribute('seed', seed);
      }
      requestAnimationFrame(buzz);
    }
    buzz();
  }

  /* =============================================
     Section 6: Cursor-driven warp/smear effect
     ============================================= */

  function initS6WarpEffect() {
    var s6 = document.getElementById('s6');
    if (!s6) return;

    var bgDiv = s6.querySelector('.s6-bg');
    var imgEl = s6.querySelector('.s6-bg__img');
    if (!bgDiv || !imgEl) return;

    var canvas = document.createElement('canvas');
    canvas.className = 's6-warp-canvas';
    var ctx = canvas.getContext('2d');

    var ready = false;
    var s6Active = false;
    var BRUSH = 60;
    var lastX = null;
    var lastY = null;

    var sourceImg = new Image();

    function sizeCanvas() {
      canvas.width = bgDiv.offsetWidth;
      canvas.height = bgDiv.offsetHeight;
      if (ready) drawFull();
    }

    function drawFull() {
      var cw = canvas.width;
      var ch = canvas.height;
      var iw = sourceImg.naturalWidth;
      var ih = sourceImg.naturalHeight;
      var scale = Math.max(cw / iw, ch / ih);
      var dw = iw * scale;
      var dh = ih * scale;
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
      ctx.drawImage(sourceImg, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    }

    function onImageReady() {
      if (ready) return;
      ready = true;
      sizeCanvas();
      imgEl.style.display = 'none';
      bgDiv.appendChild(canvas);
    }

    sourceImg.onload = onImageReady;
    sourceImg.src = imgEl.src;
    if (sourceImg.complete && sourceImg.naturalWidth > 0) {
      onImageReady();
    }

    function applySmear(x, y, nx, ny) {
      var mag = Math.sqrt(nx * nx + ny * ny);
      var sx = mag > 0.5 ? (nx / mag) * 3 : 0;
      var sy = mag > 0.5 ? (ny / mag) * 3 : 0;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, BRUSH, 0, Math.PI * 2);
      ctx.clip();
      ctx.filter = 'blur(4px)';
      ctx.globalAlpha = 0.6;
      ctx.drawImage(canvas, sx, sy);
      ctx.restore();
    }

    s6.addEventListener('mousemove', function (e) {
      if (!ready || !s6Active) return;
      var rect = canvas.getBoundingClientRect();
      var scaleX = canvas.width / rect.width;
      var scaleY = canvas.height / rect.height;
      var x = (e.clientX - rect.left) * scaleX;
      var y = (e.clientY - rect.top) * scaleY;

      if (lastX !== null) {
        var dx = x - lastX;
        var dy = y - lastY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var steps = Math.max(1, Math.ceil(dist / 8));
        for (var i = 1; i <= steps; i++) {
          var t = i / steps;
          applySmear(lastX + dx * t, lastY + dy * t, dx, dy);
        }
      }

      lastX = x;
      lastY = y;
    });

    s6.addEventListener('mouseenter', function (e) {
      var rect = canvas.getBoundingClientRect();
      lastX = (e.clientX - rect.left) * (canvas.width / rect.width);
      lastY = (e.clientY - rect.top) * (canvas.height / rect.height);
    });

    s6.addEventListener('mouseleave', function () {
      lastX = null;
      lastY = null;
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          s6Active = entry.isIntersecting;
          if (entry.isIntersecting && ready) sizeCanvas();
        });
      }, { threshold: 0.1 }).observe(s6);
    }

    window.addEventListener('resize', function () {
      if (ready) sizeCanvas();
    });
  }

  /* =============================================
     Section 7: Anti-gravity cash animation
     ============================================= */

  var BILL_COUNT = 14;

  function initS7Cash() {
    var s7 = document.getElementById('s7');
    var container = document.getElementById('s7Cash');
    if (!s7 || !container) return;

    var bills = [];

    function spawnBills() {
      container.innerHTML = '';
      bills = [];

      for (var i = 0; i < BILL_COUNT; i++) {
        var img = document.createElement('img');
        img.src = 'public/images/S7-Cash-2x.png';
        img.alt = '';
        img.className = 's7-cash__bill';

        var xPos = randomRange(-12, 88);
        var rotation = randomRange(-70, 70);
        var finalTop = randomRange(-14, -4);

        img.style.left = xPos + '%';
        img.style.top = '100%';
        img.style.transform = 'rotate(' + rotation + 'deg)';
        img.style.opacity = '0';

        img.dataset.finalTop = finalTop;
        img.dataset.rotation = rotation;
        img.dataset.delay = (i * 80 + randomRange(0, 100));

        container.appendChild(img);
        bills.push(img);
      }
    }

    function animateBillUp(bill) {
      var finalTop = parseFloat(bill.dataset.finalTop);
      var rot = parseFloat(bill.dataset.rotation);

      bill.style.opacity = '1';

      var startTime = null;
      var duration = randomRange(600, 1000);
      var startTop = 100;

      function tick(now) {
        if (!startTime) startTime = now;
        var elapsed = now - startTime;
        var t = Math.min(elapsed / duration, 1);

        var ease = t * t * t;
        var currentTop = startTop + (finalTop - startTop) * ease;

        bill.style.top = currentTop + '%';
        bill.style.transform = 'rotate(' + rot + 'deg)';

        if (t < 1) {
          requestAnimationFrame(tick);
        }
      }

      requestAnimationFrame(tick);
    }

    function launchBills() {
      for (var i = 0; i < bills.length; i++) {
        (function (bill) {
          var delay = parseFloat(bill.dataset.delay);
          setTimeout(function () {
            animateBillUp(bill);
          }, delay);
        })(bills[i]);
      }
    }

    spawnBills();

    var hasLaunched = false;

    var launchObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !hasLaunched) {
          hasLaunched = true;
          launchBills();
        }
      });
    }, { threshold: 0.3 });

    var resetObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting && hasLaunched) {
          hasLaunched = false;
          spawnBills();
        }
      });
    }, { threshold: 0 });

    launchObserver.observe(s7);
    resetObserver.observe(s7);
  }

  /* =============================================
     Parallax (scroll-driven)
     ============================================= */

  function initParallax() {
    var scrollContainer = document.querySelector('.sections');
    if (!scrollContainer) return;

    var parallaxEls = scrollContainer.querySelectorAll('[data-parallax-speed]');

    var cached = [];
    var vh = 0;

    function cacheLayout() {
      vh = scrollContainer.clientHeight;
      cached = [];
      for (var i = 0; i < parallaxEls.length; i++) {
        var el = parallaxEls[i];
        var section = el.closest('.section');
        if (!section) continue;
        cached.push({
          el: el,
          speed: parseFloat(el.getAttribute('data-parallax-speed')) || 0,
          sectionTop: section.offsetTop,
          sectionIdx: Math.round(section.offsetTop / vh)
        });
      }
    }

    cacheLayout();
    window.addEventListener('resize', cacheLayout);

    var ticking = false;

    function update() {
      var scrollTop = scrollContainer.scrollTop;
      var currentIdx = Math.round(scrollTop / vh);

      for (var i = 0; i < cached.length; i++) {
        var c = cached[i];
        if (Math.abs(c.sectionIdx - currentIdx) > 1) continue;
        var shift = (scrollTop - c.sectionTop) * c.speed;
        c.el.style.transform = 'translate3d(0,' + shift + 'px,0)';
      }

      ticking = false;
    }

    scrollContainer.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    });

    update();
  }

  /* =============================================
     Section 5: Cursor-driven OPEN SVG scaling
     ============================================= */

  function initS5CursorZoom() {
    var s5 = document.getElementById('s5');
    var s5Obj = document.getElementById('s5Svg');
    if (!s5 || !s5Obj) return;

    var s5SvgEl = null;
    var S5_NAT_W = 1696;
    var S5_NAT_H = 1454;
    var lastVB = '';

    function onSvgLoad() {
      try {
        var doc = s5Obj.contentDocument;
        if (doc) s5SvgEl = doc.querySelector('svg');
      } catch (e) { /* cross-origin */ }
    }

    s5Obj.addEventListener('load', onSvgLoad);
    if (s5Obj.contentDocument) onSvgLoad();

    function setZoom(normX, normY) {
      if (!s5SvgEl) return;

      var cx = normX * 2 - 1;
      var cy = normY * 2 - 1;
      var dist = Math.sqrt(cx * cx + cy * cy) / Math.SQRT2;
      dist = Math.min(1, dist);

      var factor = 1 - dist * 0.75;
      var vbW = Math.round(S5_NAT_W * factor);
      var vbH = Math.round(S5_NAT_H * factor);
      var vbX = Math.round((S5_NAT_W - vbW) / 2);
      var vbY = Math.round((S5_NAT_H - vbH) / 2);

      var newVB = vbX + ' ' + vbY + ' ' + vbW + ' ' + vbH;
      if (newVB !== lastVB) {
        s5SvgEl.setAttribute('viewBox', newVB);
        lastVB = newVB;
      }
    }

    s5.addEventListener('mousemove', function (e) {
      var rect = s5.getBoundingClientRect();
      var nx = (e.clientX - rect.left) / rect.width;
      var ny = (e.clientY - rect.top) / rect.height;
      nx = Math.max(0, Math.min(1, nx));
      ny = Math.max(0, Math.min(1, ny));
      setZoom(nx, ny);
    });

    s5.addEventListener('mouseleave', function () {
      setZoom(0.5, 0.5);
    });

    setZoom(0.5, 0.5);
  }

  /* =============================================
     Section 8: Podcast artwork layout
     ============================================= */

  var S8_CARDS = [
    { file: 4,  col: 1, row: 1 },
    { file: 6,  col: 3, row: 1 },
    { file: 11, col: 6, row: 1 },
    { file: 8,  col: 8, row: 1 },
    { file: 1,  col: 2, row: 2 },
    { file: 2,  col: 1, row: 3 },
    { file: 7,  col: 8, row: 2 },
    { file: 9,  col: 7, row: 3, span: true },
    { file: 3,  col: 1, row: 5 },
    { file: 5,  col: 3, row: 5 },
    { file: 13, col: 6, row: 5 },
    { file: 10, col: 8, row: 5 },
    { file: 0,  col: 2, row: 6 },
    { file: 12, col: 5, row: 6 }
  ];

  function initS8Artwork() {
    var container = document.getElementById('s8Artwork');
    if (!container) return;

    container.innerHTML = '';

    for (var i = 0; i < S8_CARDS.length; i++) {
      var pos = S8_CARDS[i];
      var card = document.createElement('div');
      card.className = 's8-artwork__card';
      card.style.gridColumn = pos.col;
      card.style.gridRow = pos.row;

      var img = document.createElement('img');
      img.src = 'public/images/podcast-artwork/artwork-' + pos.file + '.png';
      img.alt = '';
      img.loading = 'lazy';

      card.appendChild(img);
      container.appendChild(card);

      (function (el) {
        el.addEventListener('mouseenter', function () {
          if (el.classList.contains('is-flipping')) return;
          el.classList.add('is-flipping');
          el.addEventListener('animationend', function handler() {
            el.classList.remove('is-flipping');
            el.removeEventListener('animationend', handler);
          });
        });
      })(card);
    }
  }

  function initLoader() {
    if (window !== window.top) return;
    var loader = document.getElementById('loader');
    var graphicsWrap = document.getElementById('loaderGraphics');
    var hero = document.querySelector('.section--hero');
    if (!loader || !graphicsWrap) return;

    var iconsWrap = document.getElementById('loaderIcons');
    var graphics = iconsWrap ? iconsWrap.querySelectorAll('.loader__graphic') : graphicsWrap.querySelectorAll('.loader__graphic');
    var count = graphics.length;
    if (count === 0) return;

    hero.classList.add('hero--hidden');

    var scrollContainer = document.querySelector('.sections');
    if (scrollContainer) scrollContainer.style.overflow = 'hidden';

    var currentIdx = 0;
    var swapTimer;
    var SWAP_INTERVAL = 200;
    var TOTAL_DURATION = 3000;

    setTimeout(function () {
      graphicsWrap.classList.add('loader__graphics--visible');
    }, 100);

    function swapGraphic() {
      graphics[currentIdx].classList.remove('loader__graphic--active');
      currentIdx = (currentIdx + 1) % count;
      graphics[currentIdx].classList.add('loader__graphic--active');
    }

    swapTimer = setInterval(swapGraphic, SWAP_INTERVAL);

    setTimeout(function () {
      clearInterval(swapTimer);

      loader.classList.add('loader--exit');
      hero.classList.remove('hero--hidden');

      if (scrollContainer) scrollContainer.style.overflow = '';

      setTimeout(function () {
        loader.style.display = 'none';
      }, 600);
    }, TOTAL_DURATION);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initLoader();
    buildTileGrid();
    window.addEventListener('resize', onResize);
    initS2Observer();
    initS2CursorFlip();
    initS3Observer();
    initS3CursorBoost();
    initScrollIndicator();
    initDarkSectionAdapter();
    initHeroIconFlicker();
    initBuzzyGrain();
    initParallax();
    initS5CursorZoom();
    initS6WarpEffect();
    initS7Cash();
    initS8Artwork();
  });
})();
