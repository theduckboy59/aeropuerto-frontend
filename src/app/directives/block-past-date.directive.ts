import { AfterViewInit, Directive, ElementRef, HostListener, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: 'input[type=date]:not([allowPastDate])'
})
export class BlockPastDateDirective implements AfterViewInit {
  private readonly today = this.formatDate(new Date());

  constructor(
    private readonly elementRef: ElementRef<HTMLInputElement>,
    @Optional() private readonly control: NgControl
  ) {}

  ngAfterViewInit(): void {
    const input = this.elementRef.nativeElement;
    const currentMin = input.getAttribute('min');

    if (!currentMin || currentMin < this.today) {
      input.setAttribute('min', this.today);
    }

    this.blockIfPast();
  }

  @HostListener('change')
  @HostListener('input')
  blockIfPast(): void {
    const input = this.elementRef.nativeElement;
    const minDate = input.getAttribute('min') || this.today;

    if (input.value && input.value < minDate) {
      input.value = '';
      this.control?.control?.setValue('', { emitEvent: true });
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
