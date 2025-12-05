import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-admin-reports',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './admin-reports.component.html',
    styleUrls: ['./admin-reports.component.scss']
})
export class AdminReportsComponent {
    currentDate = new Date();

    constructor(
        private router: Router,
        private location: Location
    ) { }

    goBack() {
        this.location.back();
    }

    navigateToReport(reportType: string) {
        this.router.navigate(['/admin/reports', reportType]);
    }
}
