# Lesson Planning System - Implementation Guide

## 📋 Overview

The Lesson Planning System is a comprehensive workflow management tool that enables Academic Coordinators to create individualized weekly lesson plans for children, with feedback loops involving Teachers and Admins.

**Commit:** fb27804
**Branch:** staging-clean
**Status:** ✅ Backend Complete | ⚠️ Frontend Pending

---

## 🎯 System Workflow

```
Academic Coordinator → Creates Weekly Lesson Plan → Submits
                                ↓
                Admin/Center Director → Forwards to Teacher
                                ↓
                    Teacher → Views Plan → Provides Feedback
                                ↓
                Admin/Center Director → Forwards Feedback
                                ↓
Academic Coordinator → Reviews Feedback → Creates Next Week's Plan
```

---

## 📊 Activity Categories (from Curriculum Table)

Each lesson plan includes activities across 8 categories for each day of the week:

| Category | Description |
|----------|-------------|
| **Circle Time + Music** | Group activities, songs, rhythmic play |
| **Literacy/Numeracy** | Reading, writing, counting, numbers |
| **EVS** | Environmental Studies - nature, science |
| **Art & Creative** | Drawing, painting, crafts |
| **Play (Indoor/Outdoor)** | Free play, structured games |
| **Skill Development** | Fine/gross motor skills |
| **Life Skill** | Daily living skills, self-care |
| **Methodology** | Teaching approaches, strategies |

---

## 🗄️ Database Schema

### Core Tables Created (Migration 050)

#### 1. `lesson_plans` Table
Stores weekly lesson plans for individual children.

**Key Fields:**
- `id` - UUID primary key
- `child_id` - Links to specific child
- `center_id`, `classroom_id` - Location info
- `week_number`, `week_start_date`, `week_end_date` - Week identification
- `created_by` - Academic Coordinator user ID
- `status` - Workflow status
- `overall_objectives` - Week's learning goals
- `version` - For tracking redesigns

**Status Values:**
- `draft` - Being created
- `submitted` - Sent to admin
- `forwarded_to_teacher` - Assigned to teacher
- `in_progress` - Teacher working on it
- `feedback_received` - Teacher completed feedback
- `completed` - Feedback forwarded to coordinator
- `archived` - Historical record

#### 2. `lesson_plan_activities` Table
Stores the 8 activity categories for each day of the week.

**Key Fields:**
- `lesson_plan_id` - Links to lesson plan
- `category` - One of 8 activity categories
- `day_of_week` - Monday through Saturday
- `activity_title`, `activity_description`
- `learning_outcomes` - Expected results
- `materials_needed` - Required resources
- `duration_minutes` - Estimated time
- `instructions` - Teacher instructions
- `adaptations` - Modifications for different needs

**Unique Constraint:** One activity per day per category per plan

#### 3. `lesson_plan_feedback` Table
Stores teacher feedback on activities and overall plan.

**Key Fields:**
- `lesson_plan_id` - Links to plan
- `activity_id` - Specific activity (NULL for overall feedback)
- `teacher_id` - Who provided feedback
- `feedback_type` - activity, overall, incident, achievement
- `rating` - excellent, good, satisfactory, needs_improvement
- `child_engagement` - Engagement level
- `completion_status` - completed, partially_completed, modified
- `observations` - Teacher notes
- `challenges_faced` - Problems encountered
- `child_response` - How child responded
- `suggested_modifications` - Improvements for future
- `achievements` - Notable successes
- `reviewed_by` - Academic coordinator who reviewed

#### 4. `lesson_plan_workflow` Table
Tracks all workflow state transitions.

**Key Fields:**
- `lesson_plan_id` - Links to plan
- `action` - What happened (created, submitted, forwarded, etc.)
- `performed_by`, `performed_by_role` - Who did it
- `forwarded_to` - Target user for forwarding actions
- `notes` - Additional context
- `created_at` - Timestamp

**Actions Tracked:**
- created, submitted_by_coordinator
- forwarded_to_teacher, assigned_to_teacher
- viewed_by_teacher
- feedback_submitted
- feedback_forwarded_to_coordinator
- feedback_reviewed, plan_revised
- archived

#### 5. `lesson_plan_assignments` Table
Tracks teacher assignments for lesson plans.

**Key Fields:**
- `lesson_plan_id`, `teacher_id`
- `assigned_by` - Admin who assigned
- `status` - pending, acknowledged, in_progress, completed
- `acknowledged_at` - When teacher viewed
- `completed_at` - When feedback submitted

#### 6. `lesson_plan_templates` Table (Optional)
Stores reusable activity templates.

