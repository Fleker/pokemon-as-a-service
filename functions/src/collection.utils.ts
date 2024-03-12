import { Badge } from "../../shared/src/badge3";
import { PokemonId } from "../../shared/src/pokemon/types";
import { ItemId } from "../../shared/src/items-list";
import { Users } from "./db-types";
import { awardItem, hasPokemon, hasPokemonFuzzy, removePokemon } from "./users.utils";
import * as Pkmn from '../../shared/src/pokemon'

export function genReleaseItems(user: Users.Doc, pokemon: PokemonId[]): ItemId[] {
  const receivedItems: ItemId[] = []
  for (const badgeId of pokemon) {
    const badge = badgeId.startsWith('potw-') ? Badge.fromLegacy(badgeId) : new Badge(badgeId)
    if (!hasPokemonFuzzy(user, badge.toString())) {
      throw new Error(`User does not have Pokémon ${badgeId}`);
    }
    removePokemon(user, badge, 1)
    const item = (() => {
      const datastore = Pkmn.get(badge.toLegacyString())!
      return datastore.release || 'pokeball'
    })()
    if (item) {
      receivedItems.push(item)
      awardItem(user, item)
    }
  }
  return receivedItems
}

export function v2Release(user: Users.Doc, pokemon: PokemonId, count: number): ItemId[] {
  const receivedItems: ItemId[] = []
  if (!hasPokemon(user, pokemon)) {
    throw new Error(`User does not have ${count} Pokémon ${pokemon}`);
  }
  const badge = new Badge(pokemon)
  if (badge.defaultTags?.includes('FAVORITE')) {
    throw new Error(`Cannot release favorite ${pokemon}`)
  }
  removePokemon(user, new Badge(pokemon), count)
  const item = (() => {
    const datastore = Pkmn.get(badge.toLegacyString())!
    return datastore.release || 'pokeball'
  })()
  if (item) {
    receivedItems.push(...Array(count).fill(item))
    awardItem(user, item, count)
  }
  return receivedItems
}
