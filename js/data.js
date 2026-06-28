/* Content tables for the Character Forge RPG. Every rollable item exposes rarity and rates. */
window.GameData = (() => {
  const rarities = [
    { id: 'common', name: 'Common', stars: 1, rate: 50, color: '#cbd5e1' },
    { id: 'uncommon', name: 'Uncommon', stars: 2, rate: 25, color: '#86efac' },
    { id: 'rare', name: 'Rare', stars: 3, rate: 13, color: '#7dd3fc' },
    { id: 'epic', name: 'Epic', stars: 4, rate: 7, color: '#c084fc' },
    { id: 'legendary', name: 'Legendary', stars: 5, rate: 4, color: '#facc15' },
    { id: 'mythic', name: 'Mythic', stars: 6, rate: 1, color: '#fb7185' }
  ];
  const classes = [
    { id: 'warrior', name: 'Warrior', race: 'Human', tags: ['Human', 'Warrior'], rarity: 'common', hp: 135, atk: 20, def: 9, speed: 11, classSkills: ['Guard Break', 'Rally Slash'], ultimate: 'Blade Storm', note: 'Fast leveling bruiser.' },
    { id: 'paladin', name: 'Paladin', race: 'Angel', tags: ['Angel', 'Support'], rarity: 'rare', hp: 150, atk: 16, def: 14, speed: 9, classSkills: ['Holy Strike', 'Aegis'], ultimate: 'Sanctuary', note: 'Defensive holy anchor.' },
    { id: 'necromancer', name: 'Necromancer', race: 'Demon', tags: ['Demon', 'Necromancer'], rarity: 'epic', hp: 105, atk: 24, def: 7, speed: 10, classSkills: ['Bone Spear', 'Raise Guard'], ultimate: 'Grave Tide', note: 'Summons and damage over time.' },
    { id: 'dragonMage', name: 'Dragon Mage', race: 'Angel', tags: ['Dragon', 'Mage'], rarity: 'legendary', hp: 128, atk: 31, def: 10, speed: 12, classSkills: ['Dragon Spark', 'Mana Wing'], ultimate: 'Starfire Nova', note: 'Explosive magic scaling.' },
    { id: 'worldBreaker', name: 'World Breaker', race: 'Human', tags: ['Human', 'Titan'], rarity: 'mythic', hp: 180, atk: 36, def: 15, speed: 8, classSkills: ['Fault Line', 'Titan Grip'], ultimate: 'World Crack', note: 'Slow mythic carry with huge damage.' }
  ];
  const traits = [
    { id: 'brave', name: 'Brave', rarity: 'common', effect: '+10% HP', mods: { hpPct: .1 } },
    { id: 'lucky', name: 'Lucky', rarity: 'uncommon', effect: '+20% loot coins', mods: { lootPct: .2 } },
    { id: 'quick', name: 'Quick', rarity: 'rare', effect: '+20 Speed', mods: { speed: 20 } },
    { id: 'vampire', name: 'Vampire', rarity: 'epic', effect: 'Basic attacks heal 10%', mods: { lifesteal: .1 } },
    { id: 'giant', name: 'Giant', rarity: 'legendary', effect: '+30% HP, -5 Speed', mods: { hpPct: .3, speed: -5 } },
    { id: 'genius', name: 'Genius', rarity: 'mythic', effect: 'Skills cool down 1 turn faster', mods: { cooldownReduction: 1 } }
  ];
  const passives = [
    { id: 'secondLife', name: 'Second Life', rarity: 'legendary', effect: 'Revive once at 35% HP', type: 'trigger' },
    { id: 'fireAura', name: 'Fire Aura', rarity: 'rare', effect: 'Burn enemies with skill hits', type: 'dot' },
    { id: 'criticalExpert', name: 'Critical Expert', rarity: 'uncommon', effect: '+15% crit chance', type: 'stat' },
    { id: 'bloodthirst', name: 'Bloodthirst', rarity: 'epic', effect: 'Gain attack after each KO', type: 'snowball' },
    { id: 'magicShield', name: 'Magic Shield', rarity: 'common', effect: '+20% DEF', type: 'stat' },
    { id: 'lightningBody', name: 'Lightning Body', rarity: 'mythic', effect: '20% chance to dodge', type: 'chance' }
  ];
  const skills = [
    { id: 'slash', name: 'Slash', rarity: 'common', type: 'basic', power: 1.25, cooldown: 1, effect: 'Reliable physical hit.' },
    { id: 'heal', name: 'Heal', rarity: 'uncommon', type: 'heal', power: .28, cooldown: 3, effect: 'Restore an ally.' },
    { id: 'fireball', name: 'Fireball', rarity: 'rare', type: 'dot', power: 1.15, cooldown: 2, effect: 'Damage and burn.' },
    { id: 'chainLightning', name: 'Chain Lightning', rarity: 'epic', type: 'multi', power: .85, cooldown: 3, effect: 'Hits two enemies.' },
    { id: 'meteor', name: 'Meteor', rarity: 'legendary', type: 'aoe', power: 1.45, cooldown: 4, effect: 'Heavy area damage.' },
    { id: 'icePrison', name: 'Ice Prison', rarity: 'mythic', type: 'control', power: 1.05, cooldown: 4, effect: 'Damage with a freeze chance.' }
  ];
  const equipment = [
    { slot: 'Weapon', name: 'Balanced Sword', rarity: 'common', stats: { atk: 5 } },
    { slot: 'Armor', name: 'Knight Plate', rarity: 'uncommon', stats: { hp: 18, def: 4 } },
    { slot: 'Boots', name: 'Wind Boots', rarity: 'rare', stats: { speed: 8, dodge: 5 } },
    { slot: 'Ring', name: 'Crit Ring', rarity: 'epic', stats: { crit: 8, atk: 4 } },
    { slot: 'Artifact', name: 'Phoenix Relic', rarity: 'legendary', stats: { hp: 30, atk: 8 } },
    { slot: 'Relic', name: 'Abyss Crown', rarity: 'mythic', stats: { atk: 14, def: 8, speed: 6 } }
  ];
  const areas = [
    { id: 'grasslands', name: 'Grasslands', level: '1–5', enemy: 'Common Monster', minRarity: 'common', reward: 28 },
    { id: 'forest', name: 'Forest', level: '5–10', enemy: 'Elite Monster', minRarity: 'uncommon', reward: 44 },
    { id: 'cave', name: 'Cave', level: '10–20', enemy: 'Mini Boss', minRarity: 'rare', reward: 66 },
    { id: 'ruins', name: 'Ruins', level: '20–35', enemy: 'Boss', minRarity: 'epic', reward: 100 },
    { id: 'abyss', name: 'Abyss', level: '50+', enemy: 'World Boss', minRarity: 'mythic', reward: 180 }
  ];
  return { rarities, classes, traits, passives, skills, equipment, areas };
})();
