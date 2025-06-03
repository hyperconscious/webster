import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { boolean } from "zod";

@Entity()
export class Project {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ default: '' })
    slug!: string;

    @Column({ default: '' })
    name!: string;

    @Column({ type: 'longtext' })
    data!: string;

    @Column({ default: '' })
    description?: string;

    @Column({ type: 'boolean', default: false })
    isTemplate!: boolean;

    @ManyToOne(() => User, user => user.projects)
    user!: User;

    @Column()
    @CreateDateColumn()
    public createdAt!: Date;

    @Column()
    @UpdateDateColumn()
    public updatedAt!: Date;
}
