import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatRow } from './stat-row';

@Component({
  standalone: true,
  imports: [StatRow],
  template: `<sh-stat-row label="Bike · 24 min" meta="Tue" />`,
})
class Host {}

@Component({
  standalone: true,
  imports: [StatRow],
  template: `<sh-stat-row label="Distance" value="4.2 km" />`,
})
class HostWithValue {}

describe('StatRow', () => {
  it('renders label and meta', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture: ComponentFixture<Host> = TestBed.createComponent(Host);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.label')?.textContent).toBe('Bike · 24 min');
    expect(el.querySelector('.meta')?.textContent).toBe('Tue');
    expect(el.querySelector('.value')).toBeNull();
  });

  it('renders the optional value', async () => {
    await TestBed.configureTestingModule({ imports: [HostWithValue] }).compileComponents();
    const fixture: ComponentFixture<HostWithValue> = TestBed.createComponent(HostWithValue);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.value')?.textContent).toBe('4.2 km');
    expect(el.querySelector('.meta')).toBeNull();
  });
});
