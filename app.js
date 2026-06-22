import { Application } from 'https://unpkg.com/@splinetool/runtime@1.9.3/build/runtime.js';

// --- Global State ---
let splineApp = null;
let keyboard = null;
let bongoCat = null;
let bongoFrame1 = null;
let bongoFrame2 = null;
let bongoInterval = null;
let activeSection = 'hero';
const pos = { x: 0, y: 0 };
const mouse = { x: 0, y: 0 };
const vel = { x: 0, y: 0 };
// Function to control 3D text object visibility based on scroll section
function updateTextVisibility() {
  if (!splineApp) return;
  const textDesktopDark = splineApp.findObjectByName("text-desktop-dark");
  const textDesktopLight = splineApp.findObjectByName("text-desktop");
  const textMobileDark = splineApp.findObjectByName("text-mobile-dark");
  const textMobileLight = splineApp.findObjectByName("text-mobile");

  const isMobile = window.innerWidth <= 768;

  const setVisibility = (dDark, dLight, mDark, mLight) => {
    console.log("updateTextVisibility: setting visibility inside skills-keyboard", {
      textDesktopDark: !!textDesktopDark,
      textDesktopLight: !!textDesktopLight,
      textMobileDark: !!textMobileDark,
      textMobileLight: !!textMobileLight
    });
    if (textDesktopDark) textDesktopDark.visible = dDark;
    if (textDesktopLight) textDesktopLight.visible = dLight;
    if (textMobileDark) textMobileDark.visible = mDark;
    if (textMobileLight) textMobileLight.visible = mLight;
  };

  if (activeSection !== "skills") {
    setVisibility(false, false, false, false);
  } else {
    // Under dark theme, use light text meshes
    isMobile
      ? setVisibility(false, false, false, true)
      : setVisibility(false, true, false, false);
  }
}

// --- Skill Placeholder Data ---
// You can edit the titles and descriptions below to customize your skill labels!
const SKILLS_MAP = {
  js: { label: "JavaScript", desc: "The language that brings websites and interactive designs to life." },
  bootstrap: { label: "Bootstrap", desc: "Rapid responsive design and layout development with UI components." },
  html: { label: "HTML5", desc: "The markup standard for structuring modern, accessible web interfaces." },
  css: { label: "CSS3", desc: "Turning layouts into highly interactive and beautifully styled experiences." },
  php: { label: "PHP", desc: "Backend web development scripting language for server-side logic." },
  cp: { label: "cPanel", desc: "Configuring server hosting, databases, and website deployments." },
  capcut: { label: "CapCut", desc: "Fast-paced video editing and engaging short-form content creation." },
  prepro: { label: "Premiere Pro", desc: "Industry-standard, professional video editing and audio syncing." },
  youtube: { label: "YouTube Content", desc: "Crafting engaging, retention-optimized videos for YouTube channels." },
  figma: { label: "Figma", desc: "Creating mockups, prototypes, and collaborative UI/UX designs." },
  obs: { label: "OBS Studio", desc: "Live streaming broadcast management and screen recording setups." },
  photoshop: { label: "Photoshop", desc: "Graphic design, photo editing, and creative visual artwork design." },
  vercel: { label: "Vercel", desc: "Hosting and serverless deployment platform for modern web applications." },
  git: { label: "Git", desc: "Version control system for tracking codebase changes and branching." },
  github: { label: "GitHub", desc: "Collaborative platform for cloud version control and repository management." },
  godaddy: { label: "GoDaddy", desc: "Domain registration, hosting setup, and DNS record management." },
  firebase: { label: "Firebase", desc: "NoSQL databases, authentication, and hosting for real-time applications." },
  wordpress: { label: "WordPress", desc: "Building custom themes, plugins, and scalable content management systems." }
};

// --- Sound Effects Setup ---
const pressSound = new Audio('assets/keycap-sounds/press.mp3');
pressSound.volume = 0.8;
const releaseSound = new Audio('assets/keycap-sounds/release.mp3');
releaseSound.volume = 0.7;

