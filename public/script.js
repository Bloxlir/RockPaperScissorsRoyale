const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const BOID_COUNT = 150;
const BOID_RADIUS = 20;
const MAX_SPEED = 2;
const MAX_FORCE = 0.03;
const VISION_RADIUS = 200;
const AVOID_RADIUS = 120;
const EDGE_REPULSION = 100;
let wrapAround = true;
let useGraphics = true;

const TYPES = ['rock', 'paper', 'scissors'];
const COLORS = {
    rock: 'gray',
    paper: 'white',
    scissors: 'red'
};
const PREY = {
    rock: 'scissors',
    scissors: 'paper',
    paper: 'rock'
};

const IMAGES = {
    rock: new Image(),
    paper: new Image(),
    scissors: new Image()
};

IMAGES.rock.src = 'rock.png';
IMAGES.paper.src = 'paper.png';
IMAGES.scissors.src = 'scissors.png';

function drawStatsCard() {
  const padding = 10;
  const cardWidth = 150;
  const cardHeight = 200;
  const types = ['rock', 'paper', 'scissors'];

  // Calculate dynamic lineHeight based on cardHeight and number of types
  const lineHeight = cardHeight / (types.length + 1);

  // Adjust iconSize and fontSize based on lineHeight
  const iconSize = lineHeight * 0.6;  // 60% of lineHeight
  const fontSize = lineHeight * 0.5;  // 50% of lineHeight

  // Draw card background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';  // semi-transparent white
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(padding, padding, cardWidth, cardHeight, 10);
  ctx.fill();
  ctx.stroke();

  // Draw boid images and counts
  let yOffset = padding + lineHeight;

  types.forEach(type => {
      ctx.drawImage(IMAGES[type], padding + 10, yOffset - iconSize / 1.5, iconSize, iconSize);
      ctx.fillStyle = 'black';
      ctx.font = `${fontSize}px Arial`;
      ctx.fillText(`: ${boids.filter(b => b.type === type).length}`, padding + 10 + iconSize + 5, yOffset + fontSize / 3);
      yOffset += lineHeight;
  });
}



// Helper function to draw rounded rectangles
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x + r, y);
  this.arcTo(x + w, y, x + w, y + h, r);
  this.arcTo(x + w, y + h, x, y + h, r);
  this.arcTo(x, y + h, x, y, r);
  this.arcTo(x, y, x + w, y, r);
  this.closePath();
  return this;
}


