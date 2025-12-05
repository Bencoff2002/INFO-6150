import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-recipe-card',
    templateUrl: './recipe-card.component.html',
    styleUrls: ['./recipe-card.component.scss']
})
export class RecipeCardComponent {
    @Input() recipe: any;
    @Input() user: any;
    @Input() favorites: any[] = [];
    @Input() rating: number | null = null;
    @Input() featured: boolean = false;
    @Input() onOpen: ((recipe: any) => void) | null = null;
    @Input() onDeleted: ((id: any) => void) | null = null;

    get fav() {
        return this.favorites?.find(f => f.recipeId === this.recipe?.id);
    }

    handleOpen() {
        if (this.onOpen) {
            this.onOpen(this.recipe);
        } else {
            // Default navigation logic here
        }
    }

    handleToggleFavorite(event: Event) {
        event.stopPropagation();
        // Add/remove favorite logic here
    }

    handleDelete(event: Event) {
        event.stopPropagation();
        if (this.onDeleted) {
            this.onDeleted(this.recipe.id);
        }
    }

    // Add rating, comment, and other advanced features as needed
}
