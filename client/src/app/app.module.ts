import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {MatBadgeModule} from '@angular/material/badge'
import {MatIconModule} from '@angular/material/icon';
import {MatSidenavModule} from '@angular/material/sidenav'
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatCardModule} from '@angular/material/card';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTabsModule} from '@angular/material/tabs'
import {MatSlideToggleModule} from '@angular/material/slide-toggle'
import {MatPaginatorModule} from '@angular/material/paginator'
import {MatGridListModule} from '@angular/material/grid-list'
import {MatStepperModule} from '@angular/material/stepper'
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import {MatChipsModule} from '@angular/material/chips'
import {MatAutocompleteModule} from '@angular/material/autocomplete'
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { ServiceWorkerModule } from '@angular/service-worker';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatMenuModule} from '@angular/material/menu';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { environment } from '../environments/environment';

import { CelDialogComponent } from './dialogs/cel-dialog/cel-dialog.component'
import { MovedexComponent } from './dialogs/movedex/movedex.component';
import { DialogItemsComponent } from './dialogs/picker-items/picker-items.component';
import { PokedexDialog } from './dialogs/pokedex/pokedex.component';
import { PokemonDialogComponent } from './dialogs/pokemon-dialog/pokemon-dialog.component';
import { TagComponent } from './dialogs/tag/tag.component';

import { PickerPokemonComponent } from './forms/picker-pokemon/picker-pokemon.component';

import { CollapsibleCardComponent } from './layout/collapsible-card/collapsible-card.component';

import { PageAboutComponent } from './pages/page-about/page-about.component';
import { PageAchievementsComponent } from './pages/page-achievements/page-achievements.component';
import { PageAdminComponent } from './pages/page-admin/page-admin.component';
import { PageBazaarComponent } from './pages/page-bazaar/page-bazaar.component';
import { PageBagComponent } from './pages/page-bag/page-bag.component';
import { PageBankComponent } from './pages/page-bank/page-bank.component';
import { PageBattleComponent } from './pages/page-battle/page-battle.component';
import { PageBattlesimComponent } from './pages/page-battlesim/page-battlesim.component';
import { PageChatbotComponent } from './pages/page-chatbot/page-chatbot.component';
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
import { PageWondertradeComponent } from './pages/page-wondertrade/page-wondertrade.component';

import { ScaffoldingComponent } from './scaffolding/scaffolding.component';
import { SplashscreenComponent } from './splashscreen/splashscreen.component';

import { BattlePlayersComponent } from './ui/battle-players/battle-players.component';
import { BattleRaidComponent } from './ui/battle-raid/battle-raid.component';
import { BinocularsComponent } from './ui/binoculars/binoculars.component';
import { ButtonCurrencyComponent } from './ui/button-currency/button-currency.component';
import { ButtonEventsComponent } from './ui/button-events/button-events.component';
import { ButtonLocationComponent } from './ui/button-location/button-location.component';
import { ButtonNotificationsComponent } from './ui/button-notifications/button-notifications.component';
import { ButtonTimersComponent } from './ui/button-timers/button-timers.component';
import { ConstellationComponent } from './ui/constellation/constellation.component';
import { EvolutionComponent } from './ui/evolution/evolution.component';
import { FriendSafariComponent } from './ui/friendsafari/friendsafari.component';
import { GlobalQuestDonationComponent } from './ui/global-quest-donation/global-quest-donation.component';
import { GtsTradeComponent } from './ui/gts-trade/gts-trade.component';
import { HpBarComponent } from './ui/hp-bar/hp-bar.component';
import { InfoCardComponent } from './ui/info-card/info-card.component';
import { ItemsDatalistComponent } from './ui/items-datalist/items-datalist.component';
import { LottoDrawComponent } from './ui/lotto-draw/lotto-draw.component';
import { MartButtonComponent } from './ui/mart-button/mart-button.component';
import { MartSectionComponent } from './ui/mart-section/mart-section.component';
import { MatchLogComponent } from './ui/match-log/match-log.component';
import { MoveSpanComponent } from './ui/move-span/move-span.component';
import { PokearthComponent } from './ui/pokearth/pokearth.component';
import { PokemonDatalistComponent } from './ui/pokemon-datalist/pokemon-datalist.component';
import { PrideFlagComponent } from './ui/pride-flag/pride-flag.component'
import { QuestMedalComponent } from './ui/quest-medal/quest-medal.component';
import { RaidCardComponent } from './ui/raid-card/raid-card.component';
import { ResearchTaskComponent } from './ui/research-task/research-task.component';
import { SpriteCraftingComponent } from './ui/sprite-crafting/sprite-crafting.component';
import { SpriteItemComponent } from './ui/sprite-item/sprite-item.component';
import { SpritePokemonComponent } from './ui/sprite-pokemon/sprite-pokemon.component';
import { StatsHexagonComponent } from './ui/stats-hexagon/stats-hexagon.component';
import { TradeCardComponent } from './ui/trade-card/trade-card.component';
import { TypeBoxComponent } from './ui/type-box/type-box.component';
import { TypedDialogHeaderComponent } from './ui/typed-dialog-header/typed-dialog-header.component';
import { VoyageHeaderComponent } from './ui/voyage-header/voyage-header.component';
import { VoyagesMeterComponent } from './ui/voyages-meter/voyages-meter.component';

