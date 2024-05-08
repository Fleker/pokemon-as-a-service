import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogItemsComponent } from 'src/app/dialogs/picker-items/picker-items.component';
import { PokemonDialogComponent } from 'src/app/dialogs/pokemon-dialog/pokemon-dialog.component';
import { FirebaseService } from 'src/app/service/firebase.service';
import { Badge, MATCH_GTS } from '../../../../../shared/src/badge3';
import { inflate, TPokemon } from '../../../../../shared/src/badge-inflate';
import { BadgeId, PokemonForm, pokemonForms, PokemonGender, PokemonId } from '../../../../../shared/src/pokemon/types';
import { ITEMS, ItemId } from '../../../../../shared/src/items-list';
import { User } from 'firebase/auth';
import { GtsTradeComponent } from 'src/app/ui/gts-trade/gts-trade.component';
import { TeamsBadge } from '../../../../../shared/src/badge2';

interface GtsEntry {
  heldItem: ItemId
  id: string
  legacySpeciesId: BadgeId
  lookingFor: string
  lookingForId: PokemonId
  lookingForItem?: ItemId
  noteworthy?: string
  species: string
  speciesId: PokemonId
  user: string
  heldItemLabel?: string
  lookingForItemLabel?: string
}

interface GtsListing {
  speciesId: PokemonId,
  lookingForId: PokemonId
  heldItem?: ItemId
  lookingForItem?: ItemId
}

interface Search {
  id?: string
  shiny?: boolean
  gender?: PokemonGender
  form?: PokemonForm
  variant?: number | ''
  item?: string
}

interface Filters {
  offers?: string
  seeking?: string
  regex?: string
  seekingYouHave: boolean
  seekingDuplicates: boolean
  offeringNoHave: boolean
  holdingItem: boolean
  tradeEvo: boolean
  itemYouHave: boolean
}

@Component({
  selector: 'app-page-gts',
  templateUrl: './page-gts.component.html',
  styleUrls: ['./page-gts.component.css']
})
export class PageGtsComponent implements OnInit, OnDestroy {
  @ViewChild('items') items: DialogItemsComponent
  @ViewChild('pokemon') pokemon: PokemonDialogComponent
  @ViewChild('gtsdialog') gtsDialog: ElementRef
  @ViewChild('gtstrade') gtsSprites: GtsTradeComponent
  private userPokemon?: TPokemon
  private userItems?: any
  MAX_USER_TRADES = 8
  availablePokemonFormList = pokemonForms
  myListings: GtsEntry[] = []
  publicListings: GtsEntry[] = []
  filterListings: GtsEntry[] = []
  search: Search = {}
  filter: Filters = {
    holdingItem: false,
    tradeEvo: false,
    seekingDuplicates: false,
    offeringNoHave: false,
    seekingYouHave: true,
    itemYouHave: true,
  }
  exec = {
    /** Represents every cancel together. Kinda inconvenient. */
    cancel: false,
    postListing: false,
    loadListings: false,
  }
  gtsLeaderboard = {
    simplePokemonTrades: [],
    simplePokemonOffers: [],
  }
  flagPickerPro = false
  pkmn: PokemonId[] = []
  firebaseListener: any

  get count() {
    return this.filterListings.length
  }

  get cols() {
    return Math.floor(window.innerWidth / 300)
  }

