/*
 * Client-side script to fetch sailing events from the Sailor site, parse
 * them and display them in the UI. Supports filtering by branch via
 * query parameters and a drop-down list, and groups events into two
 * categories: "students" and "pre-practical". Adds a Hebrew day-of-week
 * symbol next to each date.
 */

// Vercel serverless function endpoint (separate API deployment)
const vercelApiUrl = 'https://sailor-proxy-api.vercel.app/api/sailor-proxy';

// Simple cache to reduce proxy requests
const cache = {
    data: null,
    timestamp: null,
    ttl: 5 * 60 * 1000 // 5 minutes
};

// Mapping of day index (0=Sunday) to Hebrew abbreviations with geresh (Geresh)
const hebrewDays = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];


// When the document is ready, fetch and render events
document.addEventListener('DOMContentLoaded', () => {
    // Show loading message
    const container = document.getElementById('events-container');
    container.innerHTML = '<div class="loading"><p>טוען נתונים...</p></div>';
    
    fetchEvents().then(events => {
        console.log(`Successfully fetched ${events.length} events`);
        const urlParams = new URLSearchParams(window.location.search);
        const branchParam = urlParams.get('branch') ? urlParams.get('branch').split(',') : [];
        const categoryParam = urlParams.get('category') ? urlParams.get('category').split(',') : ['תלמידים', 'טרום מעשי'];
        
        renderFilters(events, branchParam, categoryParam);
        renderEvents(events, branchParam, categoryParam);
    }).catch(err => {
        console.error('Error fetching events:', err);
        container.innerHTML = `
            <div class="error">
                <h3>לא ניתן לטעון נתוני הפלגות</h3>
                <p>המערכת לא הצליחה לקבל נתונים מאתר סיילור.</p>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #007acc; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    נסה שוב
                </button>
                <button onclick="window.open('https://sailor.co.il/הפלגותתלמידים', '_blank')" style="margin-top: 1rem; margin-right: 0.5rem; padding: 0.75rem 1.5rem; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    עבור לאתר סיילור
                </button>
            </div>
        `;
    });
});

/**
 * Fetches sailing data directly from the Sailor API.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of event objects.
 */
async function fetchEvents() {
    // Check cache first
    if (cache.data && cache.timestamp && (Date.now() - cache.timestamp) < cache.ttl) {
        console.log('Using cached data');
        return cache.data;
    }
    
    try {
        console.log('Fetching sailing data from Vercel function...');
        
        // Try Vercel serverless function first
        const response = await fetch(vercelApiUrl);
        
        if (!response.ok) {
            throw new Error(`Vercel function HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Vercel function response received:', data);
        
        if (!data.success) {
            throw new Error(`Vercel function error: ${data.error}`);
        }
        
        if (!data.events) {
            throw new Error('Vercel function response does not contain events data');
        }
        
        console.log(`Received ${data.events.length} parsed events from Vercel function`);
        
        // Cache the results
        cache.data = data.events;
        cache.timestamp = Date.now();
        
        return data.events;
    } catch (error) {
        console.warn('Vercel function failed:', error.message);
        throw new Error('Unable to retrieve sailing data from Sailor website. Please try again later.');
    }
}

/**
 * Renders all filter dropdowns and attaches change listeners.
 * @param {Array<Object>} events List of all events.
 * @param {string} selectedBranch Branch selected via query param.
 * @param {string} selectedCategory Category selected via query param.
 */
function renderFilters(events, selectedBranches, selectedCategories) {
    const branchCheckboxes = document.getElementById('branch-checkboxes');
    const categoryCheckboxes = document.getElementById('category-checkboxes');
    
    // Extract unique branches
    const branches = Array.from(new Set(events.map(e => e.branch).filter(Boolean))).sort();
    
    // Populate branch checkboxes
    branchCheckboxes.innerHTML = '';
    branches.forEach(br => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" value="${br}" ${selectedBranches.includes(br) ? 'checked' : ''}>
            <span>${br}</span>
        `;
        branchCheckboxes.appendChild(label);
    });
    
    // Set category checkboxes
    const categoryInputs = categoryCheckboxes.querySelectorAll('input[type="checkbox"]');
    categoryInputs.forEach(input => {
        input.checked = selectedCategories.includes(input.value);
    });
    
    // Event listeners for all checkboxes
    const allCheckboxes = [...branchCheckboxes.querySelectorAll('input[type="checkbox"]'), 
                          ...categoryCheckboxes.querySelectorAll('input[type="checkbox"]')];
    allCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateFiltersAndRender();
        });
    });
}

