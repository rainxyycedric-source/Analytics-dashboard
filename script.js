 class AnalyticsTracker {
    constructor() {
        this.dataKey = 'analytics_data';
        this.data = this.loadData();
        this.init();
    }

    loadData() {
        try {
            return JSON.parse(localStorage.getItem(this.dataKey)) || {
                totalViews: 0,
                uniqueVisitors: new Set(),
                visits: [],
                sessions: []
            };
        } catch {
            return { totalViews: 0, uniqueVisitors: new Set(), visits: [], sessions: [] };
        }
    }

    saveData() {
        localStorage.setItem(this.dataKey, JSON.stringify(this.data));
    }

    trackVisit() {
        const visitorId = this.getVisitorId();
        const now = Date.now();
        const today = new Date().toDateString();
        
        this.data.totalViews++;
        
        if (!this.data.uniqueVisitors.has(visitorId)) {
            this.data.uniqueVisitors.add(visitorId);
        }
        
        this.data.visits.push({
            id: visitorId,
            timestamp: now,
            referrer: document.referrer,
            userAgent: navigator.userAgent.slice(0, 100),
            today: today
        });

        if (this.data.visits.length > 1000) {
            this.data.visits = this.data.visits.slice(-1000);
        }

        this.saveData();
        this.updateDisplay();
    }

    getVisitorId() {
        let id = localStorage.getItem('visitor_id');
        if (!id) {
            id = 'vid_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            localStorage.setItem('visitor_id', id);
        }
        return id;
    }

    init() {
        this.trackVisit();
        setInterval(() => this.updateDisplay(), 5000);
        
        document.getElementById('exportData').addEventListener('click', () => this.exportData());
        document.getElementById('resetData').addEventListener('click', () => this.resetData());
    }

    updateDisplay() {
        document.getElementById('totalViews').textContent = this.data.totalViews.toLocaleString();
        document.getElementById('uniqueVisitors').textContent = this.data.uniqueVisitors.size.toLocaleString();
        
        const today = new Date().toDateString();
        const todayViews = this.data.visits.filter(v => v.today === today).length;
        document.getElementById('todayViews').textContent = todayViews;

        this.updateReferrers();
        this.updateRecentVisitors();
    }

    updateReferrers() {
        const referrers = {};
        this.data.visits.slice(-50).forEach(visit => {
            const ref = visit.referrer || 'Direct';
            referrers[ref] = (referrers[ref] || 0) + 1;
        });

        const list = document.getElementById('referrersList');
        list.innerHTML = Object.entries(referrers)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([ref, count]) => `<li><span>${ref.length > 50 ? ref.slice(0, 50) + '...' : ref}</span><span>${count}</span></li>`)
            .join('');
    }

    updateRecentVisitors() {
        const list = document.getElementById('recentVisitors');
        const recent = this.data.visits.slice(-10).reverse().map(visit => {
            const time = new Date(visit.timestamp).toLocaleString();
            return `<li>${time} - ${visit.id.slice(0, 12)}...</li>`;
        });
        list.innerHTML = recent.join('');
    }

    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analytics_${new Date().toISOString().slice(0,10)}.json`;
        link.click();
    }

    resetData() {
        if (confirm('Reset all analytics data? This cannot be undone.')) {
            localStorage.removeItem(this.dataKey);
            localStorage.removeItem('visitor_id');
            location.reload();
        }
    }
}

new AnalyticsTracker();
