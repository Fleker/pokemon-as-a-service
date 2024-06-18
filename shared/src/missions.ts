/**
 * @fileoverview
 * - Quests
 * - Dex Charm quests
 * - Research
 * = Try again in X minutes
 */
import * as Q from './quests'
import * as L from './legendary-quests'

export const questOrder = [
  Q.SQUIRTBOTTLE,
  Q.BERRYPOUCH,
  L.MEWTWO,
  L.MEW,
  Q.POKEDOLL,
  // Q.MAGNETTRAIN_PASS,
  Q.CLEAR_BELL,
  Q.OVALCHARM,
  Q.UNOWNREPORT,
  L.GYARADOS,
  L.LUGIA,
  L.HO_OH,
  L.GS_BALL,
  Q.DEVONSCOPE,
  Q.SWARMS_UNLOCK,
  L.GROUDON,
  L.KYOGRE,
  L.REGIROCK,
  L.REGICE,
  L.REGISTEEL,
  L.RAYQUAZA,
  L.JIRACHI,
  L.DEOXYS,
  L.DEOXYS_ATK,
  L.DEOXYS_DEF,
  L.DEOXYS_SPE,
  Q.BANK_UNLOCK,
  Q.EXPLORER_KIT,
  Q.TROPHY_GARDEN,
  Q.SPIRITOMB,
  L.CRESSELIA,
  L.UXIE,
  L.AZELF,
  L.DIALGA,
  L.PALKIA,
  L.GIRANTINA,
  L.HEATRAN,
  L.REGIGIGAS,
  L.DARKRAI,
  L.MANAPHY,
  L.SHAYMIN,
  L.ARCEUS,
  Q.LEGENDARY_RAIDS,
  Q.FRIENDSAFARI,
  Q.ZYGARDECUBE,
  Q.SOOTSACK,
  Q.GOGGLES,
  L.COBALION,
  L.TERRAKION,
  L.VIRIZION,
  L.KYUREM,
  L.LANDORUS,
  L.VICTINI,
  L.RESHIRAM,
  L.ZEKROM,
  L.KYUREM,
  L.KYUREM_BLACK,
  L.KYUREM_WHITE,
  L.MELOLETTA,
  L.GENESECT,
  L.THERIAN,
  Q.COLRESSMCHN,
  L.VIVILLON,
  L.XERNEAS,
  L.YVELTAL,
  L.ZYGARDECELL,
  L.HOOPA,
  L.PRISONBOTTLE,
  L.VOLCANION,
  L.DIANCIE,
  Q.ZRING,
  L.NIHILEGO,
  L.BUZZWOLE,
  L.PHERAMOSA,
  L.XURKITREE,
  L.CELESTEELA,
  L.KARTANA,
  L.GUZZLORD,
  L.TYPE_NULL,
  Q.ADRENALINE,
  Q.FORAGEBAG,
  L.TAPU_KOKO,
  L.TAPU_LELE,
  L.TAPU_BULU,
  L.TAPU_FINI,
  L.SUN_FLUTE,
  L.MOON_FLUTE,
  L.NECROZMA,
  Q.ITEMFINDER,
  L.STAKATAKA,
  L.BLACEPHALON,
  L.POIPOLE,
  L.MAGEARNA,
  L.NECROZMA_Z,
  L.NECROZMA_SOLGALEO,
  L.NECROZMA_LUNALA,
  L.ZERAORA,
  L.MARSHADOW,
  Q.MELTANBOX,
  L.MAGEARNA_POKEBALL,
  Q.DYNAMAXBAND,
  Q.CAMPINGGEAR,
  Q.ROTOMBIKE,
  L.ZACIAN,
  L.ZAMAZENTA,
  L.ETERNATUS,
  L.KUBFU,
  L.URSHIFUWATER,
  L.URSHIFUDARK,
  L.ZARUDE,
  L.REGIELEKI,
  L.REGIDRAGO,
  L.GLASTRIER,
  L.SPECTRIER,
  L.CALYREX,
  L.PLAPONY,
  L.ENAMORUS,
  L.LEGENDSPLATE,
  Q.TERAORB,
  Q.SCARLETBOOK,
  Q.VIOLETBOOK,
  L.WOCHIEN,
  L.CHIENPAO,
  L.TINGLU,
  L.CHIYU,
  Q.GLIMMERINGCHARM,
]

export const pokedexOrder = [
  Q.CATCH_CHARM_RBY,
  Q.CATCH_CHARM_GSC,
  Q.CATCH_CHARM_RSE,
  Q.CATCH_CHARM_DPPT,
  Q.CATCH_CHARM_BW,
  Q.CATCH_CHARM_XY,
  Q.CATCH_CHARM_SM,
  Q.CATCH_CHARM_SWSH,
  Q.CATCH_CHARM_SV,
]
