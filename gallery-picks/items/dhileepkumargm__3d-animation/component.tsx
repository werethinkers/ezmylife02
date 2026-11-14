/*
 * 3D Animation
 * Author: @dhileepkumargm   Source: https://21st.dev/@dhileepkumargm/components/3d-animation   21st.dev id: 6563
 * Licence: covered by the paid 21st.dev plan Ezyourlife bought on 14 Nov 2026 (the API returns no
 * per-component licence text, so the author's own terms were not checked line by line).
 * Kept as published; only this header was added.
 */
// @ts-nocheck
/* eslint-disable */
import React, { useEffect, useRef } from 'react';

/**
 * Renders the 3D poem animation hero section.
 */
export const PoemAnimation = ({ poemHTML, backgroundImageUrl, boyImageUrl }) => {
    const contentRef = useRef(null);

    // This effect handles the responsive scaling of the animation container.
    useEffect(() => {
        function adjustContentSize() {
            if (contentRef.current) {
                const viewportWidth = window.innerWidth;
                const baseWidth = 1000;
                const scaleFactor = viewportWidth < baseWidth ? (viewportWidth / baseWidth) * 0.9 : 1;
                contentRef.current.style.transform = `scale(${scaleFactor})`;
            }
        }

        adjustContentSize();
        window.addEventListener("resize", adjustContentSize);
        return () => window.removeEventListener("resize", adjustContentSize);
    }, []);

    return (
        <header className="hero-section">
            <div className="container">
                <div 
                    ref={contentRef} 
                    className="content" 
                    style={{ display: 'block', width: '1000px', height: '562px' }}
                >
                    <div className="container-full">
                        <div className="animated hue"></div>
                        <img className="backgroundImage" src={backgroundImageUrl} alt="An old stone courtyard at dawn" onError={(e) => e.target.style.display = 'none'} />
                        <img className="boyImage" src={boyImageUrl} alt="A man and woman practicing with swords" onError={(e) => e.target.style.display = 'none'} />
                        
                        <div className="container">
                            <div className="cube">
                                <div className="face top"></div>
                                <div className="face bottom"></div>
                                <div className="face left text" dangerouslySetInnerHTML={{ __html: poemHTML }}></div>
                                <div className="face right text" dangerouslySetInnerHTML={{ __html: poemHTML }}></div>
                                <div className="face front"></div>
                                <div className="face back text" dangerouslySetInnerHTML={{ __html: poemHTML }}></div>
                            </div>
                        </div>

                        <div className="container-reflect">
                            <div className="cube">
                                <div className="face top"></div>
                                <div className="face bottom"></div>
                                <div className="face left text" dangerouslySetInnerHTML={{ __html: poemHTML }}></div>
                                <div className="face right text" dangerouslySetInnerHTML={{ __html: poemHTML }}></div>
                                <div className="face front"></div>
                                <div className="face back text" dangerouslySetInnerHTML={{ __html: poemHTML }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

