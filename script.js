const menuData = {
    items: []
};

let selectedCategory = 'all';
let selectedDietary = 'all';
let searchQuery = '';
let selectedSuggestionIndex = -1;

function getSuggestions(query) {
    if (!query) return [];
    
    query = query.toLowerCase();
    return menuData.items
        .filter(item => 
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query))
        .slice(0, 5); // Limit to 5 suggestions
}

function highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function showSuggestions(suggestions, query) {
    const container = document.getElementById('suggestions-container');
    
    if (!suggestions.length || !query) {
        container.classList.remove('active');
        return;
    }

    container.innerHTML = suggestions
        .map((item, index) => `
            <div class="suggestion-item" data-index="${index}">
                <span class="item-name">${highlightMatch(item.name, query)}</span>
                <span class="item-category">${item.category}</span>
            </div>
        `)
        .join('');

    container.classList.add('active');
}

function handleSuggestionSelection(suggestion) {
    const searchBox = document.getElementById('search-box');
    searchBox.value = suggestion.name;
    searchQuery = suggestion.name;
    document.getElementById('suggestions-container').classList.remove('active');
    renderMenu();
}

function handleKeyNavigation(e) {
    const suggestions = document.querySelectorAll('.suggestion-item');
    const container = document.getElementById('suggestions-container');
    
    if (!container.classList.contains('active')) return;

    // Remove previous selection
    suggestions.forEach(s => s.classList.remove('selected'));

    switch(e.key) {
        case 'ArrowDown':
            e.preventDefault();
            selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
            break;
        case 'ArrowUp':
            e.preventDefault();
            selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
            break;
        case 'Enter':
            if (selectedSuggestionIndex >= 0) {
                const selectedItem = menuData.items[selectedSuggestionIndex];
                handleSuggestionSelection(selectedItem);
                selectedSuggestionIndex = -1;
            }
            return;
        case 'Escape':
            container.classList.remove('active');
            selectedSuggestionIndex = -1;
            return;
    }

    if (selectedSuggestionIndex >= 0) {
        suggestions[selectedSuggestionIndex].classList.add('selected');
        suggestions[selectedSuggestionIndex].scrollIntoView({
            block: 'nearest',
            behavior: 'smooth'
        });
    }
}

// Initialize filters
function initializeFilters() {
    const categories = ['all', ...new Set(menuData.items.map(item => item.category))];
    const dietaryOptions = ['all', ...new Set(menuData.items.flatMap(item => item.dietary))];

    const categoryFilters = document.getElementById('category-filters');
    const dietaryFilters = document.getElementById('dietary-filters');

    categories.forEach(category => {
        if (category !== 'all') {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            button.dataset.category = category;
            categoryFilters.appendChild(button);
        }
    });

    dietaryOptions.forEach(dietary => {
        if (dietary !== 'all') {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = dietary.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            button.dataset.dietary = dietary;
            dietaryFilters.appendChild(button);
        }
    });
}

function renderMenu() {
    const menuGrid = document.getElementById('menu-grid');
    menuGrid.innerHTML = '';

    const filteredItems = menuData.items.filter(item => {
        const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
        const dietaryMatch = selectedDietary === 'all' || item.dietary.includes(selectedDietary);
        const searchMatch = searchQuery === '' || 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());
        return categoryMatch && dietaryMatch && searchMatch;
    });

    if (filteredItems.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
            <h3>Нічого не знайдено</h3>
            <p>Спробуйте налаштувати пошук або фільтри</p>
        `;
        menuGrid.appendChild(noResults);
        return;
    }

    filteredItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'menu-item';
        itemElement.innerHTML = `
            <div class="menu-item-header">
                <h3 class="menu-item-title">${highlightText(item.name)}</h3>
                <span class="menu-item-price">${item.price}</span>
            </div>
            <p class="menu-item-description">${highlightText(item.description)}</p>
            <div class="dietary-tags">
                ${item.dietary.map(diet => `
                    <span class="dietary-tag ${diet}">
                        ${diet.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                `).join('')}
            </div>
        `;
        menuGrid.appendChild(itemElement);
    });
}

// Function to highlight search terms
function highlightText(text) {
    if (!searchQuery) return text;
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Add debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function handleFilterClick(filterType, value) {
    const buttons = document.querySelectorAll(`[data-${filterType}]`);
    buttons.forEach(btn => btn.classList.remove('active'));
    
    const clickedButton = document.querySelector(`[data-${filterType}="${value}"]`);
    clickedButton.classList.add('active');

    if (filterType === 'category') {
        selectedCategory = value;
    } else if (filterType === 'dietary') {
        selectedDietary = value;
    }

    renderMenu();
}

document.addEventListener('DOMContentLoaded', () => {

fetch("menu.txt") // Fetch the menu data from the text file
    .then((response) => response.text()) // Read the text response
    .then((txt) => {
        const blocks = txt.split("\n\n");
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            const lines = block.split("\n");
            const category = lines[0];
            for (let index = 1; index < lines.length; index++) {
                const nameAndPrice = lines[index++].split(";");
                const name = nameAndPrice[0];
                const price = nameAndPrice[1] || 'n/a';
                const description = lines[index];
                if (name) {
                    menuData.items.push({ name: name, category: category, price: price + '&nbsp;₴', description: description, dietary:[] });
                }
            }
        }

        initializeFilters();
        renderMenu();

        const searchBox = document.getElementById('search-box');
        const clearButton = document.getElementById('clear-search');
        const suggestionsContainer = document.getElementById('suggestions-container');

        const debouncedSearch = debounce((e) => {
            searchQuery = e.target.value;
            const suggestions = getSuggestions(searchQuery);
            showSuggestions(suggestions, searchQuery);
            renderMenu();
            clearButton.classList.toggle('active', searchQuery.length > 0);
        }, 300);

        searchBox.addEventListener('input', debouncedSearch);
        searchBox.addEventListener('keydown', handleKeyNavigation);

        clearButton.addEventListener('click', () => {
            searchBox.value = '';
            searchQuery = '';
            clearButton.classList.remove('active');
            suggestionsContainer.classList.remove('active');
            renderMenu();
            searchBox.focus();
        });

        suggestionsContainer.addEventListener('click', (e) => {
            const suggestionItem = e.target.closest('.suggestion-item');
            if (suggestionItem) {
                const index = parseInt(suggestionItem.dataset.index);
                handleSuggestionSelection(menuData.items[index]);
            }
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-wrapper')) {
                suggestionsContainer.classList.remove('active');
            }
        });

        document.getElementById('category-filters').addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                handleFilterClick('category', e.target.dataset.category);
            }
        });

        document.getElementById('dietary-filters').addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                handleFilterClick('dietary', e.target.dataset.dietary);
            }
        });
    })
    .catch((error) => {
        console.error("Error loading menu:", error);
    });
});
