import { Check, Repository, SelectQueryBuilder } from 'typeorm';
import { BadRequestError, NotFoundError } from '../utils/http-errors';
import { User, UserRole } from '../entities/user.entity';
import { AppDataSource } from '../config/orm.config';
import { createUserDto, updateUserDto, UserQueryDto } from '../dto/user.dto';
import { PaginationOptions, PaginationResult, paginateQueryBuilder } from '../utils/paginator';
import { applySortingToQueryBuilder, SortParams } from '../utils/sorting';
import { applyCondition } from '../utils/filtering';

export const enum ServiceMethod {
  update,
  create,
}

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);

  }

  public async findByEmailOrLogin(
    email: string,
    login: string,
  ): Promise<User | null> {
    return await this.userRepository.findOne({
      where: [{ email }, { login }],
    });
  }

  public async createUser(userData: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(userData);

    const existingUser = await this.userRepository.findOne({
      where: [{ email: newUser.email }, { login: newUser.login }],
    });

    if (existingUser) {
      const errors = [];
      if (existingUser.email === newUser.email) {
        errors.push('Email already exists.');
      }
      if (existingUser.login === newUser.login) {
        errors.push('Login already exists.');
      }
      throw new BadRequestError(errors.join('\n'));
    }

    newUser.hashPassword();

    return this.userRepository.save(newUser);
  }

  public async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUserById(id);

    if (userData.password) {
      user.password = userData.password;
      user.hashPassword();
      userData.password = user.password;
    }

    const updatedUser = this.userRepository.merge(user, userData);

    return this.userRepository.save(updatedUser);
  }

  public async getUserById(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundError('User does not exist.');
    }
    return user;
  }

  public async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new NotFoundError('User with this email does not exist.');
    }
    return user;
  }

  public async getQueryBuilder(): Promise<SelectQueryBuilder<User>> {
    return this.userRepository.createQueryBuilder('user');
  }

  public async getUserByEmailSafe(email: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ email });
  }

  public async getUserByLogin(login: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ login });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  public async getUserByLoginSafe(login: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ login });
  }

  public async getAllUsers(query: UserQueryDto): Promise<PaginationResult<User>> {
    const qb = this.userRepository.createQueryBuilder('user');

    if (query.filters){
      applyCondition(qb, "user.full_name", "LIKE", query.filters.full_name);
      applyCondition(qb, "user.email", "LIKE", query.filters.email);
      applyCondition(qb, "user.login", "LIKE", query.filters.login);
      applyCondition(qb, "user.verified", "=", query.filters.verified);
    }
    applySortingToQueryBuilder(qb, {
      sortDirection: query.sortDirection || 'ASC',
      sortField: query.sortBy || 'createdAt',
    }, 'user');

    return paginateQueryBuilder(qb, {
      page: query.page,
      limit: query.limit,
    });
  }

  public async validateUserCredentials(
    loginOrEmail: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.login = :loginOrEmail OR user.email = :loginOrEmail', {
        loginOrEmail,
      })
      .getOne();

    if (user && user.comparePassword(password)) {
      return user;
    }

    throw new BadRequestError('Invalid login or password.');
  }

  public async deleteUser(id: number): Promise<boolean> {
    const user = await this.getUserById(id);
    try {
      await this.userRepository.remove(user);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Unable to delete user due to existing dependencies.');
    }
  }

  public async checkAdmin(id: number): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    if (user.role === UserRole.ADMIN) {
      return true;
    }
    return false;
  }

  public async checkAdminOrOwner(
    userId: number,
    ownerId: number,
  ): Promise<boolean> {
    if (userId === ownerId) {
      return true;
    }
    return await this.checkAdmin(userId);
  }

}

