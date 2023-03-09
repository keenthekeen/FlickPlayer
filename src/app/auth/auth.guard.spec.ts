import {inject, TestBed} from '@angular/core/testing';

import {AuthGuard} from './auth.guard';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {FireAuthStub} from '../stubs';
import {ManService, ManServiceStub} from '../man.service';
import {RouterTestingModule} from '@angular/router/testing';

describe('AuthGuard', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            providers: [
                {provide: AngularFireAuth, useValue: FireAuthStub},
                AuthGuard,
                {provide: ManService, useValue: ManServiceStub}
            ],
        });
    });

    it('should ...', inject([AuthGuard], (guard: AuthGuard) => {
        expect(guard).toBeTruthy();
    }));
});
