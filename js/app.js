/* ========================================
   Delulu Score - App Logic
   12 questions, 4 options each (0-3 pts)
   Score = (raw/36)*100, 5 tiers
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
    var TOTAL_QUESTIONS = 12;
    var MAX_RAW = 36; // 12 questions * 3 max points each

    // Points per option for each question: [a, b, c, d]
    var pointMap = [
      [0, 1, 2, 3], // q1
      [0, 1, 2, 3], // q2
      [0, 1, 2, 3], // q3
      [0, 1, 2, 3], // q4
      [0, 1, 2, 3], // q5
      [0, 1, 2, 3], // q6
      [0, 1, 2, 3], // q7
      [0, 1, 2, 3], // q8
      [0, 1, 2, 3], // q9
      [0, 1, 2, 3], // q10
      [0, 1, 2, 3], // q11
      [0, 1, 2, 3]  // q12
    ];

    // --- State ---
    var currentQuestion = 0;
    var totalPoints = 0;

    // --- DOM Elements ---
    var startScreen = document.getElementById('start-screen');
    var quizScreen = document.getElementById('quiz-screen');
    var resultScreen = document.getElementById('result-screen');
    var startBtn = document.getElementById('start-btn');
    var progressFill = document.getElementById('progress-fill');
    var currentQEl = document.getElementById('current-q');
    var totalQEl = document.getElementById('total-q');
    var questionText = document.getElementById('question-text');
    var optionsContainer = document.getElementById('options-container');
    var quizCard = document.querySelector('.quiz-card');
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
      if (quizScreen.classList.contains('active')) {
        renderQuestion(currentQuestion);
      }
      if (resultScreen.classList.contains('active')) {
        var finalScore = Math.round((totalPoints / MAX_RAW) * 100);
        if (finalScore > 100) finalScore = 100;
        showResult(finalScore);
      }
    });

    // --- Screen Navigation ---
    function showScreen(screen) {
      [startScreen, quizScreen, resultScreen].forEach(function (s) {
        s.classList.remove('active');
      });
      screen.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- Start Quiz ---
    startBtn.addEventListener('click', function () {
      currentQuestion = 0;
      totalPoints = 0;
      showScreen(quizScreen);
      renderQuestion(0);

      // GA4 event
      if (typeof gtag === 'function') {
        gtag('event', 'quiz_start', {
          event_category: 'delulu_score'
        });
      }
    });

    // --- Render Question ---
    function renderQuestion(index) {
      var qNum = index + 1;
      currentQEl.textContent = qNum;
      totalQEl.textContent = TOTAL_QUESTIONS;
      progressFill.style.width = ((qNum / TOTAL_QUESTIONS) * 100) + '%';

      var qKey = 'questions.q' + qNum + '.text';
      questionText.textContent = t(qKey) || qKey;

      optionsContainer.innerHTML = '';
      var optionKeys = ['a', 'b', 'c', 'd'];

      optionKeys.forEach(function (key, idx) {
        var btn = document.createElement('button');
        btn.className = 'option-btn';
        var optKey = 'questions.q' + qNum + '.options.' + key;
        btn.textContent = t(optKey) || optKey;
        btn.addEventListener('click', function () {
          selectOption(index, idx);
        });
        optionsContainer.appendChild(btn);
      });
    }

    // --- Select Option ---
    function selectOption(questionIndex, optionIndex) {
      var points = pointMap[questionIndex][optionIndex];
      totalPoints += points;

      // Highlight selected
      var buttons = optionsContainer.querySelectorAll('.option-btn');
      buttons[optionIndex].classList.add('selected');

      // Disable all buttons
      buttons.forEach(function (btn) {
        btn.disabled = true;
        btn.style.pointerEvents = 'none';
      });

      // Next question or result
      setTimeout(function () {
        if (currentQuestion < TOTAL_QUESTIONS - 1) {
          currentQuestion++;
          quizCard.classList.add('slide-out');
          setTimeout(function () {
            renderQuestion(currentQuestion);
            quizCard.classList.remove('slide-out');
            quizCard.classList.add('slide-in');
            setTimeout(function () {
              quizCard.classList.remove('slide-in');
            }, 300);
          }, 300);
        } else {
          // Calculate percentage
          var finalScore = Math.round((totalPoints / MAX_RAW) * 100);
          if (finalScore > 100) finalScore = 100;
          showScreen(resultScreen);
          showResult(finalScore);
        }
      }, 400);
    }

    // --- Get Tier ---
    function getTier(score) {
      if (score >= 81) return 'movie';
      if (score >= 61) return 'daydreamer';
      if (score >= 41) return 'solulu';
      if (score >= 21) return 'slightly';
      return 'grounded';
    }

    // --- Tier Emojis ---
    var tierEmojis = {
      grounded: '\u{1F9CA}',    // ice cube
      slightly: '\u{1F324}\uFE0F', // sun behind small cloud
      solulu: '\u2728',          // sparkles
      daydreamer: '\u{1F98B}',  // butterfly
      movie: '\u{1F3AC}'        // clapper board
    };

    // --- Tier CSS classes ---
    var tierClasses = {
      grounded: 'tier-grounded',
      slightly: 'tier-slightly',
      solulu: 'tier-solulu',
      daydreamer: 'tier-daydreamer',
      movie: 'tier-movie'
    };

    // --- Animate Score Counter ---
    function animateCounter(target, duration) {
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        // Ease out cubic
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
      // Circle circumference = 2 * PI * 85 ~= 534
      var circumference = 534;
      var offset = circumference - (circumference * score / 100);
      // Reset first
      meterArc.style.transition = 'none';
      meterArc.style.strokeDashoffset = circumference;
      // Force reflow
      void meterArc.offsetWidth;
      // Animate
      meterArc.style.transition = 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)';
      setTimeout(function () {
        meterArc.style.strokeDashoffset = offset;
      }, 100);
    }

    // --- Show Result ---
    function showResult(score) {
      var tier = getTier(score);

      // Emoji
      document.getElementById('result-emoji').textContent = tierEmojis[tier];

      // Animate score
      animateCounter(score, 2000);

      // Animate meter
      animateMeter(score);

      // Tier name with styling
      var tierEl = document.getElementById('result-tier');
      tierEl.textContent = t('results.' + tier + '.name');
      // Remove all tier classes, add current
      Object.values(tierClasses).forEach(function (cls) {
        tierEl.classList.remove(cls);
      });
      tierEl.classList.add(tierClasses[tier]);

      // Description (tagline)
      document.getElementById('result-desc').textContent = t('results.' + tier + '.tagline');

      // Analysis
      document.getElementById('result-analysis').textContent = t('results.' + tier + '.analysis');

      // GA4 event
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
      var shareText = t('share.text') || 'My Delulu Score: {score}% - {tier}!';
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
      currentQuestion = 0;
      totalPoints = 0;
      showScreen(startScreen);

      if (typeof gtag === 'function') {
        gtag('event', 'quiz_retake', {
          event_category: 'delulu_score'
        });
      }
    });

    // --- Hide Loader ---
    var loader = document.getElementById('app-loader');
    if (loader) {
      loader.classList.add('hidden');
    }

  } catch (e) {
    // i18n or init error - hide loader anyway
    console.error('App init error:', e);
    var loader = document.getElementById('app-loader');
    if (loader) loader.classList.add('hidden');
  }
})();
