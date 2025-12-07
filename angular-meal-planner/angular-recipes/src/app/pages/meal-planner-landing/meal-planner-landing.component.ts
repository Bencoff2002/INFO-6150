import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-meal-planner-landing',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="landing-container">
            <!-- Navbar -->
            <nav class="navbar">
                <div class="navbar-content">
                    <button class="nav-link" (click)="goBack()">
                        <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20">
                            <path d="M0 0h24v24H0z" fill="none"/>
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                        </svg>
                        Back
                    </button>
                </div>
            </nav>

            <div class="landing-content">
                <div class="header">
                    <h1 class="title">
                        <svg xmlns="http://www.w3.org/2000/svg" height="40" viewBox="0 0 24 24" width="40">
                            <path d="M0 0h24v24H0z" fill="none"/>
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                        </svg>
                        Meal Planner
                    </h1>
                    
                </div>

                <div class="actions-grid">
                    <button class="action-card create" (click)="navigateTo('create')">
                        <div class="icon">
                            <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 0 24 24" width="48">
                                <path d="M0 0h24v24H0z" fill="none"/>
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                        </div>
                        <h2>Create Meal Plan</h2>
                        <p>Start planning a new week</p>
                    </button>

                    <button class="action-card view" (click)="navigateTo('view')">
                        <div class="icon">
                            <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 0 24 24" width="48">
                                <path d="M0 0h24v24H0z" fill="none"/>
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
                        </div>
                        <h2>View Meal Plans</h2>
                        <p>Browse your saved plans</p>
                    </button>

                    <button class="action-card update" (click)="navigateTo('update')">
                        <div class="icon">
                            <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 0 24 24" width="48">
                                <path d="M0 0h24v24H0z" fill="none"/>
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </div>
                        <h2>Update Meal Plan</h2>
                        <p>Edit an existing plan</p>
                    </button>

                    <button class="action-card delete" (click)="navigateTo('delete')">
                        <div class="icon">
                            <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 0 24 24" width="48">
                                <path d="M0 0h24v24H0z" fill="none"/>
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </div>
                        <h2>Delete Meal Plan</h2>
                        <p>Remove a saved plan</p>
                    </button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .navbar {
            background: transparent;
            position: relative;
            z-index: 10;
            padding: 12px 0;
        }

        .navbar-content {
            max-width: 1000px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            align-items: center;
        }

        .nav-link {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.95rem;
            font-weight: 500;
            color: var(--text-primary);
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .nav-link svg {
            fill: currentColor;
        }

        .nav-link:hover {
            background-color: var(--bg-tertiary);
            color: var(--text-primary);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .landing-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 40px 20px;
        }

        .landing-content {
            max-width: 1000px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            margin-bottom: 60px;
        }

        .title {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0 0 16px 0;
            color: #2c3e50;

            svg {
                fill: #FF9F29;
            }
        }

        .subtitle {
            font-size: 1.25rem;
            color: #7f8c8d;
            margin: 0;
        }

        .actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
            margin-top: 40px;
        }

        .action-card {
            background: white;
            border: none;
            border-radius: 16px;
            padding: 40px 32px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            position: relative;
            overflow: hidden;

            &::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #FF9F29, #ff8c00);
                transform: scaleX(0);
                transition: transform 0.3s ease;
            }

            &:hover {
                transform: translateY(-8px);
                box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);

                &::before {
                    transform: scaleX(1);
                }

                .icon svg {
                    transform: scale(1.1);
                }
            }

            &:active {
                transform: translateY(-4px);
            }
        }

        .icon {
            margin-bottom: 20px;

            svg {
                fill: #FF9F29;
                transition: transform 0.3s ease;
            }
        }

        .action-card h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 0 0 12px 0;
            color: #2c3e50;
        }

        .action-card p {
            font-size: 1rem;
            color: #7f8c8d;
            margin: 0;
        }

        .action-card.create .icon svg {
            fill: #27ae60;
        }

        .action-card.view .icon svg {
            fill: #3498db;
        }

        .action-card.update .icon svg {
            fill: #f39c12;
        }

        .action-card.delete .icon svg {
            fill: #e74c3c;
        }

        @media (max-width: 768px) {
            .landing-container {
                padding: 20px 12px;
            }

            .title {
                font-size: 2rem;
            }

            .subtitle {
                font-size: 1rem;
            }

            .actions-grid {
                grid-template-columns: 1fr;
                gap: 16px;
            }

            .action-card {
                padding: 32px 24px;
            }
        }

        /* Dark Theme */
        :host-context(body.dark-theme) .landing-container {
            background: var(--bg-primary);
        }

        :host-context(body.dark-theme) .title {
            color: var(--text-primary);
        }

        :host-context(body.dark-theme) .subtitle {
            color: var(--text-secondary);
        }

        :host-context(body.dark-theme) .action-card {
            background: var(--card-bg);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

            &:hover {
                background: var(--card-bg);
                box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
            }
        }

        :host-context(body.dark-theme) .action-card h2 {
            color: var(--text-primary);
        }

        :host-context(body.dark-theme) .action-card p {
            color: var(--text-secondary);
        }

        :host-context(body.dark-theme) .nav-link {
            color: var(--text-primary);

            &:hover {
                background: rgba(255, 159, 41, 0.15);
                color: #FF9F29;
            }
        }

        /* Force remove navbar background in dark theme (overrides global styles) */
        :host-context(body.dark-theme) .navbar {
            background-color: transparent !important;
            box-shadow: none;
            border: none;
        }
    `]
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