  get customListing(): GtsEntry | undefined {
    if (!this.search.id) return undefined
    if (this.pokemon._selection.length === 0) return undefined
    // Merge all form fields together
    const lookingForPokemon = Badge.fromLegacy(this.search.id)
    try {
      lookingForPokemon.personality.form = this.search.form
    } catch (e) {
      window.requestAnimationFrame(() => {
        this.snackbar.open(`Form ${this.search.form} is invalid`, '', {
          duration: 3000,
        })
        this.search.form = undefined
      })
    }
    lookingForPokemon.personality. gender = this.search.gender
    if (lookingForPokemon.personality.gender === '') {
      lookingForPokemon.personality.gender = undefined
    }
    if (this.search.variant !== '') {
      lookingForPokemon.personality.variant = this.search.variant
    }
    lookingForPokemon.personality.shiny = this.search.shiny
    // Update our variable
    const lookingForPokemonId = lookingForPokemon.toString()
    const searchId = this.pokemon._selection[0].species
    const heldItem = this.items._selection[0]?.item ?? undefined
    // Send to GTS
    const listing: GtsEntry = {
      species: new Badge(searchId).toLabel(),
      speciesId: searchId,
      lookingFor: lookingForPokemon.toLabel(),
      lookingForId: lookingForPokemonId,
      id: 'null',
      user: 'me',
      legacySpeciesId: new Badge(searchId).toLegacyString(),
      heldItem: heldItem ?? undefined,
      heldItemLabel: heldItem ? ITEMS[heldItem].label : undefined,
      lookingForItem: this.search.item as ItemId ?? undefined,
      lookingForItemLabel: this.search.item ? ITEMS[this.search.item].label : undefined,
    }
    return listing
  }

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.firebaseListener = this.firebase.subscribeUser(user => {
      if (user) {
        this.userPokemon = user.pokemon
        this.userItems = user.items
        this.flagPickerPro = user.settings.flagPickerPro === true
        this.pkmn = []
      }
    })
    this.fetchGtsLeaderboard() // Async
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  openItems() {
    if (!this.items) return console.error('There are no items to open!')
    this.items!.open()
  }

  openPokemon() {
    if (!this.pokemon) return console.error('There are no poke-dialog to open!')
    this.pokemon!.open()
  }

