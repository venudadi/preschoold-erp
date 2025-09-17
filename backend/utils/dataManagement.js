import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

// Backup Management
export const createBackup = async (type = 'full', userId) => {
    const backupId = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.env.BACKUP_DIR, timestamp);
    
    try {
        // Create backup directory
        await fs.mkdir(backupDir, { recursive: true });

        // Start backup log
        await pool.query(
            `INSERT INTO backup_logs 
             (id, backup_type, start_time, status, created_by)
             VALUES (?, ?, CURRENT_TIMESTAMP, 'in_progress', ?)`,
            [backupId, type, userId]
        );

        // Create backup using mysqldump
        const command = `mysqldump -u${process.env.DB_USER} -p${process.env.DB_PASSWORD} \
                        -h${process.env.DB_HOST} ${process.env.DB_NAME} \
                        > ${path.join(backupDir, 'backup.sql')}`;
        
        await execAsync(command);

        // Get file size and create checksum
        const stats = await fs.stat(path.join(backupDir, 'backup.sql'));
        const fileBuffer = await fs.readFile(path.join(backupDir, 'backup.sql'));
        const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Update backup log
        await pool.query(
            `UPDATE backup_logs 
             SET status = 'completed',
                 end_time = CURRENT_TIMESTAMP,
                 file_path = ?,
                 file_size = ?,
                 checksum = ?
             WHERE id = ?`,
            [path.join(backupDir, 'backup.sql'), stats.size, checksum, backupId]
        );

        return {
            status: 'success',
            backupId,
            filePath: path.join(backupDir, 'backup.sql')
        };
    } catch (error) {
        // Log error
        await pool.query(
            `UPDATE backup_logs 
             SET status = 'failed',
                 end_time = CURRENT_TIMESTAMP,
                 error_message = ?
             WHERE id = ?`,
            [error.message, backupId]
        );

        throw error;
    }
};

// Data Validation
export const validateData = async (tableName, columnName, value) => {
    try {
        // Get validation rules for the table and column
        const [rules] = await pool.query(
            `SELECT * FROM data_validation_rules 
             WHERE table_name = ? 
             AND column_name = ? 
             AND is_active = true`,
            [tableName, columnName]
        );

        for (const rule of rules) {
            const definition = JSON.parse(rule.rule_definition);

            switch (rule.rule_type) {
                case 'required':
                    if (definition.required && !value) {
                        throw new Error(rule.error_message);
                    }
                    break;

                case 'format':
                    const regex = new RegExp(definition.pattern);
                    if (!regex.test(value)) {
                        throw new Error(rule.error_message);
                    }
                    break;

                case 'range':
                    if (definition.min && value < definition.min) {
                        throw new Error(rule.error_message);
                    }
                    if (definition.max && value > definition.max) {
                        throw new Error(rule.error_message);
                    }
                    break;

                case 'unique':
                    const [existing] = await pool.query(
                        `SELECT COUNT(*) as count FROM ${tableName} WHERE ${columnName} = ?`,
                        [value]
                    );
                    if (existing[0].count > 0) {
                        throw new Error(rule.error_message);
                    }
                    break;

                case 'custom':
                    // Execute custom validation logic
                    if (definition.function) {
                        const result = await eval(definition.function)(value);
                        if (!result) {
                            throw new Error(rule.error_message);
                        }
                    }
                    break;
            }

            // Log validation result
            await pool.query(
                `INSERT INTO data_validation_logs 
                 (id, validation_rule_id, table_name, record_id, validation_status)
                 VALUES (UUID(), ?, ?, ?, 'pass')`,
                [rule.id, tableName, value]
            );
        }

        return true;
    } catch (error) {
        // Log validation failure
        await pool.query(
            `INSERT INTO data_validation_logs 
             (id, validation_rule_id, table_name, record_id, validation_status, error_message)
             VALUES (UUID(), ?, ?, ?, 'fail', ?)`,
            [rule.id, tableName, value, error.message]
        );

        throw error;
    }
};

// Data Archival
export const archiveData = async (tableName, recordId, reason, userId) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Get the data to archive
        const [data] = await connection.query(
            `SELECT * FROM ${tableName} WHERE id = ?`,
            [recordId]
        );

        if (data.length === 0) {
            throw new Error('Record not found');
        }

        // Store the data in archived_data table
        await connection.query(
            `INSERT INTO archived_data 
             (id, source_table, record_id, data, archived_by, reason)
             VALUES (UUID(), ?, ?, ?, ?, ?)`,
            [tableName, recordId, JSON.stringify(data[0]), userId, reason]
        );

        // Delete the original record
        await connection.query(
            `DELETE FROM ${tableName} WHERE id = ?`,
            [recordId]
        );

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Data Restoration
export const requestDataRestoration = async (archiveId, userId) => {
    try {
        await pool.query(
            `UPDATE archived_data 
             SET restore_status = 'requested',
                 restore_requested_by = ?,
                 restore_requested_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [userId, archiveId]
        );

        return true;
    } catch (error) {
        throw error;
    }
};

export const restoreArchivedData = async (archiveId, userId) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Get the archived data
        const [archived] = await connection.query(
            'SELECT * FROM archived_data WHERE id = ?',
            [archiveId]
        );

        if (archived.length === 0) {
            throw new Error('Archived record not found');
        }

        const record = archived[0];
        const data = JSON.parse(record.data);

        // Restore the data to the original table
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data)
            .map(value => typeof value === 'string' ? `'${value}'` : value)
            .join(', ');

        await connection.query(
            `INSERT INTO ${record.source_table} (${columns}) VALUES (${values})`
        );

        // Update archive status
        await connection.query(
            `UPDATE archived_data 
             SET restore_status = 'restored'
             WHERE id = ?`,
            [archiveId]
        );

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};