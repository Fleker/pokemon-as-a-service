import config from './firebase.config'
import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore, onSnapshot, doc, getDoc, DocumentReference, DocumentData, DocumentSnapshot, QuerySnapshot, query, where, WhereFilterOp, getDocs, collection, limit } from 'firebase/firestore'
import {getAuth, Auth, User, signOut, GoogleAuthProvider, onAuthStateChanged, signInWithRedirect} from 'firebase/auth'
import {Subject} from 'rxjs'
import { DebugService } from '../debug.service';
import { getFunctions, Functions, httpsCallable, HttpsCallableResult, HttpsCallableOptions } from "firebase/functions";
import { Users } from '../../../../shared/src/server-types';
import {getMessaging, getToken, Messaging, onMessage} from 'firebase/messaging'

interface AuthData {
  user: User | null
}

type Snapshot = (snapshot: DocumentSnapshot<DocumentData>) => void

type QueryCallback = (snapshot: QuerySnapshot<DocumentData>) => void

interface Querying {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ops: [string, WhereFilterOp, any][]
  max?: number
}

const vapidKey = 'BPijse_h4bJXlMuwHQIKE1wmJSR_71HlKUI_-Ii2CK3Hban8_HuJnYHW9QL9-jcBcoDXiVMxGvpjri3I9MU52GY'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultUser: Users.Doc = {
  items: {
    pokeball: 10,
    greatball: 5,
    ultraball: 3,
    safariball: 1,
    lureball: 1,
    moonball: 1,
    levelball: 1,
    heavyball: 1,
    friendball: 1,
    loveball: 1,
    fastball: 1,
    competitionball: 1,
    masterball: 0,
    stardust: 3,
  },
  ldap: 'nobody',
  currentBadges: [],
  lastPokeball: Date.now(),
  hiddenItemsFound: [],
  eggs: [],
  location: 'US-MTV',
  settings: {
    pokeindex: false,
    union: false,
    disableRealtime: false,
    disableSyncTeams: false,
    theme: 'default',
    flagAchievementService: false,
    flagLocation2: false,
    flagSearch2: false,
    flagTag: false,
    notification: {
      BATTLE_LEADERBOARD: {inapp: true, push: true},
      GTS_COMPLETE: {inapp: true, push: true},
      ITEM_DISPENSE: {inapp: true, push: true},
      RAID_CLAIM: {inapp: true, push: true},
      RAID_COMPLETE: {inapp: true, push: true},
      RAID_EXPIRE: {inapp: true, push: true},
      RAID_RESET: {inapp: true, push: true},
      VOYAGE_COMPLETE: {inapp: true, push: true},
      PLAYER_EVENT: {inapp: true, push: true},
      GAME_EVENT: {inapp: true, push: true},
    }
  },
  battleStadiumRecord: [0,0,0,0],
  raidRecord: [0,0,0,0],
  strikes: 0,
  moveTutors: 0,
  eggsLaid: 0,
  pokemon: {
    // Basic forms of Bulbasaur, Charmander, Squirtle
    '1#Yf_4': 1,
    '4#Yf_4': 1,
    '7#Yf_4': 1,
  },
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private db?: Firestore
  private _firestore?: Firestore
  private userData?: Users.Doc
  private userSubject: Subject<Users.Doc> = new Subject()

  private auth?: Auth
  private user?: User | null
  private authSubject: Subject<AuthData> = new Subject()

  private _functions?: Functions

  private messaging: Messaging

  constructor(private debug: DebugService) {}

  init() {
    initializeApp(config)
    this.db = getFirestore()
    this._firestore = getFirestore()
    this.initializeAuth()
    this._functions = getFunctions()
    console.log('App initialized')
    this.messaging = getMessaging()
    this.initializeFCM()
  }

  subscribeAuth() {
    window.requestAnimationFrame(() => {
      this.authSubject.next({user: this.user!})
    })
    return this.authSubject
  }

  /**
   * Creates a subscription to the user doc and immediately executes a callback
   * to retrieve the data. Returns the unsubscriber as a function.
   */
  subscribeUser(callback: (u: Users.Doc) => void) {
    const listener = this.userSubject.subscribe(callback)
    callback(this.userData)
    return listener
  }

  async refreshUser() {
    const userDoc = await getDoc(doc(this.db!, 'users', this.user!.uid))
    const data = userDoc.data() as Users.Doc
    this.userData = data;
    this.userSubject.next(this.userData)
  }

  private initializeAuth()  {
    this.auth = getAuth()
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        console.log('Logged in as', user.email)
        this.initializeFirestore(user)
      }
      this.user = user
      this.authSubject.next({user})
    })
  }

  private initializeFirestore(user: User) {
    const userRef = doc(this.db!, 'users', user.uid)
    const unsubscribe = onSnapshot(userRef, doc => {
      const data = doc.data() as Users.Doc
      if (this.debug.isLocal) {
        console.debug(data)
      }
      this.userData = data
      if (this.userData && !user.email.includes(this.userData.ldap)) {
        // User email has changed
        console.debug("Your LDAP appears to have changed. Let's update that.")
        // In parallel
        this.exec('user_sync_ldap', {})
          // Update any related UI in client
          .then(() => this.refreshUser())
      }
      // this.userData = jay as unknown as Users.Doc
      this.userSubject.next(this.userData)
      if (data.settings.disableRealtime) {
        console.log('Unsubscribe from realtime updates')
        unsubscribe()
      }
    })
  }

  private async initializeFCM() {
    if (Notification.permission !== 'granted') return // Don't do this yet
    const fcmToken = await getToken(this.messaging, { vapidKey })
    if (!fcmToken) {
      console.error('Cannot get FCM. Need permission?')
    } else {
      console.info('FCM obtained')
      console.debug(fcmToken)
      const res = await this.exec('fcm_manage', {
        token: fcmToken,
        action: 'PUSH',
      })
      console.debug('FCM Manage', res.data)
    }

    // Setup our foreground message provider
    onMessage(this.messaging, (payload) => {
      console.debug('[firebase.service.ts] Received foreground message', payload)
      // new Notification(payload.notification.title, {
      //   body: payload.notification.body,
      //   image: payload.notification.image,
      // })
    })
  }

  async login() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(this.auth!, provider)
    } catch (err) {
      console.error(err)
    }
  }

  async logout() {
    try {
      await signOut(this.auth!)
    } catch(error) {
      console.error('Cannot logout', error)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async exec<T = any, U = any>(rpc: string, data: T = undefined, rpcParams: HttpsCallableOptions = {}): Promise<HttpsCallableResult<U>> {
    const caller = httpsCallable(this._functions!, rpc, rpcParams)
    return (await caller(data)) as unknown as HttpsCallableResult<U>
  }

  async dbGet(path: string[]) {
    const ref = doc(this.db!, path[0], ...path.slice(1))
    const document = await getDoc(ref)
    return document.data()
  }

  async dbListen(path: string[], callback: Snapshot) {
    const ref = doc(this.db!, path[0], ...path.slice(1)) as unknown as DocumentReference<DocumentData>
    return onSnapshot(ref, {
      next: callback
    })
  }

  async dbSearch(path: string, conditions: Querying, callback: QueryCallback) {
    const ref = collection(this.db!, path)
    const {ops, max} = conditions
    const wheres = ops.map(op => where(op[0], op[1], op[2]))
    const q = (() => {
      if (max !== undefined) {
        return query(ref, ...wheres, limit(max))
      } else {
        return query(ref, ...wheres)
      }
    })()
    const snapshot = await getDocs(q)
    return callback(snapshot)
  }

  getUid() {
    return this.auth.currentUser?.uid
  }

  getMyChatRef(chatId = 'alpha') {
    return collection(this.db!, 'users', this.user!.uid, 'chats', chatId, 'messages')
  }

  /* For scripting compat */
  functions() {
    return {
      httpsCallable: (name, rpcParams) => {
        return (args) => this.exec(name, args, rpcParams)
      }
    }
  }

  firestore() {
    return {
      collection: (collection) => {
        return {
          doc: (doc) => {
            return {
              get: () => this.dbGet([collection, doc]).then(result => {
                return {
                  data: () => result,
                  get: (path) => {
                    const keys = path.split('.')
                    return keys.reduce((obj, key) => obj?.[key], result)
                  }
                }
              }),
              onSnapshot: (callback) => this.dbListen([collection, doc], callback)
            }
          }
        }
      }
    }
  }
}
