import {TestBed} from '@angular/core/testing';

import {ManService} from './man.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FireAuthStub, FireRemoteConfigStub} from './stubs';
import {AngularFireRemoteConfig} from '@angular/fire/compat/remote-config';
import {AngularFireAuth} from '@angular/fire/compat/auth';

describe('ManService', () => {
    beforeEach(() => TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
            {provide: AngularFireAuth, useValue: FireAuthStub},
            {provide: AngularFireRemoteConfig, useValue: FireRemoteConfigStub}
        ]
    }));

    it('should be created', () => {
        const service: ManService = TestBed.get(ManService);
        expect(service).toBeTruthy();
    });
});