**Key Fields:**
- `template_name`, `description`
- `age_group`, `skill_level`, `category`
- `activity_title`, `activity_description`
- `created_by`, `center_id`
- `usage_count` - Popularity tracking

---

## 🔌 Backend API Endpoints

### Academic Coordinator Endpoints

#### `GET /api/lesson-plans/coordinator/children`
Get all active children for creating lesson plans.

**Query Parameters:**
- `centerId` (optional) - Filter by center

**Response:**
```json
{
  "children": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "date_of_birth": "2020-05-15",
      "classroom_name": "Toddlers A",
      "center_name": "Main Center",
      "age_years": 4,
      "age_months": 6
    }
  ]
}
```

#### `POST /api/lesson-plans/coordinator/create`
Create a new lesson plan for a child.

**Request Body:**
```json
{
  "childId": "uuid",
  "centerId": "uuid",
  "classroomId": "uuid",
  "weekStartDate": "2025-01-06",
  "overallObjectives": "Focus on letter recognition and social skills",
  "specialNotes": "Child prefers hands-on activities",
  "activities": [
    {
      "category": "circle_time_music",
      "dayOfWeek": "Monday",
      "title": "Good Morning Song",
      "description": "Sing welcome song with actions",
      "learningOutcomes": "Social interaction, rhythm",
      "materialsNeeded": "Guitar, song sheets",
      "durationMinutes": 15,
      "instructions": "Sit in circle, lead song",
      "adaptations": "Use visual cues for non-verbal children"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Lesson plan created successfully",
  "lessonPlanId": "uuid",
  "weekStart": "2025-01-06",
  "weekEnd": "2025-01-12"
}
```

#### `GET /api/lesson-plans/coordinator/plans`
Get all lesson plans created by coordinator.

**Query Parameters:**
- `status` - Filter by status
- `centerId` - Filter by center
- `weekStart` - Filter by week
- `childId` - Filter by child

#### `PUT /api/lesson-plans/coordinator/:id/submit`
Submit lesson plan to admin (changes status to submitted).

#### `GET /api/lesson-plans/coordinator/:id/feedback`
Get all feedback for a specific lesson plan.

---

### Admin/Center Director Endpoints

#### `GET /api/lesson-plans/admin/pending`
Get all submitted lesson plans pending forwarding to teachers.

#### `POST /api/lesson-plans/admin/:id/forward-to-teacher`
Forward lesson plan to a teacher.

**Request Body:**
```json
{
  "teacherId": "uuid",
  "notes": "Please focus on motor skills activities"
}
```

#### `GET /api/lesson-plans/admin/feedback-received`
Get all lesson plans with teacher feedback pending forwarding to coordinator.

#### `POST /api/lesson-plans/admin/:id/forward-feedback`
Forward feedback to academic coordinator.

**Request Body:**
```json
{
  "notes": "Teacher noted good progress in literacy"
}
```

---

### Teacher Endpoints

#### `GET /api/lesson-plans/teacher/assigned`
Get all lesson plans assigned to teacher.

**Query Parameters:**
- `status` - Filter by assignment status

#### `GET /api/lesson-plans/teacher/:id/details`
Get detailed lesson plan with all activities.

**Response:**
```json
{
  "plan": { },
  "activities": [ ],
  "assignment": {
    "status": "pending",
    "assigned_at": "2025-01-06T10:00:00Z"
  }
}
```

#### `PUT /api/lesson-plans/teacher/:id/acknowledge`
Acknowledge receipt of lesson plan.

#### `POST /api/lesson-plans/teacher/:id/feedback`
Submit feedback for activity or overall plan.

**Request Body:**
```json
{
  "activityId": "uuid",
  "feedbackType": "activity",
  "rating": "excellent",
  "childEngagement": "highly_engaged",
  "completionStatus": "completed",
  "observations": "Child really enjoyed the activity",
  "challengesFaced": "None",
  "childResponse": "Participated enthusiastically",
  "suggestedModifications": "Could extend time by 5 minutes",
  "achievements": "Recognized 3 new letters",
  "attachments": []
}
```

---

### Shared Endpoints

#### `GET /api/lesson-plans/:id`
Get lesson plan by ID with activities, feedback, and workflow history.

#### `GET /api/lesson-plans/child/:childId`
Get all lesson plans for a specific child.

---

## 🔐 Permissions Configuration

### Features Added
```javascript
LESSON_PLAN_CREATE: 'lesson_plan_create'
LESSON_PLAN_VIEW: 'lesson_plan_view'
LESSON_PLAN_FORWARD: 'lesson_plan_forward'
LESSON_PLAN_FEEDBACK: 'lesson_plan_feedback'
LESSON_PLAN_MANAGE: 'lesson_plan_manage'
```

