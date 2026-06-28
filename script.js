/* Meadowfall RPG: a polished, framework-free base for future offline RPG updates. */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const { TILE, world, tileInfo, weapons } = window.GameData;
const mapWidth = world[0].length * TILE;
const mapHeight = world.length * TILE;

const ui = {
  mainMenu: document.getElementById('mainMenu'), pauseMenu: document.getElementById('pauseMenu'), hud: document.getElementById('hud'),
  inventory: document.getElementById('inventoryPanel'), dialogue: document.getElementById('dialogueBox'), hpFill: document.getElementById('hpFill'),
  hpText: document.getElementById('hpText'), expFill: document.getElementById('expFill'), expText: document.getElementById('expText'), coinText: document.getElementById('coinText'),
  continueButton: document.getElementById('continueButton'), weaponSlot: document.getElementById('weaponSlot'), inventoryItems: document.getElementById('inventoryItems'),
  touchControls: document.getElementById('touchControls')
};

let player = new Player(180, 270);
let slime = new Slime(750, 735);
let camera = { x: 0, y: 0 };
let keys = new Set();
let running = false;
let paused = false;
let lastTime = 0;
let autosaveTimer = 0;
let attackFlash = 0;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(480, Math.floor(rect.width));
  canvas.height = Math.max(270, Math.floor(rect.height));
}

function tileAtPixel(x, y) {
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  return world[row]?.[col] ?? '#';
}

function canMoveTo(x, y, w, h) {
  const points = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]];
  return points.every(([px, py]) => !tileInfo[tileAtPixel(px, py)].solid);
}

function getSaveState() {
  return {
    player: { x: player.x, y: player.y, hp: player.hp, maxHp: player.maxHp, level: player.level, exp: player.exp, nextExp: player.nextExp, coins: player.coins, weaponId: player.weaponId, inventory: player.inventory },
    slime: { hp: slime.hp, alive: slime.alive, respawnTimer: slime.respawnTimer }
  };
}

function applySave(save) {
  player = new Player(save.player.x, save.player.y);
  Object.assign(player, save.player);
  slime = new Slime(750, 735);
  if (save.slime) Object.assign(slime, save.slime);
}

function saveGame() {
  window.SaveSystem.save(getSaveState());
  ui.continueButton.disabled = false;
}

function startGame(save = null) {
  if (save) applySave(save); else { player = new Player(180, 270); slime = new Slime(750, 735); }
  running = true; paused = false; lastTime = performance.now(); autosaveTimer = 0;
  ui.mainMenu.classList.add('hidden'); ui.pauseMenu.classList.add('hidden'); ui.hud.classList.remove('hidden');
  saveGame(); requestAnimationFrame(loop);
}

function togglePause(force) {
  if (!running) return;
  paused = typeof force === 'boolean' ? force : !paused;
  ui.pauseMenu.classList.toggle('hidden', !paused);
  if (!paused) { lastTime = performance.now(); requestAnimationFrame(loop); }
}

function toggleInventory(force) {
  const open = typeof force === 'boolean' ? force : ui.inventory.classList.contains('hidden');
  ui.inventory.classList.toggle('hidden', !open);
  renderInventory();
}

function renderInventory() {
  const weapon = weapons[player.weaponId];
  ui.weaponSlot.innerHTML = `<strong>Weapon Slot</strong><p>${weapon.name} · Power ${weapon.power}</p>`;
  ui.inventoryItems.innerHTML = '<strong>Items</strong>' + player.inventory.map(item => `<div class="item-row"><span>${item.name}</span><span>x${item.qty}</span></div>`).join('');
}

function update(dt) {
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  slime.attackCooldown = Math.max(0, slime.attackCooldown - dt);
  attackFlash = Math.max(0, attackFlash - dt);

  const dx = (keys.has('ArrowRight') || keys.has('d') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('a') ? 1 : 0);
  const dy = (keys.has('ArrowDown') || keys.has('s') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('w') ? 1 : 0);
  const length = Math.hypot(dx, dy) || 1;
  const nextX = player.x + (dx / length) * player.speed * dt;
  const nextY = player.y + (dy / length) * player.speed * dt;
  if (canMoveTo(nextX, player.y, player.w, player.h)) player.x = nextX;
  if (canMoveTo(player.x, nextY, player.w, player.h)) player.y = nextY;

  slime.update(dt, player, canMoveTo);
  if (slime.alive && player.intersects(slime) && slime.attackCooldown <= 0) {
    player.hp = Math.max(0, player.hp - 9);
    slime.attackCooldown = 0.75;
    if (player.hp <= 0) { player.hp = player.maxHp; player.x = 180; player.y = 270; player.coins = Math.max(0, player.coins - 3); }
  }

  camera.x = Math.max(0, Math.min(player.center.x - canvas.width / 2, mapWidth - canvas.width));
  camera.y = Math.max(0, Math.min(player.center.y - canvas.height / 2, mapHeight - canvas.height));
  autosaveTimer += dt;
  if (autosaveTimer > 8) { saveGame(); autosaveTimer = 0; }
}

