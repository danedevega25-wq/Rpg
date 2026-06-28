/* Entity classes contain movement, combat, and drawing behavior for the RPG. */
class Entity {
  constructor(x, y, w, h, color) {
    this.x = x; this.y = y; this.w = w; this.h = h; this.color = color;
    this.vx = 0; this.vy = 0;
  }

  get center() { return { x: this.x + this.w / 2, y: this.y + this.h / 2 }; }

  intersects(other) {
    return this.x < other.x + other.w && this.x + this.w > other.x && this.y < other.y + other.h && this.y + this.h > other.y;
  }

  draw(ctx, camera) {
    ctx.fillStyle = this.color;
    ctx.fillRect(Math.round(this.x - camera.x), Math.round(this.y - camera.y), this.w, this.h);
  }
}

class Player extends Entity {
  constructor(x, y) {
    super(x, y, 30, 36, '#f4d35e');
    this.speed = 190;
    this.maxHp = 100; this.hp = 100;
    this.level = 1; this.exp = 0; this.nextExp = 25;
    this.coins = 0; this.weaponId = 'trainingSword';
    this.inventory = [{ id: 'potion', name: 'Small Potion', qty: 1 }];
    this.attackCooldown = 0;
  }

  gainExp(amount) {
    this.exp += amount;
    while (this.exp >= this.nextExp) {
      this.exp -= this.nextExp;
      this.level += 1;
      this.nextExp = Math.round(this.nextExp * 1.5);
      this.maxHp += 18;
      this.hp = this.maxHp;
    }
  }
}

class Slime extends Entity {
  constructor(x, y) {
    super(x, y, 34, 26, '#68e1a5');
    this.spawnX = x; this.spawnY = y;
    this.maxHp = 45; this.hp = 45;
    this.speed = 80; this.attackCooldown = 0;
    this.alive = true; this.respawnTimer = 0;
  }

  update(dt, player, canMoveTo) {
    if (!this.alive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.alive = true; this.hp = this.maxHp; this.x = this.spawnX; this.y = this.spawnY;
      }
      return;
    }

    const dx = player.center.x - this.center.x;
    const dy = player.center.y - this.center.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 280) {
      this.vx = (dx / distance) * this.speed;
      this.vy = (dy / distance) * this.speed;
    } else {
      this.vx = Math.sin(Date.now() / 700) * 25;
      this.vy = Math.cos(Date.now() / 900) * 25;
    }

    const nextX = this.x + this.vx * dt;
    const nextY = this.y + this.vy * dt;
    if (canMoveTo(nextX, this.y, this.w, this.h)) this.x = nextX;
    if (canMoveTo(this.x, nextY, this.w, this.h)) this.y = nextY;
  }
}

window.Entity = Entity;
window.Player = Player;
window.Slime = Slime;
