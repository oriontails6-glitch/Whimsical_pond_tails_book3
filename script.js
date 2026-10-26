document.addEventListener('DOMContentLoaded', function () {
  const bookEl = document.getElementById('book');
  const pages = document.querySelectorAll('.page');

  const pageFlip = new St.PageFlip(bookEl, {
    width: 500,
    height: 680,
    size: 'stretch',
    minWidth: 280,
    maxWidth: 1000,
    minHeight: 380,
    maxHeight: 1000,
    maxShadowOpacity: 0.5,
    showCover: true,
    usePortrait: true,
    mobileScrollSupport: true,
    swipeDistance: 45,
    clickEventForward: true,
    flippingTime: 600,
    useMouseEvents: true
  });

  pageFlip.loadFromHTML(pages);
  window.pageFlip = pageFlip;

  const totalPages = pageFlip.getPageCount();
  const indicator = document.getElementById('pageIndicator');

  function updateIndicator() {
    const idx = pageFlip.getCurrentPageIndex();
    if (idx === 0) {
      indicator.textContent = 'Cover';
    } else if (idx === totalPages - 1) {
      indicator.textContent = 'The End';
    } else {
      indicator.textContent = 'Page ' + idx + ' of ' + (totalPages - 2);
    }
  }

  pageFlip.on('flip', updateIndicator);
  pageFlip.on('changeState', function (state) {
    if (state === 'read') updateIndicator();
  });
  updateIndicator();

  // Prevent scroll events inside page text from breaking flip gestures
  document.querySelectorAll('.page-body').forEach(el => {
    ['wheel', 'touchstart', 'touchmove', 'pointerdown', 'pointermove'].forEach(eventType => {
      el.addEventListener(eventType, function (e) {
        e.stopPropagation();
      }, { passive: true });
    });
  });

  function goNext() {
    const cur = pageFlip.getCurrentPageIndex();
    if (cur >= totalPages - 1) return;
    try {
      pageFlip.flipNext();
    } catch (e) {
      pageFlip.turnToNextPage();
    }
    setTimeout(updateIndicator, 100);
  }

  function goPrev() {
    const cur = pageFlip.getCurrentPageIndex();
    if (cur <= 0) return;
    try {
      // In portrait/single-page mode, StPageFlip's internal flipPrev has a coordinate calculation bug.
      // turnToPrevPage() flips back smoothly and reliably without failing.
      if (pageFlip.getOrientation() === 'portrait') {
        pageFlip.turnToPrevPage();
      } else {
        pageFlip.flipPrev();
      }
    } catch (e) {
      pageFlip.turnToPrevPage();
    }
    setTimeout(updateIndicator, 100);
  }

  document.getElementById('nextBtn').addEventListener('click', goNext);
  document.getElementById('prevBtn').addEventListener('click', goPrev);
  document.getElementById('nextBtnBottom').addEventListener('click', goNext);
  document.getElementById('prevBtnBottom').addEventListener('click', goPrev);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  });

  // Touch swipe fallback for book stage
  let touchStartX = 0;
  let touchEndX = 0;

  bookEl.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  bookEl.addEventListener('touchend', function (e) {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goPrev(); // Swiped right -> go back
      } else {
        goNext(); // Swiped left -> go forward
      }
    }
  }, { passive: true });

  // Re-check size on orientation change / resize so the book re-fits
  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      pageFlip.updateFromHTML(pages);
      updateIndicator();
    }, 200);
  });
});
