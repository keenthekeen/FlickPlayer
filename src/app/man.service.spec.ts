import {TestBed} from '@angular/core/testing';

import {ManService} from './man.service';

describe('ManService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: ManService = TestBed.get(ManService);
        expect(service).toBeTruthy();
    });
});
