import {BehaviorSubject, of} from 'rxjs';
import {environment} from '../environments/environment';
import {ParamMap} from '@angular/router';

class MockActivatedRoute {
    paramMap = of<ParamMap>({
        has: (name: string) => true,
        get: (name: string) => (name === 'course') ? 'Course' : 'Loading',
        getAll: (name: string) => [name],
        keys: []
    });
    params = of({id: '1'});
    parent: MockActivatedRoute;
    snapshot = {data: {title: 'TestTitle'}};

    constructor(parent?) {
        this.parent = parent ?? {};
    }
}

export const ActivatedRouteStub = new MockActivatedRoute(new MockActivatedRoute());

export const FireAnalyticsStub = {
    logEvent: (eventName: string, params?: object) => {
    }
};

export const FireAuthStub = {
    authState: of({getIdToken: () => new Promise((resolve, reject) => resolve('TestIdToken'))}),
    idToken: of('TestIdToken'),
    user: of({uid: 'TestUser'})
};

export const FireRemoteConfigStub = {
    strings: {
        manEndpoint: of(environment.defaultRemoteConfig.manEndpoint)
    },
    defaultConfig: Promise
};

export const FirestoreStub = {
    doc: (id: string) => ({
        valueChanges: () => new BehaviorSubject({playHistory: {}}),
        set: (d: object) => new Promise<void>((resolve, reject) => resolve())
    })
};
