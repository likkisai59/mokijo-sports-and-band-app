"use client";

import { useEffect, useState } from "react";

const SLIDES = [
    { src: "/marketing/slideshow/sports-01.jpg", alt: "Basketball game in action" },
    { src: "/marketing/slideshow/band-01.jpg", alt: "Live music performance on stage" },
    { src: "/marketing/slideshow/sports-02.jpg", alt: "Football match on the field" },
    { src: "/marketing/slideshow/band-02.jpg", alt: "Musician performing with guitar" },
    { src: "/marketing/slideshow/sports-03.jpg", alt: "Tennis court and play" },
    { src: "/marketing/slideshow/band-03.jpg", alt: "Concert crowd under stage lights" },
    { src: "/marketing/slideshow/sports-04.jpg", alt: "Cricket match in play" },
    { src: "/marketing/slideshow/band-04.jpg", alt: "Night concert with dramatic lighting" },
];

const INTERVAL_MS = 5000;

/**
 * Full-bleed crossfade slideshow for the marketing hero.
 */
export default function HeroSlideshow() {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (paused) return undefined;
        const id = window.setInterval(() => {
            setIndex((i) => (i + 1) % SLIDES.length);
        }, INTERVAL_MS);
        return () => window.clearInterval(id);
    }, [paused]);

    return (
        <div
            className="mkt-hero-slideshow"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            aria-roledescription="carousel"
            aria-label="Sports and band highlights"
        >
            {SLIDES.map((slide, i) => (
                <img
                    key={slide.src}
                    src={slide.src}
                    alt={slide.alt}
                    className={`mkt-hero-slide${i === index ? " is-active" : ""}`}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                />
            ))}

            <div className="mkt-hero-scrim" aria-hidden="true" />

            <div className="mkt-hero-slideshow-controls">
                <button
                    type="button"
                    className="mkt-hero-slideshow-nav"
                    aria-label="Previous slide"
                    onClick={() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
                >
                    ‹
                </button>
                <div className="mkt-hero-slideshow-dots" role="tablist" aria-label="Slide indicators">
                    {SLIDES.map((slide, i) => (
                        <button
                            key={slide.src}
                            type="button"
                            role="tab"
                            aria-selected={i === index}
                            aria-label={`Show slide ${i + 1}`}
                            className={`mkt-hero-slideshow-dot${i === index ? " is-active" : ""}`}
                            onClick={() => setIndex(i)}
                        />
                    ))}
                </div>
                <button
                    type="button"
                    className="mkt-hero-slideshow-nav"
                    aria-label="Next slide"
                    onClick={() => setIndex((i) => (i + 1) % SLIDES.length)}
                >
                    ›
                </button>
            </div>
        </div>
    );
}
