import {Injectable} from '@angular/core';
import {map, mergeMap, skipWhile, take} from 'rxjs/operators';
import {BehaviorSubject} from 'rxjs';
import {
    collection,
    doc,
    docData,
    DocumentReference,
    FieldValue,
    Firestore,
    FirestoreDataConverter,
    QueryDocumentSnapshot,
    serverTimestamp,
    setDoc,
    SnapshotOptions,
    Timestamp
} from '@angular/fire/firestore';
import {AuthService} from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class PlayTrackerService {
    private readonly history$: BehaviorSubject<PlayHistory>;
    private documentRef: DocumentReference<UserDocument>;

    constructor(aFirestore: Firestore, authService: AuthService) {
        this.history$ = new BehaviorSubject({});

        const documentRef$ = authService.user.pipe(map(user => {
            // Convert to a DocumentReference
            return user ? doc(collection(aFirestore, 'users'), user.uid).withConverter(UserDocumentConverter) : null;
        }));
        documentRef$.subscribe(documentRef => {
            this.documentRef = documentRef;
        });
        documentRef$.pipe(skipWhile(v => v == null), mergeMap(documentRef => docData(documentRef))).subscribe(document => {
            this.history$.next(document ? (document.playHistory ?? {}) : {});
        });
    }

    retrieve() {
        return this.history$;
    }

    updateCurrentTime(identifier: string, value: number, year: string, course: string, duration?: number) {
        if (!this.documentRef || !value) {
            return;
        }
        this.history$.pipe(take(1), map(history => {
            const newHistory = {};
            Object.keys(history).forEach(key => {
                if (history[key].currentTime && history[key].updatedAt
                    && history[key].currentTime > 3
                    // @ts-ignore
                    && (Date.now() - +history[key].updatedAt.toDate()) <= 20736000000) {
                    // Store for 240 days
                    newHistory[key] = {
                        currentTime: history[key].currentTime,
                        updatedAt: history[key].updatedAt,
                        duration: history[key].duration ?? 0
                    };
                }
            });
            newHistory[identifier] = {
                currentTime: value,
                updatedAt: serverTimestamp(),
                duration: duration ?? 0,
                year,
                course
            };
            return newHistory;
        })).subscribe(history => {
            setDoc(this.documentRef, {playHistory: history});
        });
    }
}

export const PlayTrackerServiceStub: Partial<PlayTrackerService> = {
    retrieve: () => new BehaviorSubject<PlayHistory>({}),
    updateCurrentTime: (identifier: string, value: number, year: string, course: string, duration?: number) => {
    }
};

const UserDocumentConverter: FirestoreDataConverter<UserDocument> = {
    toFirestore: (data: UserDocument) => data,
    fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions) => {
        const data = snapshot.data(options);
        return {
            playHistory: data.playHistory
        };
    }
};

export interface UserDocument {
    playHistory: PlayHistory;
}

export interface PlayHistory {
    [key: string]: PlayHistoryValue;
}

export interface PlayHistoryValue {
    duration: number | null;
    currentTime: number;
    updatedAt: Timestamp | FieldValue;
    year?: string;
    course?: string;
}
