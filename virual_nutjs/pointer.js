const { screen, Region, mouse, Button } = require("@nut-tree-fork/nut-js");
const Jimp = require("jimp");
const { createCanvas } = require("@napi-rs/canvas");

class VirtualCursor {
  constructor() {
    this.x = 500;
    this.y = 500;
    this.size = 30;
    this.color = { r: 255, g: 0, b: 0, a: 200 }; // Red with transparency
    this.isVisible = true;
    this.cursorShape = "arrow"; // arrow, hand, crosshair
  }

  // Update virtual cursor position
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  // Move relative to current position
  move(deltaX, deltaY) {
    this.x += deltaX;
    this.y += deltaY;
  }

  // Create cursor image
  async createCursorImage() {
    const canvas = createCanvas(this.size, this.size);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a / 255})`;

    switch (this.cursorShape) {
      case "arrow":
        // Draw arrow cursor
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, this.size - 8);
        ctx.lineTo(8, this.size - 12);
        ctx.lineTo(12, this.size);
        ctx.lineTo(16, this.size - 4);
        ctx.lineTo(12, this.size - 8);
        ctx.lineTo(this.size - 8, this.size - 8);
        ctx.closePath();
        ctx.fill();
        break;
      
      case "hand":
        // Draw hand/pointer cursor
        ctx.beginPath();
        ctx.arc(this.size / 2, this.size / 2, this.size / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(this.size / 2 - 3, this.size / 2, 6, this.size / 3);
        break;
      
      case "crosshair":
        // Draw crosshair
        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a / 255})`;
        ctx.beginPath();
        ctx.moveTo(this.size / 2, 0);
        ctx.lineTo(this.size / 2, this.size);
        ctx.moveTo(0, this.size / 2);
        ctx.lineTo(this.size, this.size / 2);
        ctx.stroke();
        break;
    }

    // Convert canvas to Jimp image
    const buffer = canvas.toBuffer("image/png");
    return await Jimp.read(buffer);
  }

  // Draw cursor on screen by taking screenshot and overlaying
  async render() {
    if (!this.isVisible) return;

    try {
      // Capture current screen
      const screenshot = await screen.grabScreen();
      
      // Convert screenshot to Jimp
      const baseImage = await Jimp.read(screenshot);
      
      // Create cursor image
      const cursorImg = await this.createCursorImage();
      
      // Composite cursor onto screenshot
      baseImage.composite(cursorImg, this.x, this.y);
      
      // Display the modified image (this is a workaround - see note below)
      // In practice, you'd want to use a transparent overlay window
      const buffer = await baseImage.getBufferAsync(Jimp.MIME_PNG);
      
      return buffer;
    } catch (error) {
      console.error("Error rendering virtual cursor:", error);
    }
  }

  // Simulate click at virtual cursor position
  async click(button = Button.LEFT) {
    console.log(`Virtual cursor clicking at (${this.x}, ${this.y})`);
    const originalPos = await mouse.getPosition();
    
    // Move real mouse to virtual cursor position
    await mouse.setPosition({ x: this.x, y: this.y });
    await mouse.click(button);
    
    // Move real mouse back
    await mouse.setPosition(originalPos);
  }

  // Simulate drag from current position
  async drag(toX, toY, steps = 20) {
    console.log(`Virtual cursor dragging from (${this.x}, ${this.y}) to (${toX}, ${toY})`);
    
    const originalPos = await mouse.getPosition();
    const startX = this.x;
    const startY = this.y;
    
    // Move real mouse to start position
    await mouse.setPosition({ x: startX, y: startY });
    await mouse.pressButton(Button.LEFT);
    
    // Animate drag
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const currentX = startX + (toX - startX) * t;
      const currentY = startY + (toY - startY) * t;
      
      this.setPosition(currentX, currentY);
      await mouse.setPosition({ x: currentX, y: currentY });
      await sleep(30);
    }
    
    await mouse.releaseButton(Button.LEFT);
    
    // Move real mouse back
    await mouse.setPosition(originalPos);
  }

  // Simulate scroll at virtual cursor position
  async scroll(direction, amount = 3) {
    console.log(`Virtual cursor scrolling ${direction} at (${this.x}, ${this.y})`);
    const originalPos = await mouse.getPosition();
    
    await mouse.setPosition({ x: this.x, y: this.y });
    
    switch (direction) {
      case "up":
        await mouse.scrollUp(amount);
        break;
      case "down":
        await mouse.scrollDown(amount);
        break;
      case "left":
        await mouse.scrollLeft(amount);
        break;
      case "right":
        await mouse.scrollRight(amount);
        break;
    }
    
    await mouse.setPosition(originalPos);
  }

  // Animate smooth movement
  async animateMoveTo(targetX, targetY, duration = 500) {
    const startX = this.x;
    const startY = this.y;
    const startTime = Date.now();
    
    while (Date.now() - startTime < duration) {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - t, 3);
      
      this.x = startX + (targetX - startX) * eased;
      this.y = startY + (targetY - startY) * eased;
      
      await sleep(16); // ~60fps
    }
    
    this.setPosition(targetX, targetY);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Demo usage
async function demo() {
  const virtualCursor = new VirtualCursor();
  
  console.log("Virtual cursor created at (500, 500)");
  console.log("Note: Real mouse cursor is separate!\n");
  
  // Move virtual cursor in a square
  console.log("Moving in a square...");
  await virtualCursor.animateMoveTo(800, 500, 1000);
  await sleep(500);
  await virtualCursor.animateMoveTo(800, 700, 1000);
  await sleep(500);
  await virtualCursor.animateMoveTo(500, 700, 1000);
  await sleep(500);
  await virtualCursor.animateMoveTo(500, 500, 1000);
  
  // Click at virtual cursor position
  console.log("\nClicking at virtual cursor position...");
  await virtualCursor.click(Button.LEFT);
  
  // Drag operation
  console.log("\nDragging virtual cursor...");
  await virtualCursor.drag(700, 600);
  
  // Scroll at virtual cursor position
  console.log("\nScrolling at virtual cursor position...");
  await virtualCursor.scroll("down", 5);
  
  console.log("\nDemo complete!");
  console.log(`Final virtual cursor position: (${virtualCursor.x}, ${virtualCursor.y})`);
}

// Run demo
demo().catch(console.error);

module.exports = { VirtualCursor };