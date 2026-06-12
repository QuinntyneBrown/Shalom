import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BottomNav } from './bottom-nav';

describe('BottomNav', () => {
  let component: BottomNav;
  let fixture: ComponentFixture<BottomNav>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomNav],
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    fixture = TestBed.createComponent(BottomNav);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the three pillar items with their Material Symbols icons', () => {
    const links = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
    expect(links.length).toBe(3);

    const labels = Array.from(links).map((a) => a.textContent?.trim());
    expect(labels[0]).toContain('Today');
    expect(labels[1]).toContain('Health');
    expect(labels[2]).toContain('People');

    const icons = Array.from(
      fixture.nativeElement.querySelectorAll('.material-symbols-rounded'),
    ).map((el) => (el as HTMLElement).textContent?.trim());
    expect(icons).toEqual(['wb_twilight', 'monitor_heart', 'diversity_1']);
  });

  it('marks only the active item with data-active and aria-current', () => {
    fixture.componentRef.setInput('active', 'health');
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
    const active = Array.from(links).filter((a) => a.getAttribute('data-active') === 'true');
    expect(active.length).toBe(1);
    expect(active[0]?.getAttribute('data-nav-key')).toBe('health');
    expect(active[0]?.getAttribute('aria-current')).toBe('page');
  });

  it('links to the real routes so copy-link and modifier-click work', () => {
    const hrefs = Array.from(
      fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>,
    ).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/today', '/health', '/people']);
  });
});
