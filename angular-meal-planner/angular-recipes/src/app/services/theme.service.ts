import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private isDarkModeSubject = new BehaviorSubject<boolean>(false);
    public isDarkMode$ = this.isDarkModeSubject.asObservable();

    constructor() {
        // Check local storage for preference
        const savedTheme = localStorage.getItem('theme');
        const isDark = savedTheme === 'dark';
        this.setTheme(isDark);
    }

    toggleTheme() {
        const current = this.isDarkModeSubject.value;
        this.setTheme(!current);
    }

    private setTheme(isDark: boolean) {
        this.isDarkModeSubject.next(isDark);
        if (isDark) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    }

    isDarkMode(): boolean {
        return this.isDarkModeSubject.value;
    }
}