const playPress = () => {
  pressSound.currentTime = 0;
  pressSound.play().catch(() => { });
};

const playRelease = () => {
  releaseSound.currentTime = 0;
  releaseSound.play().catch(() => { });
};

// --- 1. Load Spline 3D Scene ---
const canvas = document.getElementById('canvas3d');
const spline = new Application(canvas);

// Load the custom skills_tanees spline file
spline.load('assets/skills_tanees.spline').then(() => {
  splineApp = spline;
  keyboard = spline.findObjectByName('keyboard');

  // Find Bongo Cat components if present
  bongoCat = spline.findObjectByName('bongo-cat');
  bongoFrame1 = spline.findObjectByName('frame-1');
  bongoFrame2 = spline.findObjectByName('frame-2');

  // Initialize keyboard properties & bounce-in reveal sequence
  if (keyboard) {
    const allObjects = spline.getAllObjects();
    const isMobile = window.innerWidth <= 768;

    keyboard.visible = false;
    setTimeout(() => {
      keyboard.visible = true;

      // Make colored keycap bases visible
      if (isMobile) {
        const mobileKeyCaps = allObjects.filter(obj => obj.name === "keycap-mobile");
        mobileKeyCaps.forEach(k => { k.visible = true; });
      } else {
        const desktopKeyCaps = allObjects.filter(obj => obj.name === "keycap-desktop");
        desktopKeyCaps.forEach((k, idx) => {
          setTimeout(() => {
            k.visible = true;
          }, idx * 70);
        });
      }

      // Hide keycaps and stagger reveal them with a bounce
      const keycaps = allObjects.filter(obj => obj.name === 'keycap');
      keycaps.forEach((k, idx) => {
        k.visible = false;
        setTimeout(() => {
          k.visible = true;
          gsap.fromTo(
            k.position,
            { y: 200 },
            { y: 50, duration: 0.5, ease: "bounce.out" }
          );
        }, idx * 70 + 400);
      });
    }, 400);
  }

  // Setup GSAP Scroll animations
  setupScrollAnimations();

  // Setup interactive listeners
  setupSplineEvents();

  // Initialize 3D text visibility state
  updateTextVisibility();
}).catch(err => {
  console.error("Error loading Spline 3D Scene:", err);
});

