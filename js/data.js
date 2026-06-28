/* Shared game constants and map data. Tiles use simple letters so maps are easy to expand. */
window.GameData = (() => {
  const TILE = 48;
  const world = [
    '############################',
    '#..........VVVVVV..........#',
    '#..........V....V..........#',
    '#..PP......V.N..V.....SS...#',
    '#..PP......V....V..........#',
    '#..........VV..VV..........#',
    '#..........................#',
    '#..............~~~~........#',
    '#..............~~~~........#',
    '#..........................#',
    '#.................gggg.....#',
    '#.................g..g.....#',
    '#.....SS..........g..g.....#',
    '#.................gggg.....#',
    '#..........................#',
    '#..............E...........#',
    '#..........................#',
    '############################'
  ];

  const tileInfo = {
    '#': { color: '#213343', solid: true },
    '.': { color: '#79c267', solid: false },
    'V': { color: '#a87949', solid: true },
    'P': { color: '#7f6a55', solid: true },
    'S': { color: '#5a7f4f', solid: true },
    '~': { color: '#4aa3df', solid: true },
    'g': { color: '#5fb85a', solid: false },
    'N': { color: '#79c267', solid: false },
    'E': { color: '#79c267', solid: false }
  };

  const weapons = {
    trainingSword: { id: 'trainingSword', name: 'Training Sword', power: 8 },
    slimeDagger: { id: 'slimeDagger', name: 'Slime Dagger', power: 13 }
  };

  return { TILE, world, tileInfo, weapons };
})();
