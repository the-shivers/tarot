// src/js/deck.js
(function() {
    // ─── CONFIGURATION & GLOBAL VARIABLES ─────────────────────────────────────
    let TOTAL_CARDS = 78;
    let baseCardWidth = 175;
    let baseCardHeight = 300;
    let baseRadius = 2400;
  
    let CARD_SCALE = window.innerHeight / 1080;
    let CARD_WIDTH = baseCardWidth * CARD_SCALE;
    let CARD_HEIGHT = baseCardHeight * CARD_SCALE;
    let RADIUS = baseRadius * CARD_SCALE;
    let BASE_ANGLE = 180 / (TOTAL_CARDS - 1) / 4;
  
    let ARC_TOP = window.innerHeight * 0.8;
    let cx = window.innerWidth / 2;
    let cy = ARC_TOP + RADIUS;
  
    const minCurrentAngle = -90;
    const maxCurrentAngle = -45;
    let currentAngle = (minCurrentAngle + maxCurrentAngle) / 2;
    let momentum = 0;
    let lastTime = performance.now();
  
    let isInFanMode = false;
    let isAnimating = false;
  
    // ─── DECK MODE CONFIGURATION ──────────────────────────────────────────────
    let DECK_CENTER_X = window.innerWidth / 2 - CARD_WIDTH / 2;
    let DECK_CENTER_Y = window.innerHeight / 2 - CARD_HEIGHT / 2;
    const STACK_OFFSET = 0.3;
  
    function updateCSSVariables() {
      document.documentElement.style.setProperty('--card-width', CARD_WIDTH + 'px');
      document.documentElement.style.setProperty('--card-height', CARD_HEIGHT + 'px');
    }
    updateCSSVariables();
  
    const deck = document.getElementById('deck');
  
    // ─── CARD CREATION ─────────────────────────────────────────────────────────
    let cardSvgTemplate = '';
  
    function createCard(i) {
      const card = document.createElement('div');
      card.className = 'card';
      // Replace "{patternId}" in the template with a unique id, e.g. "pattern-0", "pattern-1", etc.
      const svgContent = cardSvgTemplate.replace(/{patternId}/g, 'pattern-' + i);
      card.innerHTML = `<div class="card-content">${svgContent}</div>`;
      return card;
    }

    function createAllCards() {
      for (let i = 0; i < TOTAL_CARDS; i++) {
        deck.appendChild(createCard(i));
      }
    }
  
    fetch('src/assets/svg/card.svg')
      .then(response => response.text())
      .then(svgText => {
          cardSvgTemplate = svgText;
          createAllCards();
      })
      .catch(error => console.error('Error loading card.svg:', error));

    function degToRad(deg) {
      return deg * Math.PI / 180;
    }
  
    function getStackPosition(index) {
      return {
        x: DECK_CENTER_X + index * STACK_OFFSET,
        y: DECK_CENTER_Y + index * STACK_OFFSET,
        rotation: 0
      };
    }
  
    function getFanPosition(index) {
      let rawAngle = index * BASE_ANGLE - currentAngle;
      let A = rawAngle - 180;
      const rad = degToRad(A);
      const x = cx + RADIUS * Math.cos(rad);
      const y = cy + RADIUS * Math.sin(rad);
      return {
        x: Math.round(x - CARD_WIDTH / 2),
        y: Math.round(y - CARD_HEIGHT / 2),
        rotation: A + 90
      };
    }
  
    function updateCards() {
      const now = performance.now();
      const dt = now - lastTime;
      lastTime = now;
  
      if (!isDragging && momentum !== 0 && isInFanMode) {
        currentAngle += momentum * dt * 0.001;
        momentum *= Math.pow(0.9, dt / 16);
        if (Math.abs(momentum) < 0.01) momentum = 0;
        if (currentAngle < minCurrentAngle) { currentAngle = minCurrentAngle; momentum = 0; }
        if (currentAngle > maxCurrentAngle) { currentAngle = maxCurrentAngle; momentum = 0; }
      }
  
      let hoveredCard = null;
      if (lastMouseX >= 0 && lastMouseY >= 0) {
        let el = document.elementFromPoint(lastMouseX, lastMouseY);
        while (el && el !== document.body) {
          if (el.classList && el.classList.contains('card')) {
            hoveredCard = el;
            break;
          }
          el = el.parentElement;
        }
      }
  
      document.querySelectorAll('.card').forEach((card, i) => {
        const pos = isInFanMode ? getFanPosition(i) : getStackPosition(i);
        const tx = Math.round(pos.x);
        const ty = Math.round(pos.y);
        card.style.transform = `translate(${tx}px, ${ty}px) rotate(${pos.rotation}deg)`;
        card.style.zIndex = i;
        if (card === hoveredCard && isInFanMode) {
          card.classList.add('hovered');
        } else {
          card.classList.remove('hovered');
        }
      });
      requestAnimationFrame(updateCards);
    }
    requestAnimationFrame(updateCards);
  
    // ─── INPUT HANDLING ──────────────────────────────────────────────────────────
    let isDragging = false;
    let startX = 0;
    let startAngle = 0;
    let velocity = 0;
    let lastDragPos = 0;
    let lastDragTime = performance.now();
    let lastMouseX = -1, lastMouseY = -1;
  
    function handleDragStart(clientX) {
      if (!isInFanMode) return;
      isDragging = true;
      startX = clientX;
      startAngle = currentAngle;
      velocity = 0;
      lastDragPos = currentAngle;
      lastDragTime = performance.now();
    }
  
    function handleDragMove(clientX) {
      if (!isDragging || !isInFanMode) return;
      let delta = clientX - startX;
      currentAngle = startAngle - delta * 0.2;
      if (currentAngle < minCurrentAngle) currentAngle = minCurrentAngle;
      if (currentAngle > maxCurrentAngle) currentAngle = maxCurrentAngle;
      const now = performance.now();
      const dt = now - lastDragTime;
      if (dt > 0) {
        velocity = (currentAngle - lastDragPos) / dt;
        lastDragPos = currentAngle;
        lastDragTime = now;
      }
    }
  
    function handleDragEnd() {
      if (!isInFanMode) return;
      isDragging = false;
      momentum = velocity * 1000;
    }
  
    document.addEventListener('mousedown', (e) => {
      handleDragStart(e.clientX);
      if (isInFanMode) document.body.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', (e) => {
      handleDragMove(e.clientX);
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    });
    document.addEventListener('mouseup', () => {
      handleDragEnd();
      document.body.style.cursor = 'default';
    });
    document.addEventListener('touchstart', (e) => {
      handleDragStart(e.touches[0].clientX);
    }, { passive: false });
    document.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handleDragMove(e.touches[0].clientX);
      lastMouseX = e.touches[0].clientX;
      lastMouseY = e.touches[0].clientY;
    }, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
    window.addEventListener('wheel', (e) => {
      if (!isInFanMode) return;
      e.preventDefault();
      momentum += e.deltaY * 0.3;
      momentum = Math.max(Math.min(momentum, 100), -100);
    }, { passive: false });
  
    const toggleButton = document.getElementById('toggle-view');
    toggleButton.addEventListener('click', () => {
      if (isAnimating) return;
      isAnimating = true;
      isInFanMode = !isInFanMode;
      toggleButton.textContent = isInFanMode ? 'Stack Cards' : 'Fan Cards';
      momentum = 0;
      isDragging = false;
      document.querySelectorAll('.card').forEach((card) => {
        card.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s ease-out';
      });
      setTimeout(() => {
        document.querySelectorAll('.card').forEach((card) => {
          if (isInFanMode) {
            card.style.transition = 'filter 0.2s ease-out';
          } else {
            card.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s ease-out';
          }
        });
        isAnimating = false;
      }, 800);
    });
  
    function recalcGeometry() {
      CARD_SCALE = window.innerHeight / 1080;
      CARD_WIDTH = baseCardWidth * CARD_SCALE;
      CARD_HEIGHT = baseCardHeight * CARD_SCALE;
      RADIUS = baseRadius * CARD_SCALE;
      updateCSSVariables();
      ARC_TOP = window.innerHeight * 0.8;
      cx = window.innerWidth / 2;
      cy = ARC_TOP + RADIUS;
      DECK_CENTER_X = window.innerWidth / 2 - CARD_WIDTH / 2;
      DECK_CENTER_Y = window.innerHeight / 2 - CARD_HEIGHT / 2;
    }
    window.addEventListener('resize', recalcGeometry);
  
    // Expose an init function to be called when the deck view becomes active.
    window.initDeck = function() {
      recalcGeometry();
      // (Optional) Additional initialization if needed.
    };
  })();
  