// --- 2. GSAP ScrollTrigger Configuration ---
function setupScrollAnimations() {
  if (!keyboard) return;
  gsap.registerPlugin(ScrollTrigger);

  const isMobile = window.innerWidth <= 768;

  // --- Responsive Scale Offset (from original config) ---
  const getScaleOffset = () => {
    const width = window.innerWidth;
    const DESKTOP_REF_WIDTH = 1280;
    const MOBILE_REF_WIDTH = 390;
    const targetScale = isMobile ? width / MOBILE_REF_WIDTH : width / DESKTOP_REF_WIDTH;
    const minScale = 0.5;
    const maxScale = isMobile ? 0.6 : 1.15;
    return Math.min(Math.max(targetScale, minScale), maxScale);
  };

  const scaleOffset = getScaleOffset();

  const applyScaleOffset = (base) => ({
    x: Math.abs(base.x * scaleOffset),
    y: Math.abs(base.y * scaleOffset),
    z: Math.abs(base.z * scaleOffset),
  });

  // Keyboard Layout Transform States for each section
  const STATES = {
    hero: {
      scale: isMobile ? { x: 0.30, y: 0.30, z: 0.30 } : { x: 0.20, y: 0.20, z: 0.20 },
      position: isMobile ? { x: 0, y: -200, z: 0 } : { x: 225, y: -100, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    skills: {
      scale: isMobile ? { x: 0.3, y: 0.3, z: 0.3 } : { x: 0.25, y: 0.25, z: 0.25 },
      position: isMobile ? { x: 0, y: -40, z: 0 } : { x: 100, y: -40, z: 0 },
      rotation: isMobile ? { x: 0, y: Math.PI / 6, z: 0 } : { x: 0, y: Math.PI / 12, z: 0 },
    },
    about: {
      scale: isMobile ? { x: 0.3, y: 0.3, z: 0.3 } : { x: 0.25, y: 0.25, z: 0.25 },
      position: { x: 0, y: -40, z: 0 },
      rotation: isMobile ? { x: Math.PI / 6, y: -Math.PI / 6, z: 0 } : { x: Math.PI / 12, y: -Math.PI / 4, z: 0 },
    },
    projects: {
      scale: isMobile ? { x: 0.3, y: 0.3, z: 0.3 } : { x: 0.25, y: 0.25, z: 0.25 },
      position: isMobile ? { x: 0, y: 150, z: 0 } : { x: 0, y: -40, z: 0 },
      rotation: { x: Math.PI, y: Math.PI / 3, z: Math.PI },
    },
    contact: {
      scale: isMobile ? { x: 0.25, y: 0.25, z: 0.25 } : { x: 0.2, y: 0.2, z: 0.2 },
      position: isMobile ? { x: 0, y: 150, z: 0 } : { x: 350, y: -250, z: 0 },
      rotation: isMobile ? { x: Math.PI, y: Math.PI / 3, z: Math.PI } : { x: 0, y: 0, z: 0 },
    }
  };

  // Helper: apply scale offset to a state
  const getState = (sectionName) => {
    const s = STATES[sectionName];
    return {
      scale: applyScaleOffset(s.scale),
      position: s.position,
      rotation: s.rotation,
    };
  };

  // Set Initial Hero State
  const heroState = getState('hero');
  gsap.set(keyboard.position, heroState.position);
  gsap.set(keyboard.rotation, heroState.rotation);

  // Scale up keyboard with GSAP elastic effect (intro animation using computed hero scale)
  gsap.fromTo(
    keyboard.scale,
    { x: 0.01, y: 0.01, z: 0.01 },
    {
      x: heroState.scale.x,
      y: heroState.scale.y,
      z: heroState.scale.z,
      duration: 1.5,
      ease: "elastic.out(1, 0.6)",
    }
  );

  // Continuous Hero Rotation
  let rotateHero = null;
  const startHeroRotation = () => {
    if (rotateHero) rotateHero.kill();
    rotateHero = gsap.to(keyboard.rotation, {
      y: "+=" + (Math.PI * 2),
      duration: 25,
      repeat: -1,
      ease: "none"
    });
  };

  const stopHeroRotation = () => {
    if (rotateHero) {
      rotateHero.kill();
      rotateHero = null;
    }
  };

  // Start hero rotation initially
  startHeroRotation();

  // Function to animate bongo cat paw movements
  function setActiveBongo(active) {
    clearInterval(bongoInterval);
    if (!bongoCat || !bongoFrame1 || !bongoFrame2) return;

    if (active) {
      bongoCat.visible = true;
      let counter = 0;
      bongoInterval = setInterval(() => {
        if (counter % 2) {
          bongoFrame1.visible = false;
          bongoFrame2.visible = true;
        } else {
          bongoFrame1.visible = true;
          bongoFrame2.visible = false;
        }
        counter++;
      }, 100);
    } else {
      bongoCat.visible = false;
      bongoFrame1.visible = false;
      bongoFrame2.visible = false;
    }
  }

  // Keycap float animations in contact section
  let floatTweens = [];
  function startKeycapsFloating() {
    stopKeycapsFloating();
    const skillKeys = Object.keys(SKILLS_MAP);
    skillKeys.forEach((key, index) => {
      const obj = splineApp.findObjectByName(key);
      if (!obj) return;
      const tween = gsap.to(obj.position, {
        y: Math.random() * 150 + 150,
        duration: Math.random() * 2 + 1.5,
        delay: index * 0.1,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
      });
      floatTweens.push(tween);
    });
  }

  function stopKeycapsFloating() {
    floatTweens.forEach(t => t.kill());
    floatTweens = [];
    const skillKeys = Object.keys(SKILLS_MAP);
    skillKeys.forEach(key => {
      const obj = splineApp.findObjectByName(key);
      if (!obj) return;
      gsap.to(obj.position, {
        y: 0,
        duration: 1,
        ease: "power2.out"
      });
    });
  }

  // --- Section enter/leave logic ---
  const onSectionChange = (section) => {
    activeSection = section;
    updateTextVisibility();

    // Close skill details popup if we scroll away from skills
    if (section !== "skills") {
      const popup = document.getElementById('skill-details-popup');
      if (popup) {
        popup.classList.remove('active');
      }
    }

    // Hero rotation
    if (section === "hero") {
      startHeroRotation();
    } else {
      stopHeroRotation();
    }

    // Bongo cat
    if (section === "projects") {
      setActiveBongo(true);
    } else {
      setActiveBongo(false);
    }

    // Keycap floating
    if (section === "contact") {
      startKeycapsFloating();
    } else {
      stopKeycapsFloating();
    }
  };

  // --- ScrollTrigger transitions (matching original Next.js pattern) ---
  const createSectionTimeline = (triggerId, targetSection, prevSection, start = "top 50%", end = "bottom bottom") => {
    gsap.timeline({
      scrollTrigger: {
        trigger: triggerId,
        start,
        end,
        scrub: true,
        onEnter: () => {
          const state = getState(targetSection);
          gsap.to(keyboard.scale, { ...state.scale, duration: 1 });
          gsap.to(keyboard.position, { ...state.position, duration: 1 });
          gsap.to(keyboard.rotation, { ...state.rotation, duration: 1 });
          onSectionChange(targetSection);
        },
        onLeaveBack: () => {
          const state = getState(prevSection);
          gsap.to(keyboard.scale, { ...state.scale, duration: 1 });
          gsap.to(keyboard.position, { ...state.position, duration: 1 });
          gsap.to(keyboard.rotation, { ...state.rotation, duration: 1 });
          onSectionChange(prevSection);
        }
      }
    });
  };

  // Section transitions mapping
  createSectionTimeline("#skills", "skills", "hero");
  createSectionTimeline("#about", "about", "skills");
  createSectionTimeline("#projects", "projects", "about", "top 70%");
  createSectionTimeline("#contact", "contact", "projects", "top 30%");
}

// --- 3. Spline Interactive Events & Details Panel ---
function setupSplineEvents() {
  if (!splineApp) return;

  const popup = document.getElementById('skill-details-popup');
  const titleEl = document.getElementById('skill-popup-title');
  const descEl = document.getElementById('skill-popup-desc');

  let popupTimeout = null;
  let hoveredSkill = null;

  const updateDetails = (skillName, clientX, clientY) => {
    const data = SKILLS_MAP[skillName];
    if (data) {
      if (popupTimeout) {
        clearTimeout(popupTimeout);
        popupTimeout = null;
      }
      if (titleEl) titleEl.innerText = data.label;
      if (descEl) descEl.innerText = data.desc;

      if (popup) {
        // Dynamic positioning next to keyboard / hovered key (on desktop)
        if (window.innerWidth > 768) {
          if (clientX !== undefined && clientY !== undefined) {
            const cardWidth = 380;
            const cardHeight = popup.offsetHeight || 150; // fallback height estimate

            // Place card to the right of cursor with a small offset
            let leftPos = clientX + 30;
            let topPos = clientY - cardHeight / 2;

            // If the card would clip off the right screen boundary, place it to the left of the cursor instead
            if (leftPos + cardWidth > window.innerWidth) {
              leftPos = clientX - cardWidth - 30;
            }
            if (leftPos < 20) leftPos = 20;

            // Constrain vertically within screen boundaries (accounting for top header overlap)
            const minTop = 100;
            const maxTop = window.innerHeight - cardHeight - 30;
            topPos = Math.max(minTop, Math.min(topPos, maxTop));

            popup.style.left = `${leftPos}px`;
            popup.style.top = `${topPos}px`;
          } else {
            // Default backup position next to keyboard model (e.g. left side of viewport)
            const cardHeight = popup.offsetHeight || 150;
            popup.style.left = '80px';
            popup.style.top = `${(window.innerHeight - cardHeight) / 2}px`;
          }
        }
        popup.classList.add('active');
      }

      popupTimeout = setTimeout(() => {
        if (popup) popup.classList.remove('active');
        popupTimeout = null;
        hoveredSkill = null; // Allow re-hovering the same key to trigger the details card again
      }, 3000);
    } else {
      // Don't close immediately, let the 3-second timer handle it
    }
  };



  // Listen for keydown / hover events from the 3D scene
  splineApp.addEventListener('mouseHover', (e) => {
    const targetName = e.target.name;
    const showInfo = (activeSection === 'skills');

    // Prevent duplicate triggers if we are hovering within the same keycap/body
    if (hoveredSkill === targetName) return;

    if (targetName === 'body' || targetName === 'platform') {
      if (hoveredSkill) {
        playRelease();
        hoveredSkill = null;
      }
      if (showInfo) {
        updateDetails(null);
      }
      splineApp.setVariable("heading", "");
      splineApp.setVariable("desc", "");
    } else if (SKILLS_MAP[targetName]) {
      if (hoveredSkill) {
        playRelease();
      }
      playPress();
      hoveredSkill = targetName;

      if (showInfo) {
        updateDetails(targetName, mouse.x, mouse.y);
        // Temporarily disabled hover showing skill info
        // splineApp.setVariable("heading", SKILLS_MAP[targetName].label);
        // splineApp.setVariable("desc", SKILLS_MAP[targetName].desc);
      } else {
        splineApp.setVariable("heading", "");
        splineApp.setVariable("desc", "");
      }
    }
  });

  splineApp.addEventListener('keyDown', (e) => {
    const targetName = e.target.name;
    const showInfo = (activeSection === 'skills');

    if (SKILLS_MAP[targetName]) {
      playPress();
      if (showInfo) {
        updateDetails(targetName, mouse.x, mouse.y);
        splineApp.setVariable("heading", SKILLS_MAP[targetName].label);
        splineApp.setVariable("desc", SKILLS_MAP[targetName].desc);
      }
    }
  });

  splineApp.addEventListener('keyUp', () => {
    playRelease();
    splineApp.setVariable("heading", "");
    splineApp.setVariable("desc", "");
  });
}

// --- 4. Custom Elastic Jelly Cursor Physics ---
const jellyCursor = document.getElementById('custom-cursor-jelly');
const dotCursor = document.getElementById('custom-cursor-dot');

let isHovering = false;

// Track Mouse Movement
window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;

  // Dot cursor snaps directly to mouse
  gsap.set(dotCursor, { x: mouse.x, y: mouse.y });

  // Update target checks for morph effects
  const target = e.target;
  const hoverTarget = target.closest('.cursor-can-hover');

  if (hoverTarget) {
    isHovering = true;
    const rect = hoverTarget.getBoundingClientRect();

    // Morph jelly cursor into a neat rectangle wrapper around hovered link
    gsap.to(jellyCursor, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      width: rect.width + 24,
      height: rect.height + 12,
      borderRadius: "6px",
      rotation: 0,
      duration: 0.3,
      ease: "power2.out"
    });
  } else {
    isHovering = false;
    gsap.to(jellyCursor, {
      width: 50,
      height: 50,
      borderRadius: "50%",
      duration: 0.2
    });
  }
});

