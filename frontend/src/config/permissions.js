// Role-based permissions configuration for the Preschool ERP
// This defines what features each role can access

export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    OWNER: 'owner', 
    ADMIN: 'admin',
    ACADEMIC_COORDINATOR: 'academic_coordinator',
    TEACHER: 'teacher',
    PARENT: 'parent'
};

export const FEATURES = {
    // Dashboard & Analytics
    ANALYTICS_DASHBOARD: 'analytics_dashboard',
    BASIC_DASHBOARD: 'basic_dashboard',
    CENTER_COMPARISON: 'center_comparison',
    FINANCIAL_METRICS: 'financial_metrics',
    
    // Management Features
    CHILDREN_MANAGEMENT: 'children_management',
    CLASSROOM_MANAGEMENT: 'classroom_management', 
    STAFF_MANAGEMENT: 'staff_management',
    CENTER_MANAGEMENT: 'center_management',
    
    // Operations
    ATTENDANCE_MANAGEMENT: 'attendance_management',
    ENQUIRY_MANAGEMENT: 'enquiry_management',
    BILLING_MANAGEMENT: 'billing_management',
    INVOICE_GENERATION: 'invoice_generation',
    PAYMENT_PROCESSING: 'payment_processing',
    
    // Reports & Analytics
    REPORTS_VIEW: 'reports_view',
    FINANCIAL_REPORTS: 'financial_reports',
    ATTENDANCE_REPORTS: 'attendance_reports',
    
    // Settings & Configuration
    SYSTEM_SETTINGS: 'system_settings',
    PROGRAM_SETTINGS: 'program_settings',
    FEE_STRUCTURE: 'fee_structure',
    COMPANY_SETTINGS: 'company_settings',
    
    // Documents
    DOCUMENT_MANAGEMENT: 'document_management',
    DOCUMENT_UPLOAD: 'document_upload',
    
    // Personal Features
    VIEW_OWN_CHILDREN: 'view_own_children',
    VIEW_ASSIGNED_CLASSES: 'view_assigned_classes'
};

// Role permissions mapping
export const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: [
        // Full system access
        FEATURES.ANALYTICS_DASHBOARD,
        FEATURES.CENTER_COMPARISON,
        FEATURES.FINANCIAL_METRICS,
        FEATURES.CHILDREN_MANAGEMENT,
        FEATURES.CLASSROOM_MANAGEMENT,
        FEATURES.STAFF_MANAGEMENT,
        FEATURES.CENTER_MANAGEMENT,
        FEATURES.ATTENDANCE_MANAGEMENT,
        FEATURES.ENQUIRY_MANAGEMENT,
        FEATURES.BILLING_MANAGEMENT,
        FEATURES.INVOICE_GENERATION,
        FEATURES.PAYMENT_PROCESSING,
        FEATURES.REPORTS_VIEW,
        FEATURES.FINANCIAL_REPORTS,
        FEATURES.ATTENDANCE_REPORTS,
        FEATURES.SYSTEM_SETTINGS,
        FEATURES.PROGRAM_SETTINGS,
        FEATURES.FEE_STRUCTURE,
        FEATURES.COMPANY_SETTINGS,
        FEATURES.DOCUMENT_MANAGEMENT,
        FEATURES.DOCUMENT_UPLOAD
    ],
    
    [ROLES.OWNER]: [
        // Center-specific full access
        FEATURES.ANALYTICS_DASHBOARD,
        FEATURES.FINANCIAL_METRICS,
        FEATURES.CHILDREN_MANAGEMENT,
        FEATURES.CLASSROOM_MANAGEMENT,
        FEATURES.STAFF_MANAGEMENT,
        FEATURES.ATTENDANCE_MANAGEMENT,
        FEATURES.ENQUIRY_MANAGEMENT,
        FEATURES.BILLING_MANAGEMENT,
        FEATURES.INVOICE_GENERATION,
        FEATURES.PAYMENT_PROCESSING,
        FEATURES.REPORTS_VIEW,
        FEATURES.FINANCIAL_REPORTS,
        FEATURES.ATTENDANCE_REPORTS,
        FEATURES.PROGRAM_SETTINGS,
        FEATURES.FEE_STRUCTURE,
        FEATURES.DOCUMENT_MANAGEMENT,
        FEATURES.DOCUMENT_UPLOAD
    ],
    
    [ROLES.ADMIN]: [
        // Administrative functions
        FEATURES.BASIC_DASHBOARD,
        FEATURES.CHILDREN_MANAGEMENT,
        FEATURES.CLASSROOM_MANAGEMENT,
        FEATURES.ATTENDANCE_MANAGEMENT,
        FEATURES.ENQUIRY_MANAGEMENT,
        FEATURES.BILLING_MANAGEMENT,
        FEATURES.INVOICE_GENERATION,
        FEATURES.REPORTS_VIEW,
        FEATURES.ATTENDANCE_REPORTS,
        FEATURES.PROGRAM_SETTINGS,
        FEATURES.DOCUMENT_MANAGEMENT,
        FEATURES.DOCUMENT_UPLOAD
    ],
    
    [ROLES.ACADEMIC_COORDINATOR]: [
        // Academic and operational focus
        FEATURES.BASIC_DASHBOARD,
        FEATURES.CHILDREN_MANAGEMENT,
        FEATURES.CLASSROOM_MANAGEMENT,
        FEATURES.ATTENDANCE_MANAGEMENT,
        FEATURES.ENQUIRY_MANAGEMENT,
        FEATURES.REPORTS_VIEW,
        FEATURES.ATTENDANCE_REPORTS,
        FEATURES.DOCUMENT_MANAGEMENT
    ],
    
    [ROLES.TEACHER]: [
        // Classroom and student focus
        FEATURES.BASIC_DASHBOARD,
        FEATURES.VIEW_ASSIGNED_CLASSES,
        FEATURES.ATTENDANCE_MANAGEMENT,
        FEATURES.DOCUMENT_MANAGEMENT
    ],
    
    [ROLES.PARENT]: [
        // Limited to own children
        FEATURES.BASIC_DASHBOARD,
        FEATURES.VIEW_OWN_CHILDREN,
        FEATURES.DOCUMENT_MANAGEMENT
    ]
};

