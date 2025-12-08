import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const sessionToken = localStorage.getItem('sessionToken');
    const csrfToken = localStorage.getItem('csrfToken');

    const headers = {};

    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (sessionToken) headers['X-Session-Token'] = sessionToken;
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

    return headers;
};

// ============================================================================
// ACADEMIC COORDINATOR API
// ============================================================================

export const lessonPlanCoordinatorAPI = {
    /**
     * Get all active centers
     */
    async getCenters() {
        const response = await axios.get(`${apiBase}/lesson-plans/coordinator/centers`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    /**
     * Get all classrooms, optionally filtered by center
     */
    async getClassrooms(centerId = null) {
        const params = centerId ? { centerId } : {};
        const response = await axios.get(`${apiBase}/lesson-plans/coordinator/classrooms`, {
            params,
            headers: getAuthHeaders()
        });
        return response.data;
    },

    /**
     * Get all active children for creating lesson plans
     */
    async getChildren(centerId = null) {
        const params = centerId ? { centerId } : {};
        const response = await axios.get(`${apiBase}/lesson-plans/coordinator/children`, {
            params,
            headers: getAuthHeaders()
        });
        return response.data;
    },

    /**
     * Create a new lesson plan
     */
    async createPlan(planData) {
        const response = await axios.post(
            `${apiBase}/lesson-plans/coordinator/create`,
            planData,
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    /**
     * Get all lesson plans created by coordinator
     */
    async getPlans(filters = {}) {
        const response = await axios.get(`${apiBase}/lesson-plans/coordinator/plans`, {
            params: filters,
            headers: getAuthHeaders()
        });
        return response.data;
    },

    /**
     * Submit lesson plan to admin
     */
    async submitPlan(planId) {
        const response = await axios.put(
            `${apiBase}/lesson-plans/coordinator/${planId}/submit`,
            {},
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    /**
     * Get feedback for a specific lesson plan
     */
    async getFeedback(planId) {
        const response = await axios.get(
            `${apiBase}/lesson-plans/coordinator/${planId}/feedback`,
            { headers: getAuthHeaders() }
        );
        return response.data;
    }
};

// ============================================================================
// ADMIN / CENTER DIRECTOR API
// ============================================================================

export const lessonPlanAdminAPI = {
    /**
     * Get all submitted lesson plans pending forwarding
     */
    async getPendingPlans(centerId = null) {
        const params = centerId ? { centerId } : {};
        const response = await axios.get(`${apiBase}/lesson-plans/admin/pending`, {
            params,
            headers: getAuthHeaders()
        });
        return response.data;
    },

    /**
     * Forward lesson plan to teacher
     */
    async forwardToTeacher(planId, teacherId, notes = '') {
        const response = await axios.post(
            `${apiBase}/lesson-plans/admin/${planId}/forward-to-teacher`,
            { teacherId, notes },
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    /**
     * Get all lesson plans with feedback received
     */
    async getFeedbackReceivedPlans(centerId = null) {
        const params = centerId ? { centerId } : {};
        const response = await axios.get(`${apiBase}/lesson-plans/admin/feedback-received`, {
            params,
            headers: getAuthHeaders()
        });
        return response.data;
    },

    /**
     * Forward feedback to academic coordinator
     */
    async forwardFeedback(planId, notes = '') {
        const response = await axios.post(
            `${apiBase}/lesson-plans/admin/${planId}/forward-feedback`,
            { notes },
            { headers: getAuthHeaders() }
        );
        return response.data;
    }
};

// ============================================================================
// TEACHER API
// ============================================================================

export const lessonPlanTeacherAPI = {
    /**
     * Get all lesson plans assigned to teacher
     */
    async getAssignedPlans(status = null) {
        const params = status ? { status } : {};
        const response = await axios.get(`${apiBase}/lesson-plans/teacher/assigned`, {
            params,
            headers: getAuthHeaders()
        });
        return response.data;
    },

    /**
     * Get detailed lesson plan with all activities
     */
    async getPlanDetails(planId) {
        const response = await axios.get(
            `${apiBase}/lesson-plans/teacher/${planId}/details`,
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    /**
     * Acknowledge receipt of lesson plan
     */
    async acknowledgePlan(planId) {
        const response = await axios.put(
            `${apiBase}/lesson-plans/teacher/${planId}/acknowledge`,
            {},
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    /**
     * Submit feedback for activity or overall plan
     */
    async submitFeedback(planId, feedbackData) {
        const response = await axios.post(
            `${apiBase}/lesson-plans/teacher/${planId}/feedback`,
            feedbackData,
            { headers: getAuthHeaders() }
        );
        return response.data;
    }
};

// ============================================================================
// SHARED API
// ============================================================================

export const lessonPlanSharedAPI = {
    /**
     * Get lesson plan by ID (with full details)
     */
    async getPlanById(planId) {
        const response = await axios.get(
            `${apiBase}/lesson-plans/${planId}`,
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    /**
     * Get all lesson plans for a specific child
     */
    async getPlansByChild(childId) {
        const response = await axios.get(
            `${apiBase}/lesson-plans/child/${childId}`,
            { headers: getAuthHeaders() }
        );
        return response.data;
    }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get week start and end dates for a given date
 */
export const getWeekDates = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
        weekStart: monday.toISOString().split('T')[0],
        weekEnd: sunday.toISOString().split('T')[0]
    };
};

/**
 * Get week number for a given date
 */
export const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

/**
 * Format date for display
 */
export const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Get status badge color
 */
export const getStatusColor = (status) => {
    const colors = {
        draft: 'default',
        submitted: 'primary',
        forwarded_to_teacher: 'secondary',
        in_progress: 'warning',
        feedback_received: 'info',
        completed: 'success',
        archived: 'default'
    };
    return colors[status] || 'default';
};

/**
 * Get status display text
 */
export const getStatusText = (status) => {
    const texts = {
        draft: 'Draft',
        submitted: 'Submitted',
        forwarded_to_teacher: 'With Teacher',
        in_progress: 'In Progress',
        feedback_received: 'Feedback Received',
        completed: 'Completed',
        archived: 'Archived'
    };
    return texts[status] || status;
};

/**
 * Activity categories
 */
export const ACTIVITY_CATEGORIES = [
    { value: 'circle_time_music', label: 'Circle Time + Music', icon: '🎵' },
    { value: 'literacy_numeracy', label: 'Literacy/Numeracy', icon: '📚' },
    { value: 'evs', label: 'EVS', icon: '🌱' },
    { value: 'art_creative', label: 'Art & Creative', icon: '🎨' },
    { value: 'play_indoor_outdoor', label: 'Play (Indoor/Outdoor)', icon: '⚽' },
    { value: 'skill_development', label: 'Skill Development', icon: '🎯' },
    { value: 'life_skill', label: 'Life Skill', icon: '🏠' },
    { value: 'methodology', label: 'Methodology', icon: '📋' }
];

/**
 * Days of week
 */
export const DAYS_OF_WEEK = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];

/**
 * Feedback ratings
 */
export const FEEDBACK_RATINGS = [
    { value: 'excellent', label: 'Excellent', color: 'success' },
    { value: 'good', label: 'Good', color: 'primary' },
    { value: 'satisfactory', label: 'Satisfactory', color: 'warning' },
    { value: 'needs_improvement', label: 'Needs Improvement', color: 'error' }
];

/**
 * Child engagement levels
 */
export const ENGAGEMENT_LEVELS = [
    { value: 'highly_engaged', label: 'Highly Engaged' },
    { value: 'engaged', label: 'Engaged' },
    { value: 'somewhat_engaged', label: 'Somewhat Engaged' },
    { value: 'not_engaged', label: 'Not Engaged' }
];

/**
 * Completion statuses
 */
export const COMPLETION_STATUSES = [
    { value: 'completed', label: 'Completed' },
    { value: 'partially_completed', label: 'Partially Completed' },
    { value: 'not_completed', label: 'Not Completed' },
    { value: 'modified', label: 'Modified' }
];
