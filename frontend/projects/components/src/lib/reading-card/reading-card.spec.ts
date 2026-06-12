import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReadingCard } from './reading-card';

@Component({
  standalone: true,
  imports: [ReadingCard],
  template: `
    <sh-reading-card
      planName="John & His Letters"
      [dayNumber]="1"
      passageReference="John 1"
      href="https://www.bible.com/bible/111/JHN.1"
      [completed]="completed()"
      [completedCount]="3"
      [totalDays]="28"
      (markRead)="reads = reads + 1"
    />
  `,
})
class Host {
  readonly completed = signal(false);
  reads = 0;
}

describe('ReadingCard', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders plan name, day number, passage, and progress', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.plan')?.textContent?.trim()).toBe('John & His Letters');
    expect(el.querySelector('.passage')?.textContent?.trim()).toBe('Day 1 · John 1');
    expect(el.querySelector('.progress')?.textContent?.trim()).toBe('3 of 28 read');
  });

  it('links to YouVersion in a new tab', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a.link');
    expect(link.getAttribute('href')).toBe('https://www.bible.com/bible/111/JHN.1');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('emits markRead when the button is clicked', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.mark-read');
    button.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.reads).toBe(1);
  });

  it('shows the completed state instead of the button when done', () => {
    fixture.componentInstance.completed.set(true);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.mark-read')).toBeNull();
    expect(el.querySelector('.done')?.textContent).toContain('Read today');
  });
});
