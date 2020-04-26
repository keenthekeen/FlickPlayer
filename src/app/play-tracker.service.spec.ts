import { TestBed } from '@angular/core/testing';

import { PlayTrackerService } from './play-tracker.service';

describe('PlayTrackerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PlayTrackerService = TestBed.get(PlayTrackerService);
    expect(service).toBeTruthy();
  });
});
