const functions = require('firebase-functions');
const admin = require('firebase-admin');
// Initialize Firebase
admin.initializeApp(functions.config().firebase);
const db = admin.firestore()
const settings = {timestampsInSnapshots: true};
db.settings(settings);

import * as admins from './admin'
// Modifies `items` via txn
export const admin_dispense_cron = admins.admin_dispense_cron
// Modifies `hiddenItemsFound` via txn
export const admin_recycle_legendaries_cron = admins.admin_recycle_legendaries_cron
// Read-only
export const admin_forbes_cron = admins.admin_forbes_cron
// Modifies to `hiddenItemsFound`
export const admin_hidden_id_cleanup = admins.admin_hidden_id_cleanup
export const about_info = admins.about_info
export const admin_notify_cron = admins.admin_notify_cron

const battleFrontier = require('./battle-frontier')
exports.battle_box = battleFrontier.battle_box
exports.battle_box_history = battleFrontier.battle_box_history
exports.battle_box_leaderboard = battleFrontier.battle_box_leaderboard
// Read-only
exports.battle_box_leaderboard_cron = battleFrontier.battle_box_leaderboard_cron

const battleStadium = require('./battle-frontier-2')
exports.battle_stadium = battleStadium.battle_stadium
exports.battle_stadium_history = battleStadium.battle_stadium_history
exports.battle_leaderboards = battleStadium.battle_leaderboards
// Modifies `items` in txn
exports.battle_stadium_leaderboard_cron = battleStadium.battle_stadium_leaderboard_cron

import * as dowsingMachine from './dowsing-machine'
export const dowse = dowsingMachine.dowse
export const quest_donate = dowsingMachine.quest_donate

const gameCorner = require('./game-corner')
exports.draw_lotto = gameCorner.draw_lotto
exports.draw_lotto_debug = gameCorner.draw_lotto_debug
exports.radio_quiz = gameCorner.radio_quiz

const gts = require('./gts')
exports.gts_query = gts.gts_query
exports.gts_history = gts.gts_history
exports.gts_upload = gts.gts_upload
exports.gts_trade = gts.gts_trade
// Modifies `gts/_cache`
exports.gts_prune_stale_cron = gts.gts_prune_stale_cron
exports.gts_cancel = gts.gts_cancel
// Modifies `gts/_cache`
exports.gts_virtual_cron = gts.gts_virtual_cron

import * as items from './items'
export const use_item = items.use_item
export const move_tutor = items.move_tutor
export const move_deleter = items.move_deleter
export const use_tmtr = items.use_tmtr
export const craft_item = items.craft_item
export const train_pokemon = items.train_pokemon

const location = require('./location')
// Modifies `location` doc
exports.location_cron = location.location_cron
exports.location_list = location.location_list

const mart = require('./mart')
exports.exchange = mart.exchange
exports.exchange_bazaar = mart.exchange_bazaar
exports.exchange_inverse = mart.exchange_inverse

const pokemon = require('./collection')
export const hatch = pokemon.hatch
exports.throw = pokemon.throw
export const release = pokemon.release
export const swarm_vote = pokemon.swarm_vote
export const swarm_notify = pokemon.swarm_notify
export const tag = pokemon.tag
export const tag_manage = pokemon.tag_manage

const daycare = require('./day-care')
exports.daycare = daycare.daycare

import * as users from './users'
exports.create_user_auto = users.create_user_auto
exports.settings = users.settings
exports.npc = users.npc
exports.user_dowsing = users.user_dowsing
exports.user_pokedex = users.user_pokedex
exports.user_adventurelog_clear = users.user_adventurelog_clear
exports.user_location = users.user_location
export const notifications_clear = users.notifications_clear
export const fcm_manage = users.fcm_manage
export const user_history = users.user_history
export const user_sync_ldap = users.user_sync_ldap

const raid = require('./battle-raid')
exports.raid_create = raid.raid_create
exports.raid_select = raid.raid_select
exports.raid_start = raid.raid_start
exports.raid_claim = raid.raid_claim
exports.raid_wish = raid.raid_wish
exports.raid_dispense = raid.raid_dispense
exports.raid_publicize = raid.raid_publicize
exports.raid_list = raid.raid_list
exports.raid_history = raid.raid_history
exports.raid_public_remove = raid.raid_public_remove
exports.raid_tank = raid.raid_tank
exports.raid_active_clear = raid.raid_active_clear

import * as research from './research-quests'
export const research_claim = research.research_claim
export const research_get = research.research_get

import * as trade from './trade'
export const trade_room_create = trade.trade_room_create
export const trade_offer = trade.trade_offer
export const trade_close = trade.trade_close
export const trade_room_join = trade.trade_room_join
export const trade_confirm = trade.trade_confirm

import * as farm from './berry-farm'
export const berry_plot = farm.berry_plot
export const berry_plant = farm.berry_plant
export const berry_harvest = farm.berry_harvest
export const berry_fertilize = farm.berry_fertilize

import * as coldstorage from './cold-storage'
export const bank_list = coldstorage.bank_list
export const bank_deposit = coldstorage.bank_deposit
export const bank_withdraw = coldstorage.bank_withdraw

import * as voyages from './battle-voyages'
export const voyage_create = voyages.voyage_create
export const voyage_select = voyages.voyage_select
export const voyage_path = voyages.voyage_path
export const voyage_start2 = voyages.voyage_start
export const voyage_completion_cron = voyages.voyage_completion_cron
export const voyage_claim2 = voyages.voyage_claim
export const voyage_publicize = voyages.voyage_publicize

import * as wonderTrade from './wonder-trade'
export const wonder_trade_upload = wonderTrade.wonder_trade_upload
export const wonder_trade_cron = wonderTrade.wonder_trade_cron
