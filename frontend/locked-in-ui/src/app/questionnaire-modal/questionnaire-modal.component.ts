import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionnaireService, QuestionnaireAnswers } from './questionnaire.service';

interface Option {
  label: string;
  value: string;
}

interface Question {
  key: keyof QuestionnaireAnswers;
  section: string;
  text: string;
  options: Option[];
}

@Component({
  selector: 'app-questionnaire-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './questionnaire-modal.component.html',
  styleUrls: ['./questionnaire-modal.component.css']
})
export class QuestionnaireModalComponent {
  @Output() closed = new EventEmitter<void>();

  currentStep = 0;
  answers: QuestionnaireAnswers = {};
  showCompletion = false;
  submitting = false;

  readonly questions: Question[] = [
    {
      key: 'focusCompletionDifficulty',
      section: 'Focus & Attention',
      text: 'How often do you struggle to finish the final details of a project once the hard parts are done?',
      options: [
        { label: 'Never', value: 'never' },
        { label: 'Rarely', value: 'rarely' },
        { label: 'Sometimes', value: 'sometimes' },
        { label: 'Often', value: 'often' },
        { label: 'Very often', value: 'very_often' }
      ]
    },
    {
      key: 'sustainedAttentionDifficulty',
      section: 'Focus & Attention',
      text: 'How often do you have difficulty staying focused on a task for a long stretch?',
      options: [
        { label: 'Never', value: 'never' },
        { label: 'Rarely', value: 'rarely' },
        { label: 'Sometimes', value: 'sometimes' },
        { label: 'Often', value: 'often' },
        { label: 'Very often', value: 'very_often' }
      ]
    },
    {
      key: 'distractionFrequency',
      section: 'Focus & Attention',
      text: 'How often do you start something but get distracted before finishing?',
      options: [
        { label: 'Never', value: 'never' },
        { label: 'Rarely', value: 'rarely' },
        { label: 'Sometimes', value: 'sometimes' },
        { label: 'Often', value: 'often' },
        { label: 'Very often', value: 'very_often' }
      ]
    },
    {
      key: 'sleepHours',
      section: 'Sleep',
      text: 'How many hours of sleep do you typically get per night?',
      options: [
        { label: '4 hours or fewer', value: '4_or_fewer' },
        { label: '5–6 hours', value: '5_to_6' },
        { label: '7–8 hours', value: '7_to_8' },
        { label: '9 hours or more', value: '9_plus' }
      ]
    },
    {
      key: 'chronotype',
      section: 'Sleep',
      text: 'Are you more of a morning or evening person?',
      options: [
        { label: 'Morning person', value: 'morning' },
        { label: 'Evening person', value: 'evening' },
        { label: 'No strong preference', value: 'no_preference' }
      ]
    },
    {
      key: 'dailyFocusTime',
      section: 'Work Style',
      text: 'How much uninterrupted focus time do you typically get in a day?',
      options: [
        { label: 'Less than 1 hour', value: 'under_1h' },
        { label: '1–2 hours', value: '1_to_2h' },
        { label: '2–4 hours', value: '2_to_4h' },
        { label: '4+ hours', value: '4h_plus' }
      ]
    },
    {
      key: 'primaryFocusChallenge',
      section: 'Work Style',
      text: "What's your biggest focus challenge?",
      options: [
        { label: 'Starting tasks', value: 'starting' },
        { label: 'Staying on task', value: 'staying' },
        { label: 'External distractions', value: 'distractions' },
        { label: 'Low motivation', value: 'motivation' },
        { label: 'Switching between tasks', value: 'switching' }
      ]
    },
    {
      key: 'workEnvironment',
      section: 'Work Style',
      text: 'Where do you usually work or study?',
      options: [
        { label: 'Home — alone', value: 'home_alone' },
        { label: 'Home — with others around', value: 'home_with_others' },
        { label: 'Office or campus', value: 'office' },
        { label: 'It varies', value: 'varies' }
      ]
    },
    {
      key: 'taskBreakdownEase',
      section: 'Executive Function',
      text: 'How easy is it for you to break a big task into smaller steps?',
      options: [
        { label: 'Very easy', value: 'very_easy' },
        { label: 'Somewhat easy', value: 'somewhat_easy' },
        { label: 'Neutral', value: 'neutral' },
        { label: 'Somewhat difficult', value: 'somewhat_difficult' },
        { label: 'Very difficult', value: 'very_difficult' }
      ]
    },
    {
      key: 'procrastinationTendency',
      section: 'Executive Function',
      text: 'How often do you delay starting something even when you planned to?',
      options: [
        { label: 'Rarely', value: 'rarely' },
        { label: 'Sometimes', value: 'sometimes' },
        { label: 'Often', value: 'often' },
        { label: 'Almost always', value: 'almost_always' }
      ]
    },
    {
      key: 'stressLevel',
      section: 'Context',
      text: 'How would you rate your current stress level?',
      options: [
        { label: 'Not stressed', value: 'none' },
        { label: 'Mildly stressed', value: 'mild' },
        { label: 'Moderately stressed', value: 'moderate' },
        { label: 'Highly stressed', value: 'high' },
        { label: 'Burned out', value: 'burned_out' }
      ]
    },
    {
      key: 'primaryMotivation',
      section: 'Goals',
      text: "What's your main reason for using LockedIN?",
      options: [
        { label: 'Build better focus habits', value: 'focus_habits' },
        { label: 'Manage ADHD symptoms', value: 'adhd_management' },
        { label: 'Reduce procrastination', value: 'procrastination' },
        { label: 'Better work–life balance', value: 'work_life' },
        { label: 'Track my productivity', value: 'tracking' }
      ]
    }
  ];

  get total(): number { return this.questions.length; }
  get progress(): number { return Math.round(((this.currentStep) / this.total) * 100); }
  get currentQuestion(): Question { return this.questions[this.currentStep]; }
  get selectedValue(): string | undefined { return this.answers[this.currentQuestion.key]; }
  get isLastQuestion(): boolean { return this.currentStep === this.total - 1; }

  select(value: string): void {
    this.answers[this.currentQuestion.key] = value;
  }

  next(): void {
    if (!this.selectedValue) return;
    if (this.isLastQuestion) {
      this.submit();
    } else {
      this.currentStep++;
    }
  }

  skipQuestion(): void {
    delete this.answers[this.currentQuestion.key];
    if (this.isLastQuestion) {
      this.submit();
    } else {
      this.currentStep++;
    }
  }

  skipAll(): void {
    this.questionnaireService.skip().subscribe({ error: () => {} });
    this.closed.emit();
  }

  private submit(): void {
    this.submitting = true;
    this.questionnaireService.submit(this.answers).subscribe({
      next: () => {
        this.submitting = false;
        this.showCompletion = true;
      },
      error: () => {
        this.submitting = false;
        this.showCompletion = true;
      }
    });
  }

  dismiss(): void {
    this.closed.emit();
  }

  constructor(private questionnaireService: QuestionnaireService) {}
}
