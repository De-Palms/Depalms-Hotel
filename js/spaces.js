(() => {
  const data = window.siteData;
  if (!data || !data.spaces) return;

  const spaces = data.spaces;
  const section = document.querySelector('[data-spaces-section]');
  const stickyWrap = document.querySelector('[data-spaces-sticky]');
  const canvas = document.querySelector('[data-spaces-canvas]');
  const imageWrap = document.querySelector('[data-spaces-image-wrap]');
  const fallbackEl = document.querySelector('[data-spaces-fallback]');
  const nameEl = document.querySelector('[data-spaces-name]');
  const taglineEl = document.querySelector('[data-spaces-tagline]');
  const descEl = document.querySelector('[data-spaces-desc]');
  const currentEl = document.querySelector('[data-spaces-current]');
  const totalEl = document.querySelector('[data-spaces-total]');
  const progressFill = document.querySelector('[data-spaces-progress-fill]');
  const infoWrap = document.querySelector('[data-spaces-info]');

  if (!section || !stickyWrap) return;

  const totalSlides = spaces.length;
  if (totalEl) totalEl.textContent = String(totalSlides).padStart(2, '0');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = Boolean(window.gsap && window.ScrollTrigger);
  const hasThree = Boolean(window.THREE);

  /* ───────── Texture & Image Preloading ───────── */
  const loadedTextures = new Array(totalSlides).fill(null);
  const loadedImages = new Array(totalSlides).fill(null);
  let texturesReady = false;

  function createTexture(image) {
    if (!image || !renderer) return null;
    const tex = new THREE.Texture(image);
    tex.needsUpdate = true;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
  }

  function preloadImages() {
    spaces.forEach((space, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loadedImages[i] = img;
        if (renderer) {
          loadedTextures[i] = createTexture(img);
          texturesReady = loadedTextures.some(Boolean);

          // If the initial textures are ready, update the shader and draw immediately
          if (i === 0 && material && !material.uniforms.uTexture1.value) {
            material.uniforms.uTexture1.value = loadedTextures[0];
            material.uniforms.uTexture2.value = loadedTextures[1] || loadedTextures[0];
            renderFrame();
          }
        }
      };
      img.onerror = () => {
        loadedImages[i] = null;
      };
      img.src = space.image;
    });
  }

  /* ───────── Three.js WebGL Setup ───────── */
  let renderer, scene, camera, planeMesh, material;
  let webglActive = false;
  let animFrameId = null;
  let isVisible = false;

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform sampler2D uTexture1;
    uniform sampler2D uTexture2;
    uniform float uProgress;
    uniform float uIntensity;
    varying vec2 vUv;

    void main() {
      float prog = clamp(uProgress, 0.0, 1.0);

      // Fast exit when holding a slide completely static (no distortion overhead)
      if (prog <= 0.001) {
        gl_FragColor = texture2D(uTexture1, vUv);
        return;
      }
      if (prog >= 0.999) {
        gl_FragColor = texture2D(uTexture2, vUv);
        return;
      }

      vec2 uv = vUv;
      float distortAmount = uIntensity * sin(prog * 3.14159265);
      vec2 distort1 = uv + distortAmount * vec2(
        sin(uv.y * 8.0 + prog * 6.0) * 0.02,
        cos(uv.x * 6.0 + prog * 4.0) * 0.015
      );
      vec2 distort2 = uv + distortAmount * vec2(
        sin(uv.y * 10.0 - prog * 5.0) * 0.02,
        cos(uv.x * 8.0 - prog * 3.0) * 0.015
      );

      float scaleFactor = 1.0 + 0.03 * sin(prog * 3.14159265);
      vec2 centeredUV1 = (distort1 - 0.5) / scaleFactor + 0.5;
      vec2 centeredUV2 = (distort2 - 0.5) / scaleFactor + 0.5;

      vec4 tex1 = texture2D(uTexture1, centeredUV1);
      vec4 tex2 = texture2D(uTexture2, centeredUV2);

      gl_FragColor = mix(tex1, tex2, prog);
    }
  `;

  function initWebGL() {
    if (!hasThree || !canvas || reducedMotion) return false;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: false,
        alpha: true,
        powerPreference: 'low-power'
      });

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.01, 10);
      camera.position.z = 1;

      material = new THREE.ShaderMaterial({
        uniforms: {
          uTexture1: { value: null },
          uTexture2: { value: null },
          uProgress: { value: 0.0 },
          uIntensity: { value: 1.0 }
        },
        vertexShader,
        fragmentShader,
        transparent: true
      });

      const geometry = new THREE.PlaneGeometry(1, 1);
      planeMesh = new THREE.Mesh(geometry, material);
      scene.add(planeMesh);

      resizeWebGL();
      webglActive = true;
      canvas.style.opacity = '1';
      return true;
    } catch (e) {
      console.warn('WebGL init failed, falling back to CSS transitions', e);
      return false;
    }
  }

  function resizeWebGL() {
    if (!renderer || !imageWrap) return;
    const rect = imageWrap.getBoundingClientRect();
    const w = Math.max(Math.floor(rect.width), 1);
    const h = Math.max(Math.floor(rect.height), 1);
    renderer.setSize(w, h, false);

    const aspect = w / h;
    if (aspect > 1) {
      camera.left = -0.5 * aspect;
      camera.right = 0.5 * aspect;
      camera.top = 0.5;
      camera.bottom = -0.5;
      planeMesh.scale.set(aspect, 1, 1);
    } else {
      camera.left = -0.5;
      camera.right = 0.5;
      camera.top = 0.5 / aspect;
      camera.bottom = -0.5 / aspect;
      planeMesh.scale.set(1, 1 / aspect, 1);
    }
    camera.updateProjectionMatrix();
  }

  function renderFrame() {
    if (!renderer || !scene || !camera) return;
    renderer.render(scene, camera);
  }

  function startRenderLoop() {
    if (animFrameId) return;
    const loop = () => {
      if (!isVisible) { animFrameId = null; return; }
      renderFrame();
      animFrameId = requestAnimationFrame(loop);
    };
    animFrameId = requestAnimationFrame(loop);
  }

  function stopRenderLoop() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  /* ───────── CSS Fallback (no WebGL) ───────── */
  function initFallback() {
    if (!fallbackEl) return;
    fallbackEl.style.display = 'block';
    if (canvas) canvas.style.display = 'none';

    fallbackEl.innerHTML = '';
    spaces.forEach((space, i) => {
      const img = document.createElement('img');
      img.src = space.image;
      img.alt = space.name;
      img.loading = 'lazy';
      img.className = 'spaces-fallback-img' + (i === 0 ? ' is-active' : '');
      img.setAttribute('data-space-index', i);
      fallbackEl.appendChild(img);
    });
  }

  function setFallbackImage(index) {
    if (!fallbackEl) return;
    const imgs = fallbackEl.querySelectorAll('.spaces-fallback-img');
    imgs.forEach((img, i) => {
      img.classList.toggle('is-active', i === index);
    });
  }

  /* ───────── Text Updates ───────── */
  let lastDisplayedIndex = 0;

  function setSlideText(index) {
    const space = spaces[index];
    if (!space) return;
    if (nameEl) nameEl.textContent = space.name;
    if (taglineEl) taglineEl.textContent = space.tagline;
    if (descEl) descEl.textContent = space.description;
    if (currentEl) currentEl.textContent = String(index + 1).padStart(2, '0');
  }

  /* ───────── Scroll-Driven Pinning & Scrubbing ───────── */
  function setupScrollTrigger() {
    if (!hasGSAP) return;
    gsap.registerPlugin(ScrollTrigger);

    // Initial section reveal
    if (!reducedMotion) {
      gsap.from('.spaces-reveal', {
        y: 28, autoAlpha: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1,
        scrollTrigger: { trigger: section, start: 'top 85%', once: true }
      });
    }

    // There are 6 slides, so exactly 5 transitions (0->1, 1->2, 2->3, 3->4, 4->5).
    // Allocate 1 viewport height of scroll per transition.
    const numTransitions = totalSlides - 1;

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => `+=${window.innerHeight * numTransitions}`,
      scrub: 0.5,
      pin: stickyWrap,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const progress = Math.max(0, Math.min(1, self.progress));

        // Update progress line
        if (progressFill) {
          progressFill.style.width = `${progress * 100}%`;
        }

        // Map progress to current slide transition step
        const raw = progress * numTransitions;
        const currentSlide = Math.min(Math.floor(raw), numTransitions - 1);
        const nextSlide = currentSlide + 1;
        const slideProgress = raw - currentSlide; // 0.0 to 1.0 within transition step

        // Transition mapping within each step:
        // 0.00 to 0.20: hold current slide steadily
        // 0.20 to 0.80: transition current -> next (60% active transition window)
        // 0.80 to 1.00: hold next slide steadily
        let transProgress = 0;
        if (slideProgress < 0.20) {
          transProgress = 0;
        } else if (slideProgress > 0.80) {
          transProgress = 1;
        } else {
          transProgress = (slideProgress - 0.20) / 0.60;
        }

        const isAtEnd = progress >= 0.999;

        // Determine which slide text & fallback image should be active:
        // Text changes at the EXACT midpoint (0.50) of the distortion transition!
        let activeIndex = currentSlide;
        if (isAtEnd) {
          activeIndex = totalSlides - 1; // Slide 5: Corridor
          transProgress = 0;
        } else if (transProgress >= 0.5) {
          activeIndex = nextSlide;
        }

        // Swap text content synchronously at midpoint
        if (activeIndex !== lastDisplayedIndex) {
          setSlideText(activeIndex);
          lastDisplayedIndex = activeIndex;
        }

        // Seamless text fade & micro-lift in lockstep with the image morph
        if (infoWrap && !reducedMotion) {
          if (isAtEnd || transProgress <= 0 || transProgress >= 1) {
            infoWrap.style.opacity = '1';
            infoWrap.style.transform = 'translate3d(0, 0, 0)';
          } else if (transProgress < 0.5) {
            // Fading out old text
            const fadeOut = transProgress / 0.5; // 0 to 1
            infoWrap.style.opacity = String(1 - fadeOut * 0.85);
            infoWrap.style.transform = `translate3d(0, ${-fadeOut * 10}px, 0)`;
          } else {
            // Fading in new text
            const fadeIn = (transProgress - 0.5) / 0.5; // 0 to 1
            infoWrap.style.opacity = String(0.15 + fadeIn * 0.85);
            infoWrap.style.transform = `translate3d(0, ${10 * (1 - fadeIn)}px, 0)`;
          }
        }

        // Three.js distortion update
        if (webglActive && texturesReady && material) {
          if (isAtEnd) {
            // Final slide (Corridor): zero distortion, hold completely static
            material.uniforms.uTexture1.value = loadedTextures[totalSlides - 1];
            material.uniforms.uTexture2.value = loadedTextures[totalSlides - 1];
            material.uniforms.uProgress.value = 0.0;
          } else {
            if (loadedTextures[currentSlide]) {
              material.uniforms.uTexture1.value = loadedTextures[currentSlide];
            }
            if (loadedTextures[nextSlide]) {
              material.uniforms.uTexture2.value = loadedTextures[nextSlide];
            }
            material.uniforms.uProgress.value = transProgress;
            material.uniforms.uIntensity.value = window.innerWidth < 768 ? 0.55 : 1.0;
          }
          renderFrame();
        }

        // CSS fallback transition (if WebGL inactive)
        if (!webglActive) {
          setFallbackImage(activeIndex);
        }
      }
    });
  }

  /* ───────── Visibility Observer ───────── */
  function setupVisibility() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
        if (isVisible && webglActive) {
          startRenderLoop();
        } else {
          stopRenderLoop();
        }
      });
    }, { threshold: 0.05 });

    observer.observe(section);
  }

  /* ───────── Resize Handler ───────── */
  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (webglActive) {
        resizeWebGL();
        renderFrame();
      }
    }, 120);
  }

  /* ───────── Synchronous Initialization ───────── */
  function init() {
    // Initial text display
    setSlideText(0);

    const webglOk = initWebGL();
    if (webglOk) {
      // Preload textures in parallel in background
      preloadImages();
    } else {
      initFallback();
    }

    // Set up ScrollTrigger IMMEDIATELY so pins register in strict DOM order
    setupScrollTrigger();
    setupVisibility();

    window.addEventListener('resize', handleResize, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