class Boid {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * MAX_SPEED;
        this.vy = (Math.random() - 0.5) * MAX_SPEED;
        this.ax = 0;
        this.ay = 0;
        this.type = TYPES[Math.floor(Math.random() * TYPES.length)];
    }

    draw() {
        if (useGraphics) {
            const image = IMAGES[this.type];
            ctx.drawImage(image, this.x - BOID_RADIUS, this.y - BOID_RADIUS, BOID_RADIUS * 2, BOID_RADIUS * 2);
        } else {
            ctx.fillStyle = COLORS[this.type];
            ctx.beginPath();
            ctx.arc(this.x, this.y, BOID_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    applyForce(fx, fy) {
        const forceMagnitude = Math.sqrt(fx * fx + fy * fy);
        if (forceMagnitude > MAX_FORCE) {
            fx = (fx / forceMagnitude) * MAX_FORCE;
            fy = (fy / forceMagnitude) * MAX_FORCE;
        }

        this.ax += fx;
        this.ay += fy;
    }

    update(boids) {
      let alignX = 0;
      let alignY = 0;
      let cohesionX = 0;
      let cohesionY = 0;
      let separationX = 0;
      let separationY = 0;
      let preyX = 0;
      let preyY = 0;
      let predatorX = 0;
      let predatorY = 0;
      let count = 0;
      let sameTypeCount = 0;
      let preyCount = 0;
      let predatorCount = 0;
  
      for (let other of boids) {
          if (other === this) continue;
  
          const dx = other.x - this.x;
          const dy = other.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
  
          if (distance < VISION_RADIUS) {
              cohesionX += other.x;
              cohesionY += other.y;
              count++;
  
              if (other.type === this.type) {
                  alignX += other.vx;
                  alignY += other.vy;
                  sameTypeCount++;
              } else if (other.type === PREY[this.type]) {
                  preyX += other.x;
                  preyY += other.y;
                  preyCount++;
              } else if (PREY[other.type] === this.type) {
                  predatorX += other.x;
                  predatorY += other.y;
                  predatorCount++;
              }
  
              if (distance < AVOID_RADIUS) {
                  separationX -= dx / distance * 4;  // Doubled the separation force
                  separationY -= dy / distance * 4;  // Doubled the separation force
              }
  
              if (distance < BOID_RADIUS * 2) {
                  if (this.type === 'rock' && other.type === 'scissors' ||
                      this.type === 'scissors' && other.type === 'paper' ||
                      this.type === 'paper' && other.type === 'rock') {
                      other.type = this.type;
                  }
              }
          }
      }
  
      if (sameTypeCount > 0) {
          alignX /= sameTypeCount;
          alignY /= sameTypeCount;
          this.applyForce(alignX * 0.1, alignY * 0.1);
      }
  
      if (count > 0) {
          cohesionX = (cohesionX / count - this.x) * 0.005;
          cohesionY = (cohesionY / count - this.y) * 0.005;
  
          if (preyCount > 0) {
              preyX = (preyX / preyCount - this.x) * 0.02;
              preyY = (preyY / preyCount - this.y) * 0.02;
              this.applyForce(preyX, preyY);
          }
  
          if (predatorCount > 0) {
              predatorX = (predatorX / predatorCount - this.x) * -0.04;
              predatorY = (predatorY / predatorCount - this.y) * -0.04;
              this.applyForce(predatorX, predatorY);
          }
  
          this.applyForce(cohesionX, cohesionY);
          this.applyForce(separationX, separationY);  // Apply the increased separation force
      }
  
      this.vx += this.ax;
      this.vy += this.ay;
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > MAX_SPEED) {
          this.vx = (this.vx / speed) * MAX_SPEED;
          this.vy = (this.vy / speed) * MAX_SPEED;
      }
  
      this.x += this.vx;
      this.y += this.vy;
  
      this.ax = 0;
      this.ay = 0;
  
      if (!wrapAround) {
        // Repel from edges
        if (this.x < EDGE_REPULSION) this.applyForce((EDGE_REPULSION - this.x) * 20, 0);
        if (this.x > canvas.width - EDGE_REPULSION) this.applyForce(-(this.x - (canvas.width - EDGE_REPULSION)) * 20, 0);
        if (this.y < EDGE_REPULSION) this.applyForce(0, (EDGE_REPULSION - this.y) * 20);
        if (this.y > canvas.height - EDGE_REPULSION) this.applyForce(0, -(this.y - (canvas.height - EDGE_REPULSION)) * 20);
    } else {
        // Wrap around the screen
        if (this.x > canvas.width + BOID_RADIUS) this.x = 0 - BOID_RADIUS;
        if (this.x < 0 - BOID_RADIUS) this.x = canvas.width + BOID_RADIUS;
        if (this.y > canvas.height + BOID_RADIUS) this.y = 0 - BOID_RADIUS;
        if (this.y < 0 - BOID_RADIUS) this.y = canvas.height + BOID_RADIUS;
    }
  }
  
}

function toggleWrap() {
  wrapAround = !wrapAround;
}

function toggleGraphics() {
  useGraphics = !useGraphics;
}

let boids = [];
for (let i = 0; i < BOID_COUNT; i++) {
  boids.push(new Boid());
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let boid of boids) {
      boid.update(boids);
      boid.draw();
  }
  drawStatsCard();

  requestAnimationFrame(animate);
}

let mouseX = 0;
let mouseY = 0;

canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function handleKeyDown(e) {
    let newType = null;

    switch (e.key) {
        case '1':
            newType = 'rock';
            break;
        case '2':
            newType = 'paper';
            break;
        case '3':
            newType = 'scissors';
            break;
    }

    if (newType) {
        const boid = new Boid();
        boid.x = mouseX;
        boid.y = mouseY;
        boid.type = newType;
        boids.push(boid);
    }
}

document.addEventListener('keydown', handleKeyDown);


animate();