### Role Permissions

| Role | Permissions |
|------|-------------|
| **Academic Coordinator** | CREATE, VIEW, MANAGE |
| **Admin** | VIEW, FORWARD |
| **Center Director** | VIEW, FORWARD |
| **Teacher** | VIEW, FEEDBACK |

### Navigation Item Added
```javascript
{
  text: 'Lesson Planning',
  icon: 'AssignmentIcon',
  path: '/lesson-plans',
  requiredFeatures: [
    LESSON_PLAN_CREATE,
    LESSON_PLAN_VIEW,
    LESSON_PLAN_FORWARD,
    LESSON_PLAN_FEEDBACK
  ],
  requireAny: true
}
```

---

## ⚠️ What's Still Needed - Frontend Implementation

### 1. Academic Coordinator Dashboard
**Location:** `frontend/src/components/LessonPlans/AcademicCoordinatorDashboard.jsx`

**Features Needed:**
- List all children with create lesson plan button
- Weekly lesson plan creator with 8 activity categories × 5-6 days
- View created plans (draft, submitted, completed)
- View feedback from teachers
- Revise plans based on feedback

**Key Components:**
- `ChildSelector` - Select child and week
- `ActivityEditor` - 8-category grid for each day
- `PlanList` - Table of all plans with status
- `FeedbackViewer` - Display teacher feedback
- `PlanSubmitter` - Submit button with confirmation

### 2. Admin/Center Director Dashboard
**Location:** `frontend/src/components/LessonPlans/AdminDashboard.jsx`

**Features Needed:**
- View submitted lesson plans
- Forward plans to teachers (select teacher dropdown)
- View plans with feedback received
- Forward feedback to academic coordinator

**Key Components:**
- `PendingPlansTable` - Submitted plans needing forwarding
- `TeacherSelector` - Dropdown to assign teacher
- `FeedbackReceivedTable` - Plans with teacher feedback
- `ForwardingPanel` - Forward to coordinator

### 3. Teacher Dashboard
**Location:** `frontend/src/components/LessonPlans/TeacherDashboard.jsx`

**Features Needed:**
- View assigned lesson plans
- View detailed weekly plan with all activities
- Acknowledge receipt
- Provide feedback for each activity
- Submit feedback at end of week (Friday)

**Key Components:**
- `AssignedPlansList` - All assigned plans
- `WeeklyPlanViewer` - Display full week grid
- `ActivityFeedbackForm` - Feedback form per activity
- `FeedbackSubmitter` - Submit all feedback

### 4. Child Profile Integration
**Location:** `frontend/src/components/Children/ChildProfile.jsx`

**Features Needed:**
- Add "Lesson Plans" tab to child profile
- Display all lesson plans for that child
- Show status, dates, and links to full plan
- Allow parents to view (read-only)

### 5. Routing Setup
**Location:** `frontend/src/App.jsx` or routing file

**Routes Needed:**
```javascript
// Academic Coordinator routes
/lesson-plans/coordinator
/lesson-plans/coordinator/create
/lesson-plans/coordinator/:id
/lesson-plans/coordinator/:id/edit

// Admin routes
/lesson-plans/admin/pending
/lesson-plans/admin/feedback

// Teacher routes
/lesson-plans/teacher/assigned
/lesson-plans/teacher/:id
/lesson-plans/teacher/:id/feedback

// Shared
/lesson-plans/:id/view
```

---

## 🎨 UI/UX Recommendations

### Weekly Grid Layout
```
| Day       | Circle Time | Literacy | EVS | Art | Play | Skills | Life | Method |
|-----------|-------------|----------|-----|-----|------|--------|------|--------|
| Monday    | [Activity]  | [...]    | ... | ... | ...  | ...    | ...  | ...    |
| Tuesday   | [Activity]  | [...]    | ... | ... | ...  | ...    | ...  | ...    |
| Wednesday | [Activity]  | [...]    | ... | ... | ...  | ...    | ...  | ...    |
| Thursday  | [Activity]  | [...]    | ... | ... | ...  | ...    | ...  | ...    |
| Friday    | [Activity]  | [...]    | ... | ... | ...  | ...    | ...  | ...    |
```

### Activity Card Design
```
┌─────────────────────────────────┐
│ 🎵 Circle Time + Music         │
│ Good Morning Song               │
├─────────────────────────────────┤
│ Duration: 15 mins               │
│ Materials: Guitar, song sheets  │
│                                 │
│ [View Details] [Edit] [Delete]  │
└─────────────────────────────────┘
```

