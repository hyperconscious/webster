import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';

import { User } from './user.entity';

export enum NotificationType {
    EventReminder = 'event_reminder',
    EventChange = 'event_change',
    EventCancellation = 'event_cancellation',
    Invitation = 'event_invitation',
}

@Entity()
@Unique(['id'])
export class Notification {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column({ type: 'text' })
    message!: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
        default: NotificationType.EventReminder
    })
    type!: NotificationType;

    @Column({ default: false })
    isRead!: boolean;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn()
    user!: User;

    // @ManyToOne(() => Event, { nullable: true, onDelete: 'SET NULL' })
    // @JoinColumn()
    // relatedEvent?: Event;

    @CreateDateColumn()
    createdAt!: Date;
}