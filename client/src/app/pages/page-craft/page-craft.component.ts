import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseService } from 'src/app/service/firebase.service';
import { LocationService } from 'src/app/service/location.service';
import getQuestArgs from 'src/app/to-requirements';
import { Recipe, Recipes, RecipeId, RecipeCategory } from '../../../../../shared/src/crafting';
import { Requirements } from '../../../../../shared/src/legendary-quests';
import { Users, F } from '../../../../../shared/src/server-types';
import { ItemId, ITEMS } from '../../../../../shared/src/items-list';
import { ObjectEntries } from '../../../../../shared/src/object-entries';
import { EngagementService } from 'src/app/engagement.service';
import { SpriteCraftingComponent } from 'src/app/ui/sprite-crafting/sprite-crafting.component';

interface RecipeUI extends Recipe {
  key: string
  label: string
  description: string
  reason: string | boolean
  hasItems: boolean
}

@Component({
  selector: 'page-craft',
  templateUrl: './page-craft.component.html',
  styleUrls: ['./page-craft.component.css']
})
export class PageCraftComponent implements OnInit, OnDestroy {
  @ViewChild('crafting') crafting?: ElementRef
  @ViewChild('animation') animation?: ElementRef
  @ViewChild('animationcraft') animationCrafting?: SpriteCraftingComponent
  @ViewChild('error') error?: ElementRef
  craftTotal = 0
  user: Users.Doc
  processedRecipes = false
  craftItems: [string, number][] = []
  availableRecipes: Record<RecipeCategory, RecipeUI[]> = {
    crafting: [], tmmachine: [], bait: [],
  }
  unavailableRecipes: Record<RecipeCategory, RecipeUI[]> = {
    crafting: [], tmmachine: [], bait: [],
  }
  selectedKey?: RecipeId
  selected?: RecipeUI
  reasons: Partial<Record<ItemId, string>> = {}
  errorMsg: string = ''
  craftCount: number = 1
  exec = {
    craft: false,
  }
  firebaseListener: any

  get next() {
    return this.engager.isNextUi
  }

  get canCook() {
    return this.user.items.campinggear > 0
  }

  constructor(
    private firebase: FirebaseService,
    private locations: LocationService,
    private snackbar: MatSnackBar,
    private engager: EngagementService,
  ) {}

  getInventoryCount(item: string) {
    if (!this.user) return -1
    return this.user.items[item as ItemId] ?? 0
  }

  ineligible() {
    if (!this.selected) return true
    for (const [key, value] of Object.entries(this.selected?.input)) {
      if (!this.user.items[key]) {
        return true
      }
      if (value * this.craftCount > this.user.items[key]) {
        return true
      }
    }
    return false
  }

  isAvailable(recipe: Recipe, args: Requirements) {
    for (const hint of recipe.unlocked.hints) {
      if (!hint.completed(args)) return hint.msg
    }
    return true
  }

  ngOnInit(): void {
    this.firebaseListener = this.firebase.subscribeUser(async user => {
      if (!user) return
      this.user = user
      this.craftTotal = this.user.itemsCrafted

      const args = await getQuestArgs(this.user, this.locations, this.firebase)
      this.craftItems = ObjectEntries(this.user.items).filter(([k, n]) => ITEMS[k]?.category === 'material') as [string, number][]
      this.availableRecipes = {crafting: [], tmmachine: [], bait: []}
      this.unavailableRecipes = {crafting: [], tmmachine: [], bait: []}
      Object.entries(Recipes).forEach(([key, value]) => {
        const hasItems = (() => {
          const inputs = Object.entries(value.input)
          for (const i of inputs) {
            if (this.user.items[i[0]] === undefined || this.user.items[i[0]] < i[1]) {
              return false
            }
          }
          return true
        })()
        const available = this.isAvailable(value, args)
        const uiValue: RecipeUI = {
          ...value,
          key,
          label: ITEMS[value.output].label,
          description: ITEMS[value.output].description,
          reason: available,
          hasItems,
        }
        if (available === true) {
          this.availableRecipes[value.category].push(uiValue)
        } else {
          this.unavailableRecipes[value.category].push(uiValue)
          this.reasons[value.output] = available // Returns unlock msg 
        }
      })
      this.processedRecipes = true
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  openCraftingDialog(item: ItemId) {
    for (const [category, recipes] of Object.entries(this.availableRecipes)) {
      for (const recipe of recipes) {
        if (recipe.output === item) {
          this.selectedKey = recipe.key as RecipeId
          this.selected = recipe
          this.crafting.nativeElement.showModal()
          return
        }
      }
    }
    this.snackbar.open(`Cannot find recipe for ${item}`, '', { duration: 5000 })
  }
  
  reportError(item: ItemId) {
    this.errorMsg = this.reasons[item] ?? 'No error found'
    this.error.nativeElement.showModal()
  }

  async craft() {
    this.exec.craft = true
    this.animation.nativeElement.showModal()
    this.animationCrafting.input = Object.keys(this.selected.input) as ItemId[]
    this.animationCrafting.output = this.selected.output
    this.animationCrafting.startCrafting()
    window.requestAnimationFrame(async () => {
      try {
        const res = await this.firebase.exec<F.CraftItem.Req, F.CraftItem.Res>('craft_item', {
          craft: [{
            item: this.selectedKey as RecipeId,
            count: this.craftCount,
          }]
        })
        this.animationCrafting.finishCrafting()
        setTimeout(() => {
          this.snackbar.open(`You have crafted ${this.craftCount} ${this.selected.label}`, '', { duration: 5000 })
          this.close()
          this.firebase.refreshUser()
        }, 1000)
      } catch (e) {
        this.snackbar.open(e, '', { duration: 5000 })
        this.close()
      } finally {
        this.exec.craft = false
      }
    })    
  }

  label(item: string) {
    if (!item) return item
    return ITEMS[item]?.label ?? item
  }

  /** Close all dialogs on this page. */
  close() {
    this.crafting.nativeElement.close()
    this.animation.nativeElement.close()
    this.error.nativeElement.close()
  }
}
