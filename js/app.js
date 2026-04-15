/* ========================================
   Delulu Score - App Logic
   12 questions, 4 options each (0-3 pts)
   Score = (raw/36)*100, 5 tiers
   ======================================== */

(async function () {
  'use strict';

  try {
    await i18n.loadTranslations(i18n.currentLang);
    i18n.updateUI();

    function t(key) {
      var val = i18n.t(key);
      return (val !== key) ? val : '';
    }

    var TOTAL_QUESTIONS = 12;
    var MAX_RAW = 36;
    var pointMap = [
      [0, 1, 2, 3],
      [0, 1, 2, 3],
      [0, 1, 2, 3],
      [0, 1, 2, 3],
      [0, 1, 2, 3],
      [0, 1, 2, 3],
      [0, 1, 2, 3],
      [0, 1, 2, 3],
      [0, 1, 2, 3],
      [0, 1, 2, 3],
      [0, 1, 2, 3],
      [0, 1, 2, 3]
    ];

    var recommendationMap = {
      grounded: ['attachment-style', 'eq-test', 'mbti-love', 'rizz-score'],
      slightly: ['rizz-score', 'attachment-style', 'eq-test', 'mbti-love'],
      solulu: ['rizz-score', 'mbti-love', 'eq-test', 'attachment-style'],
      daydreamer: ['mbti-love', 'rizz-score', 'attachment-style', 'eq-test'],
      movie: ['mbti-love', 'rizz-score', 'eq-test', 'attachment-style']
    };

    var currentQuestion = 0;
    var totalPoints = 0;
    var currentScore = 0;
    var currentTier = null;
    var resultInlineAdLoaded = false;

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
    var relatedGrid = document.getElementById('related-grid');
    var relatedTests = document.getElementById('related-tests');
    var primaryRelatedEmoji = document.getElementById('primary-related-emoji');
    var primaryRelatedTitle = document.getElementById('primary-related-title');
    var primaryRelatedDesc = document.getElementById('primary-related-desc');
    var primaryRelatedCta = document.getElementById('primary-related-cta');
    var primaryRelatedCtaText = document.getElementById('primary-related-cta-text');
    var relatedJumpBtn = document.getElementById('related-jump-btn');
    var resultInlineAd = document.getElementById('result-inline-ad');

    var tierEmojis = {
      grounded: '\u{1F9CA}',
      slightly: '\u{1F324}\uFE0F',
      solulu: '\u2728',
      daydreamer: '\u{1F98B}',
      movie: '\u{1F3AC}'
    };

    var tierClasses = {
      grounded: 'tier-grounded',
      slightly: 'tier-slightly',
      solulu: 'tier-solulu',
      daydreamer: 'tier-daydreamer',
      movie: 'tier-movie'
    };

    function trackEvent(name, params) {
      if (typeof gtag !== 'function') {
        return;
      }
      gtag('event', name, params || {});
    }

    function getCurrentLang() {
      if (window.i18n && typeof window.i18n.getCurrentLanguage === 'function') {
        return window.i18n.getCurrentLanguage();
      }
      return i18n.currentLang || document.documentElement.lang || 'en';
    }

    function getShareUrl() {
      var url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('lang', getCurrentLang());
      return url.toString();
    }

    function getTier(score) {
      if (score >= 81) return 'movie';
      if (score >= 61) return 'daydreamer';
      if (score >= 41) return 'solulu';
      if (score >= 21) return 'slightly';
      return 'grounded';
    }

    function prioritizeRelatedCards(tier) {
      if (!relatedGrid) {
        return;
      }

      var cards = Array.prototype.slice.call(relatedGrid.querySelectorAll('.related-card'));
      var order = recommendationMap[tier] || recommendationMap.solulu;
      var rankMap = {};

      order.forEach(function (key, index) {
        rankMap[key] = index;
      });

      cards.sort(function (a, b) {
        var aKey = a.getAttribute('data-related-key') || '';
        var bKey = b.getAttribute('data-related-key') || '';
        var aRank = Object.prototype.hasOwnProperty.call(rankMap, aKey) ? rankMap[aKey] : 999;
        var bRank = Object.prototype.hasOwnProperty.call(rankMap, bKey) ? rankMap[bKey] : 999;
        return aRank - bRank;
      });

      cards.forEach(function (card, index) {
        card.classList.toggle('is-featured', index < 2);
        card.setAttribute('data-rank', String(index + 1));
        relatedGrid.appendChild(card);
      });
    }

    function updatePrimaryRecommendation() {
      if (!relatedGrid || !primaryRelatedTitle || !primaryRelatedDesc || !primaryRelatedCta || !primaryRelatedCtaText || !primaryRelatedEmoji) {
        return;
      }

      var firstCard = relatedGrid.querySelector('.related-card');
      if (!firstCard) {
        return;
      }

      var titleEl = firstCard.querySelector('.related-name');
      var emojiEl = firstCard.querySelector('.related-emoji');
      var cardTitle = titleEl ? titleEl.textContent.trim() : (firstCard.getAttribute('data-related-key') || 'Recommended Test');
      var href = firstCard.getAttribute('href') || '#';
      var emoji = emojiEl ? emojiEl.textContent.trim() : '\u2728';
      var cardColor = firstCard.style.getPropertyValue('--card-color') || '';
      var nextStepCard = document.getElementById('next-step-card');

      primaryRelatedTitle.textContent = cardTitle;
      primaryRelatedDesc.textContent = t('result.nextStepDesc') || 'Open the strongest follow-up for your current score and keep the momentum going.';
      primaryRelatedCtaText.textContent = t('result.nextStepCta') || 'Open Follow-up';
      primaryRelatedEmoji.textContent = emoji;
      primaryRelatedCta.setAttribute('href', href);
      primaryRelatedCta.setAttribute('data-related-key', firstCard.getAttribute('data-related-key') || '');
      primaryRelatedCta.setAttribute('data-related-rank', firstCard.getAttribute('data-rank') || '1');

      if (cardColor) {
        primaryRelatedCta.style.setProperty('--cta-color', cardColor);
        if (nextStepCard) {
          nextStepCard.style.setProperty('--cta-color', cardColor);
        }
      }
    }

    function ensureResultAdLoaded() {
      if (resultInlineAdLoaded || !resultInlineAd) {
        return;
      }

      var adNode = resultInlineAd.querySelector('.adsbygoogle');
      if (!adNode) {
        return;
      }

      try {
        (adsbygoogle = window.adsbygoogle || []).push({});
        resultInlineAdLoaded = true;
      } catch (error) {
        // Ad blockers or delayed AdSense init are non-fatal.
      }
    }

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

    function showScreen(screen) {
      [startScreen, quizScreen, resultScreen].forEach(function (section) {
        section.classList.remove('active');
      });
      screen.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showResult(score, options) {
      var settings = options || {};
      var shouldTrack = settings.track !== false;
      var tier = getTier(score);
      var tierEl = document.getElementById('result-tier');

      currentScore = score;
      currentTier = tier;

      document.getElementById('result-emoji').textContent = tierEmojis[tier];
      animateCounter(score, 2000);
      animateMeter(score);

      tierEl.textContent = t('results.' + tier + '.name');
      Object.values(tierClasses).forEach(function (cls) {
        tierEl.classList.remove(cls);
      });
      tierEl.classList.add(tierClasses[tier]);

      document.getElementById('result-desc').textContent = t('results.' + tier + '.tagline');
      document.getElementById('result-analysis').textContent = t('results.' + tier + '.analysis');

      prioritizeRelatedCards(tier);
      updatePrimaryRecommendation();
      ensureResultAdLoaded();

      if (shouldTrack) {
        trackEvent('result_view', {
          event_category: 'delulu_score',
          event_label: tier,
          value: score
        });
        trackEvent('quiz_complete', {
          event_category: 'delulu_score',
          event_label: tier,
          value: score
        });
      }
    }

    function renderQuestion(index) {
      var qNum = index + 1;
      currentQEl.textContent = qNum;
      totalQEl.textContent = TOTAL_QUESTIONS;
      progressFill.style.width = ((qNum / TOTAL_QUESTIONS) * 100) + '%';

      var qKey = 'questions.q' + qNum + '.text';
      questionText.textContent = t(qKey) || qKey;

      optionsContainer.innerHTML = '';
      ['a', 'b', 'c', 'd'].forEach(function (key, idx) {
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

    function selectOption(questionIndex, optionIndex) {
      var points = pointMap[questionIndex][optionIndex];
      totalPoints += points;

      trackEvent('delulu_option_select', {
        event_category: 'delulu_score',
        event_label: 'q' + (questionIndex + 1),
        question_number: questionIndex + 1,
        choice_index: optionIndex + 1,
        value: points
      });

      var buttons = optionsContainer.querySelectorAll('.option-btn');
      buttons[optionIndex].classList.add('selected');
      buttons.forEach(function (btn) {
        btn.disabled = true;
        btn.style.pointerEvents = 'none';
      });

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
          var finalScore = Math.round((totalPoints / MAX_RAW) * 100);
          if (finalScore > 100) finalScore = 100;
          showScreen(resultScreen);
          showResult(finalScore, { track: true });
        }
      }, 400);
    }

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

    langSelect.value = i18n.currentLang;
    langSelect.addEventListener('change', async function () {
      await i18n.setLanguage(this.value);
      if (quizScreen.classList.contains('active')) {
        renderQuestion(currentQuestion);
      }
      if (resultScreen.classList.contains('active')) {
        showResult(currentScore, { track: false });
      }
    });

    startBtn.addEventListener('click', function () {
      currentQuestion = 0;
      totalPoints = 0;
      currentScore = 0;
      currentTier = null;
      showScreen(quizScreen);
      renderQuestion(0);

      trackEvent('quiz_start', {
        event_category: 'delulu_score',
        event_label: getCurrentLang(),
        value: TOTAL_QUESTIONS
      });
    });

    shareTwitter.addEventListener('click', function () {
      var tier = currentTier || getTier(currentScore);
      var tierName = t('results.' + tier + '.name');
      var emoji = tierEmojis[tier];
      var shareText = t('share.text') || 'My Delulu Score: {score}% - {tier}! How delulu are you?';
      var text = emoji + ' ' + shareText.replace('{score}', currentScore).replace('{tier}', tierName);
      var url = getShareUrl();

      window.open(
        'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url),
        '_blank',
        'noopener'
      );

      trackEvent('delulu_share_click', {
        event_category: 'delulu_score',
        event_label: 'twitter',
        result_tier: tier,
        value: currentScore
      });
    });

    shareCopy.addEventListener('click', function () {
      var url = getShareUrl();

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

      trackEvent('delulu_share_click', {
        event_category: 'delulu_score',
        event_label: 'copy_url',
        result_tier: currentTier || getTier(currentScore),
        value: currentScore
      });
    });

    if (primaryRelatedCta) {
      primaryRelatedCta.addEventListener('click', function () {
        trackEvent('delulu_primary_cta_click', {
          event_category: 'delulu_score',
          event_label: currentTier || '',
          related_key: primaryRelatedCta.getAttribute('data-related-key') || '',
          related_rank: Number(primaryRelatedCta.getAttribute('data-related-rank') || '1'),
          value: currentScore
        });
      });
    }

    if (relatedJumpBtn) {
      relatedJumpBtn.addEventListener('click', function () {
        if (relatedTests) {
          relatedTests.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        trackEvent('delulu_related_jump_click', {
          event_category: 'delulu_score',
          event_label: currentTier || '',
          value: currentScore
        });
      });
    }

    if (relatedGrid) {
      relatedGrid.addEventListener('click', function (event) {
        var card = event.target.closest('.related-card');
        if (!card) {
          return;
        }

        trackEvent('delulu_related_click', {
          event_category: 'delulu_score',
          event_label: currentTier || '',
          related_key: card.getAttribute('data-related-key') || '',
          related_rank: Number(card.getAttribute('data-rank') || '0'),
          destination: card.href,
          value: currentScore
        });
      });
    }

    retakeBtn.addEventListener('click', function () {
      var previousTier = currentTier || '';
      var previousScore = currentScore;
      currentQuestion = 0;
      totalPoints = 0;
      currentScore = 0;
      currentTier = null;
      showScreen(startScreen);

      trackEvent('delulu_retry_click', {
        event_category: 'delulu_score',
        event_label: previousTier,
        value: previousScore
      });
    });

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
