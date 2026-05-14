import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutorialStep } from './tutorial.service';

@Component({
  selector: 'app-tutorial-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tutorial-modal.component.html',
  styleUrls: ['./tutorial-modal.component.css']
})
export class TutorialModalComponent {
  @Input() steps: TutorialStep[] = [];
  @Input() featureName: string = '';
  @Output() onComplete = new EventEmitter<boolean>(); // true if "don't show again" checked
  @Output() onSkip = new EventEmitter<void>();

  currentStep: number = 0;
  dontShowAgain: boolean = false;

  get currentStepData(): TutorialStep {
    return this.steps[this.currentStep] || { title: '', description: '' };
  }

  get isFirstStep(): boolean {
    return this.currentStep === 0;
  }

  get isLastStep(): boolean {
    return this.currentStep === this.steps.length - 1;
  }

  get totalSteps(): number {
    return this.steps.length;
  }

  nextStep(): void {
    if (!this.isLastStep) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (!this.isFirstStep) {
      this.currentStep--;
    }
  }

  goToStep(index: number): void {
    if (index >= 0 && index < this.steps.length) {
      this.currentStep = index;
    }
  }

  complete(): void {
    this.onComplete.emit(this.dontShowAgain);
  }

  skip(): void {
    this.onSkip.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    // Close modal when clicking backdrop
    this.skip();
  }
}
