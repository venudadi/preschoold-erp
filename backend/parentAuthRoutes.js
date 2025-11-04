import express from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';
import { 
    rateLimiters, 
    validateInput, 
    validationRules, 
    auditLogger,
    sanitizeInput 
} from './middleware/security.js';
import encryption, { 
    encryptPII, 
    decryptPII, 
    hashPassword, 
    verifyPassword, 
    generateToken 
} from './utils/encryption.js';

const router = express.Router();

// Apply security middleware to all parent auth routes
router.use(sanitizeInput);

/**
 * Parent Registration Endpoint
 * Allows parents to register using child verification code
 */
router.post('/register', 
    rateLimiters.parentRegistration,
    validateInput([
        validationRules.email.custom(body => body('email')),
        validationRules.password.custom(body => body('password')),
        validationRules.phone.custom(body => body('phone')),
        validationRules.name.custom(body => body('firstName')),
        validationRules.name.custom(body => body('lastName')),
        validationRules.childVerificationCode.custom(body => body('childVerificationCode'))
    ]),
    auditLogger('PARENT_REGISTRATION_ATTEMPT', 'PARENT'),
    async (req, res) => {
        let conn;
        try {
            const { email, password, phone, firstName, lastName, childVerificationCode } = req.body;
            
            conn = await pool.getConnection();
            await conn.beginTransaction();

            // 1. Verify child verification code and get child details
            const [childResults] = await conn.query(`
                SELECT c.id, c.first_name, c.last_name, c.center_id,
                       cl.name as classroom_name
                FROM children c
                LEFT JOIN classrooms cl ON c.classroom_id = cl.id
                WHERE c.verification_code = ? AND c.is_active = 1
            `, [childVerificationCode]);

            if (childResults.length === 0) {
                await conn.rollback();
                return res.status(400).json({
                    error: 'Invalid child verification code. Please contact the school for assistance.'
                });
            }

            const child = childResults[0];

            // 2. Check if parent already exists with this email
            const [existingUsers] = await conn.query(
                'SELECT id FROM users WHERE email = ?', 
                [email]
            );

            if (existingUsers.length > 0) {
                await conn.rollback();
                return res.status(400).json({
                    error: 'An account with this email already exists. Please use a different email or try logging in.'
                });
            }

            // 3. Check if parent already exists in parents table
            const [existingParents] = await conn.query(
                'SELECT id FROM parents WHERE phone_number = ? OR email = ?', 
                [phone, email]
            );

            let parentId;
            if (existingParents.length > 0) {
                parentId = existingParents[0].id;
                
                // Update existing parent record with encrypted data
                const encryptedParentData = encryptPII({
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    phone_number: phone
                }, 'PARENT');

                await conn.query(`
                    UPDATE parents 
                    SET first_name = ?, last_name = ?, email = ?, phone_number = ?, updated_at = NOW()
                    WHERE id = ?
                `, [
                    encryptedParentData.first_name,
                    encryptedParentData.last_name, 
                    encryptedParentData.email,
                    encryptedParentData.phone_number,
                    parentId
                ]);
            } else {
                // Create new parent record with encrypted data
                parentId = generateToken(16);
                const encryptedParentData = encryptPII({
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    phone_number: phone
                }, 'PARENT');

                await conn.query(`
                    INSERT INTO parents (id, first_name, last_name, email, phone_number, created_at)
                    VALUES (?, ?, ?, ?, ?, NOW())
                `, [
                    parentId,
                    encryptedParentData.first_name,
                    encryptedParentData.last_name,
                    encryptedParentData.email,
                    encryptedParentData.phone_number
                ]);
            }

            // 4. Create user account with encrypted data
            const userId = generateToken(16);
            const hashedPassword = hashPassword(password);
            const encryptedUserData = encryptPII({
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone_number: phone
            }, 'USER');

            await conn.query(`
                INSERT INTO users (id, full_name, email, password, role, center_id, is_active, created_at)
                VALUES (?, ?, ?, ?, 'parent', ?, 1, NOW())
            `, [
                userId,
                `${firstName} ${lastName}`,
                encryptedUserData.email,
                hashedPassword,
                child.center_id
            ]);

            // 5. Create parent-child relationship if it doesn't exist
            const [existingRelation] = await conn.query(
                'SELECT 1 FROM parent_children WHERE parent_id = ? AND child_id = ?',
                [parentId, child.id]
            );

            if (existingRelation.length === 0) {
                const linkId = uuidv4();
                await conn.query(`
                    INSERT INTO parent_children (id, parent_id, child_id, relationship_type, is_primary, created_at)
                    VALUES (?, ?, ?, 'Guardian', FALSE, NOW())
                `, [linkId, parentId, child.id]);
            }

            // 6. Link user to parent record
            await conn.query(`
                UPDATE users SET parent_id = ? WHERE id = ?
            `, [parentId, userId]);

            // 7. Clear the verification code to prevent reuse
            await conn.query(`
                UPDATE children SET verification_code = NULL WHERE id = ?
            `, [child.id]);

            await conn.commit();

            // 8. Generate JWT token
            const token = jwt.sign(
                { 
                    id: userId, 
                    role: 'parent',
                    parentId: parentId,
                    centerId: child.center_id
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // 9. Return success response with decrypted user data for client
            const userData = decryptPII({
                id: userId,
                first_name: encryptedUserData.first_name,
                last_name: encryptedUserData.last_name,
                email: encryptedUserData.email,
                phone_number: encryptedUserData.phone_number,
                role: 'parent',
                parentId: parentId,
                centerId: child.center_id
            }, 'USER');

            res.status(201).json({
                message: 'Parent account created successfully',
                token,
                user: {
                    id: userData.id,
                    fullName: `${userData.first_name} ${userData.last_name}`,
                    email: userData.email,
                    phone: userData.phone_number,
                    role: userData.role,
                    parentId: userData.parentId,
                    centerId: userData.centerId
                },
                child: {
                    id: child.id,
                    name: `${child.first_name} ${child.last_name}`,
                    classroom: child.classroom_name
                }
            });

        } catch (error) {
            if (conn) await conn.rollback();
            console.error('Parent registration error:', error);
            res.status(500).json({
                error: 'Registration failed. Please try again later.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        } finally {
            if (conn) conn.release();
        }
    }
);

/**
 * Parent Login Endpoint
 * Secure authentication with enhanced security
 */
router.post('/login',
    rateLimiters.auth,
    validateInput([
        validationRules.email.custom(body => body('email')),
        body('password').notEmpty().withMessage('Password is required')
    ]),
    auditLogger('PARENT_LOGIN_ATTEMPT', 'PARENT'),
    async (req, res) => {
        try {
            const { email, password } = req.body;

            // 1. Find user account
            const [userResults] = await pool.query(`
                SELECT u.id, u.full_name, u.email, u.password,
                       u.role, u.center_id, u.parent_id, u.is_active,
                       u.last_login, u.failed_login_attempts, u.locked_until
                FROM users u
                WHERE u.email = ? AND u.role = 'parent'
            `, [email]);

            if (userResults.length === 0) {
                return res.status(401).json({
                    error: 'Invalid email or password'
                });
            }

            const user = userResults[0];

            // 2. Check if account is locked
            if (user.locked_until && new Date() < new Date(user.locked_until)) {
                return res.status(423).json({
                    error: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
                });
            }

            // 3. Check if account is active
            if (!user.is_active) {
                return res.status(401).json({
                    error: 'Account is deactivated. Please contact the school for assistance.'
                });
            }

            // 4. Verify password
            const isValidPassword = verifyPassword(password, user.password);
            if (!isValidPassword) {
                // Increment failed login attempts
                const failedAttempts = (user.failed_login_attempts || 0) + 1;
                const lockUntil = failedAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // Lock for 30 minutes after 5 failed attempts

                await pool.query(`
                    UPDATE users
                    SET failed_login_attempts = ?, locked_until = ?
                    WHERE id = ?
                `, [failedAttempts, lockUntil, user.id]);

                return res.status(401).json({
                    error: 'Invalid email or password',
                    attemptsRemaining: lockUntil ? 0 : (5 - failedAttempts)
                });
            }

            // 5. Reset failed login attempts and update last login
            await pool.query(`
                UPDATE users
                SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW()
                WHERE id = ?
            `, [user.id]);

            // 6. Get parent and children information
            const [parentResults] = await pool.query(`
                SELECT p.id, p.first_name, p.last_name, p.email, p.phone_number
                FROM parents p
                WHERE p.id = ?
            `, [user.parent_id]);

            const [childrenResults] = await pool.query(`
                SELECT c.id, c.first_name, c.last_name, c.date_of_birth, c.gender,
                       cl.name as classroom_name, p.relation_to_child
                FROM children c
                LEFT JOIN classrooms cl ON c.classroom_id = cl.id
                INNER JOIN parents p ON c.id = p.child_id
                WHERE p.user_id = ? AND c.is_active = 1
            `, [user.parent_id]);

            // 7. Decrypt sensitive data
            const decryptedUser = decryptPII(user, 'USER');
            const decryptedParent = parentResults.length > 0 ? decryptPII(parentResults[0], 'PARENT') : null;
            const decryptedChildren = childrenResults.map(child => decryptPII(child, 'CHILD'));

            // 8. Generate JWT token
            const token = jwt.sign(
                {
                    id: user.id,
                    role: user.role,
                    parentId: user.parent_id,
                    centerId: user.center_id
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // 9. Return success response
            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: decryptedUser.id,
                    fullName: decryptedUser.full_name,
                    email: decryptedUser.email,
                    role: decryptedUser.role,
                    parentId: user.parent_id,
                    centerId: user.center_id,
                    lastLogin: user.last_login
                },
                parent: decryptedParent ? {
                    id: decryptedParent.id,
                    name: `${decryptedParent.first_name} ${decryptedParent.last_name}`,
                    email: decryptedParent.email,
                    phone: decryptedParent.phone_number
                } : null,
                children: decryptedChildren.map(child => ({
                    id: child.id,
                    name: `${child.first_name} ${child.last_name}`,
                    dateOfBirth: child.date_of_birth,
                    gender: child.gender,
                    classroom: child.classroom_name,
                    relationship: child.relation_to_child
                }))
            });

        } catch (error) {
            console.error('Parent login error:', error);
            res.status(500).json({
                error: 'Login failed. Please try again later.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * Request Child Verification Code
 * Allows potential parents to request verification code for child registration
 */
router.post('/request-verification-code',
    rateLimiters.auth,
    validateInput([
        validationRules.name.custom(body => body('childFirstName')),
        validationRules.name.custom(body => body('childLastName')),
        validationRules.phone.custom(body => body('parentPhone')),
        body('dateOfBirth').isISO8601().withMessage('Please provide a valid date of birth')
    ]),
    auditLogger('VERIFICATION_CODE_REQUEST', 'PARENT'),
    async (req, res) => {
        try {
            const { childFirstName, childLastName, parentPhone, dateOfBirth } = req.body;

            // Find child by name, DOB and verify parent phone is in records
            const [childResults] = await pool.query(`
                SELECT c.id, c.first_name, c.last_name, c.verification_code
                FROM children c
                INNER JOIN parents p ON c.id = p.child_id
                WHERE c.first_name LIKE ? AND c.last_name LIKE ?
                AND c.date_of_birth = ? AND p.phone_number LIKE ?
                AND c.is_active = 1
            `, [`%${childFirstName}%`, `%${childLastName}%`, dateOfBirth, `%${parentPhone}%`]);

            if (childResults.length === 0) {
                return res.status(404).json({
                    error: 'No matching child record found. Please verify the details or contact the school.'
                });
            }

            const child = childResults[0];
            
            // Generate new verification code if none exists
            let verificationCode = child.verification_code;
            if (!verificationCode) {
                verificationCode = generateToken(4).toUpperCase(); // 8-character alphanumeric code
                
                await pool.query(`
                    UPDATE children
                    SET verification_code = ?, verification_code_expires = DATE_ADD(NOW(), INTERVAL 24 HOUR)
                    WHERE id = ?
                `, [verificationCode, child.id]);
            }

            // In production, send this via SMS/Email
            // For now, return in response (remove in production)
            res.json({
                message: 'Verification code has been sent to your registered contact information.',
                // Remove this in production - code should only be sent via SMS/Email
                verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
            });

        } catch (error) {
            console.error('Verification code request error:', error);
            res.status(500).json({
                error: 'Failed to process verification code request. Please try again later.'
            });
        }
    }
);

/**
 * Change Password
 * Allows parents to change their password
 */
router.post('/change-password',
    rateLimiters.auth,
    validateInput([
        body('currentPassword').notEmpty().withMessage('Current password is required'),
        validationRules.password.custom(body => body('newPassword'))
    ]),
    auditLogger('PASSWORD_CHANGE', 'PARENT'),
    async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            // Get current password hash
            const [userResults] = await pool.query(
                'SELECT password FROM users WHERE id = ? AND role = "parent"',
                [userId]
            );

            if (userResults.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Verify current password
            const isValidPassword = verifyPassword(currentPassword, userResults[0].password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            // Hash new password
            const hashedNewPassword = hashPassword(newPassword);


            // Update password and clear must_reset_password flag
            await pool.query(
                'UPDATE users SET password = ?, must_reset_password = 0, updated_at = NOW() WHERE id = ?',
                [hashedNewPassword, userId]
            );

            res.json({ message: 'Password changed successfully' });

        } catch (error) {
            console.error('Password change error:', error);
            res.status(500).json({ error: 'Failed to change password' });
        }
    }
);

export default router;