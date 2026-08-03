"use client";
import React from "react";
import { ContainerScroll } from "./container-scroll-animation";

export function HeroScrollDemo() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      paddingBottom: '200px',
      paddingTop: '50px',
      width: '100%',
    }}>
      <ContainerScroll
        titleComponent={
          <>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 600,
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.25,
              fontFamily: "'Maltiner Display', Georgia, serif",
              margin: 0,
            }}>
              Unleash the power of <br />
              <span style={{
                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                fontWeight: 800,
                marginTop: '12px',
                display: 'block',
                lineHeight: 1.1,
                background: 'linear-gradient(to bottom, #ffffff 30%, #a1a1aa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}>
                Scroll Animations
              </span>
            </h1>
          </>
        }
      >
        <img
          src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1470&auto=format&fit=crop"
          alt="hero"
          style={{
            marginLeft: 'auto',
            marginRight: 'auto',
            borderRadius: '16px',
            objectFit: 'cover',
            height: '100%',
            width: '100%',
            objectPosition: 'left top',
          }}
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
}
