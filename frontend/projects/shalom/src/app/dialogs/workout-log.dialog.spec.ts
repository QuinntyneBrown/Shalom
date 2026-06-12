import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { IWorkoutsService, LogWorkoutRequest, WORKOUTS_SERVICE, WorkoutDto } from 'api';
import { WorkoutLogDialog, WorkoutLogData } from './workout-log.dialog';

const saved: WorkoutDto = {
  id: 'w-1',
  equipment: 'IndoorBike',
  startedAt: '2026-06-12T11:00:00+00:00',
  durationMinutes: 25,
  distanceKm: null,
  avgHeartRateBpm: null,
  activeCalories: null,
  notes: 'effort:steady',
};

describe('WorkoutLogDialog', () => {
  let fixture: ComponentFixture<WorkoutLogDialog>;
  let logCalls: LogWorkoutRequest[];
  let close: ReturnType<typeof vi.fn>;

  async function setup(data: WorkoutLogData): Promise<void> {
    logCalls = [];
    close = vi.fn();
    const workoutsMock: IWorkoutsService = {
      log: async (req) => {
        logCalls.push(req);
        return saved;
      },
      list: async () => [],
      delete: async () => undefined,
    };

    await TestBed.configureTestingModule({
      imports: [WorkoutLogDialog],
      providers: [
        { provide: WORKOUTS_SERVICE, useValue: workoutsMock },
        { provide: DialogRef, useValue: { close } },
        { provide: DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutLogDialog);
    fixture.detectChanges();
  }

  function el(testid: string): HTMLElement {
    return fixture.nativeElement.querySelector(`[data-testid="${testid}"]`);
  }

  it('preselects the machine handed in via dialog data', async () => {
    await setup({ equipment: 'IndoorBike' });

    expect(el('sh-sheet-machine-indoorbike').classList.contains('selected')).toBe(true);
    expect(el('sh-sheet-machine-treadmill').classList.contains('selected')).toBe(false);
  });

  it('defaults to Treadmill, 25 min, Steady when opened from the add button', async () => {
    await setup({ equipment: null });

    expect(el('sh-sheet-machine-treadmill').classList.contains('selected')).toBe(true);
    expect(el('sh-sheet-duration').textContent).toBe('25 min');
    expect(el('sh-sheet-effort-steady').classList.contains('selected')).toBe(true);
  });

  it('offers outdoor walk and run alongside the machines and logs them', async () => {
    await setup({ equipment: null });

    expect(el('sh-sheet-machine-outdoorwalk').textContent).toBe('Outdoor walk');
    expect(el('sh-sheet-machine-outdoorrun').textContent).toBe('Outdoor run');

    el('sh-sheet-machine-outdoorrun').click();
    fixture.detectChanges();
    expect(el('sh-sheet-machine-outdoorrun').classList.contains('selected')).toBe(true);

    el('sh-sheet-save-workout').click();
    await fixture.whenStable();
    expect(logCalls[0].equipment).toBe('OutdoorRun');
  });

  it('steps duration by 5 and never below 5 minutes', async () => {
    await setup({ equipment: null });

    el('sh-sheet-duration-plus').click();
    fixture.detectChanges();
    expect(el('sh-sheet-duration').textContent).toBe('30 min');

    for (let i = 0; i < 10; i++) el('sh-sheet-duration-minus').click();
    fixture.detectChanges();
    expect(el('sh-sheet-duration').textContent).toBe('5 min');
  });

  it('saves with the effort word as the notes prefix and closes with the result', async () => {
    await setup({ equipment: 'IndoorBike' });

    el('sh-sheet-effort-strong').click();
    fixture.detectChanges();
    el('sh-sheet-save-workout').click();
    await fixture.whenStable();

    expect(logCalls).toEqual([
      { equipment: 'IndoorBike', durationMinutes: 25, notes: 'effort:strong' },
    ]);
    expect(close).toHaveBeenCalledWith(saved);
  });

  it('appends the free-text note after the effort prefix', async () => {
    await setup({ equipment: null });

    const note: HTMLInputElement = fixture.nativeElement.querySelector('input.note');
    note.value = 'felt good';
    note.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el('sh-sheet-save-workout').click();
    await fixture.whenStable();

    expect(logCalls[0].notes).toBe('effort:steady · felt good');
  });
});
