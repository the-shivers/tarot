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
      document.documentElement.style.setProperty('--hover-lift', (CARD_HEIGHT * 0.25) + 'px');
      document.documentElement.style.setProperty('--card-hover-transition', '0.15s');
    }
    updateCSSVariables();
  
    const deck = document.getElementById('deck');
  
    // ─── CARD CREATION ─────────────────────────────────────────────────────────
    let cardSvgTemplate = '';
  
    function createCard(i) {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.touchAction = 'none';
      const svgContent = cardSvgTemplate.replace(/{patternId}/g, 'pattern-' + i);
      card.innerHTML = `<div class="card-content">${svgContent}</div>`;
      
      // Add this debugging code to see if hover is working
      card.addEventListener('mouseenter', () => {
        console.log('Mouse enter!');
        console.log('Current state:', currentState);
        console.log('Should hover:', currentState === DeckState.FANNED);
        if (currentState === DeckState.FANNED) {
          console.log('Adding hover class!');
          card.classList.add('hovered');
        }
      });
      
      card.addEventListener('mouseleave', () => {
        console.log('Mouse leave!');
        card.classList.remove('hovered');
      });
      
      return card;
    }

    let isBackgroundDeck = false;

    function createBackgroundAnimation() {
        if (!isBackgroundDeck) return;
        
        // Start in stack mode
        isInFanMode = false;
        
        // Add mystical particles
        const particleContainer = document.createElement('div');
        particleContainer.className = 'particle-container';
        
        // Attach directly to the deck element instead of its parent
        deck.appendChild(particleContainer);
        
        // Create particles with varied sizes and speeds
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'mystic-particle';
            
            // Randomize particle properties
            const size = 3 + Math.random() * 4;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Add horizontal variance centered on the deck
            const xOffset = (Math.random() - 0.5) * CARD_WIDTH * 0.8;
            particle.style.setProperty('--x-offset', `${xOffset}px`);
            
            // Randomize animation timing
            particle.style.setProperty('--delay', `${Math.random() * 3}s`);
            particle.style.setProperty('--duration', `${4 + Math.random() * 3}s`);
            
            particleContainer.appendChild(particle);
            
            // Create new particles periodically
            setInterval(() => {
                const newParticle = particle.cloneNode(true);
                particleContainer.appendChild(newParticle);
                setTimeout(() => {
                    newParticle.remove();
                }, 7000);
            }, 3000 + Math.random() * 2000);
        }
    }

    function createAllCards() {
      const deckElement = document.getElementById('deck');
      if (deckElement.parentElement.id === 'background-deck') {
        isBackgroundDeck = true;
        CARD_SCALE *= 0.7; // Make background cards smaller
        recalcGeometry();
      }
      
      for (let i = 0; i < TOTAL_CARDS; i++) {
        deckElement.appendChild(createCard(i));
      }
      
      if (isBackgroundDeck) {
        createBackgroundAnimation();
        // Position deck in center
        DECK_CENTER_X = window.innerWidth / 2 - CARD_WIDTH / 2;
        DECK_CENTER_Y = window.innerHeight / 2 - CARD_HEIGHT / 2;
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
      const dt = Math.min(now - lastTime, 32);
      lastTime = now;
  
      if (!isDragging && momentum !== 0 && isInFanMode) {
        currentAngle += momentum * dt * 0.001;
        momentum *= Math.pow(0.95, dt / 16);
        if (Math.abs(momentum) < 0.01) momentum = 0;
        if (currentAngle < minCurrentAngle) { currentAngle = minCurrentAngle; momentum = 0; }
        if (currentAngle > maxCurrentAngle) { currentAngle = maxCurrentAngle; momentum = 0; }
      }
  
      const cards = document.querySelectorAll('.card');
      const positions = [];
      
      cards.forEach((card, i) => {
        const pos = isInFanMode ? getFanPosition(i) : getStackPosition(i);
        positions.push(pos);
      });
  
      cards.forEach((card, i) => {
        const pos = positions[i];
        const tx = Math.round(pos.x);
        const ty = Math.round(pos.y);
        card.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${pos.rotation}deg)`;
        card.style.zIndex = i;
        
        // Debug z-index for hovered cards
        if (card.classList.contains('hovered')) {
          console.log('Hovered card z-index:', card.style.zIndex);
        }
      });
  
      // Check for card under cursor after positions are updated
      if (isInFanMode && lastMouseX !== -1) {
        const elementUnderCursor = document.elementFromPoint(lastMouseX, lastMouseY);
        const cardElement = elementUnderCursor?.closest('.card');
        
        // Remove hover from all other cards
        document.querySelectorAll('.card.hovered').forEach(card => {
          if (card !== cardElement) {
            card.classList.remove('hovered');
          }
        });
        
        // Add hover to the card under cursor
        if (cardElement) {
          cardElement.classList.add('hovered');
        }
      }
  
      // Skip interaction updates if this is the background deck
      if (isBackgroundDeck) {
        requestAnimationFrame(updateCards);
        return;
      }
  
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
      currentAngle = startAngle - delta * 0.05;
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
        
        const newState = currentState === DeckState.MYSTIC ? DeckState.FANNED : DeckState.MYSTIC;
        
        // Apply transition
        document.querySelectorAll('.card').forEach((card) => {
            card.style.transition = 'transform 0.5s cubic-bezier(0.2, 0, 0.2, 1), box-shadow 0.3s ease-out';
        });
        
        // Set new state
        setDeckState(newState);
        
        toggleButton.textContent = newState === DeckState.FANNED ? 'Stack Cards' : 'Fan Cards';
        momentum = 0;
        isDragging = false;

        setTimeout(() => {
            document.querySelectorAll('.card').forEach((card) => {
                card.style.transition = newState === DeckState.FANNED ? 
                    'transform 0.2s ease-out, box-shadow 0.3s ease-out' : 
                    'transform 0.5s cubic-bezier(0.2, 0, 0.2, 1), box-shadow 0.3s ease-out';
            });
            isAnimating = false;
        }, 500);
    });
  
    function recalcGeometry() {
        // Get the width directly from the responsive container
        let width = document.documentElement.getBoundingClientRect().width;
        console.log('Width:', width);
        
        let heightScale = window.innerHeight / 1080;
        let widthScale = window.innerWidth / 1920;
        
        if (width <= 768) {
            console.log('Mobile mode activated');
            CARD_SCALE = Math.min(heightScale, widthScale) * 2.5;
        } else {
            console.log('Desktop mode activated');
            CARD_SCALE = Math.min(heightScale, widthScale);
        }
        
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

    // Add this debugging code to check if cards are getting events
    document.addEventListener('mousemove', (e) => {
        const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
        if (elementUnderCursor?.closest('.card')) {
            console.log('Mouse is over a card!');
        }
    });

    // Disable interactions for background deck
    if (isBackgroundDeck) {
      document.removeEventListener('mousedown', handleDragStart);
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchstart', handleDragStart);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('wheel', handleWheel);
    }

    const DeckState = {
        MYSTIC: 'mystic',
        FANNED: 'fanned'
    };

    const DeckConfig = {
        [DeckState.MYSTIC]: {
            particlesEnabled: true,
            floatingEnabled: true,
            hoverEnabled: false,
            dragEnabled: false,
            scrollEnabled: false,
            baseBoxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            hoverBoxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        },
        [DeckState.FANNED]: {
            particlesEnabled: false,
            floatingEnabled: false,
            hoverEnabled: true,
            dragEnabled: true,
            scrollEnabled: true,
            baseBoxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            hoverBoxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)'
        }
    };

    let currentState = DeckState.MYSTIC;

    function setDeckState(newState) {
        if (newState === currentState) return;
        
        currentState = newState;
        const config = DeckConfig[currentState];
        
        // Update deck classes
        deck.classList.remove('state-mystic', 'state-fanned');
        deck.classList.add(`state-${currentState}`);
        
        // Update particle effects
        const particleContainer = deck.querySelector('.particle-container');
        if (particleContainer) {
            particleContainer.style.display = config.particlesEnabled ? 'block' : 'none';
        }
        
        // Update floating animation
        deck.style.animation = config.floatingEnabled ? 'float 3s ease-in-out infinite' : 'none';
        
        // Update interaction flags
        isInFanMode = newState === DeckState.FANNED;
        
        // Re-apply hover listeners after state change
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            // Remove existing listeners
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            // Add new hover listeners
            newCard.addEventListener('mouseenter', () => {
                if (currentState === DeckState.FANNED) {
                    newCard.classList.add('hovered');
                }
            });
            
            newCard.addEventListener('mouseleave', () => {
                newCard.classList.remove('hovered');
            });
        });
    }
})();
  