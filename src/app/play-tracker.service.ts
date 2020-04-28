import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import {map, take} from 'rxjs/operators';
import {BehaviorSubject} from 'rxjs';
import Timestamp = firebase.firestore.Timestamp;
import FieldValue = firebase.firestore.FieldValue;

@Injectable({
    providedIn: 'root'
})
export class PlayTrackerService {
    private readonly history$: BehaviorSubject<PlayHistory>;
    private documentId: string;

    constructor(private aFirestore: AngularFirestore, afAuth: AngularFireAuth) {
        this.history$ = new BehaviorSubject({});

        afAuth.user.pipe(take(1)).subscribe(user => {
            this.documentId = 'users/' + user.uid;
            aFirestore.doc<UserDocument>(this.documentId).valueChanges().subscribe(doc => {
                if (doc) {
                    this.history$.next(doc.playHistory ?? {});
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
        if (!this.documentId) {
            return;
        }
        this.history$.pipe(take(1), map(history => {
            const newHistory = {};
            Object.keys(history).forEach(key => {
                // @ts-ignore
                if (history[key].currentTime && (Date.now() - +history[key].updatedAt.toDate()) <= 5184000000) {
                    // Store for 60 days
                    newHistory[key] = history[key];
                }
            });
            newHistory[identifier] = {
                currentTime: value,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            return newHistory;
        })).subscribe(history => this.aFirestore.doc<UserDocument>(this.documentId).update({playHistory: history}));
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
    updatedAt: Timestamp | FieldValue | null;
}