/**
 * Tendril Landing Page 02 - Interactive Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      const isOpen = mobileNav.classList.contains('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile nav on click of link
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 2. FAQ Accordion: Synchronize +/- toggle icons
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const icon = item.querySelector('.faq-toggle-icon');
    
    // Initial state
    if (icon) {
      icon.textContent = item.hasAttribute('open') ? '−' : '+';
    }

    item.addEventListener('toggle', () => {
      if (icon) {
        icon.textContent = item.open ? '−' : '+';
      }
    });
  });

  // 3. Ask AI Prompt Copy
  const copyPromptBtn = document.getElementById('copyPromptBtn');
  const copyPromptText = document.getElementById('copyPromptText');
  const toast = document.getElementById('toastNotification');
  const samplePrompt = "How does Tendril work for decentralized pay-per-second compute? Compare Tendril with Akash and io.net for renting sandboxed GPU and CPU machines over x402 on Algorand.";

  if (copyPromptBtn) {
    copyPromptBtn.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(samplePrompt);
        } else {
          // Fallback
          const textarea = document.createElement('textarea');
          textarea.value = samplePrompt;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }

        // Show toast
        if (toast) {
          toast.classList.add('show');
          setTimeout(() => {
            toast.classList.remove('show');
          }, 3200);
        }

        // Button label feedback
        if (copyPromptText) {
          const originalText = copyPromptText.textContent;
          copyPromptText.textContent = 'Copied!';
          setTimeout(() => {
            copyPromptText.textContent = originalText;
          }, 2500);
        }
      } catch (err) {
        console.error('Clipboard copy error:', err);
      }
    });
  }

  // 4. AI Links
  const aiButtons = document.querySelectorAll('.btn-ai[data-ai]');
  aiButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const aiType = btn.getAttribute('data-ai');
      const encodedPrompt = encodeURIComponent(samplePrompt);
      let targetUrl = '';

      switch (aiType) {
        case 'chatgpt':
          targetUrl = `https://chatgpt.com/?q=${encodedPrompt}`;
          break;
        case 'claude':
          targetUrl = `https://claude.ai/new?q=${encodedPrompt}`;
          break;
        case 'gemini':
          targetUrl = `https://gemini.google.com/app`;
          break;
        case 'perplexity':
          targetUrl = `https://www.perplexity.ai/search?q=${encodedPrompt}`;
          break;
        case 'grok':
          targetUrl = `https://x.com/i/grok?text=${encodedPrompt}`;
          break;
      }

      if (targetUrl) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
    });
  });

  // 5. Interactive Demo: Hero Search Simulation
  const searchPillBtn = document.querySelector('.search-pill-btn');
  const searchActionBtn = document.querySelector('.search-action-btn');
  const extractingPill = document.querySelector('.extracting-pill');

  const gearSvg = `<svg class="gear-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>`;

  function triggerSearchDemo() {
    if (!extractingPill) return;
    extractingPill.innerHTML = `${gearSvg} Querying active compute nodes...`;
    setTimeout(() => {
      extractingPill.innerHTML = `${gearSvg} Polling live nodes...`;
    }, 2200);
  }

  if (searchPillBtn) {
    searchPillBtn.addEventListener('click', triggerSearchDemo);
  }
  if (searchActionBtn) {
    searchActionBtn.addEventListener('click', triggerSearchDemo);
  }

  // 6. Smooth scroll for internal hashes
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && href !== '#' && href.length > 1) {
        const targetElement = document.querySelector(href);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
});