// Update jelly spring position & velocity mapping loop (elastic jelly effect)
gsap.ticker.add(() => {
  if (isHovering) return; // Keep rectangular shape fixed when hovering links

  // Soft elastic delay/interpolate coordinate values
  pos.x += (mouse.x - pos.x) * 0.15;
  pos.y += (mouse.y - pos.y) * 0.15;

  // Compute velocity vectors
  vel.x = mouse.x - pos.x;
  vel.y = mouse.y - pos.y;

  // Determine stretching angle and amount
  const rotation = (Math.atan2(vel.y, vel.x) * 180) / Math.PI;
  const distance = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
  const scale = Math.min(distance / 600, 0.45);

  gsap.set(jellyCursor, {
    x: pos.x,
    y: pos.y,
    scaleX: 1 + scale,
    scaleY: 1 - scale,
    rotation: rotation
  });
});

// --- 5. Cosmic Universe Starfield Particle Simulation ---
const pCanvas = document.getElementById('particles-canvas');
if (pCanvas) {
  const pCtx = pCanvas.getContext('2d');
  let stars = [];
  const STAR_COUNT = window.innerWidth <= 768 ? 60 : 150;

  const resizeParticlesCanvas = () => {
    pCanvas.width = window.innerWidth;
    pCanvas.height = window.innerHeight;
  };

  // Track window resizing
  window.addEventListener('resize', resizeParticlesCanvas);
  resizeParticlesCanvas();

  // Color Palette for Universe Stars
  const starColors = [
    'rgba(255, 255, 255, ',   // Pure White
    'rgba(173, 216, 230, ',   // Light Blue
    'rgba(255, 240, 245, ',   // Soft Lavender Pink
    'rgba(255, 250, 205, '    // Pale Golden Star
  ];

  // Helper to generate a single star properties
  const createStar = (randomizeY = true) => {
    return {
      x: Math.random() * pCanvas.width,
      y: randomizeY ? Math.random() * pCanvas.height : -10, // Spawn just off-screen if resetting
      size: Math.random() * 1.8 + 0.2, // Tiny specs to slightly larger glowing dots
      speedX: (Math.random() - 0.5) * 0.05, // Drifts very slowly horizontally
      speedY: Math.random() * 0.12 + 0.03, // Drifts downward slowly
      colorBase: starColors[Math.floor(Math.random() * starColors.length)],
      alpha: 0,
      targetAlpha: Math.random() * 0.7 + 0.2,
      parallaxFactor: Math.random() * 0.02 + 0.005 // Stars further back have lower parallax, closer stars have more shift
    };
  };

  // Populate initial star field
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push(createStar(true));
  }

  // Animating Starfield Frame Loop
  const animateStars = () => {
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

    stars.forEach((star, index) => {
      // Slow fade-in of stars
      if (star.alpha < star.targetAlpha) {
        star.alpha += 0.01;
      }

      // Parallax shifts based on mouse coordinates relative to center screen
      const offsetX = (mouse.x - window.innerWidth / 2) * star.parallaxFactor;
      const offsetY = (mouse.y - window.innerHeight / 2) * star.parallaxFactor;

      // Draw Star with glow shadow
      pCtx.beginPath();
      pCtx.arc(star.x + offsetX, star.y + offsetY, star.size, 0, Math.PI * 2);
      pCtx.fillStyle = star.colorBase + star.alpha + ')';

      // Make larger stars glow a bit
      if (star.size > 1.2) {
        pCtx.shadowBlur = star.size * 3;
        pCtx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      } else {
        pCtx.shadowBlur = 0;
      }

      pCtx.fill();

      // Reset shadow mapping to avoid impacting other elements
      pCtx.shadowBlur = 0;

      // Update positions
      star.x += star.speedX;
      star.y += star.speedY;

      // Reset star to top of canvas if it goes off bottom viewport
      if (star.y > pCanvas.height + 20) {
        stars[index] = createStar(false);
      }
      // Reset if drifts too far left/right
      if (star.x < -20 || star.x > pCanvas.width + 20) {
        stars[index] = createStar(true);
      }
    });

    requestAnimationFrame(animateStars);
  };

  // Start universe animation
  animateStars();
}

// --- 6. Mobile Navigation Menu Toggle ---
const menuToggle = document.getElementById('menu-toggle');
const headerNav = document.querySelector('header nav');
const navOverlay = document.getElementById('nav-overlay');

if (menuToggle && headerNav && navOverlay) {
  const toggleMenu = () => {
    headerNav.classList.toggle('open');
    navOverlay.classList.toggle('active');
  };

  const closeMenu = () => {
    headerNav.classList.remove('open');
    navOverlay.classList.remove('active');
  };

  menuToggle.addEventListener('click', toggleMenu);
  navOverlay.addEventListener('click', closeMenu);

  // Close menu when navigation links are clicked
  const navLinks = headerNav.querySelectorAll('a');
  navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}
