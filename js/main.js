(() => {
  const data = window.siteData;
  if (!data) return;
  const { hotel } = data;
  const directions = hotel.directions || `https://www.google.com/maps/search/?api=1&query=${hotel.coordinates}`;
  const whatsappBase = 'https://wa.me/2349153111592';

  function createWhatsAppLink(message) {
    const text = message || "Hello De Palms, I would like to check room availability.";
    return `${whatsappBase}?text=${encodeURIComponent(text)}`;
  }

  // Set prefilled WhatsApp links for all Call-To-Action buttons
  document.querySelectorAll('[data-booking]').forEach((link) => {
    const customMsg = link.getAttribute('data-whatsapp-msg');
    link.href = createWhatsAppLink(customMsg);
    link.target = '_blank';
    link.rel = 'noreferrer';
  });

  document.querySelectorAll('[data-directions]').forEach((link) => {
    link.href = directions;
    link.target = '_blank';
    link.rel = 'noreferrer';
  });

  document.querySelectorAll('[data-instagram]').forEach((link) => {
    link.href = hotel.instagram;
  });

  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const amenityEls = document.querySelectorAll('[data-marquee]');
  if (amenityEls.length && data.amenities) {
    const amenityMarkup = [...data.amenities, ...data.amenities].map((item) => `<span class="marquee-item">${item}</span>`).join('');
    amenityEls.forEach((el) => el.innerHTML = amenityMarkup);
  }

  function getFeatureIcon(name) {
    const n = name.toLowerCase();
    if (n.includes('bed')) return '<svg class="feature-icon" aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/></svg>';
    if (n.includes('shower') || n.includes('bath')) return '<svg class="feature-icon" aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h7a5 5 0 0 1 5 5v1M16 14v1M12 16v1M16 18v1M20 16v1"/></svg>';
    if (n.includes('wi-fi') || n.includes('wifi')) return '<svg class="feature-icon" aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>';
    if (n.includes('netflix') || n.includes('tv')) return '<svg class="feature-icon" aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15"/><polyline points="17 2 12 7 7 2"/></svg>';
    if (n.includes('breakfast')) return '<svg class="feature-icon" aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>';
    return '';
  }

  const roomsContainer = document.querySelector('[data-rooms]');
  if (roomsContainer && data.rooms) {
    roomsContainer.innerHTML = data.rooms.map((room, index) => {
      let mediaContent = '';
      const hasImage = Boolean(room.image);
      const hasVideo = Boolean(room.video);

      if (hasImage && hasVideo) {
        const allImages = room.gallery ? [room.image, ...room.gallery] : [room.image];
        const hasGallery = allImages.length > 1;
        const imgsMarkup = allImages.map((src, i) => `<img class="room-img${i > 0 ? ' room-img--hidden' : ''}" src="${src}" alt="${room.name}${i > 0 ? ' \u2013 view ' + (i + 1) : ''}" loading="lazy">`).join('');
        mediaContent = `<div class="room-media has-image${hasGallery ? ' has-gallery' : ''}">${imgsMarkup}<video class="room-video" muted loop playsinline preload="metadata"><source src="${room.video}" type="video/mp4"></video><span class="room-index">0${index + 1}</span><button class="room-video-btn" type="button" data-video-toggle aria-label="Watch video tour of ${room.name}"><span class="video-btn-icon" aria-hidden="true">▶</span><span class="video-btn-text">Watch tour</span></button></div>`;
      } else if (hasVideo) {
        mediaContent = `<div class="room-media"><video class="room-video" muted loop playsinline preload="metadata"><source src="${room.video}" type="video/mp4"></video><span class="room-index">0${index + 1}</span><button class="room-video-btn" type="button" data-video-toggle aria-label="Watch video tour of ${room.name}"><span class="video-btn-icon" aria-hidden="true">▶</span><span class="video-btn-text">Watch tour</span></button></div>`;
      } else if (hasImage) {
        mediaContent = `<div class="room-media"><img class="room-img" src="${room.image}" alt="${room.name}" loading="lazy"><span class="room-index">0${index + 1}</span></div>`;
      } else {
        mediaContent = `<div class="room-media"><span class="room-placeholder">Imagery to be supplied</span><span class="room-index">0${index + 1}</span></div>`;
      }

      const featureList = room.features || [room.details];
      const featuresMarkup = featureList.map((f) => `<span class="room-feature">${getFeatureIcon(f)}<span>${f}</span></span>`).join('');

      // Prefilled WhatsApp booking message specifically naming this room
      const roomBookingMsg = `Hello De Palms, I would like to book the ${room.name}.`;
      const roomWhatsAppUrl = createWhatsAppLink(roomBookingMsg);

      return `<article class="room-card">${mediaContent}<div class="room-meta"><div><h3><a class="room-title-link" href="${roomWhatsAppUrl}" target="_blank" rel="noreferrer" aria-label="Book ${room.name} on WhatsApp">${room.name}</a></h3><p class="lede">${room.description}</p><div class="room-features">${featuresMarkup}</div></div><a class="room-link" href="${roomWhatsAppUrl}" target="_blank" rel="noreferrer" aria-label="Book ${room.name} on WhatsApp">↗</a></div></article>`;
    }).join('');

    document.querySelectorAll('[data-video-toggle]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const media = btn.closest('.room-media');
        if (!media) return;
        const video = media.querySelector('video');
        if (!video) return;

        const isPlaying = media.classList.contains('is-playing');

        document.querySelectorAll('.room-media.is-playing').forEach((other) => {
          if (other !== media) {
            other.classList.remove('is-playing');
            const otherVid = other.querySelector('video');
            if (otherVid) otherVid.pause();
            const otherBtn = other.querySelector('[data-video-toggle]');
            if (otherBtn) {
              const icon = otherBtn.querySelector('.video-btn-icon');
              const text = otherBtn.querySelector('.video-btn-text');
              if (icon) icon.textContent = '▶';
              if (text) text.textContent = 'Watch tour';
            }
          }
        });

        const icon = btn.querySelector('.video-btn-icon');
        const text = btn.querySelector('.video-btn-text');

        if (isPlaying) {
          media.classList.remove('is-playing');
          video.pause();
          if (icon) icon.textContent = '▶';
          if (text) text.textContent = 'Watch tour';
        } else {
          media.classList.add('is-playing');
          video.play().catch(() => {});
          if (icon) icon.textContent = '⏸';
          if (text) text.textContent = 'Pause tour';
        }
      });
    });

    document.querySelectorAll('.room-media.has-gallery').forEach((media) => {
      const imgs = media.querySelectorAll('.room-img');
      if (imgs.length < 2) return;
      let current = 0;
      setInterval(() => {
        imgs[current].classList.add('room-img--hidden');
        current = (current + 1) % imgs.length;
        imgs[current].classList.remove('room-img--hidden');
      }, 2000);
    });
  }

  function renderStars(rating) { let s = ''; for (let i = 1; i <= 5; i++) s += `<span class="review-star${i <= rating ? ' is-filled' : ''}" aria-hidden="true">★</span>`; return s; }

  const reviewsContainer = document.querySelector('[data-reviews]');
  if (reviewsContainer && data.reviews) {
    reviewsContainer.innerHTML = data.reviews.map((review) => `<article class="review"><div class="review-top"><span>${review.author} · ${review.rating}/5</span><span class="review-stars" aria-label="${review.rating} out of 5 stars">${renderStars(review.rating)}</span></div><p>"${review.quote}"</p><small>${review.timeAgo} on ${review.source}</small></article>`).join('');
  }

  const placesContainer = document.querySelector('[data-places]');
  if (placesContainer && data.placesToVisit) {
    placesContainer.innerHTML = data.placesToVisit.map((place, index) => `<article class="place"><div class="place-art"><img src="${place.image}" alt="${place.name}" loading="lazy"><span class="place-city">Port Harcourt / 0${index + 1}</span><span class="place-number">0${index + 1}</span></div><div class="place-meta"><p class="place-type">${place.type}</p><h3>${place.name}</h3><p class="lede">${place.detail}</p></div></article>`).join('');
  }

  const contactContainer = document.querySelector('[data-contact]');
  if (contactContainer) {
    contactContainer.innerHTML = `<a class="contact-detail" href="${directions}" target="_blank" rel="noreferrer"><strong>01</strong><span>${hotel.address}</span></a><a class="contact-detail" href="tel:+2349153111592"><strong>02</strong><span>${hotel.phone}</span></a><a class="contact-detail" href="mailto:${hotel.email}"><strong>03</strong><span>${hotel.email}</span></a><a class="contact-detail" href="${hotel.instagram}" target="_blank" rel="noreferrer"><strong>04</strong><span>Instagram</span></a>`;
  }
})();
