import {inject, Injectable} from '@angular/core';
import {first, map, mergeMap, tap} from 'rxjs/operators';
import {BehaviorSubject, fromEventPattern, Observable} from 'rxjs';
import {
    FieldValue,
    Timestamp,
} from '@angular/fire/firestore';
import Pusher from 'pusher-js';
import Echo from 'laravel-echo';
import {Auth, idToken, user} from '@angular/fire/auth';

@Injectable({
    providedIn: 'root'
})
export class PlayTrackerService {
    private auth: Auth = inject(Auth);
    idToken$ = idToken(this.auth);
    user$ = user(this.auth);

    private updates$: Observable<any>;

    private readonly history$: BehaviorSubject<PlayHistory>;
    constructor() {
        this.history$ = new BehaviorSubject({});

        /*
        const documentRef$ = authService.user.pipe(map(user => {
            // Convert to a DocumentReference
            return user ? doc(collection(aFirestore, 'users'), user.uid).withConverter(UserDocumentConverter) : null;
        }));
        documentRef$.subscribe(documentRef => {
            this.documentRef = documentRef;
        });
        documentRef$.pipe(skipWhile(v => v == null), mergeMap(documentRef => docData(documentRef))).subscribe(document => {
            this.history$.next(document ? (document.playHistory ?? {}) : {});
        });*/

        // Setup websocket client
        // @ts-ignore
        window.Pusher = Pusher;
        const echo = new Echo({
            broadcaster: 'reverb',
            key: 'wr2uu6n8zkbel4nalzzl',
            authEndpoint: 'http://localhost:8000/broadcasting/auth',
            auth: {headers: {Authorization: "Bearer " + idToken}},
            wsHost: "localhost",
            wsPort: 8080,
            forceTLS: false,
            enabledTransports: ['ws', 'wss'],
        });
        this.updates$ = this.idToken$.pipe(
            tap(idToken => {
                if (idToken) {
                    echo.connector.options.auth.headers.Authorization = "Bearer " + idToken;
                }
            }),
            // combine the idToken with the user information (for UID)
            mergeMap(idToken => this.user$.pipe(first(), map(user => ({idToken, user})))),
            first(),
            // Return observable only once
            mergeMap(userAndToken =>
                fromEventPattern(handler => {
                    echo.private("user." + userAndToken.user.email).listen("message", handler);
                }, () => echo.leaveChannel("user." + userAndToken.user.email))),
        );
        this.updates$.subscribe((data) => console.log(data));
        setTimeout(() => {
            echo.join("user.siwat.techa@docchula.com").whisper('typing', {
                name: "aaa",
            });
        }, 3000);
    }

    retrieve() {
        return this.history$;
    }
}

export const PlayTrackerServiceStub: Partial<PlayTrackerService> = {
    retrieve: () => new BehaviorSubject<PlayHistory>({}),
};

export interface PlayHistory {
    [key: string]: PlayHistoryValue;
}

export interface PlayHistoryValue {
    duration?: number | null;
    currentTime: number;
    updatedAt: Timestamp | FieldValue;
    year?: string;
    course?: string;
}
