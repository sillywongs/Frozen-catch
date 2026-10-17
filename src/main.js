import {
  createGame,
  placeSquad,
  undoLastTap,
  shuffleSquads,
  extraSlot,
  computeStars,
  coinReward,
  freeSlot,
} from './logic/game.js';
import { reachableTargets, COLOR_NAMES } from './logic/board.js';
import { generateEndless } from './logic/generator.js';
import { LEVELS } from './levels-data.js';
import { Renderer } from './render/renderer.js';
import { AudioFX } from './render/audio.js';
import { createStorage } from './ui/storage.js';
import { BOOSTERS, buyBooster } from './ui/shop.js';

const storage = createStorage();
const audio = new AudioFX();
const renderer = new Renderer(document.getElementById('board'));
renderer.splashCallback = () => audio.splash();

let data = storage.load();
let state = null;
let currentLevel = null;
let endlessMode = false;
let endlessSeed = 0;

const menu = document.getElementById('menu');
const game = document.getElementById('game');
const overlay = document.getElementById('overlay');
const shop = document.getElementById('shop');

function show(element) {
  element.classList.remove('hidden');
}

function hide(element) {
  element.classList.add('hidden');
}

function updateHUD() {
  document.getElementById('coin-count').textContent = data.coins;
  document.getElementById('count-slot').textContent = data.inventory.extraSlot || 0;
  document.getElementById('count-shuffle').textContent = data.inventory.shuffle || 0;
  document.getElementById('count-undo').textContent = data.inventory.undo || 0;
  document.getElementById('mute-btn').textContent = data.settings.muted ? 'Muted' : 'Sound';
}

function renderMenu() {
  const grid = document.getElementById('level-grid');
  grid.innerHTML = '';
  for (const level of LEVELS) {
    const stars = data.stars[level.id] || 0;
    const button = document.createElement('button');
    button.className = 'level-btn';
    button.setAttribute('role', 'listitem');
    button.setAttribute('aria-label', 'Level ' + level.id + ', ' + stars + ' of 3 stars');
    button.innerHTML = '<span class="num">' + level.id + '</span><span class="st">' + '*'.repeat(stars) + '</span>';
    button.addEventListener('click', () => startLevel(level));
    grid.appendChild(button);
  }
  updateHUD();
}

function startLevel(level, options = {}) {
  currentLevel = level;
  endlessMode = Boolean(options.endless);
  endlessSeed = options.seed || endlessSeed;
  state = createGame(level, { restarted: Boolean(options.restarted), slotCap: level.slots });
  document.getElementById('level-title').textContent = level.name;
  hide(overlay);
  show(game);
  renderer.lastState = state;
  renderer.render(state);
  buildSquadButtons();
  updateHUD();
}

function readyColors() {
  const colors = new Set();
  for (const target of reachableTargets(state.grid)) {
    if (target.cell.m) {
      for (const squad of state.available) colors.add(squad.color);
    } else {
      colors.add(target.cell.c);
    }
  }
  return colors;
}

function buildSquadButtons() {
  const row = document.getElementById('squad-row');
  row.innerHTML = '';
  const ready = readyColors();
  const slotAvailable = freeSlot(state) >= 0;
  for (const squad of state.available) {
    const button = document.createElement('button');
    button.className = 'squad' + (ready.has(squad.color) ? ' ready' : '');
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.style.background = ['#ff7a6b', '#2ec4b6', '#ffd166', '#9b5de5', '#7bd389', '#ff8fab', '#4cc9f0', '#f4a261'][squad.color];
    button.appendChild(chip);
    const label = document.createElement('span');
    label.textContent = COLOR_NAMES[squad.color] + ' x' + squad.quota;
    button.appendChild(label);
    button.setAttribute('aria-label', 'Send ' + COLOR_NAMES[squad.color] + ' squad, quota ' + squad.quota);
    button.disabled = state.status !== 'playing' || !slotAvailable;
    button.addEventListener('click', () => sendSquad(squad.id));
    row.appendChild(button);
  }
}

function sendSquad(squadId) {
  audio.unlock();
  const result = placeSquad(state, squadId);
  if (!result.ok) return;
  audio.slide();
  renderer.playEvents(result.events);
  afterResolve();
}

function afterResolve() {
  renderer.render(state);
  buildSquadButtons();
  if (state.status === 'won') handleWin();
  else if (state.status === 'lost') handleLose();
}

function handleWin() {
  const stars = computeStars(state);
  const reward = coinReward(state);
  data.coins += reward;
  if (endlessMode) {
    data.endlessHigh = Math.max(data.endlessHigh || 0, (data.endlessHigh || 0) + 1);
  } else {
    data.stars[currentLevel.id] = Math.max(data.stars[currentLevel.id] || 0, stars);
  }
  storage.save(data);
  updateHUD();
  audio.chime();
  renderer.playWinReveal(currentLevel.grid, () => {
    showOverlay({
      title: 'Ice melted!',
      text: (endlessMode ? 'Expedition complete. ' : 'Level ' + currentLevel.id + ' complete. ') + '+' + reward + ' coins',
      stars,
      actions: [
        { label: endlessMode ? 'Next Expedition' : 'Next Level', primary: true, onClick: nextLevel },
        { label: 'Level Select', onClick: backToMenu },
      ],
    });
  });
}

