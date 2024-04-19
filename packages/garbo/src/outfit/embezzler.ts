import { Outfit, OutfitSpec } from "grimoire-kolmafia";
import { toJson } from "kolmafia";
import { $familiar, $item, $items, $location, Guzzlr } from "libram";
import { meatFamiliar } from "../familiar";
import { chooseBjorn } from "./bjorn";
import { bonusGear } from "./dropsgear";
import {
  bestBjornalike,
  cleaverCheck,
  familiarWaterBreathingEquipment,
  useUPCsIfNeeded,
  validateGarbageFoldable,
  waterBreathingEquipment,
} from "./lib";
import { BonusEquipMode, modeValueOfMeat } from "../lib";

export function embezzlerOutfit(
  spec: OutfitSpec = {},
  target = $location.none,
): Outfit {
  cleaverCheck();
  validateGarbageFoldable(spec);
  const outfit = Outfit.from(
    spec,
    new Error(`Failed to construct outfit from spec ${toJson(spec)}`),
  );

  outfit.modifier.push(
    `${modeValueOfMeat(BonusEquipMode.EMBEZZLER)} Meat Drop`,
    "-tie",
  );
  outfit.avoid.push($item`cheap sunglasses`); // Even if we're adventuring in Barf Mountain itself, these are bad
  outfit.familiar ??= meatFamiliar();

  const bjornChoice = chooseBjorn(BonusEquipMode.EMBEZZLER, outfit.familiar);

  const underwater = target.environment === "underwater";
  if (underwater) {
    if (!outfit.familiar.underwater) {
      outfit.equipFirst(familiarWaterBreathingEquipment);
    }

    if (!outfit.equipFirst(waterBreathingEquipment)) {
      outfit.modifier.push("sea");
    }
  }

  if (outfit.familiar === $familiar`Jill-of-All-Trades`) {
    outfit.equip($item`LED candle`);
    outfit.setModes({ jillcandle: "ultraviolet" });
  }

  useUPCsIfNeeded(outfit);

  outfit.bonuses = bonusGear(BonusEquipMode.EMBEZZLER);
  const bjornalike = bestBjornalike(outfit);

  if (
    target === Guzzlr.getLocation() &&
    Guzzlr.turnsLeftOnQuest(false) === 1 &&
    Guzzlr.haveBooze()
  ) {
    outfit.addBonus(
      $item`Guzzlr pants`,
      Guzzlr.expectedReward(true) - Guzzlr.expectedReward(false),
    );
  }

  if (bjornalike) {
    outfit.setBonus(bjornalike, bjornChoice.value);
    outfit.equip(bjornalike);
    const other = $items`Buddy Bjorn, Crown of Thrones`.filter(
      (i) => i !== bjornalike,
    )[0];
    outfit.avoid.push(other);
    switch (bjornalike) {
      case $item`Buddy Bjorn`:
        outfit.bjornify(bjornChoice.familiar);
        break;
      case $item`Crown of Thrones`:
        outfit.enthrone(bjornChoice.familiar);
        break;
    }
  }

  outfit.setModes({
    snowsuit: "nose",
    parka: "kachungasaur",
    edpiece: "fish",
  });

  return outfit;
}