function attack() {
  if (!running || paused || player.attackCooldown > 0) return;
  player.attackCooldown = 0.42; attackFlash = 0.16;
  if (slime.alive && Math.hypot(slime.center.x - player.center.x, slime.center.y - player.center.y) < 72) {
    slime.hp -= weapons[player.weaponId].power;
    if (slime.hp <= 0) defeatSlime();
  }
}

function defeatSlime() {
  slime.alive = false; slime.respawnTimer = 14; player.gainExp(18); player.coins += 5 + Math.floor(Math.random() * 6);
  if (Math.random() < 0.45 && player.weaponId !== 'slimeDagger') {
    player.weaponId = 'slimeDagger';
    player.inventory.push({ id: 'slimeDagger', name: 'Slime Dagger', qty: 1 });
    showDialogue('The slime dropped a Slime Dagger! It was equipped automatically.');
  }
  saveGame();
}

function interact() {
  const npc = { x: 635, y: 165, w: 34, h: 40 };
  const close = Math.hypot(player.center.x - (npc.x + 17), player.center.y - (npc.y + 20)) < 80;
  showDialogue(close ? 'Elder Mira: Welcome to Meadowfall. The field is calm, but even small slimes can be dangerous.' : 'No one is close enough to talk to.');
}

function showDialogue(text) {
  ui.dialogue.textContent = text;
  ui.dialogue.classList.remove('hidden');
  clearTimeout(showDialogue.timer);
  showDialogue.timer = setTimeout(() => ui.dialogue.classList.add('hidden'), 3600);
}

function drawMap() {
  const startCol = Math.floor(camera.x / TILE), endCol = Math.ceil((camera.x + canvas.width) / TILE);
  const startRow = Math.floor(camera.y / TILE), endRow = Math.ceil((camera.y + canvas.height) / TILE);
  for (let row = startRow; row < endRow; row++) for (let col = startCol; col < endCol; col++) {
    const tile = world[row]?.[col] ?? '#';
    ctx.fillStyle = tileInfo[tile].color;
    ctx.fillRect(col * TILE - camera.x, row * TILE - camera.y, TILE, TILE);
    if (tile === '.') { ctx.fillStyle = '#ffffff10'; ctx.fillRect(col * TILE - camera.x + 8, row * TILE - camera.y + 10, 4, 4); }
  }
  ctx.fillStyle = '#c08457'; ctx.fillRect(635 - camera.x, 165 - camera.y, 34, 40);
}

function drawHealth(entity) {
  if (!entity.alive && entity instanceof Slime) return;
  const pct = Math.max(0, entity.hp / entity.maxHp);
  ctx.fillStyle = '#111827'; ctx.fillRect(entity.x - camera.x - 2, entity.y - camera.y - 12, entity.w + 4, 6);
  ctx.fillStyle = pct > .35 ? '#77dd77' : '#e63946'; ctx.fillRect(entity.x - camera.x - 2, entity.y - camera.y - 12, (entity.w + 4) * pct, 6);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); drawMap();
  if (slime.alive) { slime.draw(ctx, camera); drawHealth(slime); }
  player.draw(ctx, camera); drawHealth(player);
  if (attackFlash > 0) { ctx.strokeStyle = '#f4d35e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(player.center.x - camera.x, player.center.y - camera.y, 70, 0, Math.PI * 2); ctx.stroke(); }
  ui.hpFill.style.width = `${(player.hp / player.maxHp) * 100}%`; ui.hpText.textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
  ui.expFill.style.width = `${(player.exp / player.nextExp) * 100}%`; ui.expText.textContent = `Lv ${player.level} · ${player.exp}/${player.nextExp}`;
  ui.coinText.textContent = player.coins;
}

function loop(time) {
  if (!running || paused) return;
  const dt = Math.min(0.033, (time - lastTime) / 1000); lastTime = time;
  update(dt); draw(); requestAnimationFrame(loop);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('keydown', event => {
  keys.add(event.key);
  if (event.key === ' ') attack();
  if (event.key.toLowerCase() === 'e') interact();
  if (event.key.toLowerCase() === 'i') toggleInventory();
  if (event.key === 'Escape') togglePause();
});
window.addEventListener('keyup', event => keys.delete(event.key));

document.getElementById('newGameButton').onclick = () => startGame();
ui.continueButton.onclick = () => startGame(window.SaveSystem.load());
document.getElementById('resumeButton').onclick = () => togglePause(false);
document.getElementById('saveButton').onclick = saveGame;
document.getElementById('returnMenuButton').onclick = () => { saveGame(); running = false; ui.pauseMenu.classList.add('hidden'); ui.hud.classList.add('hidden'); ui.mainMenu.classList.remove('hidden'); };
document.getElementById('closeInventoryButton').onclick = () => toggleInventory(false);
ui.continueButton.disabled = !window.SaveSystem.hasSave();

document.querySelectorAll('[data-dir]').forEach(button => {
  const map = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  const key = map[button.dataset.dir];
  button.addEventListener('pointerdown', () => keys.add(key));
  button.addEventListener('pointerup', () => keys.delete(key));
  button.addEventListener('pointerleave', () => keys.delete(key));
});
document.querySelector('[data-action="attack"]').onclick = attack;
document.querySelector('[data-action="interact"]').onclick = interact;
document.querySelector('[data-action="inventory"]').onclick = () => toggleInventory();

resizeCanvas(); draw();
