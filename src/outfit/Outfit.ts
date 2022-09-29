import { canEquip, Item, myFamiliar, Slot, toSlot, weaponHands, weaponType } from "kolmafia";
import { $familiar, $item, $skill, $slot, have, Requirement } from "libram";
import { BooleanModifier, NumericModifier } from "libram/dist/modifierTypes";

export default class Outfit {
  private slots: Map<Slot, Item> = new Map();
  private hands: { main?: Item; off?: Item } = {};
  private accessories: [Item | null, Item | null, Item | null] = [null, null, null];
  private numericParameters: Partial<{ [x in NumericModifier]: number }> = {};
  private booleanParameters: Set<BooleanModifier> = new Set();
  private otherParameters: string[] = [];
  private preventEquip: Item[] = [];
  private bonuses: Map<Item, number> = new Map();

  inSlot(slot: Slot): Item | null {
    return this.slots.get(slot) ?? null;
  }

  assignBonus(item: Item, value: number): this {
    const current = this.bonuses.get(item) ?? 0;
    this.bonuses.set(item, current + value);
    return this;
  }

  assignBonuses(bonuses: Map<Item, number>): this {
    for (const [item, value] of bonuses.entries()) {
      this.assignBonus(item, value);
    }
    return this;
  }

  currentEquipment(): Item[] {
    return [...this.slots.values(), this.hands.main, this.hands.off, ...this.accessories].filter(
      (i) => i instanceof Item
    ) as Item[];
  }

  canEquip(item: Item): boolean {
    if (!have(item) || !canEquip(item)) return false;
    if (this.preventEquip.includes(item)) return false;
    if (this.currentEquipment().includes(item)) return false;
    return true;
  }

  canForce(item: Item): boolean {
    const slot = toSlot(item);
    if (slot === $slot`acc1`) {
      return this.accessories.filter((acc) => acc === null).length > 0;
    }
    if (slot === $slot`off-hand`) {
      if (myFamiliar() === $familiar`Left-Hand Man` && !this.slots.get($slot`Familiar`)) {
        return true;
      }
      if (this.hands.off) return false;
      if (this.hands.main && weaponHands(this.hands.main) === 2) return false;
      return true;
    }
    if (slot === $slot`weapon`) {
      const hands = weaponHands(item);
      if (
        myFamiliar() === $familiar`Disembodied Hand` &&
        hands === 1 &&
        !this.slots.get($slot`Familiar`)
      ) {
        return true;
      }

      const canDual = have($skill`Double-Fisted Skull Smashing`);
      if (
        this.hands.main &&
        weaponHands(this.hands.main) === 1 &&
        !this.hands.off &&
        canDual &&
        weaponType(this.hands.main) === weaponHands(item)
      ) {
        return true;
      }
      if (!this.hands.main && (hands === 1 || !this.hands.off)) return true;
      return false;
    }
    if (slot === $slot`shirt` && !have($skill`Torso Awareness`)) return false;
    return Boolean(this.slots.get(slot));
  }

  private _softforce(item: Item): boolean {
    if (this.has(item)) return true;
      if (this.canEquip(item) && this.canForce(item)) {
        const slot = toSlot(item);
        if (slot === $slot`acc1`) {
          const spot = this.accessories.indexOf(null);
          if (spot > -1) this.accessories[spot] = item;
        }
        if (slot === $slot`weapon`) {
          const hands = weaponHands(item);
          if (
            myFamiliar() === $familiar`Disembodied Hand` &&
            hands === 1 &&
            !this.inSlot($slot`familiar`)
          ) {
            this.slots.set($slot`familiar`, item);
            return true;
          }
          if (this.hands.main && !this.hands.off && have($skill`Double-Fisted Skull Smashing`)) {
            this.hands.off = item;
            return true;
          }
          this.hands.main ??= item;
          return true;
        }
        if (
          slot === $slot`off-hand` &&
          myFamiliar() === $familiar`Left-Hand Man` &&
          !this.inSlot($slot`familiar`)
        ) {
          this.slots.set($slot`familiar`, item);
          return true;
        }

        this.slots.set(slot, item);
      }
    return false;
  }

  softforce(...items: Item[]): boolean {
    return items.every((item) => this._softforce(item))
  }

  forceIf(condition: boolean, ...items: Item[]): boolean {
    if (condition) return this.softforce(...items);
    return false;
  }

  forceFirst(items: Item[]): boolean {
    const available = items.find((i) => this.canForce(i));
    if (available) return this.softforce(available);
    return false;
  }

  has(item: Item): boolean {
    const slot = toSlot(item);
    if (slot === $slot`acc1`) return this.accessories.includes(item);
    return Array.from(this.slots.values()).includes(item);
  }

  static from(requirement: Requirement): Outfit {
    const newOutfit = new Outfit();
    newOutfit.otherParameters = requirement.maximizeParameters;
    const { bonusEquip, forceEquip, preventEquip, preventSlot } = requirement.maximizeOptions;
    if (bonusEquip) newOutfit.bonuses = bonusEquip;
    if (preventEquip) newOutfit.preventEquip = preventEquip;
    if (preventSlot) {
      for (const slot of preventSlot) {
        newOutfit.slots.set(slot, $item.none);
      }
    }
    if (forceEquip) {
      for (const equip of forceEquip) {
        newOutfit.softforce(equip);
      }
    }
    return newOutfit;
  }
}
