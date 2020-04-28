import {TestBed} from '@angular/core/testing';

import {PlayTrackerService} from './play-tracker.service';
import {AngularFirestore} from '@angular/fire/firestore';
import {FireAuthStub, FirestoreStub} from './stubs';
import {AngularFireAuth} from '@angular/fire/auth';

describe('PlayTrackerService', () => {
    beforeEach(() => TestBed.configureTestingModule({
        providers: [
            {provide: AngularFireAuth, useValue: FireAuthStub},
            {provide: AngularFirestore, useValue: FirestoreStub}
        ]
    }));

    it('should be created', () => {
        const service: PlayTrackerService = TestBed.get(PlayTrackerService);
        expect(service).toBeTruthy();
    });
});
