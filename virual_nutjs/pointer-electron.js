const { screen, mouse, Button } = require("@nut-tree-fork/nut-js");
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let overlayWindow;
let virtualCursor;

class VirtualCursor {
  constructor() {
    this.x = 500;
    this.y = 500;
    this.size = 30;
    this.color = "red"; // red, blue, green, yellow, purple
    this.isVisible = true;
    this.cursorShape = "arrow"; // arrow, hand, crosshair
  }

  // Send update to overlay window
  updateOverlay(data = {}) {
    if (overlayWindow && overlayWindow.webContents) {
      overlayWindow.webContents.send('cursor-update', {
        x: this.x,
        y: this.y,
        ...data
      });
    }
  }

  // Update virtual cursor position
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.updateOverlay();
  }

  // Move relative to current position
  move(deltaX, deltaY) {
    this.x += deltaX;
    this.y += deltaY;
    this.updateOverlay();
  }

  // Set cursor shape
  setShape(shape) {
    this.cursorShape = shape;
    if (overlayWindow && overlayWindow.webContents) {
      overlayWindow.webContents.send('set-shape', shape);
    }
  }

  // Set cursor color
  setColor(color) {
    this.color = color;
    if (overlayWindow && overlayWindow.webContents) {
      overlayWindow.webContents.send('set-color', color);
    }
  }

  // Set visibility
  setVisibility(visible) {
    this.isVisible = visible;
    if (overlayWindow && overlayWindow.webContents) {
      overlayWindow.webContents.send('set-visibility', visible);
    }
  }

  // Set state (clicking, dragging, glow)
  setState(state) {
    if (overlayWindow && overlayWindow.webContents) {
      overlayWindow.webContents.send('set-state', state);
    }
  }

  // Simulate click at virtual cursor position
  async click(button = Button.LEFT) {
    console.log(`Virtual cursor clicking at (${this.x}, ${this.y})`);
    this.setState('clicking');

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

    this.setState('dragging');
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
    this.setState('');

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

      const newX = startX + (targetX - startX) * eased;
      const newY = startY + (targetY - startY) * eased;

      // Update position and send to overlay
      this.x = newX;
      this.y = newY;
      this.updateOverlay({ animated: true });

      await sleep(16); // ~60fps
    }

    this.setPosition(targetX, targetY);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createOverlay() {
  const { screen: electronScreen } = require('electron');
  const primaryDisplay = electronScreen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  overlayWindow = new BrowserWindow({
    width: width,
    height: height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  overlayWindow.loadFile('overlay.html');
  overlayWindow.setIgnoreMouseEvents(true);
  overlayWindow.maximize();

  // Optional: Open DevTools for debugging
  // overlayWindow.webContents.openDevTools({ mode: 'detach' });

  // Wait for overlay to be ready, then start demo
  overlayWindow.webContents.on('did-finish-load', () => {
    console.log('Overlay loaded, starting demo...');
    setTimeout(() => {
      demo();
    }, 1000);
  });
}

// Demo usage
async function demo() {
  virtualCursor = new VirtualCursor();

  console.log("\n=== Virtual Cursor Demo ===");
  console.log("Virtual cursor created at (500, 500)");
  console.log("Note: Real mouse cursor is separate!\n");

  // Wait a bit for overlay to be ready
  await sleep(500);

  // Initial position
  virtualCursor.setPosition(500, 500);
  virtualCursor.setState('glow');
  await sleep(1000);
  virtualCursor.setState('');

  // Move virtual cursor in a square
  console.log("Moving in a square...");
  await virtualCursor.animateMoveTo(800, 500, 1000);
  await sleep(500);
  await virtualCursor.animateMoveTo(800, 700, 1000);
  await sleep(500);
  await virtualCursor.animateMoveTo(500, 700, 1000);
  await sleep(500);
  await virtualCursor.animateMoveTo(500, 500, 1000);
  await sleep(500);

  // Change shape
  console.log("\nChanging to hand cursor...");
  virtualCursor.setShape('hand');
  await sleep(1000);

  // Click at virtual cursor position
  console.log("Clicking at virtual cursor position...");
  await virtualCursor.click(Button.LEFT);
  await sleep(1000);

  // Change to crosshair
  console.log("\nChanging to crosshair...");
  virtualCursor.setShape('crosshair');
  virtualCursor.setColor('blue');
  await sleep(1000);

  // Drag operation
  console.log("Dragging virtual cursor...");
  await virtualCursor.drag(700, 600);
  await sleep(1000);

  // Change color
  console.log("\nChanging to green arrow...");
  virtualCursor.setShape('arrow');
  virtualCursor.setColor('green');
  await sleep(1000);

  // Scroll at virtual cursor position
  console.log("Scrolling at virtual cursor position...");
  await virtualCursor.scroll("down", 5);
  await sleep(1000);

  console.log("\n=== Demo complete! ===");
  console.log(`Final virtual cursor position: (${virtualCursor.x}, ${virtualCursor.y})`);
  console.log("\nPress Ctrl+C to exit or close the window.");
}

// Electron app lifecycle
app.whenReady().then(() => {
  createOverlay();
});

app.on('window-all-closed', () => {
  app.quit();
});

module.exports = { VirtualCursor };
