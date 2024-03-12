# An orderly deployment script
firebase deploy --only hosting
firebase deploy --only functions:admin_stats_cron,functions:admin_dispense_cron,functions:admin_recycle_legendaries_cron,functions:admin_forbes_cron,functions:admin_hidden_id_cleanup,functions:about_info,functions:admin_notify_cron
# Skip Battle Box
firebase deploy --only functions:battle_stadium,functions:battle_stadium_history,functions:battle_stadium_leaderboards,functions:battle_stadium_leaderboard_cron
firebase deploy --only functions:dowse,functions:quest_donate
firebase deploy --only functions:draw_lotto,functions:draw_lotto_debug,functions:radio_quiz
firebase deploy --only functions:gts_query,functions:gts_history,functions:gts_upload,functions:gts_trade,functions:gts_prune_stale_cron,functions:gts_cancel,functions:gts_virtual_cron
firebase deploy --only functions:use_item,functions:move_tutor,functions:move_deleter,functions:use_tmtr,functions:craft_item
firebase deploy --only functions:location_cron,functions:location_list
firebase deploy --only functions:exchange,functions:exchange_bazaar,functions:exchange_inverse
firebase deploy --only functions:hatch,functions:throw,functions:release,functions:swarm_vote,functions:swarm_notify,functions:tag,functions:tag_manage
firebase deploy --only functions:daycare,functions:create_user_auto,functions:settings,functions:npc,functions:user_dowsing,functions:user_pokedex,functions:user_adventurelog_clear,functions:user_location,functions:notifications_clear,functions:fcm_manage,functions:user_history,functions:user_sync_ldap
firebase deploy --only functions:raid_create,functions:raid_select,functions:raid_start,functions:raid_claim,functions:raid_wish,functions:raid_dispense,functions:raid_publicize,functions:raid_list,functions:raid_history,functions:raid_public_remove,functions:raid_tank,functions:raid_active_clear
firebase deploy --only functions:research_claim,functions:research_get
firebase deploy --only functions:trade_room_create,functions:trade_offer,functions:trade_close,functions:trade_room_join,functions:trade_confirm
firebase deploy --only functions:berry_plot,functions:berry_plant,functions:berry_harvest,functions:berry_fertilize
firebase deploy --only functions:bank_list,functions:bank_deposit,functions:bank_withdraw
firebase deploy --only functions:voyage_create,functions:voyage_select,functions:voyage_path,functions:voyage_start2,functions:voyage_completion_cron,functions:voyage_claim2,functions:voyage_publicize
firebase deploy --only functions:wonder_trade_upload,functions:wonder_trade_cron
firebase deploy --only functions:admin_unown_cron,functions:admin_sync_cron
firebase deploy --only functions:chatbot2