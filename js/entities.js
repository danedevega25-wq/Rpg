/* Forge entities and deterministic helpers used by the UI and auto-battle simulator. */
class ForgeUnit {
  constructor(id, unitClass, trait, passive, rolledSkills, gear, level = 1) {
    this.id = id;
    this.name = `${trait.name} ${unitClass.name}`;
    this.class = unitClass;
    this.trait = trait;
    this.passive = passive;
    this.rolledSkills = rolledSkills;
    this.gear = gear;
    this.level = level;
    this.exp = 0;
  }

  get skills() {
    return [...this.class.classSkills.map(name => ({ name, cooldown: 2, type: 'class' })), ...this.rolledSkills, { name: this.class.ultimate, cooldown: 5, type: 'ultimate' }];
  }

  getStats() {
    const traitMods = this.trait.mods || {};
    const gearStats = this.gear.reduce((total, item) => {
      Object.entries(item.stats).forEach(([key, value]) => total[key] = (total[key] || 0) + value + (item.upgrade || 0));
      return total;
    }, {});
    return {
      hp: Math.round((this.class.hp + this.level * 12 + (gearStats.hp || 0)) * (1 + (traitMods.hpPct || 0))),
      atk: this.class.atk + this.level * 3 + (gearStats.atk || 0),
      def: Math.round((this.class.def + this.level * 2 + (gearStats.def || 0)) * (this.passive.id === 'magicShield' ? 1.2 : 1)),
      speed: this.class.speed + (traitMods.speed || 0) + (gearStats.speed || 0),
      crit: 8 + (gearStats.crit || 0) + (this.passive.id === 'criticalExpert' ? 15 : 0),
      dodge: (gearStats.dodge || 0) + (this.passive.id === 'lightningBody' ? 20 : 0),
      lifesteal: traitMods.lifesteal || 0,
      lootPct: traitMods.lootPct || 0,
      cooldownReduction: traitMods.cooldownReduction || 0
    };
  }
}

class BattleActor {
  constructor(unit, side) {
    this.unit = unit;
    this.side = side;
    this.stats = unit.getStats();
    this.hp = this.stats.hp;
    this.cooldowns = {};
    this.revived = false;
    this.burn = 0;
  }

  get alive() { return this.hp > 0; }
}

window.ForgeUnit = ForgeUnit;
window.BattleActor = BattleActor;
