"use client";

import { useEffect, useState } from "react";

export function CustomCursor() {
  const [isTouch, setIsTouch] = useState(true);

  useEffect(() => {
    // Check if it's a touch device
    const isTouchDevice = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0;
    
    setIsTouch(isTouchDevice);

    if (isTouchDevice) return;

    const cur = document.getElementById('cur');
    const curT = document.getElementById('curT');
    if (!cur || !curT) return;

    let mx = 0, my = 0, tx = 0, ty = 0;

    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      cur.style.left = mx + 'px';
      cur.style.top = my + 'px';
    };

    let animationFrameId: number;

    const loop = () => {
      tx += (mx - tx) * 0.11;
      ty += (my - ty) * 0.11;
      curT.style.left = tx + 'px';
      curT.style.top = ty + 'px';
      animationFrameId = requestAnimationFrame(loop);
    };

    document.addEventListener('mousemove', onMouseMove);
    animationFrameId = requestAnimationFrame(loop);

    // Hover effects
    const onMouseEnter = () => {
      cur.classList.add('big');
      curT.classList.add('big');
    };
    
    const onMouseLeave = () => {
      cur.classList.remove('big');
      curT.classList.remove('big');
    };

    const addHoverListeners = () => {
      document.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('mouseenter', onMouseEnter);
        el.addEventListener('mouseleave', onMouseLeave);
      });
    };

    // Add initial listeners
    addHoverListeners();

    // Use MutationObserver to catch dynamically added links (like in Chat)
    const observer = new MutationObserver((mutations) => {
      let shouldAttach = false;
      mutations.forEach(m => {
        if (m.addedNodes.length > 0) shouldAttach = true;
      });
      if (shouldAttach) {
        // Simple strategy: re-attach, but need to avoid duplicates.
        // The event listener is the same reference, so addEventListener handles duplicates.
        addHoverListeners();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      document.querySelectorAll('a, button').forEach(el => {
        el.removeEventListener('mouseenter', onMouseEnter);
        el.removeEventListener('mouseleave', onMouseLeave);
      });
    };
  }, []);

  if (isTouch) return null;

  return (
    <>
      <div id="cur" />
      <div id="curT" />
    </>
  );
}