  async postListing() {
    const listing = this.customListing
    const msg = (() => {
      let out = `Trading your ${listing.species}`
      if (listing.heldItem) {
        out += ` holding ${listing.heldItemLabel}`
      }
      out += ` and seeking ${listing.lookingFor}`
      if (this.search.item) {
        out += ` holding ${listing.lookingForItemLabel}`
      }
      return out
    })()
    this.snackbar.open(msg, '', {
      duration: 3000,
    })

    // Perform operation
    this.exec.postListing = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec('gts_upload', listing)
        // Reset our globals
        this.pokemon.reset()
        this.items.reset()
        // this._loadGts();
        this.snackbar.open('Posting is now available!', '', {duration: 3000})
      } catch (e: any) {
        this.snackbar.open(e, '', { duration: 5000 })
      } finally {
        this.exec.postListing = false
      }
    })
  }

  async loadListings() {
    this.exec.loadListings = true
    window.requestAnimationFrame(async () => {
      try {
        const res = await this.firebase.exec('gts_query')
        this.publicListings = res.data.filter(x => x.user === '').map(x => ({
          ...x,
          heldItemLabel: x.heldItem ? ITEMS[x.heldItem].label : undefined,
          lookingForItemLabel: x.lookingForItem ? ITEMS[x.lookingForItem].label : undefined,
        }))
        this.myListings = res.data.filter(x => x.user !== '').map(x => ({
          ...x,
          heldItemLabel: x.heldItem ? ITEMS[x.heldItem].label : undefined,
          lookingForItemLabel: x.lookingForItem ? ITEMS[x.lookingForItem].label : undefined,
        }))
        this.filterListings = this.publicListings
        this.refilter()
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.loadListings = false
      }
    })
  }

  async cancel(tradeId: string) {
    this.exec.cancel = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec('gts_cancel', {
          tradeId,
        })
        this.snackbar.open('Cancelled trade... Reloading listings...', '', {duration: 3000})
        this.loadListings()
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.cancel = false
      }
    })
  }

  async inquireListing(gtsEntry: GtsEntry) {
    if (!this.pokemon) return console.error('There is no pokemon to open!')
    this.pokemon.open()
    this.pokemon.match(gtsEntry.lookingForId)
    const subscription = this.pokemon.events.subscribe(async event => {
      if (event === 'CLOSE' && this.pokemon._selection.length === 1) {
        console.log(`Trade ${this.pokemon._selection[0].species} for ${gtsEntry.id}`)
        console.log(gtsEntry)
        this.snackbar.open(`Performing trade...`,
          '', {duration: 5000})
        this.gtsDialog.nativeElement!.showModal()
        this.gtsSprites.offer = this.pokemon._selection[0].species
        try {
          const res = await this.firebase.exec('gts_trade', {
            tradeId: gtsEntry.id,
            tradeSpeciesId: this.pokemon._selection[0].species
          })
          this.gtsSprites.receive = res.data.speciesId as PokemonId
          this.snackbar.open(res.data.html, '', {duration: 3000})
          this.loadListings()
        } catch (e: any) {
          this.close()
          this.snackbar.open(e.message, '', {duration: 3000})
        } finally {
          this.pokemon.reset()
        }
      } else {
        this.pokemon.reset()
        this.snackbar.open(`Wanted 1 selection, got ${this.pokemon._selection.length}`,
          '', {duration: 5000})
      }
      subscription.unsubscribe()
    })
  }

  alert(txt: string) {
    this.snackbar.open(`This Pokémon will evolve into ${txt} when you receive it.`, '', {duration: 5000})
  }

  async fetchGtsLeaderboard() {
    try {
      const dbData = await this.firebase.dbGet(['gts', 'leaderboard'])
      const {simplePokemonTrades, simpleOffers} = dbData
      const sortedSimplePokemonTrades = Object.entries(simplePokemonTrades)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
      const sortedSimplePokemonOffers = Object.entries(simpleOffers)
        .sort((a, b) => (b[1] as number) - (a[1] as number))

      this.gtsLeaderboard.simplePokemonTrades = [...sortedSimplePokemonTrades]
        .map(([bid, c]) => [new TeamsBadge(bid).toLabel(), Badge.fromLegacy(bid).toString(), c])
        .filter(x => x[0]) // Needs to be valid
        .slice(0, 10)
      this.gtsLeaderboard.simplePokemonOffers = [...sortedSimplePokemonOffers]
        .map(([bid, c]) => [new TeamsBadge(bid).toLabel(), Badge.fromLegacy(bid).toString(), c])
        .filter(x => x[0]) // Needs to be valid
        .slice(0, 10)
      console.log(this.gtsLeaderboard.simplePokemonTrades)
    } catch (e) {
      console.error('Cannot fetch GTS leaderboard', e)
    }
  }

  displayBagCount(item: ItemId) {
    const {label} = ITEMS[item]
    this.snackbar.open(`You have ${this.userItems[item] ?? 0} ${label}`, '', {duration: 5000})
  }

  refilter() {
    if (!this.pkmn || !this.pkmn.length) {
      this.pkmn = inflate(this.userPokemon)
    }
    // Give time for UI animtaion to happen
    window.requestAnimationFrame(() => {
      this.filterListings = this.publicListings.filter(listing => {
        const seekingMatch = Badge.match(listing.lookingForId, this.pkmn, MATCH_GTS)
        const offerMatch = Badge.match(listing.speciesId, this.pkmn, MATCH_GTS)
        if (!!this.filter.offers &&
            !listing.species.toLowerCase().includes(this.filter.offers.toLowerCase())) {
          return false
        }
        if (!!this.filter.seeking &&
            !listing.lookingFor.toLowerCase().includes(this.filter.seeking.toLowerCase())) {
          return false
        }
        if (!!this.filter.regex) {
          const filterString = `Offering ${listing.species} Seeking ` +
            `${listing.lookingFor} Holding ${listing.heldItemLabel} ` +
            `Seeking ${listing.lookingForItemLabel} from you!`
          const regex = new RegExp(this.filter.regex)
          if (!regex.test(filterString)) {
            return false
          }
        }
        if (this.filter.seekingYouHave && !seekingMatch.match) {
          return false
        }
        if (this.filter.seekingDuplicates && seekingMatch.count < 2) {
          return false
        }
        if (this.filter.offeringNoHave && offerMatch.count > 0) {
          return false
        }
        if (this.filter.holdingItem && !listing.heldItem) {
          return false
        }
        if (this.filter.tradeEvo && !listing.noteworthy) {
          return false
        }
        if (this.filter.itemYouHave && listing.lookingForItem && (!this.userItems[listing.lookingForItem] || this.userItems[listing.lookingForItem] === 0)) {
          return false
        }
        return true
      })
    })
  }

  close() {
    this.gtsDialog.nativeElement!.close()
  }
}
