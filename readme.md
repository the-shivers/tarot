tarot-reading-website/
├── index.html            // The main HTML entry point.
├── README.md             // Project documentation.
├── package.json          // For dependency management & build scripts.
├── /dist                 // (After building) Minified/bundled production code.
└── /src
    ├── /assets           // Images, fonts, SVGs, etc.
    │   ├── /images
    │   └── /fonts
    │
    ├── /css
    │   ├── base.css      // Global styles, resets, variables, etc.
    │   ├── deck.css      // Styles specific to the tarot deck, fanning, animations.
    │   └── prompt.css    // Styles for the prompt, text animations, entry fields.
    │
    └── /js
        ├── main.js       // Bootstraps the app and wires everything together.
        ├── deck.js       // All logic for creating, positioning, and animating the tarot cards.
        ├── prompt.js     // Logic for text animations, handling the prompt and user text input.
        ├── reading.js    // Handles card selection, API calls, and AI reading logic.
        └── api.js        // A small module that wraps API calls (e.g., your AI inference endpoint).