function handleLose() {
  audio.lose();
  showOverlay({
    title: 'The squads are stuck',
    text: 'No penguin can reach a fish. Try a different order.',
    stars: 0,
    actions: [
      { label: 'Retry', primary: true, onClick: () => startLevel(currentLevel, { endless: endlessMode, seed: endlessSeed, restarted: true }) },
      { label: 'Level Select', onClick: backToMenu },
    ],
  });
}

function showOverlay({ title, text, stars, actions }) {
  document.getElementById('overlay-title').textContent = title;
  document.getElementById('overlay-text').textContent = text;
  document.getElementById('overlay-stars').textContent = '*'.repeat(stars);
  const actionRow = document.getElementById('overlay-actions');
  actionRow.innerHTML = '';
  for (const action of actions) {
    const button = document.createElement('button');
    button.className = action.primary ? 'primary' : 'icon-btn';
    button.textContent = action.label;
    button.addEventListener('click', action.onClick);
    actionRow.appendChild(button);
  }
  show(overlay);
}

function nextLevel() {
  if (endlessMode) {
    const seed = Math.floor(Math.random() * 1e9);
    let level = generateEndless(seed, (data.endlessHigh || 0) + 1);
    let attempt = 0;
    while (!level && attempt < 8) {
      level = generateEndless(seed + attempt + 1, (data.endlessHigh || 0) + 1);
      attempt++;
    }
    if (!level) return backToMenu();
    startLevel(level, { endless: true, seed: seed + attempt });
    return;
  }
  const next = LEVELS.find((level) => level.id === currentLevel.id + 1);
  if (next) startLevel(next);
  else backToMenu();
}

function backToMenu() {
  hide(overlay);
  hide(game);
  show(menu);
  renderMenu();
}

function useBooster(type) {
  audio.unlock();
  if ((data.inventory[type] || 0) <= 0) return;
  if (type === 'extraSlot') {
    const result = extraSlot(state);
    if (!result.ok) return;
  } else if (type === 'shuffle') {
    const result = shuffleSquads(state);
    if (!result.ok) return;
  } else if (type === 'undo') {
    const result = undoLastTap(state);
    if (!result.ok) return;
    state = result.state;
  }
  data.inventory[type]--;
  storage.save(data);
  renderer.playEvents(state.lastEvents);
  renderer.render(state);
  buildSquadButtons();
  updateHUD();
}

function renderShop() {
  document.getElementById('shop-coins').textContent = 'Coins: ' + data.coins;
  const items = document.getElementById('shop-items');
  items.innerHTML = '';
  for (const [type, booster] of Object.entries(BOOSTERS)) {
    const row = document.createElement('div');
    row.className = 'shop-item';
    const info = document.createElement('div');
    info.innerHTML = '<strong>' + booster.name + '</strong><br><small>' + booster.description + '</small>';
    const button = document.createElement('button');
    button.className = 'primary';
    button.textContent = booster.price + ' coins';
    button.disabled = data.coins < booster.price;
    button.addEventListener('click', () => {
      const result = buyBooster(data, type);
      if (result.ok) {
        storage.save(data);
        updateHUD();
        renderShop();
      }
    });
    row.appendChild(info);
    row.appendChild(button);
    items.appendChild(row);
  }
}

document.getElementById('back-btn').addEventListener('click', backToMenu);
document.getElementById('restart-btn').addEventListener('click', () => {
  startLevel(currentLevel, { endless: endlessMode, seed: endlessSeed, restarted: true });
});
document.getElementById('endless-btn').addEventListener('click', () => {
  audio.unlock();
  const seed = Math.floor(Math.random() * 1e9);
  let level = generateEndless(seed, (data.endlessHigh || 0) + 1);
  let attempt = 0;
  while (!level && attempt < 8) {
    level = generateEndless(seed + attempt + 1, (data.endlessHigh || 0) + 1);
    attempt++;
  }
  if (level) startLevel(level, { endless: true, seed: seed + attempt });
});
document.getElementById('shop-btn').addEventListener('click', () => {
  renderShop();
  show(shop);
});
document.getElementById('shop-close').addEventListener('click', () => hide(shop));
document.getElementById('mute-btn').addEventListener('click', () => {
  data.settings.muted = !data.settings.muted;
  audio.setMuted(data.settings.muted);
  storage.save(data);
  updateHUD();
});
document.getElementById('booster-slot').addEventListener('click', () => useBooster('extraSlot'));
document.getElementById('booster-shuffle').addEventListener('click', () => useBooster('shuffle'));
document.getElementById('booster-undo').addEventListener('click', () => useBooster('undo'));

document.addEventListener('keydown', (event) => {
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  const activeScreen = game.classList.contains('hidden') ? menu : game;
  const focusable = [...activeScreen.querySelectorAll('button:not(:disabled)')];
  if (!focusable.length) return;
  const index = focusable.indexOf(document.activeElement);
  let nextIndex = index;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = index + 1;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = index - 1;
  nextIndex = (nextIndex + focusable.length) % focusable.length;
  focusable[nextIndex].focus();
  event.preventDefault();
});

audio.setMuted(data.settings.muted);
renderMenu();
