import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.css'
})
export class PricingComponent {
  mobileMenuOpen = false;
  annual = false;

  get monthlyPrice() { return this.annual ? '6.67' : '9.99'; }
  get annualTotal()  { return '79.99'; }

  faqItems = [
    {
      q: 'Is there a free trial?',
      a: 'You can use TokiSpirit\'s core features completely free, forever. Sign up and start your first session right now — no credit card required.',
      open: false
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes. Cancel anytime from your account settings. You\'ll keep Premium access until the end of your current billing period.',
      open: false
    },
    {
      q: 'What happens to my data if I cancel?',
      a: 'Your account, stats, and gold stay intact. You\'ll simply return to the Free plan — no data is deleted.',
      open: false
    },
    {
      q: 'What payment methods are accepted?',
      a: 'We use Stripe for secure payments. All major credit and debit cards are accepted worldwide.',
      open: false
    },
    {
      q: 'Do you offer refunds?',
      a: 'All payments are final. We do not offer refunds, but you can cancel at any time to stop future charges.',
      open: false
    },
    {
      q: 'Can I switch between monthly and annual?',
      a: 'Yes. You can upgrade from monthly to annual at any time. The switch is prorated automatically via Stripe.',
      open: false
    }
  ];

  comparisonRows = [
    { feature: 'Pomodoro Timer',             free: true,  premium: true  },
    { feature: 'Free themes (10)',            free: true,  premium: true  },
    { feature: 'All 50+ animated themes',    free: false, premium: true  },
    { feature: 'Todo planner (5 topics)',     free: true,  premium: true  },
    { feature: 'Unlimited planner topics',   free: false, premium: true  },
    { feature: 'Streak & session tracking',  free: true,  premium: true  },
    { feature: 'Advanced analytics',         free: false, premium: true  },
    { feature: 'Ambience sounds',            free: true,  premium: true  },
    { feature: 'Calendar time blocking',     free: false, premium: true  },
    { feature: 'Starter avatars (3)',         free: true,  premium: true  },
    { feature: 'Premium avatars & cosmetics',free: false, premium: true  },
    { feature: '150 gold welcome bonus',     free: true,  premium: true  },
    { feature: 'No ads',                     free: false, premium: true  },
  ];

  toggleFaq(item: any) { item.open = !item.open; }
}
