import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageAboutComponent } from './pages/page-about/page-about.component';
import { PageAchievementsComponent } from './pages/page-achievements/page-achievements.component';
import { PageAdminComponent } from './pages/page-admin/page-admin.component';
import { PageBagComponent } from './pages/page-bag/page-bag.component';
import { PageBankComponent } from './pages/page-bank/page-bank.component';
import { PageBattleComponent } from './pages/page-battle/page-battle.component';
import { PageBazaarComponent } from './pages/page-bazaar/page-bazaar.component';
import { PageCraftComponent } from './pages/page-craft/page-craft.component';
import { PageDaycareComponent } from './pages/page-daycare/page-daycare.component';
import { PageDowseComponent } from './pages/page-dowse/page-dowse.component';
import { PageEggsComponent } from './pages/page-eggs/page-eggs.component';
import { PageEncounterComponent } from './pages/page-encounter/page-encounter.component';
import { PageFarmComponent } from './pages/page-farm/page-farm.component';
import { PageGamesComponent } from './pages/page-games/page-games.component';
import { PageGtsComponent } from './pages/page-gts/page-gts.component';
import { PageMartComponent } from './pages/page-mart/page-mart.component';
import { PageMovedeleterComponent } from './pages/page-movedeleter/page-movedeleter.component';
import { PageMovetutorComponent } from './pages/page-movetutor/page-movetutor.component';
import { PagePokedexComponent } from './pages/page-pokedex/page-pokedex.component';
import { PagePokemonComponent } from './pages/page-pokemon/page-pokemon.component';
import { PageQuestsComponent } from './pages/page-quests/page-quests.component';
import { PageRaidComponent } from './pages/page-raid/page-raid.component';
import { PageReleaseComponent } from './pages/page-release/page-release.component';
import { PageResearchComponent } from './pages/page-research/page-research.component';
import { PageSandboxComponent } from './pages/page-sandbox/page-sandbox.component';
import { PageTradeComponent } from './pages/page-trade/page-trade.component';
import { PageTrainerComponent } from './pages/page-trainer/page-trainer.component';
import { PageVoyageComponent } from './pages/page-voyage/page-voyage.component';
import { PageChatbotComponent } from './pages/page-chatbot/page-chatbot.component';
import { PageBattlesimComponent } from './pages/page-battlesim/page-battlesim.component';

const routes: Routes = [
  {path: '', component: PagePokemonComponent},
  {path: 'dowsing', component: PageDowseComponent},
  {path: 'pokemon', children: [
    {path: 'collection', component: PagePokemonComponent},
    {path: 'eggs', component: PageEggsComponent},
    {path: 'bank', component: PageBankComponent},
    {path: 'release', component: PageReleaseComponent},
    {path: 'pokedex', component: PagePokedexComponent},
    {path: 'catch', component: PageEncounterComponent},
    {path: 'deleter', component: PageMovedeleterComponent},
    {path: 'tutor', component: PageMovetutorComponent},
  ]},
  {path: 'items', children: [
    {path: 'bag', component: PageBagComponent},
    {path: 'mart', component: PageMartComponent},
    {path: 'bazaar', component: PageBazaarComponent},
    {path: 'craft', component: PageCraftComponent},
  ]},
  {path: 'multiplayer', children: [
    {path: 'battle', component: PageBattleComponent},
    {path: 'battlesim', component: PageBattlesimComponent},
    {path: 'daycare', component: PageDaycareComponent},
    {path: 'nursery', component: PageDaycareComponent},
    {path: 'gts', component: PageGtsComponent},
    {path: 'trade', component: PageTradeComponent},
    {path: 'raids', component: PageRaidComponent},
    {path: 'voyages', component: PageVoyageComponent},
  ]},
  {path: 'base', children: [
    {path: 'gamecorner', component: PageGamesComponent},
    {path: 'farm', component: PageFarmComponent},
    {path: 'quests', component: PageQuestsComponent},
    {path: 'achievements', component: PageAchievementsComponent},
    {path: 'research', component: PageResearchComponent},
  ]},
  {path: 'profile', children: [
    {path: 'trainer', component: PageTrainerComponent},
  ]},
  {path: 'about', component: PageAboutComponent},
  {path: 'help', component: PageAboutComponent},
  {path: 'admin', component: PageAdminComponent},
  // URL compat
  {path: 'box', component: PagePokemonComponent},
  {path: 'box-release', component: PageReleaseComponent},
  {path: 'pokedex', component: PagePokedexComponent},
  {path: 'bag', component: PageBagComponent},
  {path: 'mart', component: PageMartComponent},
  {path: 'encounters', component: PageEncounterComponent},
  {path: 'gts', component: PageGtsComponent},
  {path: 'lottery', component: PageGamesComponent},
  {path: 'daycare', component: PageDaycareComponent},
  {path: 'battle-stadium', component: PageBattleComponent},
  {path: 'farm', component: PageFarmComponent},
  {path: 'quests', component: PageQuestsComponent},
  {path: 'trainer', component: PageTrainerComponent},
  {path: 'raids', component: PageRaidComponent},
  {path: 'trade', component: PageTradeComponent},
  {path: 'sandbox', component: PageSandboxComponent},
  {path: 'chat', component: PageChatbotComponent},
  // {path: '**'}, // 404
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