/**
 * Updates URL parameters and re-renders events based on current filter selections.
 */
function updateFiltersAndRender() {
    const branchCheckboxes = document.getElementById('branch-checkboxes');
    const categoryCheckboxes = document.getElementById('category-checkboxes');
    
    const selectedBranches = Array.from(branchCheckboxes.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    const selectedCategories = Array.from(categoryCheckboxes.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    
    const params = new URLSearchParams(window.location.search);
    
    // Update URL parameters
    if (selectedBranches.length > 0) {
        params.set('branch', selectedBranches.join(','));
    } else {
        params.delete('branch');
    }
    
    if (selectedCategories.length > 0) {
        params.set('category', selectedCategories.join(','));
    } else {
        params.delete('category');
    }
    
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    history.replaceState(null, '', newUrl);
    
    // Re-render events with current filters
    renderEvents(window._sailorEvents, selectedBranches, selectedCategories);
}


/**
 * Renders the events into the page with filtering.
 * @param {Array<Object>} events List of all events.
 * @param {Array<string>} branches Branches to filter by.
 * @param {Array<string>} categories Categories to filter by.
 */
function renderEvents(events, branches, categories) {
    // Store events globally for re-rendering on filter change
    window._sailorEvents = events;
    const container = document.getElementById('events-container');
    container.innerHTML = '';
    
    // Apply filters
    let filtered = events;
    
    if (branches.length > 0) {
        filtered = filtered.filter(e => branches.includes(e.branch));
    }
    
    if (categories.length > 0) {
        filtered = filtered.filter(e => categories.includes(e.eventType));
    }
    
    
    // Group events by type while preserving order
    const studentEvents = filtered.filter(e => e.eventType === 'תלמידים');
    const preEvents = filtered.filter(e => e.eventType === 'טרום מעשי');
    if (!filtered.length) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>לא נמצאו הפלגות</h3>
                <p>לא נמצאו הפלגות עבור הסינון הנבחר. נסה לשנות את הסינון או לבדוק מאוחר יותר.</p>
            </div>
        `;
        return;
    }
    // Render groups
    [
        { title: 'הפלגות תלמידים', events: studentEvents },
        { title: 'הפלגות טרום מעשי', events: preEvents }
    ].forEach(group => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'event-group';
        const h2 = document.createElement('h2');
        h2.textContent = group.title;
        groupDiv.appendChild(h2);
        if (group.events.length) {
            group.events.forEach(ev => {
                const card = document.createElement('div');
                card.className = 'event-card';
                const h3 = document.createElement('h3');
                h3.textContent = ev.title;
                card.appendChild(h3);
                const meta = document.createElement('p');
                meta.className = 'event-meta';
                meta.innerHTML = `<strong>תאריך:</strong> ${ev.date} (${ev.dayOfWeek || '—'})<br>
                    <strong>שעות:</strong> ${ev.startTime} - ${ev.endTime}<br>
                    <strong>סניף:</strong> ${ev.branch} | <strong>רציף:</strong> ${ev.pier}<br>
                    <strong>כלי שייט:</strong> ${ev.boat}`;
                card.appendChild(meta);
                const desc = document.createElement('p');
                desc.textContent = ev.description;
                card.appendChild(desc);
                const actions = document.createElement('div');
                actions.className = 'event-actions';
                if (ev.moreUrl) {
                    const moreA = document.createElement('a');
                    moreA.href = ev.moreUrl;
                    moreA.target = '_blank';
                    moreA.rel = 'noopener';
                    moreA.textContent = 'לפרטים נוספים';
                    actions.appendChild(moreA);
                }
                if (ev.orderUrl) {
                    const orderA = document.createElement('a');
                    orderA.href = ev.orderUrl;
                    orderA.target = '_blank';
                    orderA.rel = 'noopener';
                    orderA.textContent = 'להזמנה';
                    actions.appendChild(orderA);
                }
                card.appendChild(actions);
                groupDiv.appendChild(card);
            });
        } else {
            const p = document.createElement('p');
            p.textContent = 'אין הפלגות זמינות מקטגוריה זו.';
            groupDiv.appendChild(p);
        }
        container.appendChild(groupDiv);
    });
}