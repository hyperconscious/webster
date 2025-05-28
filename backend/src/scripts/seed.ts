import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';

import { Notification, NotificationType } from '../entities/notification.entity';
import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/orm.config';

export class DatabaseSeeder {
    static async seed(dataSource: DataSource) {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const tableNames = await queryRunner.query(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
            );

            const tables = tableNames.map((table: any) => table.table_name || table.TABLE_NAME);
            console.log('Found tables:', tables);

            await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

            for (const table of tables) {
                if (table.startsWith('typeorm_') || table === 'migrations') {
                    continue;
                }

                try {
                    console.log(`Truncating table: ${table}`);
                    await queryRunner.query(`TRUNCATE TABLE \`${table}\``);
                } catch (err) {
                    console.warn(`Warning: Could not truncate table ${table}`, err);
                }
            }

            await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');

            const userRepository = dataSource.getRepository(User);
            const notificationRepository = dataSource.getRepository(Notification);

            console.log('Starting to seed users...');
            const users = [
                userRepository.create({
                    login: 'johndoe',
                    full_name: 'John Doe',
                    email: 'john.doe@example.com',
                    password: bcrypt.hashSync('password123', 7),
                    verified: true,
                    avatar: 'https://example.com/avatar/johndoe.jpg'
                }),
                userRepository.create({
                    login: 'janedoe',
                    full_name: 'Jane Doe',
                    email: 'jane.doe@example.com',
                    password: bcrypt.hashSync('password456', 7),
                    verified: true,
                    avatar: 'https://example.com/avatar/janedoe.jpg'
                }),
                userRepository.create({
                    login: 'bobsmith',
                    full_name: 'Bob Smith',
                    email: 'bob.smith@example.com',
                    password: bcrypt.hashSync('password789', 7),
                    verified: false
                }),
                // New users
                userRepository.create({
                    login: 'alexwong',
                    full_name: 'Alex Wong',
                    email: 'alex.wong@example.com',
                    password: bcrypt.hashSync('password101', 7),
                    verified: true,
                    avatar: 'https://example.com/avatar/alexwong.jpg'
                }),
                userRepository.create({
                    login: 'sarahlee',
                    full_name: 'Sarah Lee',
                    email: 'sarah.lee@example.com',
                    password: bcrypt.hashSync('password202', 7),
                    verified: true,
                    avatar: 'https://example.com/avatar/sarahlee.jpg'
                }),
                userRepository.create({
                    login: 'mikebrown',
                    full_name: 'Mike Brown',
                    email: 'mike.brown@example.com',
                    password: bcrypt.hashSync('password303', 7),
                    verified: true
                }),
                userRepository.create({
                    login: 'emilyjones',
                    full_name: 'Emily Jones',
                    email: 'emily.jones@example.com',
                    password: bcrypt.hashSync('password404', 7),
                    verified: false
                }),
                userRepository.create({
                    login: 'davidchen',
                    full_name: 'David Chen',
                    email: 'david.chen@example.com',
                    password: bcrypt.hashSync('password505', 7),
                    verified: true,
                    avatar: 'https://example.com/avatar/davidchen.jpg'
                })
            ];
            const savedUsers = await userRepository.save(users);
            console.log('Users seeded successfully');

            // Seed projects
            const projectRepository = dataSource.getRepository('Project');
            console.log('Starting to seed projects...');
            const projects = [
                projectRepository.create({
                    name: 'Art1',
                    data: 'dawdkdbaud',
                    user: savedUsers[0]
                }),
                projectRepository.create({
                    name: 'Art2',
                    data: 'dawdkdbaud',
                    user: savedUsers[1]
                }),
                projectRepository.create({
                    name: 'Art3',
                    data: 'dawdkdbaud',
                    user: savedUsers[2]
                }),
            ];
            await projectRepository.save(projects);
            console.log('Projects seeded successfully');

            console.log('Starting to seed notifications...');
            const notifications = [
                notificationRepository.create({
                    title: 'Event Reminder',
                    message: 'Your event "Tech Innovation Summit 2025" is starting in 24 hours.',
                    type: NotificationType.EventReminder,
                    isRead: false,
                    user: savedUsers[0]
                }),
                notificationRepository.create({
                    title: 'Event Update',
                    message: 'The location for "Summer Music Festival" has been updated.',
                    type: NotificationType.EventChange,
                    isRead: true,
                    user: savedUsers[1]
                }),
                // New notifications
                notificationRepository.create({
                    title: 'New Comment',
                    message: 'Someone commented on an event you\'re attending: "Tech Innovation Summit 2025"',
                    type: NotificationType.EventReminder,
                    isRead: false,
                    user: savedUsers[2]
                }),
                notificationRepository.create({
                    title: 'Ticket Confirmation',
                    message: 'Your tickets for "Web Development Bootcamp" have been confirmed.',
                    type: NotificationType.EventReminder,
                    isRead: false,
                    user: savedUsers[3]
                }),
                notificationRepository.create({
                    title: 'Price Drop',
                    message: 'The price for "Modern Art Exhibition" has been reduced!',
                    type: NotificationType.EventReminder,
                    isRead: false,
                    user: savedUsers[4]
                }),
                notificationRepository.create({
                    title: 'Event Cancelled',
                    message: 'Unfortunately, "Tech Talk Series" has been cancelled.',
                    type: NotificationType.EventCancellation,
                    isRead: true,
                    user: savedUsers[5]
                }),
                notificationRepository.create({
                    title: 'Event Reminder',
                    message: 'Your event "Basketball Tournament Championship" is starting in 48 hours.',
                    type: NotificationType.EventReminder,
                    isRead: false,
                    user: savedUsers[6]
                }),
                notificationRepository.create({
                    title: 'Ticket Available',
                    message: 'A ticket for "International Food Festival" is now available!',
                    type: NotificationType.EventReminder,
                    isRead: false,
                    user: savedUsers[7]
                }),
                notificationRepository.create({
                    title: 'New Event',
                    message: 'A new event has been added that matches your interests: "Gaming Expo 2025"',
                    type: NotificationType.EventReminder,
                    isRead: true,
                    user: savedUsers[0]
                }),
                notificationRepository.create({
                    title: 'Event Update',
                    message: 'Schedule updated for "Rock Music Night"',
                    type: NotificationType.EventChange,
                    isRead: false,
                    user: savedUsers[1]
                })
            ];
            await notificationRepository.save(notifications);
            console.log('Notifications seeded successfully');

            await queryRunner.commitTransaction();
            console.log('Seeding completed successfully');
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Seeding failed:', error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}

async function runSeed() {
    try {
        const dataSource = AppDataSource;

        await dataSource.initialize();
        await DatabaseSeeder.seed(dataSource);
        console.log('Seeding completed successfully');

        await dataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

runSeed();