// Navigation items with required permissions
export const NAVIGATION_ITEMS = [
    {
        text: 'Dashboard',
        icon: 'HomeIcon',
        path: '/dashboard',
        requiredFeatures: [FEATURES.BASIC_DASHBOARD, FEATURES.ANALYTICS_DASHBOARD],
        requireAny: true // Show if user has ANY of the required features
    },
    {
        text: 'Owners',
        icon: 'PeopleIcon',
        path: '/owners',
        requiredFeatures: [FEATURES.CENTER_MANAGEMENT]
    },
    {
        text: 'Children',
        icon: 'PeopleIcon', 
        path: '/children',
        requiredFeatures: [FEATURES.CHILDREN_MANAGEMENT, FEATURES.VIEW_OWN_CHILDREN],
        requireAny: true
    },
    {
        text: 'Classrooms',
        icon: 'ClassIcon',
        path: '/classrooms', 
        requiredFeatures: [FEATURES.CLASSROOM_MANAGEMENT, FEATURES.VIEW_ASSIGNED_CLASSES],
        requireAny: true
    },
    {
        text: 'Attendance',
        icon: 'HowToRegIcon',
        path: '/attendance',
        requiredFeatures: [FEATURES.ATTENDANCE_MANAGEMENT]
    },
    {
        text: 'Enquiries',
        icon: 'QuestionAnswerIcon',
        path: '/enquiries',
        requiredFeatures: [FEATURES.ENQUIRY_MANAGEMENT]
    },
    {
        text: 'Billing',
        icon: 'MonetizationOnIcon',
        path: '/billing',
        requiredFeatures: [FEATURES.BILLING_MANAGEMENT]
    },
    {
        text: 'Reports', 
        icon: 'AssessmentIcon',
        path: '/reports',
        requiredFeatures: [FEATURES.REPORTS_VIEW]
    },
    {
        text: 'Documents',
        icon: 'FolderIcon',
        path: '/documents',
        requiredFeatures: [FEATURES.DOCUMENT_MANAGEMENT]
    },
    {
        text: 'Settings',
        icon: 'SettingsIcon', 
        path: '/settings',
        requiredFeatures: [
            FEATURES.SYSTEM_SETTINGS, 
            FEATURES.PROGRAM_SETTINGS, 
            FEATURES.FEE_STRUCTURE,
            FEATURES.COMPANY_SETTINGS
        ],
        requireAny: true
    }
];

// Helper function to check if user has permission for a feature
export const hasPermission = (userRole, feature) => {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(feature);
};

// Helper function to check if user has any of the required features
export const hasAnyPermission = (userRole, features) => {
    return features.some(feature => hasPermission(userRole, feature));
};

// Helper function to check if user has all required features
export const hasAllPermissions = (userRole, features) => {
    return features.every(feature => hasPermission(userRole, feature));
};

// Get filtered navigation items for a user role
export const getFilteredNavigation = (userRole) => {
    return NAVIGATION_ITEMS.filter(item => {
        if (item.requireAny) {
            return hasAnyPermission(userRole, item.requiredFeatures);
        }
        return hasAllPermissions(userRole, item.requiredFeatures);
    });
};

// Role display names and descriptions
export const ROLE_INFO = {
    [ROLES.SUPER_ADMIN]: {
        displayName: 'Super Administrator',
        description: 'Full system access across all centers',
        color: '#e91e63',
        priority: 1
    },
    [ROLES.OWNER]: {
        displayName: 'Center Owner', 
        description: 'Full access to assigned center operations',
        color: '#9c27b0',
        priority: 2
    },
    [ROLES.ADMIN]: {
        displayName: 'Administrator',
        description: 'Administrative functions and management',
        color: '#3f51b5',
        priority: 3
    },
    [ROLES.ACADEMIC_COORDINATOR]: {
        displayName: 'Academic Coordinator',
        description: 'Academic oversight and coordination',
        color: '#2196f3',
        priority: 4
    },
    [ROLES.TEACHER]: {
        displayName: 'Teacher',
        description: 'Classroom and student management',
        color: '#4caf50', 
        priority: 5
    },
    [ROLES.PARENT]: {
        displayName: 'Parent',
        description: 'Access to own children information',
        color: '#ff9800',
        priority: 6
    }
};