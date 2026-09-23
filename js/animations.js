(() => {
  if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);

  /* Room card and review reveals */
  gsap.utils.toArray('.room-card, .review').forEach((item) =>
    gsap.from(item, { y: 45, autoAlpha: 0, duration: .85, ease: 'power3.out', scrollTrigger: { trigger: item, start: 'top 88%', once: true } })
  );

  /* Section heading reveals — kicker, display, lede stagger in */
  gsap.utils.toArray('.section-heading, .amenities-intro').forEach((heading) => {
    const children = heading.querySelectorAll('.kicker, .display, .lede');
    if (!children.length) return;
    gsap.from(children, {
      y: 30, autoAlpha: 0, duration: .7, ease: 'power3.out', stagger: .12,
      scrollTrigger: { trigger: heading, start: 'top 85%', once: true }
    });
  });

  /* Places to visit horizontal scroll-trigger sliding */
  const placesSection = document.querySelector('.places');
  const placesTrack = document.querySelector('[data-places]');
  if (placesSection && placesTrack) {
    const getDistance = () => {
      const parentWidth = placesTrack.parentElement ? placesTrack.parentElement.clientWidth : window.innerWidth;
      const totalWidth = placesTrack.scrollWidth;
      return Math.max(totalWidth - parentWidth + 40, 0);
    };

    gsap.to(placesTrack, {
      x: () => -getDistance(),
      ease: 'none',
      scrollTrigger: {
        trigger: placesSection,
        start: 'top top',
        end: () => '+=' + Math.max(getDistance() + 250, 450),
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });
  }

  /* Contact section elements */
  const contactSection = document.querySelector('.contact');
  if (contactSection) {
    const contactEls = contactSection.querySelectorAll('.kicker, .contact-title, .lede, .contact-actions, address, .map-art');
    gsap.from(contactEls, {
      y: 35, autoAlpha: 0, duration: .75, ease: 'power3.out', stagger: .1,
      scrollTrigger: { trigger: contactSection, start: 'top 75%', once: true }
    });
  }

  /* Sort and refresh ScrollTrigger to ensure pins are in exact DOM sequence */
  ScrollTrigger.sort();
  ScrollTrigger.refresh();

  window.addEventListener('load', () => {
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  });
})();
