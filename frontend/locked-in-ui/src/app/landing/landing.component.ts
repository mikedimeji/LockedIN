import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  mobileMenuOpen = false;

  faqItems = [
    {
      q: 'Is TokiSpirit really free?',
      a: 'Yes. The Pomodoro timer, basic themes, todo planner, and stats tracking are all free forever — no credit card required.',
      open: false
    },
    {
      q: 'What does Premium unlock?',
      a: 'Premium gives you all 50+ animated themes, unlimited planner topics, advanced analytics, calendar time-blocking, premium avatars, and no ads.',
      open: false
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Absolutely. Cancel from your account settings at any time. You keep Premium access until the end of your billing period.',
      open: false
    },
    {
      q: 'What payment methods are accepted?',
      a: 'We use Stripe for secure payments. All major credit and debit cards are accepted.',
      open: false
    }
  ];

  toggleFaq(item: any) {
    item.open = !item.open;
  }
}