@NgModule({
  declarations: [
    AppComponent,
    PokedexDialog,
    PrideFlagComponent,
    VoyagesMeterComponent,
    VoyageHeaderComponent,
    TypeBoxComponent,
    PokearthComponent,
    BinocularsComponent,
    SpriteCraftingComponent,
    InfoCardComponent,
    TypedDialogHeaderComponent,
    ConstellationComponent,
    GtsTradeComponent,
    FriendSafariComponent,
    TradeCardComponent,
    RaidCardComponent,
    BattlePlayersComponent,
    BattleRaidComponent,
    EvolutionComponent,
    ButtonEventsComponent,
    ButtonCurrencyComponent,
    ButtonTimersComponent,
    ResearchTaskComponent,
    MatchLogComponent,
    ButtonNotificationsComponent,
    ButtonLocationComponent,
    PokemonDatalistComponent,
    ItemsDatalistComponent,
    HpBarComponent,
    QuestMedalComponent,
    GlobalQuestDonationComponent,
    MartSectionComponent,
    MartButtonComponent,
    SpriteItemComponent,
    StatsHexagonComponent,
    MoveSpanComponent,
    SpritePokemonComponent,
    CollapsibleCardComponent,
    MovedexComponent,
    TagComponent,
    CelDialogComponent,
    PokemonDialogComponent,
    DialogItemsComponent,
    PickerPokemonComponent,
    ScaffoldingComponent,
    SplashscreenComponent,
    PageAboutComponent,
    PageAchievementsComponent,
    PageAdminComponent,
    PageBazaarComponent,
    PageBagComponent,
    PageBankComponent,
    PageBattleComponent,
    PageBattlesimComponent,
    PageChatbotComponent,
    PageCraftComponent,
    PageDaycareComponent,
    PageDowseComponent,
    PageEggsComponent,
    PageEncounterComponent,
    PageFarmComponent,
    PageGamesComponent,
    PageGtsComponent,
    PageMartComponent,
    PageMovedeleterComponent,
    PageMovetutorComponent,
    PagePokedexComponent,
    PagePokemonComponent,
    PageQuestsComponent,
    PageRaidComponent,
    PageReleaseComponent,
    PageResearchComponent,
    PageSandboxComponent,
    PageTradeComponent,
    PageTrainerComponent,
    PageVoyageComponent,
    LottoDrawComponent,
    PageWondertradeComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    MatAutocompleteModule,
    MatBadgeModule,
    MatCardModule,
    MatChipsModule,
    MatGridListModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatStepperModule,
    MatTabsModule,
    MatToolbarModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatMenuModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
  providers:  [
    {provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {hasBackdrop: false}}
 ],
  bootstrap: [AppComponent]
})
export class AppModule { }
