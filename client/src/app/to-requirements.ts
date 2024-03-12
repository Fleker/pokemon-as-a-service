import { TeamsBadge } from "../../../shared/src/badge2"
import { Badge } from "../../../shared/src/badge3"
import { Requirements } from "../../../shared/src/legendary-quests"
import { Globe } from "../../../shared/src/locations-list"
import { PokemonId } from "../../../shared/src/pokemon/types"
import { myPokemon } from "../../../shared/src/badge-inflate"
import { Users } from "../../../shared/src/server-types"
import { FirebaseService } from "./service/firebase.service"
import { LocationService } from "./service/location.service"

export default async function getQuestArgs(user: Users.Doc, locations: LocationService, firebase: FirebaseService) {
  const {lastPokeball} = user
  const userJoin = (() => {
    if (lastPokeball['toMillis']) {
      return lastPokeball['toMillis']()
    }
    return lastPokeball
  })()
  let location = {...Globe[user.location]}
  const loc = await locations.getLocation(user.location)
  location = {...location, ...loc}

  const pokemonKeys = [...myPokemon(user.pokemon)]
    .filter(([, v]) => v > 0).map(([k]) => k) as PokemonId[]
  const pokemonBadges = [...myPokemon(user.pokemon)]
    .filter(([, v]) => v > 0)
    .map(([k, v]) => [new Badge(k), v]) as [Badge, number][]
  const teamsBadges = pokemonBadges
    .map(([k, v]) => [new TeamsBadge(k.toLegacyString()), v]) as [TeamsBadge, number][]
  const badgeKeys = teamsBadges.map(([k]) => k.toString())
  const questArgs: Requirements = {
    battleStadiumRecord: user.battleStadiumRecord,
    teamsBadges,
    badgeKeys,
    pokemonBadges,
    pokemonKeys,
    pokemon: user!.pokemon,
    hiddenItemsFound: user!.hiddenItemsFound,
    id: firebase.getUid(),
    items: user!.items,
    location,
    raidRecord: user.raidRecord,
    researchCompleted: user.researchCompleted,
    userJoinedDate: userJoin,
    berryGrown: user.berryGrown,
    totalTrades: (user.trainersTraded ?? 0) + (user.gtsTraded ?? 0),
    pokedex: user.pokedex!,
    eggsLaid: user.eggsLaid,
    moveTutors: user.moveTutors,
    friendSafari: user.friendSafari,
    itemsCrafted: user.itemsCrafted ?? 0,
    voyagesCompleted: user.voyagesCompleted ?? 0,
    evolutions: user.evolutionCount ?? 0,
    forms: user.formChangeCount ?? 0,
    restorations: user.restorationCount ?? 0,
  }
  return questArgs
}