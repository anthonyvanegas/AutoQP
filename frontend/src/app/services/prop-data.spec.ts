import { TestBed } from '@angular/core/testing';

import { PropDataService } from './prop-data';

describe('PropData', () => {
  let service: PropDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
