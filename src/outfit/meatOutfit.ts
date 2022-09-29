import {
  canEquip,
  inebrietyLimit,
  Item,
  myClass,
  myInebriety,
  retrieveItem,
  totalTurnsPlayed,
} from "kolmafia";
import { $class, $familiar, $item, $items, $skill, get, getKramcoWandererChance, have, Requirement } from "libram";
import { meatFamiliar } from "../familiar";
import { pickBjorn } from "./bonusGear";
import Outfit from "./Outfit";

export default function meatOutfit(
  embezzlerUp: boolean,
  requirements: Requirement = new Requirement([], {}),
  sea = false
): void {
  const outfit = Outfit.from(requirements);
  const equipMode = embezzlerUp ? "embezzler" : "barf";
  const bjornChoice = pickBjorn(equipMode);

  if (!embezzlerUp) {
    if (myInebriety() > inebrietyLimit()) {
      outfit.softforce($item`Drunkula's wineglass`);
    } else {
      outfit.forceIf(
        get("questPAGhost") === "unstarted" && get("nextParanormalActivity") <= totalTurnsPlayed(),
        $item`protonic accelerator pack`
      );

      const ring = $item`mafia pointer finger ring`;
      let canCrit = false;
      if (outfit.canForce(ring)) {
        canCrit = myClass() === $class`Seal Clubber` && have($skill`Furious Wallop`);
        if (!canCrit) {
          canCrit = outfit.forceIf(
            myClass() === $class`Turtle Tamer`,
            $item`Operation Patriot Shield`
          );
        }
        if (!canCrit) {
          canCrit = outfit.softforce($item`haiku katana`);
        }
        if (!canCrit) {
          const gun =
            have($item`love`) && meatFamiliar() === $familiar`Robortender`
              ? $item`love`
              : $item`ice nine`;
          if (!have(gun)) retrieveItem(gun);
          canCrit = outfit.softforce($item`unwrapped knock-off retro superhero cape`, gun);
        }
        if (!canCrit) canCrit = outfit.softforce($item`Operation Patriot Shield`);
        if (canCrit) outfit.softforce(ring);
      }
      outfit.forceIf(getKramcoWandererChance() > 0.05, $item`Kramco Sausage-o-Matic™`);
    }
  }
}
