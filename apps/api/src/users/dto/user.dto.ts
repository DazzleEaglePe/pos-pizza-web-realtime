export class CreateUserDto {
  email!: string;
  password!: string;
  name!: string;
  role!: string;
}

export class UpdateUserDto {
  name?: string;
  role?: string;
  isActive?: boolean;
}

export class ResetPasswordDto {
  newPassword!: string;
}
