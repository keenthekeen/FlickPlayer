import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import {take} from 'rxjs/operators';
import {Observable} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PlayTrackerService {
    private history: PlayHistory = {};
    private readonly history$: Observable<PlayHistory>;
    private updateHistory: CallableFunction;
    private documentId: string;

    constructor(private aFirestore: AngularFirestore, afAuth: AngularFireAuth) {
        this.history$ = new Observable(observer => {
            this.updateHistory = (newValue) => {
                observer.next(newValue);
                this.history = newValue;
            };
        });

        afAuth.user.pipe(take(1)).subscribe(user => {
            this.documentId = 'users/' + user.uid;
            aFirestore.doc<UserDocument>(this.documentId).valueChanges().subscribe(doc => {
                if (doc) {
                    this.updateHistory(doc.playHistory ?? {});
                } else {
                    this.aFirestore.doc<UserDocument>(this.documentId).set({playHistory: {}});
                }
            });
        });
    }

    retrieve() {
        return this.history$;
    }

    updateCurrentTime(identifier: string, value: number) {
        const history = {};
        const historyKeys = Object.keys(this.history);
        historyKeys.forEach(key => {
            if ((Date.now() - Date.parse(this.history[key].updatedAt)) <= 2592000000) {
                // Store for 30 days
                history[key] = this.history[key];
            }
        });
        history[identifier] = {
            currentTime: value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        this.aFirestore.doc<UserDocument>(this.documentId).update({
            playHistory: history
        });
    }
}

export interface UserDocument {
    playHistory: PlayHistory;
}

export interface PlayHistory {
    [key: string]: PlayHistoryValue;
}

export interface PlayHistoryValue {
    currentTime: number | null;
    updatedAt: any | null;
}
