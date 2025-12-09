import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-meal-planner-landing',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './meal-planner-landing.component.html',
    styleUrls: ['./meal-planner-landing.component.scss']
})
export class MealPlannerLandingComponent {
    constructor(
        private router: Router
    ) { }

    navigateTo(action: string) {
        this.router.navigate(['/meal-planner', action]);
    }

    goBack() {
        this.router.navigate(['/home']);
    }
}
