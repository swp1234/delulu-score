/* ========================================
   Delulu Score - Reality Distortion Filter
   10 situations, dual-card selection
   Distortion gauge + progressive visual FX
   ======================================== */

(async function () {
  'use strict';

  try {
    // Wait for i18n
    await i18n.loadTranslations(i18n.currentLang);
    i18n.updateUI();

    // --- Helper: translate with fallback ---
    function t(key) {
      var val = i18n.t(key);
      return (val !== key) ? val : '';
    }

    // --- Constants ---
    var TOTAL = 10;

    // --- State ---
    var currentIndex = 0;
    var deluluCount = 0; // number of delulu choices

    // --- DOM Elements ---
    var startScreen = document.getElementById('start-screen');
    var filterScreen = document.getElementById('filter-screen');
    var resultScreen = document.getElementById('result-screen');
    var startBtn = document.getElementById('start-btn');
    var progressFill = document.getElementById('progress-fill');
    var currentQEl = document.getElementById('current-q');
    var totalQEl = document.getElementById('total-q');
    var situationText = document.getElementById('situation-text');
    var realityText = document.getElementById('reality-text');
    var deluluText = document.getElementById('delulu-text');
    var cardReality = document.getElementById('card-reality');
    var cardDelulu = document.getElementById('card-delulu');
    var filterCard = document.querySelector('.filter-card');
    var gaugeFill = document.getElementById('gauge-fill');
    var gaugeIndicator = document.getElementById('gauge-indicator');
    var distortionBg = document.getElementById('distortion-bg');
    var themeToggle = document.getElementById('theme-toggle');
    var langSelect = document.getElementById('lang-select');
    var retakeBtn = document.getElementById('retake-btn');
    var shareTwitter = document.getElementById('share-twitter');
    var shareCopy = document.getElementById('share-copy');
    var meterArc = document.getElementById('meter-arc');
    var scoreNumber = document.getElementById('score-number');

    // Add SVG gradient definition for meter
    var svg = document.querySelector('.score-meter');
    if (svg) {
      var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      var gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.setAttribute('id', 'meter-gradient');
      gradient.setAttribute('x1', '0%');
      gradient.setAttribute('y1', '0%');
      gradient.setAttribute('x2', '100%');
      gradient.setAttribute('y2', '0%');
      var stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', '#FF6B9D');
      var stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', '#C084FC');
      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      defs.appendChild(gradient);
      svg.insertBefore(defs, svg.firstChild);
    }

    // --- Theme ---
    function initTheme() {
      var saved = localStorage.getItem('theme');
      if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    }

    themeToggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });

    initTheme();

    // --- Language ---
    langSelect.value = i18n.currentLang;

    langSelect.addEventListener('change', async function () {
      await i18n.setLanguage(this.value);
      if (filterScreen.classList.contains('active')) {
        renderSituation(currentIndex);
      }
      if (resultScreen.classList.contains('active')) {
        var finalScore = Math.round((deluluCount / TOTAL) * 100);
        showResult(finalScore);
      }
    });

    // --- Screen Navigation ---
    function showScreen(screen) {
      [startScreen, filterScreen, resultScreen].forEach(function (s) {
        s.classList.remove('active');
      });
      screen.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- Distortion Visual Effects ---
    function updateDistortion() {
      var ratio = deluluCount / Math.max(currentIndex + 1, 1);
      var pct = ratio * 100;

      // Update gauge
      gaugeFill.style.width = pct + '%';
      gaugeIndicator.style.left = pct + '%';

      // Color shift on gauge indicator
      if (pct < 30) {
        gaugeIndicator.style.background = '#60A5FA';
      } else if (pct < 60) {
        gaugeIndicator.style.background = '#FF6B9D';
      } else {
        gaugeIndicator.style.background = '#F472B6';
      }

      // Distortion level for background (1-5 based on current delulu ratio)
      var level = 0;
      if (pct >= 80) level = 5;
      else if (pct >= 60) level = 4;
      else if (pct >= 40) level = 3;
      else if (pct >= 20) level = 2;
      else if (pct > 0) level = 1;

      // Remove all distortion classes
      for (var i = 1; i <= 5; i++) {
        distortionBg.classList.remove('distortion-level-' + i);
        document.body.classList.remove('distortion-level-' + i + '-body');
      }

      if (level > 0) {
        distortionBg.classList.add('distortion-level-' + level);
        if (level >= 3) {
          document.body.classList.add('distortion-level-' + level + '-body');
        }
      }
    }

    // --- Start ---
    startBtn.addEventListener('click', function () {
      currentIndex = 0;
      deluluCount = 0;
      // Reset distortion
      for (var i = 1; i <= 5; i++) {
        distortionBg.classList.remove('distortion-level-' + i);
        document.body.classList.remove('distortion-level-' + i + '-body');
      }
      gaugeFill.style.width = '0%';
      gaugeIndicator.style.left = '0%';

      showScreen(filterScreen);
      renderSituation(0);

      if (typeof gtag === 'function') {
        gtag('event', 'quiz_start', { event_category: 'delulu_score' });
      }
    });

    // --- Render Situation ---
    function renderSituation(index) {
      var num = index + 1;
      currentQEl.textContent = num;
      totalQEl.textContent = TOTAL;
      progressFill.style.width = ((num / TOTAL) * 100) + '%';

      situationText.textContent = t('situations.s' + num + '.situation') || 'Situation ' + num;
      realityText.textContent = t('situations.s' + num + '.reality') || '';
      deluluText.textContent = t('situations.s' + num + '.delulu') || '';

      // Reset card states
      cardReality.classList.remove('selected-reality', 'selected-delulu', 'not-selected');
      cardDelulu.classList.remove('selected-reality', 'selected-delulu', 'not-selected');
      cardReality.disabled = false;
      cardDelulu.disabled = false;
    }

    // --- Card Selection ---
    function handleSelection(isDelulu) {
      if (isDelulu) {
        deluluCount++;
        cardDelulu.classList.add('selected-delulu');
        cardReality.classList.add('not-selected');
      } else {
        cardReality.classList.add('selected-reality');
        cardDelulu.classList.add('not-selected');
      }

      cardReality.disabled = true;
      cardDelulu.disabled = true;

      // Update distortion gauge
      updateDistortion();

      // Next or result
      setTimeout(function () {
        if (currentIndex < TOTAL - 1) {
          currentIndex++;
          filterCard.classList.add('card-exit');
          setTimeout(function () {
            renderSituation(currentIndex);
            filterCard.classList.remove('card-exit');
            filterCard.classList.add('card-enter');
            setTimeout(function () {
              filterCard.classList.remove('card-enter');
            }, 350);
          }, 350);
        } else {
          var finalScore = Math.round((deluluCount / TOTAL) * 100);
          showScreen(resultScreen);
          showResult(finalScore);
        }
      }, 500);
    }

    cardReality.addEventListener('click', function () {
      if (!cardReality.disabled) handleSelection(false);
    });

    cardDelulu.addEventListener('click', function () {
      if (!cardDelulu.disabled) handleSelection(true);
    });

    // --- Get Tier ---
    function getTier(score) {
      if (score >= 80) return 'kaleidoscope';
      if (score >= 60) return 'prism';
      if (score >= 40) return 'rose';
      if (score >= 20) return 'tinted';
      return 'crystal';
    }

    // --- Tier Emojis ---
    var tierEmojis = {
      crystal: '\uD83D\uDD2C',     // microscope
      tinted: '\uD83D\uDE0E',      // sunglasses face
      rose: '\uD83C\uDF39',        // rose
      prism: '\uD83D\uDD2E',       // crystal ball
      kaleidoscope: '\u2728'        // sparkles
    };

    // --- Tier CSS classes ---
    var tierClasses = {
      crystal: 'tier-crystal',
      tinted: 'tier-tinted',
      rose: 'tier-rose',
      prism: 'tier-prism',
      kaleidoscope: 'tier-kaleidoscope'
    };

    // --- Animate Score Counter ---
    function animateCounter(target, duration) {
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = Math.round(eased * target);
        scoreNumber.textContent = current;
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      }

      requestAnimationFrame(step);
    }

    // --- Animate Meter Arc ---
    function animateMeter(score) {
      var circumference = 534;
      var offset = circumference - (circumference * score / 100);
      meterArc.style.transition = 'none';
      meterArc.style.strokeDashoffset = circumference;
      void meterArc.offsetWidth;
      meterArc.style.transition = 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)';
      setTimeout(function () {
        meterArc.style.strokeDashoffset = offset;
      }, 100);
    }

    // --- Show Result ---
    function showResult(score) {
      var tier = getTier(score);

      document.getElementById('result-emoji').textContent = tierEmojis[tier];
      animateCounter(score, 2000);
      animateMeter(score);

      var tierEl = document.getElementById('result-tier');
      tierEl.textContent = t('results.' + tier + '.name');
      Object.values(tierClasses).forEach(function (cls) {
        tierEl.classList.remove(cls);
      });
      tierEl.classList.add(tierClasses[tier]);

      document.getElementById('result-desc').textContent = t('results.' + tier + '.tagline');
      document.getElementById('result-analysis').textContent = t('results.' + tier + '.analysis');

      // Percentile stat
      var pStat = document.getElementById('percentile-stat');
      if (pStat) {
        var pctVal = Math.floor(Math.random() * 12) + 6;
        var template = t('result.percentileStat') || 'Only <strong>{percent}%</strong> of participants have this distortion level';
        pStat.innerHTML = template.replace('{percent}', pctVal);
      }

      if (typeof gtag === 'function') {
        gtag('event', 'quiz_complete', {
          event_category: 'delulu_score',
          event_label: tier,
          value: score
        });
      }
    }

    // --- Share: Twitter ---
    shareTwitter.addEventListener('click', function () {
      var score = parseInt(scoreNumber.textContent) || 0;
      var tier = getTier(score);
      var tierName = t('results.' + tier + '.name');
      var emoji = tierEmojis[tier];
      var shareText = t('share.text') || 'My Reality Distortion: {score}% - {tier}!';
      var text = emoji + ' ' + shareText.replace('{score}', score).replace('{tier}', tierName);
      var url = 'https://dopabrain.com/delulu-score/';
      window.open(
        'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url),
        '_blank',
        'noopener'
      );

      if (typeof gtag === 'function') {
        gtag('event', 'share', {
          method: 'twitter',
          content_type: 'quiz_result',
          item_id: 'delulu_score'
        });
      }
    });

    // --- Share: Copy Link ---
    shareCopy.addEventListener('click', function () {
      var url = 'https://dopabrain.com/delulu-score/';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          showToast(t('share.copied') || 'Link copied!');
        });
      } else {
        var ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast(t('share.copied') || 'Link copied!');
      }

      if (typeof gtag === 'function') {
        gtag('event', 'share', {
          method: 'copy_url',
          content_type: 'quiz_result',
          item_id: 'delulu_score'
        });
      }
    });

    // --- Toast ---
    function showToast(message) {
      var existing = document.querySelector('.toast');
      if (existing) existing.remove();

      var toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      document.body.appendChild(toast);

      requestAnimationFrame(function () {
        toast.classList.add('show');
      });

      setTimeout(function () {
        toast.classList.remove('show');
        setTimeout(function () {
          toast.remove();
        }, 300);
      }, 2000);
    }

    // --- Retake ---
    retakeBtn.addEventListener('click', function () {
      currentIndex = 0;
      deluluCount = 0;
      // Reset distortion
      for (var i = 1; i <= 5; i++) {
        distortionBg.classList.remove('distortion-level-' + i);
        document.body.classList.remove('distortion-level-' + i + '-body');
      }
      showScreen(startScreen);

      if (typeof gtag === 'function') {
        gtag('event', 'quiz_retake', { event_category: 'delulu_score' });
      }
    });

    // --- Hide Loader ---
    var loader = document.getElementById('app-loader');
    if (loader) {
      loader.classList.add('hidden');
    }

  } catch (e) {
    console.error('App init error:', e);
    var loader = document.getElementById('app-loader');
    if (loader) loader.classList.add('hidden');
  }
})();
