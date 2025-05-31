import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class Project {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({default: ''})
    name!: string;

    @Column({ type: 'longtext' })
    data!: string;

    @ManyToOne(() => User, user => user.projects)
    user!: User;

    @Column()
    @CreateDateColumn()
    public createdAt!: Date;

    @Column()
    @UpdateDateColumn()
    public updatedAt!: Date;
}
