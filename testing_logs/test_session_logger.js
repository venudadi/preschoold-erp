/**
 * Dynamic Testing Session Logger
 * Tracks E2E testing progress and provides session recovery capabilities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TestSessionLogger {
    constructor() {
        this.sessionId = `e2e_test_${Date.now()}`;
        this.startTime = new Date().toISOString();
        this.logDir = __dirname;
        this.backupDir = path.join(__dirname, 'backup');
        this.currentSessionFile = path.join(this.logDir, 'current_session.json');
        this.sessionLogFile = path.join(this.logDir, `e2e_test_session_${this.formatTimestamp()}.json`);

        this.sessionData = {
            sessionId: this.sessionId,
            testPlan: "E2E_FUNCTIONAL_TESTING_PLAN",
            startTime: this.startTime,
            currentPhase: null,
            currentStep: null,
            status: "initialized",
            phases: {
                phase_1: {
                    name: "Authentication & User Role Testing",
                    status: "pending",
                    startTime: null,
                    endTime: null,
                    steps: [],
                    errors: [],
                    completionRate: "0%"
                },
                phase_2: {
                    name: "Core Module Functionality Testing",
                    status: "pending",
                    startTime: null,
                    endTime: null,
                    steps: [],
                    errors: [],
                    completionRate: "0%"
                },
                phase_3: {
                    name: "Integration & Workflow Testing",
                    status: "pending",
                    startTime: null,
                    endTime: null,
                    steps: [],
                    errors: [],
                    completionRate: "0%"
                },
                phase_4: {
                    name: "User Interface & Experience Testing",
                    status: "pending",
                    startTime: null,
                    endTime: null,
                    steps: [],
                    errors: [],
                    completionRate: "0%"
                },
                phase_5: {
                    name: "Performance & Stress Testing",
                    status: "pending",
                    startTime: null,
                    endTime: null,
                    steps: [],
                    errors: [],
                    completionRate: "0%"
                },
                phase_6: {
                    name: "Security & Data Integrity Testing",
                    status: "pending",
                    startTime: null,
                    endTime: null,
                    steps: [],
                    errors: [],
                    completionRate: "0%"
                },
                phase_7: {
                    name: "Final Integration & Acceptance Testing",
                    status: "pending",
                    startTime: null,
                    endTime: null,
                    steps: [],
                    errors: [],
                    completionRate: "0%"
                }
            },
            errors: [],
            resumeInstructions: "",
            nextAction: "Begin Phase 1: Authentication & User Role Testing",
            environment: {
                frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
                backend_url: process.env.BACKEND_URL || "http://localhost:5001",
                database: "mysql_connection_active",
                node_version: process.version,
                platform: process.platform
            },
            metrics: {
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                skippedTests: 0,
                testCoverage: "0%"
            }
        };

        this.initializeSession();
    }

    formatTimestamp() {
        const now = new Date();
        return now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
    }

    initializeSession() {
        try {
            // Ensure directories exist
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
            }
            if (!fs.existsSync(this.backupDir)) {
                fs.mkdirSync(this.backupDir, { recursive: true });
            }

            // Save initial session data
            this.saveSession();
            console.log(`✅ Test session initialized: ${this.sessionId}`);
            console.log(`📁 Log file: ${this.sessionLogFile}`);
            console.log(`📋 Current session: ${this.currentSessionFile}`);
        } catch (error) {
            console.error('❌ Failed to initialize test session:', error);
            throw error;
        }
    }

    saveSession() {
        try {
            // Save to main session file
            fs.writeFileSync(this.sessionLogFile, JSON.stringify(this.sessionData, null, 2));

            // Save to current session tracker
            fs.writeFileSync(this.currentSessionFile, JSON.stringify(this.sessionData, null, 2));

            // Create backup
            const backupFile = path.join(this.backupDir, `backup_${this.formatTimestamp()}.json`);
            fs.writeFileSync(backupFile, JSON.stringify(this.sessionData, null, 2));
        } catch (error) {
            console.error('❌ Failed to save session:', error);
            throw error;
        }
    }

    startPhase(phaseNumber, description = null) {
        const phaseKey = `phase_${phaseNumber}`;
        if (this.sessionData.phases[phaseKey]) {
            this.sessionData.phases[phaseKey].status = "in_progress";
            this.sessionData.phases[phaseKey].startTime = new Date().toISOString();
            this.sessionData.currentPhase = phaseNumber;
            this.sessionData.status = "in_progress";

            if (description) {
                this.sessionData.phases[phaseKey].description = description;
            }

            this.updateNextAction(phaseNumber);
            this.saveSession();

            console.log(`🚀 Started Phase ${phaseNumber}: ${this.sessionData.phases[phaseKey].name}`);
        }
    }

    completePhase(phaseNumber, completionRate = "100%") {
        const phaseKey = `phase_${phaseNumber}`;
        if (this.sessionData.phases[phaseKey]) {
            this.sessionData.phases[phaseKey].status = "completed";
            this.sessionData.phases[phaseKey].endTime = new Date().toISOString();
            this.sessionData.phases[phaseKey].completionRate = completionRate;

            this.updateNextAction(phaseNumber + 1);
            this.saveSession();

            console.log(`✅ Completed Phase ${phaseNumber}: ${completionRate} completion rate`);
        }
    }

    addStep(phaseNumber, stepDescription, status = "in_progress") {
        const phaseKey = `phase_${phaseNumber}`;
        if (this.sessionData.phases[phaseKey]) {
            const step = {
                description: stepDescription,
                status: status,
                timestamp: new Date().toISOString()
            };

            this.sessionData.phases[phaseKey].steps.push(step);
            this.sessionData.currentStep = stepDescription;
            this.saveSession();

            console.log(`📝 Added step to Phase ${phaseNumber}: ${stepDescription}`);
        }
    }

    completeStep(phaseNumber, stepDescription) {
        const phaseKey = `phase_${phaseNumber}`;
        if (this.sessionData.phases[phaseKey]) {
            const step = this.sessionData.phases[phaseKey].steps.find(s => s.description === stepDescription);
            if (step) {
                step.status = "completed";
                step.completedAt = new Date().toISOString();
            }
            this.saveSession();

            console.log(`✅ Completed step: ${stepDescription}`);
        }
    }

    addError(phaseNumber, error, severity = "medium") {
        const phaseKey = `phase_${phaseNumber}`;
        const errorObj = {
            message: error,
            severity: severity,
            timestamp: new Date().toISOString(),
            phase: phaseNumber
        };

        // Add to phase-specific errors
        if (this.sessionData.phases[phaseKey]) {
            this.sessionData.phases[phaseKey].errors.push(errorObj);
        }

        // Add to global errors
        this.sessionData.errors.push(errorObj);

        this.saveSession();

        console.log(`❌ Error in Phase ${phaseNumber}: ${error}`);
    }

    updateMetrics(totalTests, passedTests, failedTests, skippedTests = 0) {
        this.sessionData.metrics.totalTests = totalTests;
        this.sessionData.metrics.passedTests = passedTests;
        this.sessionData.metrics.failedTests = failedTests;
        this.sessionData.metrics.skippedTests = skippedTests;

        if (totalTests > 0) {
            const coverage = ((passedTests / totalTests) * 100).toFixed(1);
            this.sessionData.metrics.testCoverage = `${coverage}%`;
        }

        this.saveSession();
    }

    updateNextAction(nextPhase) {
        const phaseActions = {
            1: "Begin Phase 1: Authentication & User Role Testing",
            2: "Begin Phase 2: Core Module Functionality Testing",
            3: "Begin Phase 3: Integration & Workflow Testing",
            4: "Begin Phase 4: User Interface & Experience Testing",
            5: "Begin Phase 5: Performance & Stress Testing",
            6: "Begin Phase 6: Security & Data Integrity Testing",
            7: "Begin Phase 7: Final Integration & Acceptance Testing",
            8: "Testing Complete - Generate Final Report"
        };

        this.sessionData.nextAction = phaseActions[nextPhase] || "Testing Complete";
        this.sessionData.resumeInstructions = this.generateResumeInstructions(nextPhase);
    }

    generateResumeInstructions(nextPhase) {
        if (nextPhase > 7) {
            return "All phases completed. Generate comprehensive test report and deployment recommendations.";
        }

        return `Resume E2E testing from Phase ${nextPhase}. Check current session log for completed steps and continue from where testing was interrupted. Follow the AI implementation prompt for Phase ${nextPhase} in the E2E_FUNCTIONAL_TESTING_PLAN.md file.`;
    }

    pauseSession(reason) {
        this.sessionData.status = "paused";
        this.sessionData.pauseReason = reason;
        this.sessionData.pausedAt = new Date().toISOString();
        this.saveSession();

        console.log(`⏸️ Session paused: ${reason}`);
    }

    resumeSession() {
        this.sessionData.status = "in_progress";
        this.sessionData.resumedAt = new Date().toISOString();
        delete this.sessionData.pauseReason;
        this.saveSession();

        console.log(`▶️ Session resumed at ${this.sessionData.resumedAt}`);
    }

    completeSession(finalStatus = "completed") {
        this.sessionData.status = finalStatus;
        this.sessionData.endTime = new Date().toISOString();

        // Calculate final metrics
        const totalDuration = new Date(this.sessionData.endTime) - new Date(this.sessionData.startTime);
        this.sessionData.totalDuration = `${Math.round(totalDuration / 1000 / 60)} minutes`;

        this.saveSession();

        console.log(`🏁 Testing session completed: ${finalStatus}`);
        console.log(`⏱️ Total duration: ${this.sessionData.totalDuration}`);
    }

    getSessionSummary() {
        return {
            sessionId: this.sessionData.sessionId,
            status: this.sessionData.status,
            currentPhase: this.sessionData.currentPhase,
            currentStep: this.sessionData.currentStep,
            nextAction: this.sessionData.nextAction,
            resumeInstructions: this.sessionData.resumeInstructions,
            metrics: this.sessionData.metrics,
            errors: this.sessionData.errors.length
        };
    }

    static loadExistingSession(sessionFile) {
        try {
            const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
            const logger = new TestSessionLogger();
            logger.sessionData = sessionData;
            logger.sessionId = sessionData.sessionId;

            console.log(`📂 Loaded existing session: ${sessionData.sessionId}`);
            console.log(`📍 Current phase: ${sessionData.currentPhase || 'Not started'}`);
            console.log(`📋 Status: ${sessionData.status}`);

            return logger;
        } catch (error) {
            console.error('❌ Failed to load existing session:', error);
            throw error;
        }
    }

    generateReport() {
        const report = {
            sessionSummary: this.getSessionSummary(),
            phaseResults: {},
            overallMetrics: this.sessionData.metrics,
            errors: this.sessionData.errors,
            recommendations: []
        };

        // Process each phase
        Object.keys(this.sessionData.phases).forEach(phaseKey => {
            const phase = this.sessionData.phases[phaseKey];
            report.phaseResults[phaseKey] = {
                name: phase.name,
                status: phase.status,
                completionRate: phase.completionRate,
                stepsCompleted: phase.steps.filter(s => s.status === 'completed').length,
                totalSteps: phase.steps.length,
                errors: phase.errors.length,
                duration: phase.startTime && phase.endTime ?
                    `${Math.round((new Date(phase.endTime) - new Date(phase.startTime)) / 1000 / 60)} minutes` :
                    'Not completed'
            };
        });

        // Generate recommendations
        if (this.sessionData.errors.length > 0) {
            report.recommendations.push("Address all identified errors before production deployment");
        }

        if (this.sessionData.metrics.testCoverage !== "100%") {
            report.recommendations.push("Improve test coverage to reach 100%");
        }

        return report;
    }
}

export default TestSessionLogger;