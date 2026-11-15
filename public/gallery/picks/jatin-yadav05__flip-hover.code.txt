/*
 * FlipHover
 * Author: @jatin-yadav05   Source: https://21st.dev/@jatin-yadav05/components/flip-hover   21st.dev id: 7772
 * Licence: covered by the paid 21st.dev plan Ezyourlife bought on 14 Nov 2026 (the API returns no
 * per-component licence text, so the author's own terms were not checked line by line).
 * Kept as published; only this header was added.
 */
// @ts-nocheck
/* eslint-disable */
"use client"
import React, { useState } from 'react'

interface FlipHoverProps {
    imageUrl: string;
}

const FlipHover = ({ imageUrl }: FlipHoverProps) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleHover = () => {
        if (!isFlipped) {
            setIsFlipped(true);
            setTimeout(() => setIsFlipped(false), 700);
        }
    };

    return (
        <div 
            className="w-44 h-60 [perspective:1000px]"
            onMouseEnter={handleHover}
        >
            <div className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${
                isFlipped 
                    ? '[transform:rotateY(180deg)_translateY(-40px)]' 
                    : '[transform:rotateY(0deg)_translateY(0px)]'
            }`}>
                
                {/* Front Side */}
                <div className="absolute w-full h-full rounded-xl overflow-hidden shadow-xl [backface-visibility:hidden]">
                    <img
                        src={imageUrl}
                        alt="Front"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Back Side */}
                <div className="absolute w-full h-full rounded-xl overflow-hidden shadow-xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold [transform:rotateY(180deg)] [backface-visibility:hidden]">
                    <img
                        src={imageUrl}
                        alt="Back"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </div>
    )
}

export default FlipHover;