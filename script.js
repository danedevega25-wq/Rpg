/* Character Forge RPG: offline squad building, visible roll rates, auto-battle, and autosave. */
const { rarities, classes, traits, passives, skills, equipment, areas } = window.GameData;
const rarityById = Object.fromEntries(rarities.map(rarity => [rarity.id, rarity]));
const state = { coins: 180, diamonds: 160, units: [], selectedId: null, formation: [], discovered: { classes: {}, traits: {}, passives: {}, skills: {}, equipment: {}, enemies: {} } };
const ui = {
  mainMenu: document.getElementById('mainMenu'), gameScreen: document.getElementById('gameScreen'), continueButton: document.getElementById('continueButton'), coinText: document.getElementById('coinText'), diamondText: document.getElementById('diamondText'), unitList: document.getElementById('unitList'), unitDetail: document.getElementById('unitDetail'), formationSlots: document.getElementById('formationSlots'), synergyList: document.getElementById('synergyList'), areaSelect: document.getElementById('areaSelect'), summonRates: document.getElementById('summonRates'), indexGrid: document.getElementById('indexGrid'), battleModal: document.getElementById('battleModal'), battleTitle: document.getElementById('battleTitle'), battleTeams: document.getElementById('battleTeams'), battleLog: document.getElementById('battleLog')
};

function stars(rarityId) { return '★'.repeat(rarityById[rarityId].stars); }
function byRarity(list, rarityId) { return list.filter(item => item.rarity === rarityId); }
function rollRarity(minimum = 'common') {
  const minStars = rarityById[minimum].stars;
  const pool = rarities.filter(rarity => rarity.stars >= minStars);
  const total = pool.reduce((sum, rarity) => sum + rarity.rate, 0);
  let roll = Math.random() * total;
  for (const rarity of pool) { roll -= rarity.rate; if (roll <= 0) return rarity.id; }
  return pool[0].id;
}
function pick(list, minimum = 'common') {
  let rarityId = rollRarity(minimum);
  let pool = byRarity(list, rarityId);
  while (!pool.length) { rarityId = rollRarity(); pool = byRarity(list, rarityId); }
  return structuredClone(pool[Math.floor(Math.random() * pool.length)]);
}
function discover(type, item) { state.discovered[type][item.id || item.name] = true; }
function markUnitDiscovered(unit) { discover('classes', unit.class); discover('traits', unit.trait); discover('passives', unit.passive); unit.rolledSkills.forEach(skill => discover('skills', skill)); unit.gear.forEach(item => discover('equipment', item)); }
function randomId() { return crypto.randomUUID ? crypto.randomUUID() : `unit-${Date.now()}-${Math.random()}`; }

function createUnit() {
  const unitClass = pick(classes);
  const unit = new ForgeUnit(randomId(), unitClass, pick(traits), pick(passives), [pick(skills), pick(skills)], [pick(equipment), pick(equipment)]);
  markUnitDiscovered(unit);
  return unit;
}
function createEnemy(area, index) {
  const enemyClass = pick(classes, area.minRarity);
  const enemy = new ForgeUnit(`enemy-${index}`, enemyClass, pick(traits, area.minRarity), pick(passives, area.minRarity), [pick(skills, area.minRarity)], [pick(equipment, area.minRarity)], rarityById[area.minRarity].stars + 1);
  enemy.name = `${area.enemy} ${index + 1}`;
  state.discovered.enemies[area.enemy] = true;
  return enemy;
}
function newGame() {
  Object.assign(state, { coins: 180, diamonds: 160, units: [], selectedId: null, formation: [], discovered: { classes: {}, traits: {}, passives: {}, skills: {}, equipment: {}, enemies: {} } });
  for (let i = 0; i < 5; i++) state.units.push(createUnit());
  state.formation = state.units.slice(0, 5).map(unit => unit.id);
  state.selectedId = state.units[0].id;
  start();
}
function start(save = null) {
  if (save) hydrate(save);
  ui.mainMenu.classList.add('hidden'); ui.gameScreen.classList.remove('hidden');
  render(); saveGame();
}
function hydrate(save) {
  Object.assign(state, save);
  state.units = save.units.map(raw => Object.assign(new ForgeUnit(raw.id, raw.class, raw.trait, raw.passive, raw.rolledSkills, raw.gear, raw.level), { exp: raw.exp || 0, name: raw.name }));
}
function saveGame() { window.SaveSystem.save(state); ui.continueButton.disabled = false; }

