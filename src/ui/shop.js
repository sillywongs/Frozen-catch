export const BOOSTERS = {
  extraSlot: { name: 'Extra Slot', price: 40, description: 'Two extra slots on the ice shelf for one level.' },
  shuffle: { name: 'Shuffle Squads', price: 25, description: 'Reorder the waiting penguin squads.' },
  undo: { name: 'Undo Last Tap', price: 20, description: 'Take back the last squad you sent out.' },
};

export function buyBooster(data, type) {
  const booster = BOOSTERS[type];
  if (!booster) return { ok: false, error: 'Unknown booster.' };
  if (data.coins < booster.price) return { ok: false, error: 'Not enough coins.' };
  data.coins -= booster.price;
  data.inventory[type] = (data.inventory[type] || 0) + 1;
  return { ok: true };
}
