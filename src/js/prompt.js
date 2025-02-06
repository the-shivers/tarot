// src/js/prompt.js
(function() {
    // Animate the prompt text by splitting it into words and letters.
    function animatePrompt() {
      const promptEl = document.getElementById('prompt');
      const promptText = promptEl.textContent;
      promptEl.textContent = '';
      const words = promptText.split(' ');
      let globalIndex = 0;
      words.forEach((word, index) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        for (let i = 0; i < word.length; i++) {
          const letterSpan = document.createElement('span');
          letterSpan.className = 'char';
          letterSpan.textContent = word[i];
          letterSpan.style.animationDelay = (globalIndex * 0.02) + 's';
          globalIndex++;
          wordSpan.appendChild(letterSpan);
        }
        if (index < words.length - 1) {
          wordSpan.appendChild(document.createTextNode('\u00A0'));
        }
        promptEl.appendChild(wordSpan);
      });
    }
  
    animatePrompt();
  
    // Auto-resize the text area and show/hide the submit button.
    const questionInput = document.getElementById('question-input');
    const submitBtn = document.getElementById('submit-btn');
    const charCounter = document.getElementById('char-counter');
    const CHAR_LIMIT_THRESHOLD = 120;
    const MAX_LENGTH = 150;
  
    function autoResize() {
      questionInput.style.height = 'auto';
      questionInput.style.height = questionInput.scrollHeight + 'px';
    }
  
    questionInput.addEventListener('input', function() {
      autoResize();
      const len = questionInput.value.length;
      if (len >= 5) {
        submitBtn.classList.add('visible');
      } else {
        submitBtn.classList.remove('visible');
      }
      if (len >= CHAR_LIMIT_THRESHOLD) {
        charCounter.style.display = 'block';
        charCounter.textContent = len + ' / ' + MAX_LENGTH;
        charCounter.style.color = (MAX_LENGTH - len <= 10) ? 'red' : '#fff';
      } else {
        charCounter.style.display = 'none';
      }
    });
  
    autoResize();
  
    // When the submit button is clicked, create a ripple effect and fade out the prompt view.
    submitBtn.addEventListener('click', function() {
      const rect = submitBtn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const ripple = document.createElement('div');
      ripple.className = 'ripple-effect';
      ripple.style.width = rect.width + 'px';
      ripple.style.height = rect.height + 'px';
      ripple.style.left = centerX + 'px';
      ripple.style.top = centerY + 'px';
      document.body.appendChild(ripple);
      setTimeout(() => {
        ripple.remove();
      }, 400);
      // Fade out the prompt text and entry container, then transition to the deck view.
      setTimeout(() => {
        document.getElementById('prompt').classList.add('fade-out');
        document.getElementById('entry-container').classList.add('fade-out');
        setTimeout(() => {
          // Hide the prompt view and show the deck view.
          document.getElementById('prompt-view').classList.add('hidden');
          document.getElementById('deck-view').classList.remove('hidden');
          // Initialize the deck module if it exists.
          if (window.initDeck) window.initDeck();
        }, 1000);
      }, 100);
    });
  })();
  