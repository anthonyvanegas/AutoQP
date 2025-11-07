import { Injectable } from '@angular/core';
import { Prop } from '../models/prop';

@Injectable({
  providedIn: 'root'
})
export class PropDataService {

  private mockProps: Prop[] = [
    {
      id: 'prop_690b6a32dd1166e8357b7ad1f1fa72b3',
      entity_name: 'Pascal Siakam',
      type_display: 'Pts+Reb+Asts',
      line: 39.5,
      odds: -135,
      books: 3
    },
    {
      id: 'prop_690af051a1da96242ed56259cbd7e717',
      entity_name: 'Cam Thomas',
      type_display: 'Pts+Reb+Asts',
      line: 31.5,
      odds: -120,
      books: 4
    },
    {
      id: 'prop_690b67db534fd0948d03e8a211cfec55',
      entity_name: 'Pascal Siakam',
      type_display: 'Pts+Reb',
      line: 33.5,
      odds: -140,
      books: 2
    },
    {
      id: 'prop_690af051bcd24f18a51e81d9748f8724',
      entity_name: 'Michael Porter Jr.',
      type_display: 'Pts+Reb+Asts',
      line: 28.5,
      odds: -110,
      books: 5
    },
    {
      id: 'prop_690ae36dde94a9b7b46d0b8c28f33ae5',
      entity_name: 'Pascal Siakam',
      type_display: 'Pts+Asts',
      line: 32.5,
      odds: -125,
      books: 3
    },
    {
      id: 'prop_690ae36d2583b9cfb3caf4b3426ec912',
      entity_name: 'Cam Thomas',
      type_display: 'Pts+Reb',
      line: 27.5,
      odds: -150,
      books: 2
    },
    {
      id: 'prop_690b01e6dda722a949556b02af71cb3b',
      entity_name: 'Jarace Walker',
      type_display: 'Pts+Reb+Asts',
      line: 26.5,
      odds: -115,
      books: 4
    },
    {
      id: 'prop_690ae499c07f2ebadf3593e211e1f92b',
      entity_name: 'Cam Thomas',
      type_display: 'Pts+Asts',
      line: 27.5,
      odds: -130,
      books: 3
    },
    {
      id: 'prop_690ae36d14568bd824f20db1fbd2c477',
      entity_name: 'Pascal Siakam',
      type_display: 'Points',
      line: 26.5,
      odds: -145,
      books: 5
    },
    {
      id: 'prop_690ae36dd3ba3c9f6a9da04094a9cbbf',
      entity_name: 'Michael Porter Jr.',
      type_display: 'Pts+Reb',
      line: 25.5,
      odds: -105,
      books: 4
    }
  ];

  constructor() { }

  getProps(): Prop[] {
    return this.mockProps;
  }

  getFilteredProps(oddsThreshold: number): Prop[] {
    // Filter for odds better than threshold (less negative or positive)
    // -135 is better than -140, -120 is better than -135
    return this.mockProps.filter(prop => prop.odds >= oddsThreshold);
  }
}