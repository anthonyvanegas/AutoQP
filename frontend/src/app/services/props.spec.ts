import { TestBed } from '@angular/core/testing';

import { PropsService } from './props';

describe('PropData', () => {
  let service: PropsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
