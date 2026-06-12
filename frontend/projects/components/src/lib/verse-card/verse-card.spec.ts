import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerseCard } from './verse-card';

@Component({
  standalone: true,
  imports: [VerseCard],
  template: `
    <sh-verse-card
      text="For God so loved the world..."
      reference="John 3:16"
      href="https://www.bible.com/bible/111/JHN.3.16"
    />
  `,
})
class Host {}

describe('VerseCard', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders the verse text and reference', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.text')?.textContent?.trim()).toBe(
      'For God so loved the world...',
    );
    expect(el.querySelector('.reference')?.textContent?.trim()).toBe('John 3:16');
  });

  it('renders the YouVersion pill link opening in a new tab', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a.link');
    expect(link.textContent?.trim()).toBe('Read the full chapter in YouVersion');
    expect(link.getAttribute('href')).toBe('https://www.bible.com/bible/111/JHN.3.16');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener');
  });
});
