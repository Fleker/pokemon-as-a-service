import { ElementRef, HostBinding, Renderer2, ViewChild } from '@angular/core';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FirebaseService } from '../service/firebase.service';
const tips = [
  "Tips may show up here.",
  "The Game Corner changes every day. Keep trying.",
  "Some Pokémon are only available at night.",
  "Your Pokédex can keep track of which Pokémon you still need to catch.",
  "You can change the theme to Dark Theme in the Trainer Card.",
  "As you complete more research tasks, your Research Level increases. This will give you access to more research.",
  "The prizes you win from the Battle Stadium depend on which cup you select.",
  "Travel around the world! Pokémon may only appear in specific locations.",
  "Want to try the latest features? Check out Feature Flags in your Trainer Card.",
  "Different Pokémon appear if you use different PokéBalls. Try to collect a bunch of them.",
  "You can convert a Pokémon by visiting the Move Tutor.",
  "Have an idea for the game? Create a feature request in the bug tracker or post in the Chat.",
  "If you send a breeding club Pokémon in the Day Care, there is a 4x chance of it being shiny.",
  "Just starting out? Try out the Beginner's Cup to compete with other newbies.",
  "You get raid passes every day. Keep joining them!",
  "Some Pokémon may be holding items when they are caught.",
  "Want your Pokémon to be friendlier? Pomeg and Kelpsy berries can help.",
  "Breeding two Pokémon? If their movesets overlap the baby can have novel moves.",
  "Use the Technical Record Defog to reset many Pokémon forms.",
  'Swords Dance and Iron Defense! Two great TRs that Aegislash loves',
  "Don't play at all hours of the night! Change locations, where you'll cross over to other time zones.",
  "Not every feature is available right away. New modes will unlock as you keep playing.",
  "You can play this game on your phone in any orientation.",
  "Have a Pancham? Try teaching it a Dark-type move.",
  "The Unown Report shows a riddle on where Unown may be encountered today. Their form changes daily!",
  "Spewpa can evolve into Pokémon of different forms depending on where it evolves. Try a bunch of locations!",
  "Eevee can evolve into many different Pokémon. If you teach it a Fairy-type move, something unusual will happen.",
  'The Quests page shows a variety of challenges. Click on grayed-out quests to see what you need to do next.',
  'Getting too many notifications? You can clear notification tokens in your Trainer Card.',
  "Look at the catching charms. Once you receive one, you will find more things you can do.",
  'The Pokémon you send on a voyage will have an effect on what you find. A stronger Pokémon can lead to greater rewards.',
  'The location dialog will show your current time of day wherever you are. This affects your actions in the game.',
  'Finding souvenirs being held by a caught Pokémon? Try traveling around to find the next.',
  'Are you in the Pokémon Misc chat? That is a good way to meet other trainers.',
  'Crafting PokéBlocks? Pikachu love them.',
  'Souvenir collections will grow dim when catching many Pokémon in one location. Keep traveling to enable them again.',
  'Want to build up your Friend Safari? Try privately trading with different users.',
  'Minior can be caught in hard shells. Once the Shells are Smashed, you may find something inside.',
  'Minior can be in a rainbow assortment of cores. When you want them to Shield Up, try ensuring their Defense is Iron-clad.',
  'Wishiwashi can be weak in its base form, but in a Team of Double, Triple, or More, it becomes stronger.',
  'The Strange Souvenir is an item that can be found in the Alola region. It may have odd effects on some Pokémon.',
  'Rockruff will evolve at any time of the day. However, this time does determine its final form.',
  'When Silvally heads into battle with memories, its type changes! This affects its signature move.',
  'Crabrawler gains more power from the snow. Only one snowy location a day will have this effect.',
  'When Pawniwards or Bisharps are defeated in a raid, they may drop a particular item.',
]
@Component({
  selector: 'app-splashscreen',
  templateUrl: './splashscreen.component.html',
  styleUrls: ['./splashscreen.component.css']
})
export class SplashscreenComponent implements OnInit, AfterViewInit {
  @HostBinding('style.opacity') opacitySplash = '1'
  @HostBinding('style.display') showSplash = 'block'
  @ViewChild('droppings') droppings: ElementRef<HTMLImageElement>
  appVersion: string = 'v3.9.7'
  uid?: string
  needLogin: boolean = false
  selectedTip: string = '...'
  isLoaded = false
  constructor(private firebase: FirebaseService, private renderer: Renderer2) { }
  ngOnInit(): void {
    this.selectedTip = tips[Math.floor(Math.random() * tips.length)]
  }
  ngAfterViewInit() {
    this.firebase.subscribeAuth().subscribe(res => {
      this.needLogin = !res || !res.user
      // this.needLogin = true
      this.uid = res?.user?.uid
      console.log(`Need login: ${this.needLogin}`)
      if (res.user) {
        setTimeout(() => {
          this.opacitySplash = '0'
          setTimeout(() => {
            this.showSplash = 'none'
            this.isLoaded = true
          }, 500)
        }, 500)
      }
    })
  }
  async login() {
    // Login in the user
    await this.firebase.login()
  }
}