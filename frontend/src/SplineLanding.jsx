import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Link, Container, Grid, Card, Button, Avatar, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import StarsIcon from '@mui/icons-material/Stars';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import GoogleIcon from '@mui/icons-material/Google';
import VerifiedIcon from '@mui/icons-material/Verified';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import CodeIcon from '@mui/icons-material/Code';
import handymanHero from './assets/handyman_hero.png';
import vivekProfile from './assets/vivek_profile.jpg';
import vedProfile from './assets/ved_profile.jpg';
import slide1 from './assets/slide1.jpg';
import slide2 from './assets/slide2.jpg';
import slide3 from './assets/slide3.jpg';
import slide4 from './assets/slide4.jpg';
import slide5 from './assets/slide5.jpg';
import slide6 from './assets/slide6.jpg';
import slide7 from './assets/slide7.jpg';
import slide8 from './assets/slide8.jpg';
import slide9 from './assets/slide9.jpg';
import slide10 from './assets/slide10.jpg';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const SplineLanding = () => {
  const navigate = useNavigate();

  // Dynamic iframe pointer events state to solve trackpad & touch scroll hijacking
  const [iframePointerEvents, setIframePointerEvents] = useState('auto');
  const scrollTimeoutRef = useRef(null);

  // Slideshow state
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideIntervalRef = useRef(null);
  const TOTAL_SLIDES = 10;

  // Auto-advance slideshow every 4 seconds, loops
  useEffect(() => {
    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % TOTAL_SLIDES);
    }, 4000);
    return () => clearInterval(slideIntervalRef.current);
  }, []);

  const goToSlide = (index) => {
    clearInterval(slideIntervalRef.current);
    setCurrentSlide((index + TOTAL_SLIDES) % TOTAL_SLIDES);
    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % TOTAL_SLIDES);
    }, 4000);
  };

  useEffect(() => {
    const handleScrollGestureStart = () => {
      // Temporarily disable pointer events on the iframe so gestures scroll the parent document
      setIframePointerEvents('none');

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Restore pointer events 150ms after scroll gesture pauses/stops
      scrollTimeoutRef.current = setTimeout(() => {
        setIframePointerEvents('auto');
      }, 150);
    };

    window.addEventListener('wheel', handleScrollGestureStart, { passive: true });
    window.addEventListener('touchstart', handleScrollGestureStart, { passive: true });
    window.addEventListener('touchmove', handleScrollGestureStart, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleScrollGestureStart);
      window.removeEventListener('touchstart', handleScrollGestureStart);
      window.removeEventListener('touchmove', handleScrollGestureStart);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Load Valeran's exact custom fonts (Maltiner Display & NewBlack) dynamically
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @font-face {
        font-family: 'Maltiner Display';
        src: url('https://cdn.prod.website-files.com/6a2988625ed1354394490132/6a2988625ed135439449014d_Maltiner%20Display.woff2') format('woff2');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'NewBlack';
        src: url('https://cdn.prod.website-files.com/6a2988625ed1354394490132/6a2988625ed1354394490159_NewBlackTypeface-UltraLight.woff2') format('woff2');
        font-weight: 200;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'NewBlack';
        src: url('https://cdn.prod.website-files.com/6a2988625ed1354394490132/6a2988625ed1354394490157_NewBlackTypeface-Regular.woff2') format('woff2');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'NewBlack';
        src: url('https://cdn.prod.website-files.com/6a2988625ed1354394490132/6a2988625ed135439449015b_NewBlackTypeface-Medium.woff2') format('woff2');
        font-weight: 500;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'NewBlack';
        src: url('https://cdn.prod.website-files.com/6a2988625ed1354394490132/6a2988625ed135439449015c_NewBlackTypeface-ExtraBold.woff2') format('woff2');
        font-weight: 800;
        font-style: normal;
        font-display: swap;
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // GSAP ScrollTrigger animations
  useEffect(() => {
    // 1. Pinned Horizontal text reveal sentence animation & oval mask slide-in
    const textTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.pinned-text-section',
        start: 'top top',
        end: '+=250%', // Extended scroll trackpad space
        pin: true,
        scrub: true,
        anticipatePin: 1,
      }
    });

    // Set initial offscreen state for the half-oval background mask
    gsap.set('.pinned-oval-mask', { x: -380, opacity: 0 });
    // Set initial offscreen state for the right video oval
    gsap.set('.pinned-oval-mask-right', { x: 380, opacity: 0 });

    textTl
      // 1. Fade in trusted
      .to('.word-comma-trusted', { opacity: 1, duration: 1.2, ease: 'power1.inOut' })
      // 2. Fade in professional
      .to('.word-professional', { opacity: 1, duration: 1.4, ease: 'power1.inOut' })
      // 3. Pause briefly to showcase the full tagline sentence
      .to({}, { duration: 0.8 })
      // 4. Slide up the text and fade it out
      .to('.reveal-text-line', {
        y: -150,
        opacity: 0,
        duration: 1.5,
        ease: 'power2.inOut',
      })
      // 5. Slowly slide in the half-oval image mask from the left side
      .to('.pinned-oval-mask', {
        x: 0,
        opacity: 1,
        duration: 2.0,
        ease: 'power2.out',
      }, '-=0.5') // Overlap slightly with text slide-up for premium fluidity
      // 6. Hold the handyman oval visible momentarily
      .to({}, { duration: 0.6 })
      // 7. Slide the handyman oval back out to the left
      .to('.pinned-oval-mask', {
        x: -420,
        opacity: 0,
        duration: 1.6,
        ease: 'power2.inOut',
      })
      // 8. Slide the right video oval in from the right
      .to('.pinned-oval-mask-right', {
        x: 0,
        opacity: 1,
        duration: 2.0,
        ease: 'power2.out',
      }, '-=0.6'); // Overlap slightly with handyman exit for smooth crossover

    // 2. Set initial hidden states for headers
    gsap.set('.spline-safety-header', { opacity: 0, y: 35 });

    // Left steps scroll-scrub
    gsap.utils.toArray('.spline-timeline-step-left').forEach((card) => {
      gsap.fromTo(card,
        { opacity: 0.15, x: -60 },
        {
          opacity: 1,
          x: 0,
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            end: 'top 55%',
            scrub: 1,
          }
        }
      );
    });

    // Right steps scroll-scrub
    gsap.utils.toArray('.spline-timeline-step-right').forEach((card) => {
      gsap.fromTo(card,
        { opacity: 0.15, x: 60 },
        {
          opacity: 1,
          x: 0,
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            end: 'top 55%',
            scrub: 1,
          }
        }
      );
    });

    // Safety Header Reveal
    ScrollTrigger.create({
      trigger: '.spline-safety-header',
      start: 'top 85%',
      onEnter: () => gsap.to('.spline-safety-header', { opacity: 1, y: 0, duration: 1.4, ease: 'power4.out' }),
      once: true
    });

    // Safety points scroll-scrub
    gsap.utils.toArray('.spline-safety-card').forEach((point) => {
      gsap.fromTo(point,
        { opacity: 0.15, y: 30 },
        {
          opacity: 1,
          y: 0,
          scrollTrigger: {
            trigger: point,
            start: 'top 85%',
            end: 'top 60%',
            scrub: 1,
          }
        }
      );
    });

    // Pinned scroll team reveal timeline (Only on desktop >= 900px)
    if (window.innerWidth >= 900) {
      const teamTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.pinned-team-section',
          start: 'top top',
          end: '+=180%',
          pin: true,
          scrub: true,
          anticipatePin: 1,
        }
      });

      gsap.set('.spline-team-card-left', { opacity: 0.15, x: -120 });
      gsap.set('.spline-team-card-right', { opacity: 0.15, x: 120 });

      teamTl
        .to('.spline-team-card-left', { opacity: 1, x: 0, duration: 1.5, ease: 'power2.out' })
        .to('.spline-team-card-right', { opacity: 1, x: 0, duration: 1.5, ease: 'power2.out' }, '+=0.5');
    } else {
      gsap.set('.spline-team-card-left', { opacity: 1, x: 0 });
      gsap.set('.spline-team-card-right', { opacity: 1, x: 0 });
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        position: 'relative',
        margin: 0,
        padding: 0,
        bgcolor: '#090d16',
      }}
    >
      {/* 1. Spline interactive background - FIXED to the screen */}
      <iframe
        src="https://my.spline.design/particles-YTBDLEkKYDerayq5gxeww7yv/"
        frameBorder="0"
        width="100%"
        height="100%"
        title="Spline Particles"
        allow="autoplay; fullscreen"
        style={{
          border: 'none',
          width: '100vw',
          height: '100vh',
          display: 'block',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1,
          pointerEvents: iframePointerEvents, // Dynamically toggled on scrolling/swiping
          transition: 'pointer-events 0.1s ease',
        }}
      />


      {/* 2. Brand Overlay - Hero Fold (pointerEvents: none to let hover reach iframe) */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { xs: 4, md: 8 },
          pointerEvents: 'none', // Hover events bypass this layer to hit fixed iframe
          boxSizing: 'border-box',
        }}
      >
        {/* Top Navigation Row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            width: '100%',
          }}
        >
          {/* Top Left: Logo & Language Selector */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                fontFamily: "'NewBlack', sans-serif",
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
              }}
            >
              [ EN ] &nbsp; [ HI ]
            </Typography>
            <Typography
              onClick={() => navigate('/home')}
              sx={{
                fontFamily: "'Maltiner Display', Georgia, serif",
                fontSize: { xs: '2rem', md: '3rem' },
                fontWeight: 400,
                letterSpacing: '0.04em',
                lineHeight: 1,
                cursor: 'pointer',
                pointerEvents: 'auto',
                color: '#ffffff',
                transition: 'opacity 0.2s',
                '&:hover': {
                  opacity: 0.8,
                },
              }}
            >
              WORKIZO
            </Typography>
          </Box>

          {/* Top Right: Columns matching Valeran */}
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 4, md: 8 },
              pointerEvents: 'auto',
              textAlign: 'left',
            }}
          >
            {/* Column 1: Services */}
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontFamily: "'NewBlack', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  letterSpacing: '0.15em',
                  display: 'block',
                  mb: 1.5,
                }}
              >
                SERVICES
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link
                  onClick={() => navigate('/home')}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: "'NewBlack', sans-serif",
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    letterSpacing: '0.02em',
                    cursor: 'pointer',
                    '&:hover': { color: '#ffffff' },
                  }}
                >
                  [ BOOK REPAIR ]
                </Link>
                <Link
                  onClick={() => navigate('/captain/register')}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: "'NewBlack', sans-serif",
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    letterSpacing: '0.02em',
                    cursor: 'pointer',
                    '&:hover': { color: '#ffffff' },
                  }}
                >
                  [ BECOME A CAPTAIN ]
                </Link>
              </Box>
            </Box>

            {/* Column 2: Platform Links */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontFamily: "'NewBlack', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  letterSpacing: '0.15em',
                  display: 'block',
                  mb: 1.5,
                }}
              >
                WORKIZO
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

                <Link
                  onClick={() => navigate('/home')}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: "'NewBlack', sans-serif",
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    letterSpacing: '0.02em',
                    cursor: 'pointer',
                    '&:hover': { color: '#ffffff' },
                  }}
                >
                  [ GO TO PORTAL ]
                </Link>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Bottom Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'flex-end' },
            gap: 4,
            width: '100%',
          }}
        >
          {/* Bottom Left: Huge Luxury serif title */}
          <Box sx={{ maxWidth: '650px' }}>
            <Typography
              variant="h2"
              sx={{
                fontFamily: "'Maltiner Display', Georgia, serif",
                fontWeight: 400,
                fontSize: { xs: '1.8rem', sm: '2.8rem', md: '3.6rem' },
                lineHeight: 1.15,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              One request,
              <br />
              one skilled solution.
            </Typography>
          </Box>

          {/* Bottom Right: Go to Website link */}
          <Box
            sx={{
              pointerEvents: 'auto',
              alignSelf: { xs: 'stretch', md: 'auto' },
            }}
          >
            <Link
              onClick={() => navigate('/home')}
              sx={{
                color: '#ffffff',
                fontFamily: "'NewBlack', sans-serif",
                fontSize: { xs: '0.9rem', md: '1rem' },
                fontWeight: 800,
                textDecoration: 'none',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                display: 'inline-block',
                transition: 'opacity 0.2s',
                '&:hover': {
                  opacity: 0.7,
                },
              }}
            >
              [ GO TO WEBSITE ]
            </Link>
          </Box>
        </Box>
      </Box>

      {/* Pinned Scroll-Reveal Text Section (Apple-style scroll scrubbing sentence) */}
      <Box
        className="pinned-text-section"
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'transparent',
          position: 'relative',
          zIndex: 10,
          pointerEvents: 'none',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Left side half-oval image background mask (hides Spline) */}
        <Box
          className="pinned-oval-mask"
          sx={{
            position: 'absolute',
            left: 0,
            top: '18vh',
            width: { xs: '200px', md: '360px' },
            height: { xs: '350px', md: '580px' },
            bgcolor: '#090d16',
            borderTopRightRadius: { xs: '175px 175px', md: '290px 290px' },
            borderBottomRightRadius: { xs: '175px 175px', md: '290px 290px' },
            zIndex: 2, // above Spline iframe (z-index 1)
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderLeft: 'none',
            pointerEvents: 'none', // let mouse clicks pass through
          }}
        >
          <Box
            component="img"
            src={handymanHero}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.7,
              filter: 'grayscale(20%) brightness(90%)',
            }}
          />
        </Box>

        {/* Right-side reverse-D — flat edge on screen right, curved arc on left, 16:9 video inside */}
        <Box
          className="pinned-oval-mask-right"
          sx={{
            position: 'absolute',
            // Push right half off-screen so the flat edge sits at the screen boundary
            right: { xs: '-10vw', md: '-6vw' },
            top: '50%',
            transform: 'translateY(-50%)',
            // Container is exactly 16:9
            width: { xs: '80vw', md: '60vw' },
            height: { xs: 'calc(80vw * 9 / 16)', md: 'calc(60vw * 9 / 16)' },
            bgcolor: '#090d16',
            // Reverse-D shape: a very large radius on left corners becomes a perfect arc
            // Right corners stay square (flat edge touching screen boundary)
            borderTopLeftRadius: '9999px',
            borderBottomLeftRadius: '9999px',
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            zIndex: 2,
            overflow: 'hidden',
            // Subtle left-side glow border only
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            borderRight: 'none',
            pointerEvents: 'none',
            // Subtle dark glow
            boxShadow: '-12px 0 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Video in natural 16:9 — fills the reverse-D container */}
          <Box
            component="video"
            src="/videos/WORKIZO_Premium_Hero_Video_Obj.mp4"
            autoPlay
            loop
            muted
            playsInline
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.92,
              filter: 'brightness(88%)',
              display: 'block',
            }}
          />
        </Box>

        <Container maxWidth="lg" sx={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <Typography
            className="reveal-text-line"
            sx={{
              fontFamily: "'Maltiner Display', Georgia, serif",
              fontSize: { xs: '1.8rem', sm: '3.2rem', md: '4.8rem' },
              fontWeight: 400,
              lineHeight: 1.25,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'inline-block',
              maxWidth: '90%',
              mx: 'auto',
            }}
          >
            <span className="word-fast" style={{ opacity: 1 }}>FAST</span>
            <span className="word-comma-trusted" style={{ opacity: 0.15 }}>, TRUSTED</span>
            <span className="word-professional" style={{ opacity: 0.15 }}>, AND PROFESSIONAL HOME SERVICES.</span>
          </Typography>
        </Container>
      </Box>

      {/* Elegant long empty space showing the Spline particles */}
      <Box sx={{ height: { xs: '20vh', md: '35vh' } }} />

      {/* 3. How It Works Section (Alternating Transparent Timeline layout) */}
      <Box
        sx={{
          bgcolor: 'transparent',
          py: 12,
          position: 'relative',
          zIndex: 10,
          pointerEvents: 'auto',
          color: '#ffffff',
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                fontFamily: "'NewBlack', sans-serif",
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
              }}
            >
              Book in Minutes. Get Help Instantly.
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 400,
                mt: 1.5,
                mb: 2,
                fontFamily: "'Maltiner Display', Georgia, serif",
                letterSpacing: '0.03em',
              }}
            >
              How It Works
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: "'NewBlack', sans-serif",
                maxWidth: '600px',
                mx: 'auto',
                fontSize: '0.9rem',
                lineHeight: 1.6,
              }}
            >
              From booking to completion, WORKIZO keeps every step simple, transparent, and live.
            </Typography>
          </Box>

          {/* Timeline Flex Wrapper (Left Column, Spine, Right Column) */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              position: 'relative',
              width: '100%',
            }}
          >
            {/* Center vertical line */}
            <Box
              sx={{
                display: { xs: 'none', md: 'block' },
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                top: 0,
                bottom: 0,
                width: '2px',
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                zIndex: 1,
              }}
            />

            {/* Left Column (Points 1 & 3) */}
            <Box
              sx={{
                width: { xs: '100%', md: '50%' },
                display: 'flex',
                flexDirection: 'column',
                alignItems: { xs: 'center', md: 'flex-end' },
                gap: { xs: 4, md: 12 },
                pr: { md: 6 }, // Exactly 48px gutter spacing from the center line
                boxSizing: 'border-box',
                zIndex: 2,
              }}
            >
              {/* Step 1 */}
              <Card
                className="spline-timeline-step-left"
                sx={{
                  p: 4,
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  bgcolor: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: 'none',
                  color: '#ffffff',
                  width: '100%',
                  maxWidth: '480px',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    mb: 1.5,
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '1.15rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  ① Choose a Service
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    lineHeight: 1.6,
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '0.88rem',
                    mb: 2.5
                  }}
                >
                  Browse verified professionals across multiple service categories.
                </Typography>
                <Box
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    p: 1.75,
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontFamily: "'NewBlack', sans-serif",
                    fontWeight: 500
                  }}
                >
                  📍 Select category → Add address → Describe your issue.
                </Box>
              </Card>

              {/* Step 3 */}
              <Card
                className="spline-timeline-step-left"
                sx={{
                  p: 4,
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  bgcolor: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: 'none',
                  color: '#ffffff',
                  width: '100%',
                  maxWidth: '480px',
                  mt: { md: 12 },
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    mb: 1.5,
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '1.15rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  ③ Track Everything Live
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    lineHeight: 1.6,
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '0.88rem',
                    mb: 2.5
                  }}
                >
                  Watch every stage of your booking.
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 1.25 }}>
                  {['Captain Accepted', 'On the Way', 'Arrived', 'Work Started', 'Bill Generated', 'Payment', 'Completed'].map((stage) => (
                    <Box
                      key={stage}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        fontSize: '0.8rem',
                        color: 'rgba(255, 255, 255, 0.85)',
                        fontFamily: "'NewBlack', sans-serif",
                        bgcolor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        px: 1.25,
                        py: 0.75,
                        borderRadius: '8px'
                      }}
                    >
                      <span style={{ color: '#10B981', fontWeight: 800 }}>✓</span> {stage}
                    </Box>
                  ))}
                </Box>
              </Card>
            </Box>

            {/* Right Column (Points 2 & 4) */}
            <Box
              sx={{
                width: { xs: '100%', md: '50%' },
                display: 'flex',
                flexDirection: 'column',
                alignItems: { xs: 'center', md: 'flex-start' },
                gap: { xs: 4, md: 12 },
                pl: { md: 6 }, // Exactly 48px gutter spacing from the center line
                pt: { md: 16 }, // Offset columns to make it alternate
                boxSizing: 'border-box',
                zIndex: 2,
              }}
            >
              {/* Step 2 */}
              <Card
                className="spline-timeline-step-right"
                sx={{
                  p: 4,
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  bgcolor: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: 'none',
                  color: '#ffffff',
                  width: '100%',
                  maxWidth: '480px',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    mb: 1.5,
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '1.15rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  ② Get Matched Instantly
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    lineHeight: 1.6,
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '0.88rem',
                    mb: 2.5
                  }}
                >
                  Your request is broadcast in real time to nearby available service partners.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Box
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      px: 2,
                      py: 1,
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontFamily: "'NewBlack', sans-serif"
                    }}
                  >
                    ⚡ Live notifications
                  </Box>
                  <Box
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      px: 2,
                      py: 1,
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontFamily: "'NewBlack', sans-serif"
                    }}
                  >
                    📍 Instant matching
                  </Box>
                </Box>
              </Card>

              {/* Step 4 */}
              <Card
                className="spline-timeline-step-right"
                sx={{
                  p: 4,
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  bgcolor: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: 'none',
                  color: '#ffffff',
                  width: '100%',
                  maxWidth: '480px',
                  mt: { md: 12 },
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    mb: 1.5,
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '1.15rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  ④ Pay Securely & Rate
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    lineHeight: 1.6,
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '0.88rem',
                    mb: 2.5
                  }}
                >
                  Review the invoice, pay online with Razorpay or cash, receive your receipt, and rate your service partner.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Box
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      px: 2,
                      py: 1,
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontFamily: "'NewBlack', sans-serif"
                    }}
                  >
                    💳 Online & Cash
                  </Box>
                  <Box
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      px: 2,
                      py: 1,
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontFamily: "'NewBlack', sans-serif"
                    }}
                  >
                    ⭐ Ratings & Reviews
                  </Box>
                </Box>
              </Card>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Elegant long empty space showing the Spline particles */}
      <Box sx={{ height: { xs: '20vh', md: '35vh' } }} />

      {/* 4. Safety & Assurance Section (Left aligned, text-only, pointwise) */}
      <Box
        sx={{
          bgcolor: 'transparent',
          pb: 12,
          pt: 4,
          position: 'relative',
          zIndex: 10,
          pointerEvents: 'auto',
          color: '#ffffff',
        }}
      >
        <Container maxWidth="lg">
          {/* Header Block */}
          <Box
            className="spline-safety-header"
            sx={{
              textAlign: 'left',
              mb: 8,
              width: '100%',
              maxWidth: '700px',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                fontFamily: "'NewBlack', sans-serif",
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                display: 'block',
                mb: 1.5,
              }}
            >
              TRUST & SAFETY
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 400,
                mb: 2.5,
                fontFamily: "'Maltiner Display', Georgia, serif",
                letterSpacing: '0.03em',
                fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3.2rem' },
                textTransform: 'uppercase',
              }}
            >
              Workizo Quality & Safety Assurance
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: "'NewBlack', sans-serif",
                fontSize: '1rem',
                lineHeight: 1.6,
                mb: 4,
              }}
            >
              Just like India's top home platforms, we prioritize trust, background verification, and quality of work.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/captain/register')}
              sx={{
                borderRadius: '24px',
                px: 4,
                py: 1.2,
                fontWeight: 800,
                fontFamily: "'NewBlack', sans-serif",
                fontSize: '0.8rem',
                color: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                letterSpacing: '0.05em',
                '&:hover': {
                  borderColor: '#ffffff',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              BECOME A VERIFIED CAPTAIN
            </Button>
          </Box>

          {/* Pointwise Text-only guarantees */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              width: '100%',
              maxWidth: '750px',
            }}
          >
            <Box className="spline-safety-card">
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontFamily: "'NewBlack', sans-serif",
                  fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' },
                  letterSpacing: '0.04em',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                }}
              >
                100% KYC Verified
              </Typography>
            </Box>

            <Box className="spline-safety-card">
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontFamily: "'NewBlack', sans-serif",
                  fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' },
                  letterSpacing: '0.04em',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                }}
              >
                Standardized Pricing
              </Typography>
            </Box>

            <Box className="spline-safety-card">
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontFamily: "'NewBlack', sans-serif",
                  fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' },
                  letterSpacing: '0.04em',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                }}
              >
                Elite Trained Captains
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Elegant long empty space showing the Spline particles */}
      <Box sx={{ height: { xs: '20vh', md: '35vh' } }} />

      {/* 5. Champions of the Startup Idea Section (Founding Team profiles) */}
      <Box
        className="pinned-team-section"
        sx={{
          minHeight: { xs: 'auto', md: '100vh' },
          py: { xs: 8, md: 0 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          bgcolor: 'transparent',
          position: 'relative',
          zIndex: 10,
          pointerEvents: 'auto',
          color: '#ffffff',
          boxSizing: 'border-box',
          overflow: { xs: 'visible', md: 'hidden' },
        }}
      >
        <Container maxWidth="lg">
          {/* Header Block */}
          <Box
            className="spline-team-header"
            sx={{
              textAlign: 'left',
              mb: { xs: 4, md: 8 },
              width: '100%',
              maxWidth: '700px',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                fontFamily: "'NewBlack', sans-serif",
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                display: 'block',
                mb: 1.5,
              }}
            >
              FOUNDING TEAM
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 400,
                mb: 2.5,
                fontFamily: "'Maltiner Display', Georgia, serif",
                letterSpacing: '0.03em',
                fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3.2rem' },
                textTransform: 'uppercase',
              }}
            >
              Champions of the Startup Idea
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: "'NewBlack', sans-serif",
                fontSize: '1rem',
                lineHeight: 1.6,
              }}
            >
              The minds behind Workizo, dedicated to bridging local home services with modern web architecture.
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 3, md: 4 }} justifyContent="center" alignItems="stretch">
            {/* Card 1: Ambariya Vivek */}
            <Grid item xs={12} md={6} className="spline-team-card-left" sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Card
                sx={{
                  p: { xs: 3, sm: 4 },
                  width: { xs: '100%', sm: '440px' },
                  maxWidth: '100%',
                  mx: 'auto',
                  borderRadius: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  bgcolor: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  height: '100%',
                  position: 'relative',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 0 25px rgba(255, 255, 255, 0.15)',
                  },
                }}
              >
                {/* Avatar with styled scope double-ring */}
                <Box
                  sx={{
                    display: 'inline-block',
                    p: '8px',
                    border: '1px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    mb: 3.5,
                    mt: 2,
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      p: '4px',
                      border: '2px solid rgba(255, 255, 255, 0.4)',
                      borderRadius: '50%',
                    }}
                  >
                    <Avatar
                      src={vivekProfile}
                      alt="Ambariya Vivek"
                      sx={{
                        width: 96,
                        height: 96,
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        fontFamily: "'NewBlack', sans-serif",
                        fontSize: '2rem',
                        fontWeight: 800,
                      }}
                    >
                      AV
                    </Avatar>
                  </Box>
                </Box>

                {/* Name & Role */}
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: "'NewBlack', sans-serif",
                    fontWeight: 800,
                    color: '#ffffff',
                    mb: 4,
                    fontSize: '1.4rem',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}
                >
                  Ambariya Vivek
                </Typography>

                {/* Parameters list (Department, Student, Specialization) */}
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2.5,
                    textAlign: 'left',
                    mb: 4,
                    flexGrow: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <WorkIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 18, mt: 0.3 }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800, fontFamily: "'NewBlack', sans-serif", letterSpacing: '0.05em' }}>
                        BRANCH
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#ffffff', fontFamily: "'NewBlack', sans-serif" }}>
                        Computer Engineering
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <SchoolIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 18, mt: 0.3 }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800, fontFamily: "'NewBlack', sans-serif", letterSpacing: '0.05em' }}>
                        STUDENT
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#ffffff', fontFamily: "'NewBlack', sans-serif" }}>
                        LJ University
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <CodeIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 18, mt: 0.3 }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800, fontFamily: "'NewBlack', sans-serif", letterSpacing: '0.05em' }}>
                        SPECIALIZATION
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#ffffff', fontFamily: "'NewBlack', sans-serif" }}>
                        MERN Stack, Razorpay, SMTP, GSAP, Spline, MySQL, Machine Learning
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* ID Bar */}
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    pt: 2.5,
                    mb: 3,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontWeight: 800,
                      fontFamily: "'NewBlack', sans-serif",
                      letterSpacing: '0.05em',
                    }}
                  >
                    ID: WKZ-001
                  </Typography>
                </Box>

                {/* Social Quick Access Square Buttons */}
                <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'center' }}>
                  <IconButton
                    component="a"
                    href="https://linkedin.com/in/vivek-ambariya"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        color: '#ffffff',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        transform: 'scale(1.08)',
                      },
                    }}
                  >
                    <LinkedInIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                  <IconButton
                    component="a"
                    href="https://github.com/vivek-ambariya"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        color: '#ffffff',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        transform: 'scale(1.08)',
                      },
                    }}
                  >
                    <GitHubIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                  <IconButton
                    component="a"
                    href="mailto:vivekambaria@gmail.com"
                    sx={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        color: '#ffffff',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        transform: 'scale(1.08)',
                      },
                    }}
                  >
                    <GoogleIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Box>
              </Card>
            </Grid>

            {/* Card 2: Ved Goyani */}
            <Grid item xs={12} md={6} className="spline-team-card-right" sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Card
                sx={{
                  p: { xs: 3, sm: 4 },
                  width: { xs: '100%', sm: '440px' },
                  maxWidth: '100%',
                  mx: 'auto',
                  borderRadius: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  bgcolor: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  height: '100%',
                  position: 'relative',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 0 25px rgba(255, 255, 255, 0.15)',
                  },
                }}
              >
                {/* Avatar with styled scope double-ring */}
                <Box
                  sx={{
                    display: 'inline-block',
                    p: '8px',
                    border: '1px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    mb: 3.5,
                    mt: 2,
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      p: '4px',
                      border: '2px solid rgba(255, 255, 255, 0.4)',
                      borderRadius: '50%',
                    }}
                  >
                    <Avatar
                      src={vedProfile}
                      alt="Ved Goyani"
                      sx={{
                        width: 96,
                        height: 96,
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        fontFamily: "'NewBlack', sans-serif",
                        fontSize: '2rem',
                        fontWeight: 800,
                      }}
                    >
                      VG
                    </Avatar>
                  </Box>
                </Box>

                {/* Name & Role */}
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: "'NewBlack', sans-serif",
                    fontWeight: 800,
                    color: '#ffffff',
                    mb: 4,
                    fontSize: '1.4rem',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}
                >
                  Ved Goyani
                </Typography>

                {/* Parameters list (Department, Student, Specialization) */}
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2.5,
                    textAlign: 'left',
                    mb: 4,
                    flexGrow: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <WorkIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 18, mt: 0.3 }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800, fontFamily: "'NewBlack', sans-serif", letterSpacing: '0.05em' }}>
                        BRANCH
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#ffffff', fontFamily: "'NewBlack', sans-serif" }}>
                        Computer Engineering
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <SchoolIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 18, mt: 0.3 }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800, fontFamily: "'NewBlack', sans-serif", letterSpacing: '0.05em' }}>
                        STUDENT
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#ffffff', fontFamily: "'NewBlack', sans-serif" }}>
                        LJ University
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <CodeIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 18, mt: 0.3 }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800, fontFamily: "'NewBlack', sans-serif", letterSpacing: '0.05em' }}>
                        SPECIALIZATION
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#ffffff', fontFamily: "'NewBlack', sans-serif" }}>
                        Python Core, React, MongoDB, PostgreSQL, Bootstrap
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* ID Bar */}
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    pt: 2.5,
                    mb: 3,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontWeight: 800,
                      fontFamily: "'NewBlack', sans-serif",
                      letterSpacing: '0.05em',
                    }}
                  >
                    ID: WKZ-002
                  </Typography>
                </Box>

                {/* Social Quick Access Square Buttons */}
                <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'center' }}>
                  <IconButton
                    component="a"
                    href="https://www.linkedin.com/in/ved-goyani-ce?utm_source=share_via&utm_content=profile&utm_medium=member_android"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        color: '#ffffff',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        transform: 'scale(1.08)',
                      },
                    }}
                  >
                    <LinkedInIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                  <IconButton
                    component="a"
                    href="https://github.com/VedGoyaniTech"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        color: '#ffffff',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        transform: 'scale(1.08)',
                      },
                    }}
                  >
                    <GitHubIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                  <IconButton
                    component="a"
                    href="mailto:goyanived001@gmail.com"
                    sx={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        color: '#ffffff',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        transform: 'scale(1.08)',
                      },
                    }}
                  >
                    <GoogleIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 6. Project Highlights Slideshow Section */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 10,
          py: { xs: 8, md: 12 },
          px: { xs: 2, md: 8 },
          pointerEvents: 'auto',
        }}
      >
        <Container maxWidth="lg">
          {/* Section header */}
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.4)',
                fontFamily: "'NewBlack', sans-serif",
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                display: 'block',
                mb: 1.5,
              }}
            >
              GALLERY
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 400,
                fontFamily: "'Maltiner Display', Georgia, serif",
                letterSpacing: '0.03em',
                fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
                textTransform: 'uppercase',
                color: '#ffffff',
              }}
            >
              Project Highlights
            </Typography>
          </Box>

          {/* 16:9 slideshow container */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              paddingTop: '56.25%', // 16:9 aspect ratio
              borderRadius: '20px',
              overflow: 'hidden',
              bgcolor: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 0 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Slides — all 10 real project highlight photos */}
            {[slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8, slide9, slide10].map((src, i) => (
              <Box
                key={i}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  opacity: currentSlide === i ? 1 : 0,
                  transition: 'opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {src ? (
                  <>
                    {/* Blurred background fills letterbox sides for portrait photos */}
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${src})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(24px) brightness(0.3)',
                        transform: 'scale(1.1)',
                        zIndex: 0,
                      }}
                    />
                    {/* Actual image — objectFit contain so portrait photos never crop */}
                    <Box
                      component="img"
                      src={src}
                      alt={`Project highlight ${i + 1}`}
                      sx={{
                        position: 'relative',
                        zIndex: 1,
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  </>
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      bgcolor: `rgba(255,255,255,${0.01 + i * 0.005})`,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "'Maltiner Display', Georgia, serif",
                        fontSize: { xs: '1.2rem', md: '2rem' },
                        color: 'rgba(255,255,255,0.2)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        userSelect: 'none',
                      }}
                    >
                      Slide {i + 1}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "'NewBlack', sans-serif",
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.12)',
                        letterSpacing: '0.08em',
                      }}
                    >
                      Add your photo here
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}

            {/* Prev arrow */}
            <Box
              onClick={() => goToSlide(currentSlide - 1)}
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 20,
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
              }}
            >
              <Typography sx={{ color: '#fff', fontSize: '1.1rem', lineHeight: 1 }}>‹</Typography>
            </Box>

            {/* Next arrow */}
            <Box
              onClick={() => goToSlide(currentSlide + 1)}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 20,
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
              }}
            >
              <Typography sx={{ color: '#fff', fontSize: '1.1rem', lineHeight: 1 }}>›</Typography>
            </Box>

            {/* Dot indicators */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 18,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 1,
                zIndex: 20,
              }}
            >
              {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
                <Box
                  key={i}
                  onClick={() => goToSlide(i)}
                  sx={{
                    width: currentSlide === i ? 24 : 7,
                    height: 7,
                    borderRadius: '4px',
                    bgcolor: currentSlide === i ? '#ffffff' : 'rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.35s ease',
                  }}
                />
              ))}
            </Box>

            {/* Slide counter */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 20,
                zIndex: 20,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'NewBlack', sans-serif",
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.12em',
                }}
              >
                {String(currentSlide + 1).padStart(2, '0')} / {String(TOTAL_SLIDES).padStart(2, '0')}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 7. Discover Platform CTA Section at the End */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          px: 3,
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              p: { xs: 4, sm: 6, md: 8 },
              borderRadius: '32px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              bgcolor: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle background glow effect */}
            <Box
              sx={{
                position: 'absolute',
                top: '-50%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 70%)',
                pointerEvents: 'none',
              }}
            />

            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.75rem',
                fontWeight: 800,
                fontFamily: "'NewBlack', sans-serif",
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              [ ENTER WORKIZO ECOSYSTEM ]
            </Typography>

            <Typography
              variant="h3"
              sx={{
                fontFamily: "'Maltiner Display', Georgia, serif",
                fontSize: { xs: '2rem', sm: '2.8rem', md: '3.5rem' },
                color: '#ffffff',
                fontWeight: 400,
                lineHeight: 1.15,
                letterSpacing: '0.02em',
                maxWidth: '700px',
              }}
            >
              Ready to Experience Seamless Home Services?
            </Typography>

            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: { xs: '0.95rem', md: '1.1rem' },
                maxWidth: '560px',
                lineHeight: 1.6,
                mb: 1,
              }}
            >
              Step inside Workizo to browse verified service captains, track live bookings, and manage your home with absolute peace of mind.
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2.5,
                mt: 2,
                width: { xs: '100%', sm: 'auto' },
                justifyContent: 'center',
              }}
            >
              <Button
                variant="contained"
                onClick={() => navigate('/home')}
                sx={{
                  px: { xs: 4, md: 5 },
                  py: 1.8,
                  borderRadius: '50px',
                  bgcolor: '#ffffff',
                  color: '#000000',
                  fontFamily: "'NewBlack', sans-serif",
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 30px rgba(255, 255, 255, 0.25)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: '#ffffff',
                    transform: 'translateY(-4px) scale(1.03)',
                    boxShadow: '0 0 45px rgba(255, 255, 255, 0.45)',
                  },
                }}
              >
                DISCOVER THE PLATFORM &nbsp; →
              </Button>

              <Button
                variant="outlined"
                onClick={() => navigate('/captain/register')}
                sx={{
                  px: { xs: 4, md: 5 },
                  py: 1.8,
                  borderRadius: '50px',
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  fontFamily: "'NewBlack', sans-serif",
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.6)',
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                BECOME A CAPTAIN
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer / Copyright bar */}
      <Box
        sx={{
          py: 4,
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <Typography
          sx={{
            color: 'rgba(255, 255, 255, 0.35)',
            fontSize: '0.75rem',
            fontFamily: "'NewBlack', sans-serif",
            letterSpacing: '0.08em',
          }}
        >
          © {new Date().getFullYear()} WORKIZO PLATFORM INC. ALL RIGHTS RESERVED.
        </Typography>
      </Box>

      {/* Elegant long empty space showing the Spline particles at the bottom */}
      <Box sx={{ height: { xs: '10vh', md: '15vh' } }} />
    </Box>
  );
};

export default SplineLanding;
