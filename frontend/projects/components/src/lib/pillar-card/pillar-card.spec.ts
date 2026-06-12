import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PillarCard } from './pillar-card';

@Component({
  standalone: true,
  imports: [PillarCard],
  template: `
    <sh-pillar-card icon="wb_twilight" title="Today" subtitle="A calm start">
      <p class="projected">Morning reflection</p>
    </sh-pillar-card>
  `,
})
class Host {}

describe('PillarCard', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders icon, title, and subtitle', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.icon')?.textContent?.trim()).toBe('wb_twilight');
    expect(el.querySelector('.title')?.textContent?.trim()).toBe('Today');
    expect(el.querySelector('.subtitle')?.textContent?.trim()).toBe('A calm start');
  });

  it('projects body content', () => {
    const projected = fixture.nativeElement.querySelector('.body .projected');
    expect(projected?.textContent?.trim()).toBe('Morning reflection');
  });

  it('omits the header when no icon/title/subtitle are given', async () => {
    const bare = TestBed.createComponent(PillarCard);
    bare.detectChanges();
    expect(bare.nativeElement.querySelector('.head')).toBeNull();
  });
});