function render() {
  ui.coinText.textContent = state.coins; ui.diamondText.textContent = state.diamonds;
  ui.summonRates.textContent = rarities.map(rarity => `${rarity.name} ${rarity.rate}%`).join(' · ');
  ui.areaSelect.innerHTML = areas.map(area => `<option value="${area.id}">${area.name} Lv.${area.level} · ${area.enemy}</option>`).join('');
  renderUnits(); renderDetail(); renderFormation(); renderIndexes(); saveGame();
}
function renderUnits() {
  ui.unitList.innerHTML = state.units.map(unit => `<button class="unit-card ${unit.id === state.selectedId ? 'active' : ''}" data-unit="${unit.id}"><strong>${unit.name}</strong><span style="color:${rarityById[unit.class.rarity].color}">${stars(unit.class.rarity)} ${unit.class.race} · ${unit.class.tags.join(' + ')}</span><small>Lv.${unit.level} · ${unit.trait.name} · ${unit.passive.name}</small></button>`).join('');
  ui.unitList.querySelectorAll('[data-unit]').forEach(button => button.onclick = () => { state.selectedId = button.dataset.unit; render(); });
}
function renderDetail() {
  const unit = state.units.find(item => item.id === state.selectedId);
  if (!unit) return;
  const stats = unit.getStats();
  ui.unitDetail.innerHTML = `<h3>${unit.name}</h3><p class="rarity" style="color:${rarityById[unit.class.rarity].color}">${stars(unit.class.rarity)} ${rarityById[unit.class.rarity].name} ${unit.class.name}</p><p>${unit.class.note}</p><div class="stat-grid">${Object.entries(stats).map(([key, value]) => `<span>${key.toUpperCase()} <strong>${value}</strong></span>`).join('')}</div><h4>Formula</h4><p>${unit.class.race} + ${unit.class.name} + ${unit.trait.name} + ${unit.passive.name} + ${unit.rolledSkills.map(skill => skill.name).join(' / ')} + Equipment + Lv.${unit.level}</p><h4>Skills & Cooldowns</h4><ul>${unit.skills.map(skill => `<li>${skill.name} <em>${skill.type || 'skill'} · CD ${Math.max(1, (skill.cooldown || 2) - stats.cooldownReduction)}</em></li>`).join('')}</ul><h4>Equipment</h4><ul>${unit.gear.map(item => `<li>${item.slot}: ${item.name} +${item.upgrade || 0} <em>${stars(item.rarity)} ${JSON.stringify(item.stats)}</em></li>`).join('')}</ul>`;
}
function renderFormation() {
  ui.formationSlots.innerHTML = state.formation.map((id, index) => {
    const unit = state.units.find(item => item.id === id);
    return `<button class="formation-slot" data-slot="${index}">${index + 1}. ${unit ? unit.name : 'Empty'}</button>`;
  }).join('');
  const tagCounts = {};
  state.formation.map(id => state.units.find(unit => unit.id === id)).filter(Boolean).forEach(unit => unit.class.tags.forEach(tag => tagCounts[tag] = (tagCounts[tag] || 0) + 1));
  const synergies = Object.entries(tagCounts).filter(([, count]) => count >= 2).map(([tag, count]) => `${tag} x${count}: +${count * 5}% team focus`);
  ui.synergyList.innerHTML = synergies.length ? synergies.map(text => `<span>${text}</span>`).join('') : '<span>No active synergy yet. Match tags like Dragon + Mage or Human + Warrior.</span>';
}
function renderIndexes() {
  const sections = [['Class Index', classes, 'classes'], ['Skill Index', skills, 'skills'], ['Passive Index', passives, 'passives'], ['Trait Index', traits, 'traits'], ['Equipment Index', equipment, 'equipment'], ['Enemy Index', areas.map(a => ({ id: a.enemy, name: a.enemy, rarity: a.minRarity, effect: `${a.name} Lv.${a.level}` })), 'enemies']];
  ui.indexGrid.innerHTML = sections.map(([title, list, type]) => `<div class="index-card"><h4>📖 ${title}</h4>${list.map(item => state.discovered[type][item.id || item.name] ? `<p><b>${item.name}</b> <span style="color:${rarityById[item.rarity].color}">${stars(item.rarity)}</span><small>${item.effect || item.note || item.race || item.slot}</small></p>` : '<p class="locked">Undiscovered</p>').join('')}</div>`).join('');
}
function selectedUnit() { return state.units.find(unit => unit.id === state.selectedId); }
function spend(cost) { if (state.coins < cost) return false; state.coins -= cost; return true; }
function reroll(kind) {
  const unit = selectedUnit();
  const costs = { trait: 35, passive: 45, skill: 40 };
  if (!spend(costs[kind])) return alert('Not enough coins. Farm a battle first.');
  if (kind === 'trait') unit.trait = pick(traits);
  if (kind === 'passive') unit.passive = pick(passives);
  if (kind === 'skill') unit.rolledSkills[Math.floor(Math.random() * unit.rolledSkills.length)] = pick(skills);
  unit.name = `${unit.trait.name} ${unit.class.name}`; markUnitDiscovered(unit); render();
}
function upgradeGear() {
  const unit = selectedUnit();
  if (!spend(60)) return alert('Not enough coins.');
  const item = unit.gear[Math.floor(Math.random() * unit.gear.length)];
  item.upgrade = (item.upgrade || 0) + 1; render();
}
function runBattle() {
  const area = areas.find(item => item.id === ui.areaSelect.value);
  const allies = state.formation.map(id => state.units.find(unit => unit.id === id)).filter(Boolean).map(unit => new BattleActor(unit, 'ally'));
  const enemies = Array.from({ length: Math.min(5, 2 + rarityById[area.minRarity].stars) }, (_, i) => new BattleActor(createEnemy(area, i), 'enemy'));
  const log = [`Entered ${area.name}. Enemy rarity floor: ${rarityById[area.minRarity].name}.`];
  for (let round = 1; round <= 18 && allies.some(a => a.alive) && enemies.some(e => e.alive); round++) {
    log.push(`— Round ${round} —`);
    [...allies, ...enemies].filter(actor => actor.alive).sort((a, b) => b.stats.speed - a.stats.speed).forEach(actor => takeTurn(actor, actor.side === 'ally' ? enemies : allies, actor.side === 'ally' ? allies : enemies, log));
  }
  const won = enemies.every(enemy => !enemy.alive);
  if (won) awardBattle(area, allies, log); else log.push('Defeat. The forge keeps your progress, but the dungeon wins this time.');
  showBattle(area, allies, enemies, log, won);
}
function takeTurn(actor, foes, allies, log) {
  if (!actor.alive) return;
  if (actor.burn) { actor.hp -= actor.burn; log.push(`${actor.unit.name} takes ${actor.burn} burn damage.`); }
  if (!actor.alive) return handleDown(actor, log);
  Object.keys(actor.cooldowns).forEach(key => actor.cooldowns[key]--);
  const readySkill = actor.unit.rolledSkills.find(skill => (actor.cooldowns[skill.id] || 0) <= 0);
  if (readySkill && readySkill.type === 'heal') {
    const target = allies.filter(a => a.alive).sort((a, b) => a.hp / a.stats.hp - b.hp / b.stats.hp)[0];
    const amount = Math.round(actor.stats.atk * 2.4); target.hp = Math.min(target.stats.hp, target.hp + amount); actor.cooldowns[readySkill.id] = Math.max(1, readySkill.cooldown - actor.stats.cooldownReduction); log.push(`${actor.unit.name} casts ${readySkill.name}, healing ${target.unit.name} for ${amount}.`); return;
  }
  const target = foes.find(foe => foe.alive); if (!target) return;
  const skill = readySkill || { id: 'basic', name: 'Basic Attack', power: 1, cooldown: 0, type: 'basic' };
  const dodged = Math.random() * 100 < target.stats.dodge;
  if (dodged) { log.push(`${target.unit.name} dodges ${actor.unit.name}'s ${skill.name}.`); return; }
  const crit = Math.random() * 100 < actor.stats.crit;
  const damage = Math.max(1, Math.round(actor.stats.atk * (skill.power || 1) * (crit ? 1.75 : 1) - target.stats.def));
  target.hp -= damage; actor.hp = Math.min(actor.stats.hp, actor.hp + Math.round(damage * actor.stats.lifesteal));
  if (skill.type === 'dot' || actor.unit.passive.id === 'fireAura') target.burn = Math.max(target.burn, 5);
  actor.cooldowns[skill.id] = Math.max(1, (skill.cooldown || 1) - actor.stats.cooldownReduction);
  log.push(`${actor.unit.name} uses ${skill.name} for ${damage}${crit ? ' CRIT' : ''} damage.`);
  if (!target.alive) handleDown(target, log, actor);
}
function handleDown(actor, log, killer) {
  if (actor.unit.passive.id === 'secondLife' && !actor.revived) { actor.revived = true; actor.hp = Math.round(actor.stats.hp * .35); log.push(`${actor.unit.name}'s Second Life triggers!`); return; }
  actor.hp = 0; log.push(`${actor.unit.name} falls.`);
  if (killer?.unit.passive.id === 'bloodthirst') { killer.stats.atk += 4; log.push(`${killer.unit.name} gains Bloodthirst attack.`); }
}
function awardBattle(area, allies, log) {
  const lootBonus = allies.reduce((sum, actor) => sum + actor.stats.lootPct, 0);
  const coins = Math.round(area.reward * (1 + lootBonus));
  state.coins += coins; state.diamonds += 8; log.push(`Victory! Earned ${coins} coins and 8 diamonds.`);
  state.formation.forEach(id => { const unit = state.units.find(item => item.id === id); unit.exp += 15; if (unit.exp >= unit.level * 30) { unit.exp = 0; unit.level++; log.push(`${unit.name} reaches level ${unit.level}.`); } });
}
function showBattle(area, allies, enemies, log, won) {
  ui.battleTitle.textContent = `${won ? 'Victory' : 'Defeat'} · ${area.name}`;
  ui.battleTeams.innerHTML = `<div><h4>Allies</h4>${allies.map(actor => `<span>${actor.unit.name}: ${Math.max(0, actor.hp)}/${actor.stats.hp}</span>`).join('')}</div><div><h4>Enemies</h4>${enemies.map(actor => `<span>${actor.unit.name}: ${Math.max(0, actor.hp)}/${actor.stats.hp}</span>`).join('')}</div>`;
  ui.battleLog.innerHTML = log.map(line => `<p>${line}</p>`).join(''); ui.battleModal.classList.remove('hidden'); render();
}

ui.continueButton.disabled = !window.SaveSystem.hasSave();
document.getElementById('newGameButton').onclick = newGame;
ui.continueButton.onclick = () => start(window.SaveSystem.load());
document.getElementById('saveButton').onclick = saveGame;
document.getElementById('menuButton').onclick = () => { saveGame(); ui.gameScreen.classList.add('hidden'); ui.mainMenu.classList.remove('hidden'); };
document.getElementById('summonButton').onclick = () => { if (state.diamonds < 50) return alert('Need 50 diamonds.'); state.diamonds -= 50; const unit = createUnit(); state.units.push(unit); state.selectedId = unit.id; render(); };
document.getElementById('rerollTraitButton').onclick = () => reroll('trait');
document.getElementById('rerollPassiveButton').onclick = () => reroll('passive');
document.getElementById('rerollSkillButton').onclick = () => reroll('skill');
document.getElementById('upgradeGearButton').onclick = upgradeGear;
document.getElementById('startBattleButton').onclick = runBattle;
document.getElementById('closeBattleButton').onclick = () => ui.battleModal.classList.add('hidden');
setInterval(() => { if (!ui.gameScreen.classList.contains('hidden')) saveGame(); }, 10000);
