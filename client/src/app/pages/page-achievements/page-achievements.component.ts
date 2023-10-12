import { Component } from '@angular/core';
import * as Q from '../../../../../shared/src/quests'

@Component({
  selector: 'app-page-achievements',
  templateUrl: './page-achievements.component.html',
  styleUrls: ['./page-achievements.component.css']
})
export class PageAchievementsComponent {
  pokedexAchievements: Q.Medal[] = Q.POKEDEX_ACHIEVEMENTS
  onepAchievements: Q.Medal[] = Q.ONEP_ACHIEVEMENTS
  catchTypeAchievements: Q.Medal[] = Q.CATCH_TYPE_ACHIEVEMENTS
  communityAchievements: Q.Medal[] = Q.COMMUNITY_ACHIEVEMENTS
}