### Status Badge Colors
- **Draft** - Gray
- **Submitted** - Blue
- **Forwarded to Teacher** - Purple
- **In Progress** - Yellow
- **Feedback Received** - Orange
- **Completed** - Green
- **Archived** - Black

---

## 🧪 Testing Workflow

### End-to-End Test Scenario

1. **Academic Coordinator:**
   - Login as academic@vanisris.com
   - Navigate to /lesson-plans/coordinator
   - Select child and week
   - Create activities for Monday-Friday across 8 categories
   - Add overall objectives and special notes
   - Submit plan

2. **Admin:**
   - Login as admin
   - Navigate to /lesson-plans/admin/pending
   - See submitted plan
   - Select teacher from dropdown
   - Forward plan to teacher

3. **Teacher:**
   - Login as teacher@test.com
   - Navigate to /lesson-plans/teacher/assigned
   - Open assigned plan
   - Acknowledge receipt
   - Throughout the week, provide feedback on activities
   - On Friday, complete final feedback and submit

4. **Admin:**
   - Navigate to /lesson-plans/admin/feedback
   - See plan with feedback
   - Forward feedback to academic coordinator

5. **Academic Coordinator:**
   - View feedback on completed plan
   - Create next week's plan based on feedback

---

## 📝 Development Checklist

### Backend ✅ COMPLETE
- [x] Database migration 050 created
- [x] lesson_plans table
- [x] lesson_plan_activities table
- [x] lesson_plan_feedback table
- [x] lesson_plan_workflow table
- [x] lesson_plan_assignments table
- [x] lesson_plan_templates table
- [x] All API endpoints implemented
- [x] Permissions configuration updated
- [x] Navigation item added
- [x] Committed to staging-clean

### Frontend ⚠️ PENDING
- [ ] Academic Coordinator dashboard
  - [ ] Child selector
  - [ ] Weekly activity grid editor
  - [ ] Plan list with filters
  - [ ] Feedback viewer
  - [ ] Submit functionality
- [ ] Admin dashboard
  - [ ] Pending plans table
  - [ ] Teacher assignment selector
  - [ ] Feedback received table
  - [ ] Forward functionality
- [ ] Teacher dashboard
  - [ ] Assigned plans list
  - [ ] Weekly plan viewer
  - [ ] Acknowledge button
  - [ ] Activity feedback forms
  - [ ] Submit feedback
- [ ] Child profile integration
  - [ ] Lesson plans tab
  - [ ] Plan history display
- [ ] Routing setup
- [ ] API integration (axios/fetch)
- [ ] State management (if needed)
- [ ] Form validation
- [ ] Loading states
- [ ] Error handling
- [ ] Responsive design
- [ ] Testing

---

## 🔧 Implementation Priority

1. **HIGH PRIORITY:**
   - Academic Coordinator create/submit functionality
   - Teacher view/feedback functionality
   - Admin forwarding functionality

2. **MEDIUM PRIORITY:**
   - Plan templates
   - Advanced filtering
   - Analytics dashboard

3. **LOW PRIORITY:**
   - Bulk operations
   - Export to PDF
   - Print friendly view

---

## 📚 Related Documentation

- [Permissions Configuration](frontend/src/config/permissions.js)
- [Migration 050](backend/migrations/050_create_lesson_planning_system.sql)
- [Lesson Plan Routes](backend/lessonPlanRoutes.js)

---

## 🆘 Troubleshooting

### Common Issues

**Issue:** 404 on lesson plan endpoints
- **Solution:** Ensure migration 050 has been run
- **Solution:** Verify routes are registered in backend/index.js

**Issue:** Permission denied
- **Solution:** Check user role has appropriate permissions
- **Solution:** Verify JWT token is valid and includes role

**Issue:** Lesson plan creation fails
- **Solution:** Ensure child_id exists in children table
- **Solution:** Check week dates don't overlap existing plans

---

## 📊 Database Relationships

```
users (academic_coordinator)
  └─> creates lesson_plans
        └─> has lesson_plan_activities (many)
        └─> tracked by lesson_plan_workflow (many)
        └─> assigned via lesson_plan_assignments
              └─> to users (teacher)
                    └─> provides lesson_plan_feedback
                          └─> reviewed by users (academic_coordinator)

children
  └─> has lesson_plans (many)

centers
  └─> has lesson_plans (many)

classrooms
  └─> has lesson_plans (many)
```

---

**Implementation Status:** ✅ Backend Complete | ⚠️ Frontend Pending
**Next Steps:** Implement frontend components for three role-based dashboards
**Estimated Frontend Effort:** 6-8 hours of development time

---

*Generated: December 8, 2025*
*Last Updated: December 8, 2025*
