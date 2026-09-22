(() => {
  if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);

  const section = document.querySelector('[data-hero-about]');
  const building = document.querySelector('[data-building]');
  const heroCopy = document.querySelector('[data-hero-copy]');
  const aboutCopy = document.querySelector('[data-about-copy]');

  if (!section || !building || !heroCopy || !aboutCopy) return;

  // Initial load reveal
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .fromTo(building, { xPercent: -12, y: 22, scale: .96, autoAlpha: 0, filter: 'blur(4px)' }, { xPercent: 0, y: 0, scale: 1, autoAlpha: 1, filter: 'blur(0)', duration: 1.35, delay: .15 })
    .fromTo('.hero-reveal', { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .65, stagger: .1 }, '-=.65');

  const mm = gsap.matchMedia();

  // Desktop view (min-width: 768px): building shifts to column 2, lifted up to center align with about text
  mm.add('(min-width: 768px)', () => {
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=125%',
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    timeline
      .to(heroCopy, { autoAlpha: 0, y: -60, ease: 'none' }, 0)
      .to(building, {
        x: () => Math.min(innerWidth * .38, 580),
        y: 0, // Lifted up to vertically center-align with aboutCopy
        scale: .94, // Pronounced size
        ease: 'none'
      }, 0)
      .to(aboutCopy, { autoAlpha: 1, x: 0, pointerEvents: 'auto', ease: 'none' }, 0.32);

    return () => timeline.kill();
  });

  // Mobile responsive view (max-width: 767px): building drops down as user scrolls and settles under about writeup
  mm.add('(max-width: 767px)', () => {
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=110%',
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    timeline
      .to(heroCopy, { autoAlpha: 0, y: -45, ease: 'none' }, 0)
      .to(aboutCopy, { autoAlpha: 1, y: 0, pointerEvents: 'auto', ease: 'none' }, 0.25)
      .to(building, {
        y: () => {
          const copyHeight = aboutCopy.offsetHeight || 260;
          return Math.max(copyHeight + 20, 240);
        },
        scale: 1.04,
        ease: 'none'
      }, 0);

    return () => timeline.kill();
  });
})();
