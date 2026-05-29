(() => {
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('.nav-links');
  const sectionEls = [...document.querySelectorAll('main section[id]')];
  const linkById = new Map(
    [...document.querySelectorAll('.nav-links a[href^="#"], a[href^="#"]')]
      .map((a) => {
        const id = a.getAttribute('href')?.slice(1);
        if (!id) return null;
        return [id, a];
      })
      .filter(Boolean)
  );

  const getOffset = () => {
    // Sticky header height + a little padding so section titles aren’t hidden.
    if (!header) return 0;
    return header.getBoundingClientRect().height + 12;
  };

  function clearActive() {
    for (const [, a] of linkById) a.classList.remove('active');
  }

  function setActive(sectionId) {
    clearActive();
    const a = linkById.get(sectionId);
    if (a) a.classList.add('active');
  }

  function findMostVisibleSection() {
    const offset = getOffset();
    const viewportTop = offset;
    const viewportBottom = window.scrollY + window.innerHeight;

    let best = null;
    let bestScore = -Infinity;

    for (const sec of sectionEls) {
      const rect = sec.getBoundingClientRect();
      // Convert rect relative positions into document-based metrics.
      const secTop = window.scrollY + rect.top;
      const secBottom = window.scrollY + rect.bottom;

      // Visible height within the viewport.
      const visibleTop = Math.max(secTop, window.scrollY + viewportTop);
      const visibleBottom = Math.min(secBottom, viewportBottom);
      const visible = Math.max(0, visibleBottom - visibleTop);

      if (visible > 0) {
        // Prefer the section with the largest visible height.
        // Tie-breaker: whichever top is closer to the viewportTop.
        const score = visible - Math.abs((secTop - (window.scrollY + viewportTop)) * 0.001);
        if (score > bestScore) {
          bestScore = score;
          best = sec;
        }
      }
    }

    // Fallback: section whose top is closest above the offset.
    if (!best) {
      const targetY = window.scrollY + viewportTop;
      let closest = null;
      let minDist = Infinity;
      for (const sec of sectionEls) {
        const top = sec.getBoundingClientRect().top + window.scrollY;
        const dist = Math.abs(top - targetY);
        if (dist < minDist) {
          minDist = dist;
          closest = sec;
        }
      }
      best = closest;
    }

    return best?.id || null;
  }

  // Offset-aware smooth scrolling for in-page anchors.
  function handleAnchorClicks(e) {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const href = a.getAttribute('href');
    if (!href || href === '#') return;

    const id = href.slice(1);
    const section = document.getElementById(id);
    if (!section) return;

    // Only intercept same-page anchors.
    if (a.origin && location.origin !== a.origin) return;

    e.preventDefault();

    const top = window.scrollY + section.getBoundingClientRect().top - getOffset();
    window.scrollTo({ top, behavior: 'smooth' });

    // Update active immediately for better UX.
    setActive(id);
  }

  // Main setup
  function init() {
    // Ensure active state on first load (including refresh mid-page).
    const initial = findMostVisibleSection();
    if (initial) setActive(initial);

    // Scroll spy (throttled via rAF)
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        const id = findMostVisibleSection();
        if (id) setActive(id);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    // Smooth scroll + offset
    document.addEventListener('click', handleAnchorClicks);

    // If nav is ever turned into a mobile drawer later, this pattern still helps.
    if (nav) {
      nav.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        // no-op now; hook for future drawer close
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

