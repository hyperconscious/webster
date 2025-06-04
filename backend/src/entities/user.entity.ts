import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';
import { IsEmail, Length } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { Notification } from './notification.entity';
import { Project } from './project.entity';

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
}

@Entity()
@Unique(['login', 'email'])
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    @Length(4, 20)
    login!: string;

    @Column()
    password!: string;

    @Column()
    full_name!: string;

    @Column({ unique: true })
    @IsEmail()
    email!: string;

    @Column({ default: false })
    verified!: boolean;

    @Column({ default: '' })
    avatar?: string;

    @OneToMany(() => Project, (project) => project.user)
    projects!: Project[];

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    lastPromoCodeAttempt!: Date;

    @Column({ default: UserRole.USER })
    role!: UserRole;

    @Column()
    @CreateDateColumn()
    public createdAt!: Date;

    @Column()
    @UpdateDateColumn()
    public updatedAt!: Date;

    public hashPassword() {
        this.password = bcrypt.hashSync(this.password, 7);
    }

    public comparePassword(unencryptedPassword: string) {
        return bcrypt.compareSync(unencryptedPassword, this.password);
    }
}