class ParticleRingPainter {
  static get inputProperties() {
    return ['--cursor-x', '--cursor-y', '--time'];
  }

  paint(ctx, geom, properties) {
    const cx = geom.width / 2;
    const cy = geom.height / 2;
    
    // Parse CSS properties safely
    const cxProp = properties.get('--cursor-x');
    const cyProp = properties.get('--cursor-y');
    const timeProp = properties.get('--time');

    let cursorX = cxProp ? parseFloat(cxProp.toString()) : NaN;
    let cursorY = cyProp ? parseFloat(cyProp.toString()) : NaN;
    let time = timeProp ? parseFloat(timeProp.toString()) : 0;

    // Fallbacks if not provided (e.g. initial render)
    if (isNaN(cursorX)) cursorX = cx;
    if (isNaN(cursorY)) cursorY = cy;
    if (isNaN(time)) time = 0;

    const rows = 25;
    const rowSpacing = (Math.min(cx, cy) * 0.9) / rows; // Scale to fit mostly within the container
    const particlesPerRow = 80;
    const particleSize = 2; // 2px diameter -> 1px radius

    // Loop through rows
    for (let r = 1; r <= rows; r++) {
      const radius = r * rowSpacing;
      
      // We reduce particle count on very inner rings so they don't overlap too much
      const currentParticles = Math.max(10, Math.floor(particlesPerRow * (r / rows) * 1.5));
      const angleStep = (Math.PI * 2) / currentParticles;

      for (let p = 0; p < currentParticles; p++) {
        // Base position
        const baseAngle = p * angleStep + (r * 0.1); // Add slight rotation offset per row
        let px = cx + Math.cos(baseAngle) * radius;
        let py = cy + Math.sin(baseAngle) * radius;

        // Vector to cursor
        const dx = px - cursorX;
        const dy = py - cursorY;
        const distanceToCursor = Math.sqrt(dx * dx + dy * dy);

        // Magnetic distortion field
        // The closer the cursor, the more they pull towards it, but we want it to look organic
        const magneticRadius = 300; // How far the magnet effect reaches
        if (distanceToCursor < magneticRadius) {
          // Normalize distance
          const normalizedDist = 1 - (distanceToCursor / magneticRadius);
          
          // Easing function for smoother magnetic pull
          const pullForce = Math.pow(normalizedDist, 2) * 40; // Max pull pixels
          
          // Angle from particle to cursor
          const angleToCursor = Math.atan2(dy, dx);
          
          // Apply magnetic offset (negative pulls towards cursor)
          px -= Math.cos(angleToCursor) * pullForce;
          py -= Math.sin(angleToCursor) * pullForce;
        }

        // Shimmer "Humming" calculation
        // Mix a slow global wave with a per-particle wave to create the shimmer
        const timeSlow = time * 0.001; // Scale down time
        // Create an organic pseudo-random wave phase based on particle position and row
        const phase = (r * 0.5) + (p * 0.2) + (Math.sin(px * 0.01) + Math.cos(py * 0.01));
        
        // Sine wave oscillating between -1 and 1, scaled to 0-1
        const shimmer = (Math.sin(timeSlow + phase) + 1) / 2;
        
        // Map shimmer to the 0.1 to 1.0 alpha range
        const alpha = 0.1 + (shimmer * 0.9);

        // Draw particle
        // Using a neutral accent tone that adapts nicely to the theme via blending
        ctx.fillStyle = `rgba(120, 119, 198, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, particleSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// Register the worklet
registerPaint('particle-ring', ParticleRingPainter);
